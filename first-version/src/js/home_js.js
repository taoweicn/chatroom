(function ($) {
	/*绑定新建弹出层*/
	$(".create-room").on("click", function () {
		$("body").css("overflow", "hidden");
		$(".mask").fadeIn().find(".close-btn").on("click", function () {
			$(".mask").fadeOut();
			$("body").css("overflow", "auto");
		});
	});

	/*主题列表的展开与收起*/
	let ul = $("#subject-list"),
		ulWidth = ul.width(),
		rowNum = Math.floor((ulWidth + 10) / 140),
		colNum = Math.ceil(ul.children().length/rowNum),
		ulHeight = colNum*44;
	ul.children().eq(rowNum*2 - 2)
		.after("<li class='more-subject'>More</li>");
	bindClickEvent($(".more-subject"));

	/*b绑定More和Less按钮的点击事件*/
	function bindClickEvent(element) {
		if(element.html() === "More"){
			element.on("click", function () {
				this.remove();
				ul.css({"overflow": "visible", "height": ulHeight + "px"})
					.append("<li class='more-subject'>Less</li>");
				bindClickEvent($(".more-subject"));
			});
		}
		else{
			element.on("click", function () {
				this.remove();
				ul.css({"overflow": "hidden", "height": "88px"})
					.children().eq(rowNum*2 - 2)
					.after("<li class='more-subject'>More</li>");
				bindClickEvent($(".more-subject"));
			});
		}
	}

})(jQuery);
