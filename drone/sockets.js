// Game logic built on socket.io
var votes = require("./votes"),
    commandDefaults = require("./command-defaults"),
    password = require("./.password"),
    _ = require("underscore");

var playerNames = {};

module.exports = function (app) {

    var io = app.sockets;

    io.on("connection", function (socket) {
        socket.on("identification", function (identification) {
            var type = identification.type;

            if (type === "drone") {

                if (io.clients("drone").length) {
                    sendLog("Sorry, we already have a drone!");
                    return;
                }
                socket.join("drone");
                socket.emit("authorized");
                sendLog("Hello, drone!");

                socket.on("disconnect", function () {
                    votes.emit("stop");
                });

            } else if (type === "player") {

                socket.join("players");
                var playerName = playerNames[socket.id] =
                    identification.name || ("Player-" + _.uniqueId());

                socket.emit("authorized", playerName);
                sendLog("Hello, " + playerName + "!");

            } else if (type === "admin") {

                if (identification.password === password) {
                    socket.join("admin");
                    socket.emit("authorized");
                    sendLog("Hello, admin!");

                    io.in("players").send("The admin is in the house!");
                } else {
                    socket.emit("unauthorized")
                    sendLog("Wrong admin password!");
                }

            } else if (type === "projector") {

                socket.join("projector");
                socket.emit("authorized");
                sendLog("Hello, projector!");

            }
        });

        var socketId = socket.id;
        socket.on("vote", function (animation) {
            if (isSocketInRoom(socketId, "players")) {
                votes.emit("increment", animation, socket.id, function (msg) {
                    socket.emit("voting error", msg);
                });
                sendLog("Voted for " + animation);
            } else {
                sendLog("But you can't vote!");
            }
        });

        socket.on("command", function (command) {
            if (isSocketInRoom(socketId, "admin")) {
                io.in("drone").emit("action", {
                    call: command,
                    args: commandDefaults[command]
                });
                sendLog("Sending command to drone(s): " + command);
            } else {
                sendLog("But you can't command the drone!");
            }
        });

        socket.on("voting", function (command) {
            if (isSocketInRoom(socketId, "admin")) {
                votes.emit(command);
                io.in("players").emit("voting " + command);
                if (command === "end game") {
                    sendLog("Game ended!");
                } else {
                    sendLog("Voting " + command + "s!");
                }
            } else {
                sendLog("Gotta be admin to start/stop voting..");
            }
        });

        socket.on("end game", function () {
            if (isSocketInRoom(socketId, "admin")) {
                votes.emit("end game", function (errorMsg) {
                    socket.emit("end game error", errorMsg);
                });
                sendLog("Ending game");
            } else {
                sendLog("Only admins stop a game. Maybe you can be an admin one day..");
            }
        });

        socket.on("navdata", function (navdata) {
            if (isSocketInRoom(socketId, "drone")) {
                io.in("projector").emit("navdata", navdata);
            }
        });


        function sendLog(msg) {
            socket.send(msg);
            app.log(">> " + msg);
        }
        socket.on("message", function (msg) {
            app.log("    << " + msg);
        });
    });

    votes.on("log", function (msg) {
        app.log(msg);
    });

    votes.on("grand winner", function (grandWinner) {
        var grandWinnerName = playerNames[grandWinner] || grandWinner;
        io.in("projector").emit("grand winner", grandWinnerName);
        io.in("players").emit("grand winner", grandWinnerName);
        app.log("Grand winner declared: " + grandWinnerName);
    });

    votes.on("winner", function (winning) {
        var animation = winning.animation,
            player = winning.player;

        if (player) {
            app.log("Winning animation: " + animation);
            app.log("Winning player: " + player);
            var playerName = playerNames[player] || player;
            io.in("projector").emit("winner", playerName);
            io.in("players").emit("winner", playerName);
        }

        setTimeout(function () {
            io.in("drone").emit("action", {
                call: "animate",
                args: [animation].concat(commandDefaults["animate"][animation])
            });
            app.log("Sending winning animation to drone: " + animation);
        }, 1000);
    });

    function isSocketInRoom(socketId, roomId) {
        return io.manager.roomClients[socketId][app.mountPath + "/" + roomId];
    }
};
