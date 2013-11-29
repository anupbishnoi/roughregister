var EventEmitter = require("events").EventEmitter;

var votes = {};
EventEmitter.call(votes);
votes.__proto__ = EventEmitter.prototype;

var winners = [];

var rounds = [
        {}
    ],
    defaultAnimation = "wave";

rounds.last = function () { return rounds[rounds.length - 1]; };

function roundAndRound() {
    var lastRound = rounds.last();
    rounds.push({});

    var systemKeys = ["allVoters"];

    var maxVoted = defaultAnimation,
        maxVotes = lastRound[defaultAnimation] || 0;
    Object.keys(lastRound).forEach(function (animation) {
        if (!~systemKeys.indexOf(animation)) {
            var voteCount = lastRound[animation].length;
            if (voteCount > maxVotes) {
                maxVotes = voteCount;
                maxVoted = animation;
            }
        }
    });

    var winner = {
        animation: maxVoted,
        player: lastRound[maxVoted] && lastRound[maxVoted][0]
    };
    winners.push(winner);

    votes.emit("winner", winner);
}

votes.on("end game", function (callback) {
    if (!votes.intervalId) {
        callback && callback("No game in progress currently.");
        return;
    }
    votes.emit("stop");

    console.log(winners);

    var grandWinner;
    if (!winners[0]) {
        callback && callback("There have been no winners in the game!");
        return;
    }

    var winCount = winners.reduce(function (winCount, winner) {
        if (winner.player) {
            winCount[winner.player] = winCount[winner.player] || 0;
            winCount[winner.player] += 1;
        }
        return winCount;
    }, {});

    var winnerNames = Object.keys(winCount);

    var grandWinner = winnerNames.reduce(function (grandWinner, winner) {
        if (winCount[winner] > winCount[grandWinner]) {
            grandWinner = winner;
        }
        return grandWinner;
    }, winnerNames[0]);

    votes.emit("grand winner", grandWinner);

    winners = [];
});

votes.on("increment", function (animation, voter, callback) {
    if (!votes.intervalId) {
        callback("Voting hasn't started yet!");
        return;
    }

    var round = rounds.last(),
        voters = round[animation] || (round[animation] = []),
        allVoters = round.allVoters || (round.allVoters = []);

    if (!~voters.indexOf(voter) && !~allVoters.indexOf(voter)) {
        voters.push(voter);
        allVoters.push(voter);
    } else {
        callback("Unable to take that vote.");
    }
});

votes.on("start", function () {
    clearInterval(votes.intervalId);
    votes.intervalId = setInterval(roundAndRound, 30000);
});
votes.on("stop", function () {
    clearInterval(votes.intervalId);
    votes.intervalId = null;
    rounds.push({});
});

function debug(msg) {
    votes.emit("log", msg);
}

module.exports = votes;
