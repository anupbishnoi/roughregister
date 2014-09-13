var socketSetup = require("./sockets"),
	bodyParser = require("body-parser");

module.exports = function (app) {
    app.use(bodyParser.urlencoded({extended:true}));
	app.use(bodyParser.json());
    socketSetup(app);
};
