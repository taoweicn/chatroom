(function ($) {
  let user = {}, lastSender = {};     //用户信息,上一位发送信息的人
  let split_arr = window.location.href.split('/'),
    roomName = split_arr[split_arr.length-1];
  // let avatarImgUrl = 'http://dummyimage.com/30x30/8cb8ff/FFF&text=';      //头像前缀地址
  let avatarImgUrl = 'https://placeimg.com/30/30/people';      //头像前缀地址

  // 判断是否登录
  $.post('/loggedIn', function (result) {
    // 如果有已登录的session
    if (result.loggedIn) {
      user = result.user;
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
            $.post('/login', {user: user, roomName: roomName}, function (result) {
              if (result.status === true) {
                joinRoom(user);
                $('#login-tip').html('登陆成功!').css('color', 'green');
                // 弹出框隐藏
                $('.prompt-to-login').fadeOut();
              }
              else if (result.status === 'repeat') {
                $('#login-tip').html('昵称或账户与已有用户重复！').css('color', 'red');
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
    //加载用户头像
    $(".nav-avatar img").attr('src', avatarImgUrl + user.nickName[user.nickName.length-1]);
    $(".avatar img").attr('src', avatarImgUrl + user.nickName[user.nickName.length-1]);
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
        $('.room-logo img').attr('src', data.roomLogoUrl);
        //房间人数
        showRoomPeople(data.roomPeople);
      });
    });

    //输入框事件
    $('#input-textarea').on('keydown', function (event) {
      let text = $(this).val();
      //发送确认
      if (event.keyCode === 13 && text) {
        let msgInfo = {
          content: text,
          time: new Date(),
          speaker: user
        };
        socket.emit('message', msgInfo);
        showMessage(msgInfo);
        $(this).val("");
      }
    }).on('keyup', function () {
      let inputBox = $('#input-textarea'),
        text = inputBox.val();
      //如果输入了@/at
      if (text[text.length-1] === '@' || text.slice(text.length - 2) === 'at') {

        $.post('/peopleList', {roomName: roomName}, function (roomInfo) {
          let inputTip = $('#input-tip');
          inputTip.html("");

          for (let i =0; i <roomInfo.roomPeople.length; i++) {
            let people = roomInfo.roomPeople[i];
            //不让自己出现在@列表
            if (people.nickName === user.nickName || people.account === user.account) {
              continue;
            }
            let small = $(`<small>@${people.account}</small>`),
              li = $(`<li>${people.nickName} </li>`);
            li.append(small)
              .on('click', function () {
                let end = $(this).html().indexOf('<');
                if (text[text.length-1] === '@') {
                  inputBox.val(inputBox.val() + $(this).html().slice(0, end));
                }
                else {
                  inputBox.val(inputBox.val().slice(0, -2)+ '@' + $(this).html().slice(0, end));
                }
              $('#input-tip').fadeOut(200);
              inputBox.focus();
            });
            inputTip.append(li);
          }
          //有人才显示列表(不包括自己）
          if (roomInfo.roomPeople.length > 1){
            inputTip.fadeIn(100).css('left', inputBox.caret('position').left);
          }
        });
      }
      else {
        $('#input-tip').fadeOut(200);
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
    if (compareObj(lastSender, data.speaker) && type !== 'system'){  //如果是
      message = $('.chat-message').eq(1).clone(true);
    }
    else {
      lastSender = data.speaker;
      message = $('.chat-message').eq(0).clone(true);
      message.find('.user-avatar img').attr('src', avatarImgUrl + nickName[nickName.length-1]);
      //先得把字符串转换为Date对象
      if (typeof data.time !== "object"){
        data.time = new Date(data.time);
      }
      message.find('.message-time').html(`${intoTwoDigits(data.time.getMonth() + 1)}月 ${intoTwoDigits(data.time.getDate())} ${intoTwoDigits(data.time.getHours())}:${intoTwoDigits(data.time.getMinutes())}`);
    }

    message.find('.user-nickName').html(nickName);
    message.find('.user-account').html('@' + account);
    let parsedLink = data.content.replace(/(https?:\/{2}[^\s]*)/g, '<a href="$1" target="_blank">$1</a>');
    message.find('.message-words').html(parsedLink);

    if (type !== 'system') {
      /*高亮@消息*/
      if (data.content.indexOf('@' + user.nickName) > -1 && !compareObj(data.speaker, user)) {
        message.find('.message-container').addClass('mention-message')
          .on('mouseover', function () {
            //鼠标经过就移除这个样式
            $(this).removeClass('mention-message');
          });
        //消息声音提醒
        $('#mention-audio')[0].play();
      }

      /*添加@消息到activity*/
      if (data.content.indexOf('@') > -1) {
        let atList = data.content.match(/@([^\s]*?)\s/g);
        if (!atList) {
          return;
        }
        $.post('/peopleList', {roomName: roomName}, function (roomInfo) {
          for (let i = 0; i < atList.length; i++) {
            let item = atList[i];
            for (let people of roomInfo.roomPeople) {
              //如果不是@自己并且房间里有这个人，就添加到活动列表
              if (item.trim().slice(1) !== user.nickName && people.nickName === item.trim().slice(1)) {
                let activityList = $('.activity-list').eq(0).clone();
                activityList.find('.activity-content span').eq(0).html(data.speaker.nickName)
                  .next().html('at')
                  .next().html(item.trim().slice(1));
                activityList.find('.activity-time').html(`${intoTwoDigits(data.time.getHours())}点${intoTwoDigits(data.time.getMinutes())}分`);
                $('#activity-lists').append(activityList);
              }
            }
          }
        });
      }

      //双击@事件
      message.on('dblclick', function () {
        //排除自己
        if (!compareObj(data.speaker, user)) {
          let inputBox = $('#input-textarea');
          inputBox.val(`${inputBox.val()}@${data.speaker.nickName} `);
        }
      });

      //如果用户没有看当前窗口，就加上未阅读的样式
      if (document.hidden) {
        document.title = '你有新的未读消息~~';
        let titleScroll = setInterval(scrollTitle, 300);

        message.find('.message-container').addClass('unread-message')
          .on('mouseover', function () {
            //鼠标经过就移除这个样式
            $(this).removeClass('unread-message');
            clearInterval(titleScroll);
            document.title = roomName;
          });
      }
      
      function scrollTitle() {
        let str = document.title,
          firstInfo = str[0],
          lastInfo = str.slice(1);
        document.title = lastInfo + firstInfo;
      }
    }
    else {
      //系统消息
      message.find('.message-container').addClass('system-message')
        .on('mouseover', function () {
          //鼠标经过就移除这个样式
          $(this).removeClass('system-message');
        });
      message.find('.user-avatar img').attr('src', '../public/img/system-message.png');
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

  /*判断对象是否相等*/
  function compareObj(obj1, obj2) {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

  /*显示房间人数*/
  function showRoomPeople(data) {
    $('.room-people-num').html(data.length);
    $('.avatar-images').html('');
    for (let i = 0; i < data.length; i++) {
      let div = $('<div><img></div>');
      div.find('img').attr('src', avatarImgUrl + data[i].nickName[data[i].nickName.length-1]);
      div.appendTo('.avatar-images');
    }
  }

  /*头像点击事件*/
  $('.nav-avatar').on('click',function (e) {
    e.stopPropagation();
    $('.drop-box').slideToggle();
  });
  $(document).on('click',function () {
    $('.drop-box').slideUp();
  });
  $('.logout').on('click', function () {
    $.get('/logout', function (result) {
      if (result) {
        window.location.reload();
      }
    })
  });

  /*导航栏上星星点击事件*/
  $('.fa-star-o').on('click', function () {
    $(this).toggleClass('fa-star-o').toggleClass('fa-star');
  });

  /*绑定新建弹出层*/
  $('.create-room').on('click', function () {
    $('body').css('overflow', 'hidden');
    $('.mask').fadeIn().find('.close-btn').on('click', function () {
      $('.mask').fadeOut();
      $('body').css('overflow', 'auto');
    });
  });

})(jQuery);

