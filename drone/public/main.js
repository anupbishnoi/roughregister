var socket = io.connect(location.origin + "/drone");
var name;

socket.on("connect", function () {
	name = "";
	/*bootbox.hideAll();
    bootbox.prompt("Enter your name", function (name) {
    	socket.emit("identification", { type: "player", name: name });
    });*/
	socket.emit("identification", { type: "player", name: prompt("Enter your name:") });
});

socket.on("authorized", function (name) {
    sendLog((name || "Player") + " is here!");
    activate();
});

socket.on("voting start", function () {
	humane.log("Voting has started!");
	activate();
});

socket.on("voting stop", function () {
	$("body > .container").addClass("inactive");
});

socket.on("voting error", function (msg) {
	humane.remove(function () {
		humane.error(msg);
	});
});

socket.on("winner", function (winnerName) {
	showAnnouncement(winnerName + " won this round");
	setTimeout(activate, 1000);
});

socket.on("grand winner", function (grandWinner) {
	showAnnouncement(grandWinner + " has won the game!");
});

function showAnnouncement(announcement) {
	$("body > .container").addClass("split");
	
	var announcementEl = $(".announcement"),
		jumbotron = $(".announcement-container");

	announcementEl.text(announcement);
	console.log(jumbotron.outerHeight());

	jumbotron.css("top", Math.round($(window).height() * 0.35) + "px");
	jumbotron.removeClass("hidden");

}

function activate() {
	$("body > .container")
		.removeClass("inactive")
		.removeClass("split");
	$(".announcement-container").addClass("hidden");
}


var vote = socket.emit.bind(socket, "vote");

function sendLog(msg) {
    socket.send(msg);
    console.log(">> " + msg);
}
socket.on("message", function (msg) {
    humane.log(msg);
});


// Humane customisation

humane.error = humane.spawn({
	addnCls: "humane-jackedup-error",
	timeout: 5000
});


// UI Code

var windowHeight = $(window).height();

$(".tile")
	.each(function () {
		var el = $(this),
			elWidth = el.width(),
			textEl = el.find(".text");
		
		var elHeight = windowHeight/3;
		el.height(elHeight);

		var fontSize = Math.min(elWidth, elHeight) / 2;
		
		textEl
			.text(el.data("vote"))
			.css({
				bottom: (elHeight/12) + "px",
				right: (elWidth/10) + "px"
			});

		el.fitText(2);
	})
	.on("tap", voteTap)
	.on("click", voteTap);

function voteTap() {
	$(this).css("background", "grey");
	vote($(this).data("vote"));
};

