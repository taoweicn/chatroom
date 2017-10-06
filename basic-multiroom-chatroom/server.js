let express = require('express');
let path = require('path');
let app = express();
let server = require('http').Server(app);
let io = require('socket.io')(server);
let PORT = 3000;

server.listen(PORT, function () {
	console.log("listening on port: " + PORT);
});

app.use(express.static(path.join(__dirname, '/')));

app.get('/room/:id', function (req, res) {
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
		console.log(roomList);
		socket.join(roomId);
		socket.to(roomId).emit('enter', username + " come in");
		socket.emit('enter', username + " come in!");
	});

	socket.on("message", function (str) {
		io.emit("message", "这是发给包括自己在内的所有人");
	});

	socket.on("disconnect", function (str) {
		socket.to(roomId).emit("leave", str + " left!");
	});
});


/*
* 几种发送方式的区别
*1.socket.emit()    发送消息给自己的服务端
*
*2.socket.broadcast.emit()   发送消息给除自己以外的所有人
*
*3.io.emit()            发送消息给所有人
*
*4.socket.to(roomId).emit()    发送给这个房间内除自己之外的所有人
*
* */