//页面加载需完成的工作：连接后方数据库，查找该用户的朋友，将其增加到好友列表、聊天选择栏
window.onload = seleadd(), listadd();
function seleadd() {    //聊天选择栏
    var sele = document.getElementById("myselect");
    sele.innerHTML = "";
    var opp = document.createElement("option");
    opp.setAttribute("value", "tishi");
    opp.innerHTML = "请选择聊天好友";
    sele.appendChild(opp);
    var op = document.createElement("option");
    //TODO:查找数据库增加好友
    op.setAttribute("value", "zzx");
    op.innerHTML = "zzx";
    sele.appendChild(op);
    var op2 = document.createElement("option");
    op2.setAttribute("value", "wxy");
    op2.innerHTML = "wxy";
    sele.appendChild(op2);
    var op3 = document.createElement("option");
    op3.setAttribute("value", "none");
    op3.innerHTML = "none";
    sele.appendChild(op3);
}
function listadd() {        //好友列表
    var biaoqian = document.getElementById("listul");
    biaoqian.innerHTML = "";
    var li = document.createElement("li");
    li.innerHTML = "zzx";
    biaoqian.appendChild(li);
    //TODO:查找数据库    
}
//第一次连接服务器,暴露了一个io的全局变量，默认连接到提供当前页面的主机
var socket = io.connect();
socket.on('welcome', function (data) {
    document.getElementById("tishi").innerHTML = "Welcome!" + person.name;
    console.log(data.id);
    person.socketid = data.id;
    socket.emit('welcome', person);
});
function logout() {
    socket.close();
    //TODO:推出后跳到上级页面
}

//此用户的json对象
var person = {
    "name": "zzx",
    "socketid": "none",
    "toname": "none",
    "message": "none"
};
//此用户的会话数、储存会话的数组
var num = 0;
var chatfri = new Array();
//根据用户名查找会话id
function find_chat_fri(str) {
    var q = 0;
    for (var x in chatfri) {
        if (chatfri[x] == str) {
            q = parseInt(x, 10) + 1;
        }
    }
    return q;   //找到则返回对应会话id，未找到返回0
}
//选中好友开始聊天:主动发起聊天,每选中一次创建一个会话,但需判断该会话是否已存在
function selefri() {
    var sele = document.getElementById("myselect");
    var index = sele.selectedIndex;
    var idname = myselect.options[index].text;
    if (idname != "请选择聊天好友") {
        //遍历该用户所有聊天会话chatfri，查找是否该会话已存在
        var id = find_chat_fri(idname);
        if (id == 0) {  //未找到，增加新会话
            num++;
            chatfri.push(idname);
            id = num;
            addchat(id, idname);
        }
        person.toname = idname;
        send_mess(id);
    };
}
//随时监听任何人发来的聊天信息：被动接收新会话/接收已存在会话的消息
socket.on('chat message', function (data) {
    var idname = data.name;   //遍历该用户聊天会话，查找是否该会话已存在
    var id = find_chat_fri(idname);
    if (idname == "server") {   //接收服务器发来的消息
        id = -1;
        alert(data.message);
    }
    if (id == 0) {  //未找到该会话，增加新会话
        num++;
        chatfri.push(idname);
        id = num;
        addchat(id, idname);
    }
    person.toname = data.name;
    addlile(data.message, id);
});
//发送消息函数,n为对应的会话id
function send_mess(n) {
    if (person.toname != "non") {       //TODO:none
        var mess = document.getElementById("textx" + n).value;
        var texx = chatfri[n - 1];
        person.toname = texx;   //根据会话id:n确定会话发送目标toname
        person.message = mess;
        if (mess != "") {
            addliri(mess, n);
        }
        socket.emit('sayto', person);
    }
    else {
        alert("请先选择聊天好友！");
    }
    document.getElementById("textx" + n).value = "";
}
//辅助函数
function addchat(n, str) {
    if (n == 1) {
        var tex = document.getElementById("chattop1");
        tex.innerHTML = str;
    }
    else {
        var chatbox = document.getElementById("chatbox");
        var chatwin = document.createElement("div");
        chatwin.setAttribute("class", "chatright");
        chatwin.setAttribute("id", n);
        var chattop = document.createElement("div");
        chattop.setAttribute("class", "top");
        var chatcenter = document.createElement("div");
        chatcenter.setAttribute("class", "center");
        var chatfoot = document.createElement("div");
        chatfoot.setAttribute("class", "footer");
        chatwin.appendChild(chattop);
        chatwin.appendChild(chatcenter);
        chatwin.appendChild(chatfoot);
        var tonamespan = document.createElement("span");
        tonamespan.setAttribute("class", "spa");
        tonamespan.setAttribute("id", "chattop" + n);
        tonamespan.innerHTML = str;
        chattop.appendChild(tonamespan);
        var ulmes = document.createElement("ul");
        ulmes.setAttribute("class", "ull");
        ulmes.setAttribute("id", "ulll" + n);
        chatcenter.appendChild(ulmes);
        var tex = document.createElement("textarea");
        tex.setAttribute("class", "text");
        tex.setAttribute("id", "textx" + n);
        tex.setAttribute("placeholer", "请在此输入要发送的内容...");
        var but = document.createElement("button");
        but.setAttribute("class", "sendbtn");
        but.setAttribute("id", "sendbtn" + num);
        but.setAttribute("onclick", "send_mess(" + n + ")");
        but.innerHTML = "发送";
        chatfoot.appendChild(tex);
        chatfoot.appendChild(but);
        chatbox.appendChild(chatwin);
    }
}
function addliri(messages, id) {
    var biaoqian = document.getElementById("ulll" + id);
    var li = document.createElement("li");
    var pp = document.createElement("p");
    pp.innerHTML = messages;
    li.setAttribute("class", "msgright");
    pp.setAttribute("class", "msgcard");
    li.appendChild(pp);
    biaoqian.appendChild(li);
}
function addlile(messages, id) {
    if (id != -1) {
        var biaoqian = document.getElementById("ulll" + id);
        var li = document.createElement("li");
        var pp = document.createElement("p");
        pp.innerHTML = messages;
        li.setAttribute("class", "msgleft");
        pp.setAttribute("class", "msgcard");
        li.appendChild(pp);
        biaoqian.appendChild(li);
    }
}