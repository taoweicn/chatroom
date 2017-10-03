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