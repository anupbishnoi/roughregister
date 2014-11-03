var serveStatic = require('serve-static'),
  filesPath = require('./files-path');

module.exports = function (app) {
  if (filesPath) {
    app.use(serveStatic(filesPath));
  }
};