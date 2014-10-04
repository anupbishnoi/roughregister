var fs = require('fs'),
    path = require('path');

function dotslash(name) {
    return path.join(__dirname, name);
}

module.exports = function (app) {
    var self = this,
        args = arguments;
    fs.readdir(__dirname, function (err, files) {
        if (err) return app.log(err.stack);
        files
            .filter(function (file) { return file !== 'index.js'; })
            .forEach(function (file) {
                try {
                    require(dotslash(file)).apply(self, args);
                } catch(e) {
                    app.log('Couldn\'t load: ' + file);
                    app.log(e.stack);
                }
            });
    });
};