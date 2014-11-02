var serveStatic = require('serve-static');

module.exports = function (app) {
  app.use(serveStatic('/home/ftpuser/files'));
};