var humanize = require('humanize');
module.exports = function (app) {
    app.get('/memory-usage', function (req, res) {
        throw 'lol';
        res.send(humanize.filesize(process.memoryUsage().rss));
    });
};