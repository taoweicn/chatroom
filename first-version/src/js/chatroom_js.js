(function ($) {
	let user = {}, lastSender = {};     //用户信息,上一位发送信息的人
	// let avatarImgUrl = 'http://dummyimage.com/30x30/8cb8ff/FFF&text=';    	//头像前缀地址
	let avatarImgUrl = 'https://placeimg.com/30/30/people';    	//头像前缀地址

	// 判断是否登录
	$.post('/loggedIn', function (result) {
		// 如果有已登录的session
		if (result.loggedIn) {
			user = JSON.parse(JSON.stringify(result.user));
			//加入房间
			joinRoom(result.user);
		}
		else {
			$('.prompt-to-login').fadeIn();
			// 登录窗口
			$('.login-dialog-body input').on('keydown', function (event) {
				if (event.keyCode === 13){
					let account = $('#input-account').val(),
						nickName = $('#input-name').val();
					if (!account || !nickName) {
						$('#login-tip').html('昵称或账户不能为空！').css('color', 'red');
					}
					else if (account === '系统消息' || nickName === '系统消息') {
						$('#login-tip').html('非法昵称或账户名！').css('color', 'red');
					}
					else {
						user = {
							"account": account,
							"nickName": nickName
						};
						$.post('/login', user, function (result) {
							if (result) {
								joinRoom(user);
								$('#login-tip').html('登陆成功!').css('color', 'green');
								// 弹出框隐藏
								$('.prompt-to-login').fadeOut();
							}
							else {
								$('#login-tip').html('登录失败，请重试！').css('color', 'red');
							}
						});
					}
				}
			});

			//关闭按钮
			$('.close-login-btn').on('click', function () {
				$('.prompt-to-login').fadeOut();
			});
		}
	});

	/*加入房间*/
	function joinRoom(user) {
		$(".nav-avatar img").attr('src', avatarImgUrl + user.nickName.substr(user.nickName.length-1, 1));
		//加入房间
		let socket = io();
		socket.on('connect', function () {
			socket.emit('join', user);
			//加载房间信息
			socket.on('join', function (data) {
				//聊天记录
				loadChatRecord(data.chatRecord);
				//房间名和图标
				document.title = data.roomName;
				$('.room-name').html(data.roomName);
				$('.room-logo img').attr('src', `../public/img/room-logo/${data.roomName}.png`);
				//房间人数
				showRoomPeople(data.roomPeople);
			});
		});

		//输入框事件
		$('#input-textarea').on('keydown', function (event) {
			if (event.keyCode === 13 && $(this).val()) {
				let msgInfo = {
					content: $(this).val(),
					time: new Date(),
					speaker: user
				};
				socket.emit('message', msgInfo);
				showMessage(msgInfo);
				$(this).val("");
			}
		});

		/*监听消息*/
		socket.on('message', function (data) {
			showMessage(data);
		});

		/*监听其他人进入房间*/
		socket.on('enter', function (userAndRoomInfo) {
			let data = {
				speaker: {nickName: '系统消息', account: '系统消息'},
				time: new Date(),
				content: `【${userAndRoomInfo.user.nickName}@${userAndRoomInfo.user.account}】进入了本房间！`
			};
			showMessage(data, 'system');
			showRoomPeople(userAndRoomInfo.roomInfo.roomPeople);
		});

		/*监听其他人离开房间*/
		socket.on('leave', function (userAndRoomInfo) {
			let data = {
				speaker: {nickName: '系统消息', account: '系统消息'},
				time: new Date(),
				content: `【${userAndRoomInfo.user.nickName}@${userAndRoomInfo.user.account}】离开了房间~~~`
			};
			showMessage(data, 'system');
			showRoomPeople(userAndRoomInfo.roomInfo.roomPeople);
		})


	}

	/*加载聊天记录*/
	function loadChatRecord(data) {
		for (let i = 0; i < data.length; i++) {
			showMessage(data[i], 'user', true);
		}
		let dialog = $('.dialog');
		let scrollHeight = dialog.prop("scrollHeight");
		//加载时间
		if (data.length < 20) {
			dialog.animate({scrollTop: scrollHeight}, data.length * 100);
		}
		else {
			dialog.animate({scrollTop: scrollHeight}, 2000);
		}
	}

	/*页面显示一条消息*/
	function showMessage(data, type, noScroll) {
		let dialog = $('.dialog'),
			nickName = data.speaker.nickName,
			account = data.speaker.account,
		  message = '';

		//判断是否是连续发送消息
		if (JSON.stringify(lastSender) === JSON.stringify(data.speaker) && type !== 'system'){  //如果是
			message = $('.chat-message').eq(1).clone(true);
		}
		else {
			lastSender = JSON.parse(JSON.stringify(data.speaker));
			message = $('.chat-message').eq(0).clone(true);
			message.find('.user-avatar img').attr('src', avatarImgUrl + nickName.substr(nickName.length-1,1));

			//先得把字符串转换为Date对象
			if (typeof data.time !== "object"){
				data.time = new Date(data.time);
			}
			message.find('.message-time').html(`${intoTwoDigits(data.time.getMonth() + 1)}月 ${intoTwoDigits(data.time.getDate())} ${intoTwoDigits(data.time.getHours())}:${intoTwoDigits(data.time.getMinutes())}`);
		}

		message.find('.user-nickName').html(nickName);
		message.find('.user-account').html('@' + account);
		message.find('.message-words').html(data.content);

		if (type === 'system') {
			//系统消息
			message.find('.message-container').addClass('system-message')
				.on('mouseover', function () {
					//鼠标经过就移除这个样式
					$(this).removeClass('system-message');
				});
			message.find('.user-avatar img').attr('src', '../public/img/system-message.png');
		}
		else if (document.hidden) {
			//如果用户没有看当前窗口，就加上未阅读的样式
			message.find('.message-container').addClass('unread-message')
				.on('mouseover', function () {
					//鼠标经过就移除这个样式
					$(this).removeClass('unread-message');
				});
		}

		dialog.append(message);
		if (!noScroll) {
			//滚到底部
			let scrollHeight = dialog.prop("scrollHeight");
			dialog.animate({scrollTop: scrollHeight}, 400);
		}

	}

	/*将一位数字变成两位字符串*/
	function intoTwoDigits(num) {
		if (num < 10) {
			return "0"+num.toString();
		}
		else {
			return num.toString();
		}
	}

	/*显示房间人数*/
	function showRoomPeople(data) {
		$('.room-people-num').html(data.length);
		$('.avatar-images').html('');
		for (let i = 0; i < data.length; i++) {
			let div = $('<div><img></div>');
			div.find('img').attr('src', avatarImgUrl + data[i].nickName.substr(data[i].nickName.length-1));
			div.appendTo('.avatar-images');
		}
	}

	/*绑定新建弹出层*/
	$('.create-room').on('click', function () {
		$('body').css('overflow', 'hidden');
		$('.mask').fadeIn().find('.close-btn').on('click', function () {
			$('.mask').fadeOut();
			$('body').css('overflow', 'auto');
		});
	});

})(jQuery);

