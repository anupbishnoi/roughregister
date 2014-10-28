module.exports = function (app) {
  var topics = {},
    sockets = app.sockets;
  
  sockets.on('connection', function (s) {
    s.on('topic', function (t) {
      app.log('socket in for', t);
      s.join(t);
      topics[t] = (topics[t] || 0) + 1;
      sockets.to(t).emit('users', topics[t]);
      s.on('disconnect', function () {
        app.log('socket out for', t);
        topics[t] = topics[t] - 1;
        sockets.to(t).emit('users', topics[t]);
      });
    });
  });
};