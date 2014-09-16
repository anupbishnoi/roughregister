var assert = require('assert'),
    request = require('request'),
    cheerio = require('cheerio');

module.exports = function (app) {
    app.get('/:handle', function (req, res) {
        res.send('hey');
        return;
        var handle = req.params.handle;
        assert.equal(typeof handle, 'string');
        request('https://twitter.com/' + handle, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(body);
                res.send($('[data-nav=followers] .ProfileNav-value').text());
            } else {
                res.send(response.statusCode + ': ' + error);
            }
        });
    });
};
