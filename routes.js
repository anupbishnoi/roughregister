var sh = require('shelljs'),
    humanize = require('humanize');

module.exports = function (app) {
    app.all('/redeploy', function (req, res) {
        sh.exec('git pull');
        setTimeout(function () {
            sh.exec('forever restartall');
        }, 2000);
        res.send('restarting server');
    });
    app.get('/memory-usage', function (req, res) {
        res.json(humanize.filesize(process.memoryUsage().rss));
    });
};