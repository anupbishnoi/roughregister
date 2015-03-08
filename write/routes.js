var marked = require('marked'),
  pyg = require('pygmentize-bundled'),
  parseUrl = require('url').parse;

var find = require('./db').find;

module.exports = function (app) {
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
        var comments = [];
        res.render('view/index.html', {
          html: html,
          comments: comments
        });
      });
    });
  });
  
  app.get('/:name/files/:file*', function (req, res, next) {
    app.log('file', req.params.file);
    res.redirect('/files/' + req.params.file);
  });
  
  app.get('/:name/edit', function (req, res) {
    var name = req.params.name;
    app.log('edit', name);
    find(name, function (err, md) {
      if (err) return res.end(err.stack);
      md = md || '';
      // app.log('edit md', md);
      res.render('edit/index.html', {
        md: md,
        name: name
      });
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
