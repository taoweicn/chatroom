let express = require('express');
let path = require('path');
let router = express.Router();

/*返回主页*/
router.get('/explore', function (req, res) {
	res.sendFile(path.resolve(__dirname + '/../views/home.html'));
});


/*返回聊天室界面*/
router.get('/room/:roomName', function (req, res) {
	res.sendFile(path.resolve(__dirname + '/../views/chatroom.html'));
});

module.exports = router;