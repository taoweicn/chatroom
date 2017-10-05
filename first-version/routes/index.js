let express = require('express');
let path = require('path');
let router = express.Router();
let bodyParser = require('body-parser');
// let cookieParser = require('cookie-parser');
let session = require('express-session');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));
// router.use(cookieParser);
router.use(session({
	secret: 'my secret', // 建议使用 128 个字符的随机字符串
	cookie: { maxAge: 60 * 1000 },
	resave: true,
	saveUninitialized: true
}));


/*返回主页*/
router.get('/explore', function (req, res) {
	res.sendFile(path.resolve(__dirname + '/../views/home.html'));
});


/*返回聊天室界面*/
router.get('/room/:roomName', function (req, res) {
	res.sendFile(path.resolve(__dirname + '/../views/chatroom.html'));
});

/*登录*/
router.post('/login', function (req, res) {
	//暂时不判断用户是否存在
	console.log(req.body);
	req.session.loggedIn = true;
	req.session.account = req.body.account;
	req.session.nickName = req.body.nickName;
	res.send(true);
});

/*判断是否登录*/
router.post('/loggedIn', function (req, res) {
	let result = {};
	if (req.session.loggedIn) {
		result.loggedIn = false;
		result.user = {
			account: req.session.account,
		  nickName: req.session.nickName
	  }
	}
	else {
		result.loggedIn =false;
	}
	res.send(result);
});


module.exports = router;