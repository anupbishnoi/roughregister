var sh = require('shelljs');

module.exports = function (app) {
    app.all('/redeploy', function (req, res) {
        sh.exec('git pull');
        setTimeout(function () {
            sh.exec('forever restartall');
        }, 2000);
        res.send('restarting server');
    });
    app.get('/memory', function (req, res) {
        res.json(process.memoryUsage());
    });
};