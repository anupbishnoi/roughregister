module.exports = function (app) {
    app.socketIO.on("connection", function (socket) {
        socket.emit("from root");
    });
};
