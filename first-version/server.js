let express = require('express');
let path = require('path');
let http = require('http');
let app = express();
let routers = require('./routes/index');
let mongoose = require('mongoose');

const PORT = 3000;

app.use(express.static(path.join(__dirname, '/')));
app.use('/', routers);


/*sock.io*/
let server = http.Server(app);
let io = require('socket.io').listen(server);


/*----MongoDB数据库----*/

//连接数据库
mongoose.connect('mongodb://localhost:27017/chat-room', {useMongoClient: true}, function (err) {
	if(err){
		console.log('数据库连接失败 ' + err);
	}else{
		console.log('数据库连接成功');
	}
});

//定义数据库模型
let Schema = mongoose.Schema;

//房间内的聊天记录
let chatRecord = new Schema({
	speaker   : {account: String, nickName: String},
	time      : Date,
	content   : String
});
//房间列表信息
let roomList = new Schema({
	roomName  : String,
	roomPeople: {account: String, nickName: String},
	chatRecord: [chatRecord]
});

//注册一个模型
let chatRoom = mongoose.model('chatRoom', roomList);

/*----数据库截止----*/


io.on('connection', function (socket) {
	let user;
	//获取当前用户的url,从而截取房间id
	let url = socket.request.headers.referer;
	let split_arr = url.split('/');
	let roomName = split_arr[split_arr.length-1];

	if (roomName === 'explore') {
		chatRoom.find({}, function (err, data) {
			if (err) {
				console.log(err);
				return false;
			}
			socket.emit('explore', data);
		});
		return;
	}
	// 监听加入事件
	socket.on('join', function (userInfo) {
		user = userInfo;
		// 将用户加入到房间
		chatRoom.find({roomName: roomName}, function (err, result) {
			if (err) {
				console.log(err);
				return false;
			}
			if (!result.length) {
				//房间不存在则新建
				console.log('房间不存在');
				new chatRoom({roomName: roomName}).save(function (err, newRoom) {
					if (err) {
						console.log(err);
						return false;
					}
					io.emit('new room', newRoom);
					console.log(' 新建房间 ' + roomName);
				});
			}

			chatRoom.update({roomName: roomName}, {$push: {roomPeople: user}}, function (err) {
				if (err) {
					console.log(err);
					return false;
				}
				// 加入房间
				socket.join(roomName);
				//发送此房间的信息
				chatRoom.findOne({roomName: roomName}, function (err, result) {
					if (err) {
						console.log(err);
						return false;
					}
					socket.emit('join', result);
					// 向房间内其他人广播
					socket.to(roomName).emit('enter', {user: user, roomInfo: result});
				});
			});
		});
	});

	// 监听客户端发送的消息
	socket.on('message', function (msg) {
		// 验证用户是否在本房间
		chatRoom.findOne({roomName: roomName}, function (err, result) {
			/*if (result.roomPeople && result.roomPeople.indexOf(user) < 0) {
				console.log(user + ' 不在此房间');
				return false;
			}*/
		});

		//给其他人广播消息，自己则使用回调来确定是否发送成功
		socket.to(roomName).emit('message', msg)	;
		// 存储聊天记录
		chatRoom.update({roomName: roomName}, {$push: {chatRecord: msg}}, function (err) {
				if (err) {
					console.log(err);
					return false;
				}
			});
	});

	// 断开连接
	socket.on('disconnect', function () {
		// 从房间中离开
		socket.leave(roomName, function (err) {
			if (err) {
				console.log(err);
				return false;
			}
			chatRoom.update({roomName: roomName}, {$pull: {roomPeople: user}}, function (err) {
				if (err) {
					console.log(err);
					return false;
				}
				chatRoom.findOne({roomName: roomName}, function (err, result) {
					socket.to(roomName).emit('leave', {user: user, roomInfo: result});
				});
			});
			console.log(user.nickName + ' 离开了房间');
		});
	});
});


app.post('/getRoomList', function (req, res) {
	chatRoom.find({}, function (err, roomList) {
		if (err) {
			console.log(err);
			return false;
		}
		res.send(roomList);
	})
});

//处理404错误
app.use(function (req, res, next) {
	let err = new Error('Not Found!');
	err.status = 404;
	next(err);
});

server.listen(PORT, function () {
	console.log('Chat Room is listening on port ' + PORT);
});


/*笔记区
*
* 1.cookie-parser有毒
* 一旦加入这个中间件路由就失效
*2.客户端的socket建立连接是在调用io开始的，
* 即在socket = io()这一步
*3.MongoDB会把Date格式的数据转换为字符串
*4.MongoDB另一大神坑，必须写回调update才会执行成功
*
*
* */