var config = require('./twilio-config'),
    accountSid = config.accountSid,
    authToken = config.authToken;

var client = require('twilio')(accountSid, authToken);
client.messages.create({
    body: "ae..",
    to: config.to,
    from: config.from
}, function(err, message) {
    process.stdout.write(message.sid);
});