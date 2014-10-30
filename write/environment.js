var ejs = require('ejs');
module.exports = function (app) {
  app.set('views', __dirname);
  app.engine('html', ejs.renderFile);
  app.set('view engine', 'ejs');
};