let username =  prompt("What is your nickName?");

let socket = io();
socket.on("connect", function () {
  //join事件发送昵称
  socket.emit("join", username);

  socket.on('enter', function (data) {
    showMessage("enter", data);
  });
  socket.on('message', function (data) {
    showMessage("message", data);
  });
  socket.on('leave', function (data) {
    showMessage("leave", data);
  });
});


function showMessage(type, str) {
  let div = document.createElement("div");
  div.innerHTML = str;
  if (type === "enter") {
    div.style.color = "blue";
  }
  else if (type === "leave") {
    div.style.color = "orange";
  }
  document.getElementById("room").appendChild(div);
}

document.getElementById("send").addEventListener("click", function () {
  let text = document.getElementById("input").value;
  if (text) {
    socket.emit("message", text);
  }
});
