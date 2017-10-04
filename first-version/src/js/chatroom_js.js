(function ($) {
	/*绑定新建弹出层*/
	$(".create-room").on("click", function () {
		$("body").css("overflow", "hidden");
		$(".mask").fadeIn().find(".close-btn").on("click", function () {
			$(".mask").fadeOut();
			$("body").css("overflow", "auto");
		});
	});


})(jQuery);

let socket = io();
socket.on('connect', function () {
	socket.emit('join', '333');
	socket.emit('message', 'hhhhhh');
});

