let app = require('express')();
let server = require('http').Server(app);
let io = require('socket.io')(server);
let PORT = 3000;

server.listen(PORT, function () {
  console.log("listening on port: " + PORT);
});

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  socket.on("join", function (name) {
    socket.nickName = name;
    io.emit('enter', socket.nickName + " come in!");
  });
  socket.on("message", function (str) {
    io.emit("message", socket.nickName + " says: " + str);
  });
  socket.on("disconnect", function (str) {
    io.emit("leave", socket.nickName + " left!");
  });
});
     