var bodyParser = require('body-parser');
module.exports = function (app) {
  app.use(bodyParser.urlencoded({
    extended: false
  }));
  
  app.use(function(req, res, next){
    res.locals.mountPath = app.mountPath;
    next();
});

  app.use('/files/:file', function (req, res, next) {
    app.log('file', req.params.file);
    res.redirect('/files/' + req.params.file);
  });
};