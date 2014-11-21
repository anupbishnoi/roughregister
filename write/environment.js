var path = require('path'),
  ejs = require('ejs');
module.exports = function (app) {
  app.set('views', path.join(__dirname, 'public', 'views'));
  app.engine('html', ejs.renderFile);
  app.set('view engine', 'ejs');
};