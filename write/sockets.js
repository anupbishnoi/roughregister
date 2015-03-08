var diff = require('diff');

var db = require('./db').db,
  find = require('./db').find;

var topics = {};
module.exports = function (app) {
  var sockets = app.sockets;
  sockets.on('connection', function (s) {
    onSave.call(app, s);
    onTopic.call(app, s);
  });
};

function onSave(s) {
  var app = this;
  s.on('save', function (opts, acknowledge) {
    app.log('save', opts.topic);
    var topic = opts.topic,
      patch = opts.patch;
    
    find(topic, function (err, md) {
      if (err) return s.emit('save-error', err.message);
      
      if (typeof md !== 'string')
        return s.emit('save-error', 'Bad value in db, refresh');
      var content = diff.applyPatch(md, patch);
      if (!content) {
        app.log('Could not save file', md, '\n', 'with patch', patch);
        return s.emit('save-error', 'Could not save');
      }
      db.set(topic, content, function (err) {
        if (err) return s.emit('save-error', 'Error saving to db');
        acknowledge();
        s.broadcast.to(topic).emit('update', patch);
      });
    });
  });
}

function onTopic(s) {
  var app = this,
    sockets = app.sockets;
  
  s.on('topic', function (t) {
    app.log('socket in for', t);
    s.join(t);
    topics[t] = (topics[t] || 0) + 1;
    sockets.to(t).emit('users', topics[t]);
    onDisconnect.call(app, s, t);
  });
}

function onDisconnect(s, t) {
  var app = this,
    sockets = app.sockets;
  
  s.on('disconnect', function () {
    app.log('socket out for', t);
    topics[t] = topics[t] - 1;
    sockets.to(t).emit('users', topics[t]);
  });
}
