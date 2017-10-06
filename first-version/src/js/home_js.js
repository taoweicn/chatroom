(function ($) {
	/*绑定新建弹出层*/
	$('.create-room').on('click', function () {
		$('body').css('overflow', 'hidden');
		$('.mask').fadeIn().find('.close-btn').on('click', function () {
			$('.mask').fadeOut();
			$('body').css('overflow', 'auto');
		});
	});

	/*主题列表的展开、收起与点击*/
	let ul = $('#subject-list'),
		ulWidth = ul.width(),
		rowNum = Math.floor((ulWidth + 10) / 140),
		colNum = Math.ceil(ul.children().length/rowNum),
		ulHeight = colNum*44;
	ul.children().eq(rowNum*2 - 2)
		.after('<li class="more-subject">More</li>');
	bindClickEvent($('.more-subject'));
	ul.find('li').each(function () {
		let that = $(this);
		that.on('click', function () {
			that.addClass('active').siblings().removeClass('active');
		});
	});

	/*b绑定More和Less按钮的点击事件*/
	function bindClickEvent(element) {
		if(element.html() === 'More'){
			element.off('click').on('click', function () {
				this.remove();
				ul.css({'overflow': 'visible', 'height': ulHeight + 'px'})
					.append('<li class="more-subject">Less</li>');
				bindClickEvent($('.more-subject'));
			});
		}
		else{
			element.off('click').on('click', function () {
				this.remove();
				ul.css({'overflow': 'hidden', 'height': '88px'})
					.children().eq(rowNum*2 - 2)
					.after('<li class="more-subject">More</li>');
				bindClickEvent($('.more-subject'));
			});
		}
	}

	/*动态加载聊天室*/
	let socket = io();
	socket.on('connect', function () {
		//加载已有房间列表
		socket.on('explore', function (roomList) {
			$('.room-detail').siblings().remove();
			for (let i = 0; i < roomList.length; i++) {
				addRoomList(roomList[i]);
			}
		});
		//动态更新新建房间
		socket.on('new room', function (newRoom) {
			addRoomList(newRoom);
		});

		//实时加载房间人数,2秒执行一次
		setInterval(getRoomList, 2000);

		//向服务器请求房间各个房间的人数
		function getRoomList() {
			$.ajax({
				type: 'POST',
				url: 'getRoomList',
				dataType: 'json',
				success: function (data) {
					for (let i = 0; i < data.length; i++) {
						updatePeopleNum(data[i]);
					}
				}
			})
		}

		//在网页中更新房间人数
		function updatePeopleNum(roomInfo) {
			$('.room-detail').each(function () {
				let that = $(this);
				if (that.find('.card-room').html().toUpperCase() === roomInfo.roomName.toUpperCase() && roomInfo.roomPeople) {
					that.find('.user-count span').html(roomInfo.roomPeople.length);
				}
			});
		}

	});

	/*加载聊天室列表*/
	function addRoomList(data) {
		let demo = $('.room-detail').eq(0);
		if (data.roomName === 'official') {
			if (data.roomPeople) {
				demo.find('.user-count span').html(data.roomPeople.length);
			}
			return;
		}
		let roomDetail = demo.clone();
		roomDetail.find('.card-subject, .card-room').html(data.roomName);
		if (data.roomPeople) {
			roomDetail.find('.user-count span').html(data.roomPeople.length);
		}
		roomDetail.find('a').attr('href', 'room/' + data.roomName);
		roomDetail.find('.card-logo').attr('src', `../public/img/room-logo/${data.roomName}.png`);
		roomDetail.appendTo('.room-list');
	}

})(jQuery);
