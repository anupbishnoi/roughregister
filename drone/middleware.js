var socketSetup = require("./sockets");

module.exports = function (app) {
    app.use(app.express.bodyParser());
    socketSetup(app);
};
