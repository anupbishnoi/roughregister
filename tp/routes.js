var config = require('./twilio-config'),
    accountSid = config.accountSid,
    authToken = config.authToken;

var client = require('twilio')(accountSid, authToken);

module.exports = function (app) {
    app.get('/', function (req, res) {
        var phones = config.phones;
        phones.forEach(function (phone, i) {
            app.log('sending to', phone);
            client.messages.create({
                body: config.msg,
                from: config.from,
                to: phone
            }, function(err) {
                if (err) return;
                app.log('sent to', phone);
                feelingLoved();
            });
        
        });
        var total = phones.length;
        function feelingLoved() {
            --total || res.send('feeling loved :)');
        }
    });
};