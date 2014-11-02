var serveStatic = require('serve-static'),
  filesPath = require('./files-path');

module.exports = function (app) {
  app.use(serveStatic(filesPath));
};