var humanize = require('humanize');
module.exports = function (app) {
    app.get('/memory-usage', function (req, res) {
        res.send(humanize.filesize(process.memoryUsage().rss));
    });
};