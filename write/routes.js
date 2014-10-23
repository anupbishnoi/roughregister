var marked = require('marked'),
  pyg = require('pygmentize-bundled'),
  dirty = require('dirty'),
  fs = require('fs');

var db = dirty('write.db');
module.exports = function (app) {
  var viewTop = read(f('view-top.html')),
    viewBottom = read(f('view-bottom.html')),
    editTop = read(f('edit-top.html')),
    editBottom = read(f('edit-bottom.html'));
  
  app.get('/:name', function (req, res) {
    var name = req.params.name;
    app.log('view', name);
    find(name, function (err, val) {
      if (err) return res.end(err.stack);
      if (!val) return res.redirect(
        app.mountPath + '/' + name + '/edit'
      );
      // app.log('view md', val);
      marked(val, function (err, html) {
        if (err) return res.end(err.stack);
        // app.log('html', html);
        res.send(viewTop + html + viewBottom);
      });
    });
  });
  
  app.get('/:name/edit', function (req, res) {
    var name = req.params.name;
    app.log('edit', name);
    find(name, function (err, md) {
      if (err) return res.end(err.stack);
      md = md || '';
      // app.log('edit md', md);
      res.send(editTop + md + editBottom);
    });
  });
  
  app.post('/:name/save', function (req, res){
    var name = req.params.name,
      content = req.body.content;
    app.log('save', name);
    // app.log('save md', content);
    db.set(name, content, function () {
      res.send('success');
    });
  });
};

// Syntax highlighting with pygmentize-bundled
marked.setOptions({
  highlight: function (code, lang, fn) {
    pyg({
      lang: lang,
      format: 'html'
    }, code, function (e, result) {
      fn(e, result.toString());
    });
  }
});

// helpers (mostly to maintain line size)
function f(file) {
  return __dirname + '/' + file;
}

function read(file) {
  return fs.readFileSync(file).toString();
}

function stream(file) {
  return fs.createReadStream(file);
}

function find(key, fn) {
  var found;
  db.forEach(function (k, val) {
    if (key === k) {
      found = true;
      fn(null, val);
      return false;
    }
  });
  if (!found) fn(null, undefined);
}