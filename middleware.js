module.exports = function (app) {
    app.sockets.on("connection", function (socket) {
        socket.emit("from root");
    });
};
