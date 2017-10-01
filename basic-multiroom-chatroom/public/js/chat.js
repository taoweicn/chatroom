let socket = io.connect('http://localhost:3000');
//join事件发送昵称
socket.emit("join", prompt("What is your nickName?"));
//显示聊天窗口
document.getElementById("chat").style.display = "block";

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

socket.on('enter', function (data) {
	showMessage("enter", data);
});
socket.on('message', function (data) {
	showMessage("message", data);
});
socket.on('leave', function (data) {
	showMessage("leave", data);
});