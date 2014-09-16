var sh = require('shelljs');

module.exports = function (app) {
    app.get('/redeploy', function (req, res) {
        sh.exec('git pull');
        setTimeout(function () {
            sh.exec('forever restartall');
        }, 2000);
        res.send('restarting server');
    });
};