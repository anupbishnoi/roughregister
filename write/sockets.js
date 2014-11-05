var topics = {};
module.exports = function (app) {
  var sockets = app.sockets;
  sockets.on('connection', function (s) {
    onTopic.call(app, s);
  });
};

function onTopic(s) {
  var app = this,
    sockets = app.sockets;
  
  s.on('topic', function (t) {
    app.log('socket in for', t);
    s.join(t);
    topics[t] = (topics[t] || 0) + 1;
    sockets.to(t).emit('users', topics[t]);
    onDisconnect.call(app, s, t);
  });
}

function onDisconnect(s, t) {
  var app = this,
    sockets = app.sockets;
  
  s.on('disconnect', function () {
    app.log('socket out for', t);
    topics[t] = topics[t] - 1;
    sockets.to(t).emit('users', topics[t]);
  });
}

function onComment() {
  
}