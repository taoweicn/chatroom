(function ($) {
  $('.next').on('click', function () {
    let roomName = $('#room-name').val(),
      roomLogoUrl = $('#room-logo-url').val();
    if (roomName) {
      let roomInfo = {
        roomName: roomName,
        roomLogoUrl: roomLogoUrl
      };
      $.post('/createRoom', roomInfo, function (result) {
        if (result.status === true) {
          $('.mask-footer').html('新建房间成功！ 即将跳转···');
          window.location.href = '/room/' + roomInfo.roomName;
        }
        else if (result.status === 'exist') {
          $('.mask-footer').html('房间已存在，换个房间名试试？');
        }
        else {
          $('.mask-footer').html('新建房间失败，请重试！');
        }
      })
    }
    else {
      $('.mask-footer').html('房间名必填！');
    }
  });
})(jQuery);