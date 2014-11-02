var fs = require('fs'),
  filesPath = require('./files-path');
module.exports = function (app) {
  app.get('/', function (req, res) {
    fs.readdir(filesPath, function (err, files) {
      if (err) return res.end(err.stack);
      res.send(files.map(function (file) {
        return '<a href="' + file + '">' + file + '</a>';
      }).join('<br>'));
    });
  });
};