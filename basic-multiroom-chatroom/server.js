let app = require('express')();
let server = require('http').Server(app);
let io = require('socket.io')(server);
let PORT = 3000;

server.listen(PORT, function () {
	console.log("listening on port: " + PORT);
});

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/public/html/index.html');
});

let roomList = {};   //所有房间列表

io.on('connection', function (socket) {
	let url = socket.request.headers.referer;
	let splitArr = url.split("/");
	let roomId = splitArr[splitArr.length-1];

	socket.on("join", function (username) {
		//将用户归类到房间
		if (!roomList[roomId]){
			roomList[roomId] = [];
		}
		roomList[roomId].push(username);
		io.to(roomId).emit('enter', socket.nickName + " come in!");
	});

	socket.on("message", function (str) {
		io.to(roomId).emit("message", socket.nickName + " says: " + str);
	});

	socket.on("disconnect", function (str) {
		io.to(roomId).emit("leave", socket.nickName + " left!");
	});
});