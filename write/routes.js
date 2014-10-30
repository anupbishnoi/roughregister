var marked = require('marked'),
  pyg = require('pygmentize-bundled'),
  dirty = require('dirty'),
  fs = require('fs'),
  crypto = require('crypto'),
  parseUrl = require('url').parse,
  path = require('path');

module.exports = function (app) {
  var db = dirty(path.join(__dirname, 'write.db'));
  app.get('/:name/', function (req, res) {
    var url = parseUrl(req.originalUrl);
    if (!/\/$/.test(url.pathname)) {
      var newUrl = url.pathname + '/' +
          (url.search || '') +
          (url.hash || '');
      app.log('redirect to', newUrl);
      return res.redirect(newUrl);
    }
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
        res.render('view.html', {
          html: html
        });
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
      var version = hash(md);
      app.log('sending version', version);
      res.render('edit.html', {
        md: md,
        version: version
      });
    });
  });

  app.post('/:name/save', function (req, res){
    var name = req.params.name,
      content = req.body.content,
      clientVersion = req.body.savedVersion;
    app.log('save', name);
    // app.log('save md', content);
    find(name, function (err, md) {
      if (err) return error(500);
      var lastVersion = hash(md);
      if (clientVersion !== lastVersion)
        return error(409);
      
      db.set(name, content, function () {
        var newVersion = hash(content);
        app.log('new version', newVersion);
        res.send(newVersion);
      });
      
      function error(status) {
        res.status(status);
        res.end();
      }
    });
  });
  
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

function hash(md) {
  var shasum = crypto.createHash('sha1');
  shasum.update(md);
  return shasum.digest('hex');
}