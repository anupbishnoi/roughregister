var app = {};

// setup data
(function () {
  app.data = {
    mountPath: window.apperMountPath,
    topicName: window.topicName,
    patches: []
  };
  
  app.diff3 = new window.diff_match_patch();
  app.diff = window.JsDiff;
}());

// saving behavior
(function () {
  var humane = window.humane;
  
  humane.baseCls = 'humane-libnotify';
  humane.error = humane.spawn({ addnCls: 'humane-libnotify-error' });
  humane.success = humane.spawn({ addnCls: 'humane-libnotify-success '});
  
  var isSaving = false;
  function save(e) {
    var content = app.editor.getContent(),
      newContent = content,
      savedContent = app.data.savedContent,
      patches = app.data.patches,
      topicName = app.data.topicName;
    
    if (content === savedContent) {
      if (e) humane.log('Already saved');
      return false;
    }
    
    if (patches.length) {
      var patchedContent = app.getPatchedContent(savedContent, patches);
      if (!patchedContent) return humane.error('Inconsistent state, refresh app');
      
      var diff3Stash = app.diff3.patch_make(savedContent, content);
      var diff3Result = app.diff3.patch_apply(diff3Stash, patchedContent);
      if (!diff3Result || !diff3Result[0] || !(typeof diff3Result[0] === 'string')) {
        return humane.error('Could not update properly, refresh app');
      }
      newContent = diff3Result[0];
    }
    
    var patch = app.diff.createPatch(topicName, patchedContent || savedContent, newContent);
    console.log(patch);
    app.socket.emit('save', {
      topic: topicName,
      patch: patch
    }, function () {
      humane.log('Saved');
      if (newContent !== content) app.editor.setContent(newContent);
      app.data.savedContent = newContent;
      app.data.patches = [];
      app.el.updateBtn.removeClass('wr-btn-highlight');
    });
    
    return false;
  }
  
  app.save = save;
}());

// updating behavior
(function () {
  var humane = window.humane;
  
  function update() {
    var content = app.editor.getContent(),
      newContent = content,
      savedContent = app.data.savedContent,
      patches = app.data.patches;
    
    if (!patches.length) return humane.log('Up to date');
    var patchedContent = getPatchedContent(savedContent, patches);
    if (!patchedContent) return humane.error('Inconsistent state, refresh app');
    
    var diff3Stash = app.diff3.patch_make(savedContent, content);
    var diff3Result = app.diff3.patch_apply(diff3Stash, patchedContent);
    if (!diff3Result || !diff3Result[0] || !(typeof diff3Result[0] === 'string')) {
      return humane.error('Could not update properly, refresh app');
    }
    newContent = diff3Result[0];
    
    if (newContent !== content) app.editor.setContent(newContent);
    app.data.savedContent = newContent;
    
    app.data.patches = [];
    app.el.updateBtn.removeClass('wr-btn-highlight');
    return true;
  }
  
  function getPatchedContent(baseContent, patches) {
    var newContent = baseContent;
    for (var i = 0; i < patches.length; i++) {
      newContent = app.diff.applyPatch(newContent, patches[i]);
      if (!newContent) return false;
    }
    return newContent;
  }
  
  app.update = update;
  app.getPatchedContent = getPatchedContent;
}());

// setup editor
(function () {
  var el = $('#writebox');
  el.markdown({
    autofocus: true,
    savable: true,
    onSave: app.save,
    hiddenButtons: 'cmdPreview',
    additionalButtons: [
      [{
        name: "groupActions",
        data: [
          {
            name: 'cmdUpdate',
            title: 'Save',
            icon: 'glyphicon glyphicon-refresh',
            callback: app.update
          },
          {
            name: 'cmdSave',
            title: 'Save',
            icon: 'glyphicon glyphicon-floppy-disk',
            callback: app.save
          }
        ]
      },
      {
        name: 'groupLinks',
        data: [{
          name: "cmdView",
          title: "View",
          icon: "glyphicon glyphicon-eye-open",
          callback: function(e){
            window.open('.');
          }
        }]
      }]
    ]
  });
  var editor = el.data('markdown');
  editor.setFullscreen(true);
  editor.setFullscreen = function () {};
  app.data.savedContent = editor.getContent();
  
  el.unbind('keydown');
  // el.bind('keyup', app.save);
  el.bind('keydown', 'ctrl+s', app.save);
  el.bind('keydown', 'meta+s', app.save);

  app.editor = editor;
  
  // hide default editor buttons
  $.fn.markdown.defaults.buttons[0].forEach(function (group) {
    group.data.forEach(function (btn) {
      app.editor.hideButtons(btn.name);
    });
  });
  
}());

// important elements
(function () {
  var usersEl = $('<span class="current-users">'),
    updateBtn = $('.glyphicon-refresh').closest('.btn');
  $('.md-fullscreen-controls').append(usersEl);
  
  app.el = {
    usersEl: usersEl,
    updateBtn: updateBtn,
    editor: $('#writebox')
  };
}());
  

// dirty editor
(function () {
  $(window).on("beforeunload", function (e) {
    var editor = app.editor;
    if (editor.getContent() === app.data.savedContent) {
      app.socket.disconnect();
      return;
    }
    var confirmationMessage = "Unsaved changes!";
    (e || window.event).returnValue = confirmationMessage;
    return confirmationMessage;
  });
}());

// setup page ui
(function () {
  $('body').animate({
    opacity: 1
  });
  
  $('title').text(app.data.topicName + ' - ' + $('title').text());
  
  $(window).resize(resize);
  resize();
  function resize() {
    var maxWidth = 800,
      minPadding = 30,
      padding = Math.max(parseInt(($(window).width() - maxWidth) / 2, 10), minPadding);
    app.el.editor.each(function () {
        this.style.setProperty('padding-left', padding + 'px', 'important');
        this.style.setProperty('padding-right', padding + 'px', 'important');
    });
  }
}());

// real-time stuff
(function () {
  var socket = window.io(app.data.mountPath);
  socket.on('connect', function () {
    socket.emit('topic', app.data.topicName);
  });
  
  socket.on('users', function (count) {
    app.el.usersEl.text(count > 1 ? (count + ' writers') : '');
  });
  
  socket.on('update', function (patch) {
    app.data.patches.push(patch);
    app.el.updateBtn.addClass('wr-btn-highlight');
  });
  
  socket.on('save-error', function (msg) {
    window.humane.error(msg);
  });
  
  app.socket = socket;
}());
