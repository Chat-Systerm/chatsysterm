//此用户的json对象
var person = {
    "name": "none",
    "socketid": "none",
    "toname": "none",
    "chat_server": 0,
    "message": "none",
    "type": "none"
};
person.name = document.getElementById("sess_name").innerHTML;
person.chat_server = document.getElementById("chatserver").innerHTML;
//console.log(person);
//第一次连接服务器,暴露了一个io的全局变量，默认连接到提供当前页面的主机
if (person.chat_server == 1) {
    var socket = io.connect('http://localhost:3001');
}
else if (person.chat_server == 2) {
    var socket = io.connect('http://localhost:3002');
}
socket.on('welcome', function (data) {
    //document.getElementById("tishi").innerHTML = "Welcome!" + person.name;
    console.log("socketid:", data.id);
    person.socketid = data.id;
    socket.emit('welcome', person);
});
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
socket.emit('friendadd');
socket.on('friend', function (data) {
    seleadd(data);
    listadd(data);
    findhistory(data);
});
//选中好友开始聊天:主动发起聊天,每选中一次创建一个会话,但需判断该会话是否已存在
function selefri() {
    var sele = document.getElementById("myselect");
    var index = sele.selectedIndex;
    var idname = myselect.options[index].text;
    if (idname != "请选择聊天好友") {
        //遍历该用户所有聊天会话chatfri，查找是否该会话已存在
        var id = find_chat_fri(idname);
        console.log(idname, id);
        if (id == 0) {  //未找到该会话，增加新会话
            if (chatfri[0] == "deleted") {  //如果会话1 被删除过，则新增加的会话替代1会话
                id = 1;
                chatfri[0] = idname;
            }
            else {      //如果会话1没有被删除，则往后新增加一个会话
                num++;
                chatfri.push(idname);
                id = num;
            }
            addchat(id, idname);
        }
        //console.log(chatfri);
        person.type = "none";
    };
}
function findhistory(fridata) {
    var sele = document.getElementById("historyfind");
    for (var i = 0; i < fridata.length; i++) {
        var op = document.createElement("option");
        op.setAttribute("value", fridata[i].UserName);
        op.innerHTML = fridata[i].UserName;
        sele.appendChild(op);
    }
}
function seleadd(fridata) {    //聊天选择栏
    var sele = document.getElementById("myselect");
    for (var i = 0; i < fridata.length; i++) {
        var op = document.createElement("option");
        op.setAttribute("value", fridata[i].UserName);
        op.innerHTML = fridata[i].UserName;
        sele.appendChild(op);
    }
}
function listadd(datafri) {        //好友列表
    var biaoqian = document.getElementById("listul");
    biaoqian.innerHTML = "";
    for (var i = 0; i < datafri.length; i++) {
        var li = document.createElement("li");
        li.innerHTML = datafri[i].UserName;
        biaoqian.appendChild(li);
    }
}
//随时监听任何人发来的聊天信息：被动接收新会话/接收已存在会话的消息
socket.on('chat message', function (data) {
    console.log(data);
    var idname = data.name;   //遍历该用户聊天会话，查找是否该会话已存在
    var id = find_chat_fri(idname);
    if (idname == "server") {   //接收服务器发来的消息
        id = -1;
        var toname = data.toname;
        var deleid = find_chat_fri(toname);
        delechat(deleid);
        alert(data.message);
    }
    if (id == 0) {  //未找到该会话，增加新会话
        if (chatfri[0] == "deleted") {  //若会话1被删除，则新增的会话填充会话1 
            id = 1;
            chatfri[0] = idname;
        }
        else {
            num++;
            chatfri.push(idname);
            id = num;
        }
        addchat(id);
    }
    if (data.type == "text") {
        addlile(data.message, id);
    }
    else if (data.type == "img") {
        addimgle(data.message, id);
    }
    else if (data.type == "video") {
        addvidle(data.message, id);
    }
    else if (data.type == "audio") {
        addaudle(data.message, id);
    }
});
//发送消息函数,n为对应的会话id
function send_mess(n) {
    if ((chatfri[n - 1]) && (chatfri[n - 1] != "deleted")) {
        var mess = document.getElementById("textx" + n).value;
        var texx = chatfri[n - 1];
        person.toname = texx;       //根据会话id:n确定会话发送目标toname
        if (mess != '') {
            addliri(mess, n);
            person.type = "text";
            person.message = mess;
        }
        if (person.type == "img") {
            img = document.getElementById("imgshow").src;
            person.message = img;
            addimgri(img, n);
        }
        if (person.type == "audio") {
            audio = document.getElementById("audshow").src;
            person.message = audio;
            addaudri(audio, n);
        }
        if (person.type == "video") {
            video = document.getElementById("vidshow").src;
            person.message = video;
            addvidri(video, n);
        }
        socket.emit('sayto', person);
        person.type = "none";
    }
    else {
        alert("请先选择聊天好友！");
    }
    document.getElementById("textx" + n).value = "";
    document.getElementById("fileinput" + n).value = "";
    send(); //每次发送消息后都申请查询聊天记录以更新chathistory数组
}
//辅助函数
function addchat(n) {
    if (n == 1) {
        var tex = document.getElementById("chattop1");
        tex.innerHTML = chatfri[0];
        var close = document.getElementById("close1");
        close.innerHTML = "&times";
        readFile(1);
    }
    else {
        var chatbox = document.getElementById("chatbox");
        var chatwin = document.createElement("div");
        chatwin.setAttribute("class", "chatright");
        chatwin.setAttribute("id", "chatwin" + n);
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
        tonamespan.innerHTML = chatfri[n - 1];
        var close = document.createElement("span");
        close.setAttribute("class", "close");
        close.setAttribute("title", "Close Moal");
        close.setAttribute("id", "close" + n);
        close.setAttribute("onclick", "delechat(" + n + ")");
        close.innerHTML = "&times";
        chattop.appendChild(tonamespan);
        chattop.appendChild(close);
        var ulmes = document.createElement("ul");
        ulmes.setAttribute("class", "ull");
        ulmes.setAttribute("id", "ulll" + n);
        chatcenter.appendChild(ulmes);
        var file = document.createElement("input");
        file.setAttribute("type", "file");
        file.setAttribute("id", "fileinput" + n);
        var preview = document.createElement("button");
        preview.setAttribute("id", "showModalBtn" + n);
        preview.setAttribute("onclick", "show(" + n + ")");
        preview.innerText = "预览";
        var tex = document.createElement("textarea");
        tex.setAttribute("class", "text");
        tex.setAttribute("id", "textx" + n);
        tex.setAttribute("placeholer", "请在此输入要发送的内容...");
        var but = document.createElement("button");
        but.setAttribute("class", "sendbtn");
        but.setAttribute("id", "sendbtn" + n);
        but.setAttribute("onclick", "send_mess(" + n + ")");
        but.innerHTML = "发送";
        chatfoot.appendChild(file);
        chatfoot.appendChild(preview);
        chatfoot.appendChild(tex);
        chatfoot.appendChild(but);
        chatbox.appendChild(chatwin);
        readFile(n);
    }
}
//删除会话
function delechat(n) {
    if (n == 1) {
        var top1 = document.getElementById("chattop1");
        top1.innerHTML = "";
        var text1 = document.getElementById("textx1");
        text1.innerHTML = "";
        var ulq = document.getElementById("ulll1");
        ulq.innerHTML = "";
        var clo = document.getElementById("close1");
        clo.innerHTML = "";
        chatfri[0] = "deleted";
    }
    else {
        var chatwin = document.getElementById("chatwin" + n);
        chatwin.parentNode.removeChild(chatwin);
        chatfri[n - 1] = "deleted";
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
function addimgri(imgsrc, id) {
    var biaoqian = document.getElementById("ulll" + id);
    var li = document.createElement("li");
    li.setAttribute("class", "msgright");
    var ppp = document.createElement("a");
    ppp.setAttribute("class", "msgcard");
    ppp.setAttribute("onclick", "show(" + id + ")");
    ppp.innerHTML = "img,点击放大";
    li.appendChild(ppp);
    biaoqian.appendChild(li);
}
function addvidri(vidsrc, id) {
    var biaoqian = document.getElementById("ulll" + id);
    var li = document.createElement("li");
    li.setAttribute("class", "msgright");
    var ppp = document.createElement("a");
    ppp.setAttribute("class", "msgcard");
    ppp.setAttribute("onclick", "show(" + id + ")");
    ppp.innerHTML = "video,点击放大";
    li.appendChild(ppp);
    biaoqian.appendChild(li);
}
function addaudri(audsrc, id) {
    //console.log("audio");
    var biaoqian = document.getElementById("ulll" + id);
    var li = document.createElement("li");
    li.setAttribute("class", "msgright");
    var ppp = document.createElement("a");
    ppp.setAttribute("class", "msgcard");
    ppp.setAttribute("onclick", "show(" + id + ")");
    ppp.innerHTML = "audio,点击放大";
    li.appendChild(ppp);
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
function addimgle(imgsrc, id) {
    var biaoqian = document.getElementById("ulll" + id);
    var li = document.createElement("li");
    li.setAttribute("class", "msgleft");
    var ppp = document.createElement("a");
    ppp.setAttribute("class", "msgcard");
    ppp.setAttribute("onclick", "show(" + id + ")");
    ppp.innerHTML = "img,点击放大";
    li.appendChild(ppp);
    biaoqian.appendChild(li);
    imggshow(imgsrc);

}
function addvidle(vidsrc, id) {
    var biaoqian = document.getElementById("ulll" + id);
    var li = document.createElement("li");
    li.setAttribute("class", "msgleft");
    var ppp = document.createElement("a");
    ppp.setAttribute("class", "msgcard");
    ppp.setAttribute("onclick", "show(" + id + ")");
    ppp.innerHTML = "video,点击放大";
    li.appendChild(ppp);
    biaoqian.appendChild(li);
    videoshow(vidsrc);

}
function addaudle(audsrc, id) {
    var biaoqian = document.getElementById("ulll" + id);
    var li = document.createElement("li");
    li.setAttribute("class", "msgleft");
    var ppp = document.createElement("a");
    ppp.setAttribute("class", "msgcard");
    ppp.setAttribute("onclick", "show(" + id + ")");
    ppp.innerHTML = "audio,点击放大";
    li.appendChild(ppp);
    biaoqian.appendChild(li);
    audioshow(audsrc);
}
//****************************图片、视频、音频的弹窗预览 */
function show(id) {
    var mask = document.getElementById("pageMask");
    var modal = document.getElementById("ModalBody");
    var closeBtn = document.getElementById("closeModalBtn");
    modal.style.display = (modal.style.display == "block") ? "none" : "block";
    closeBtn.style.display = (closeBtn.style.display == "block") ? "none" : "block";
    mask.style.visibility = (mask.style.visibility == "visible") ? "hidden" : "visible";
    closeBtn.onclick = function () {
        modal.style.display = (modal.style.display == "block") ? "none" : "block";
        closeBtn.style.display = (closeBtn.style.display == "block") ? "none" : "block";
        mask.style.visibility = (mask.style.visibility == "visible") ? "hidden" : "visible";
        document.getElementById("imgshow").removeAttribute("src");
        document.getElementById("imgshow").style.display = "none";
        document.getElementById("vidshow").removeAttribute("src");
        document.getElementById("vidshow").style.display = "none";
        document.getElementById("audshow").removeAttribute("src");
        document.getElementById("audshow").style.display = "none";
    }
}

//监听input标签
function readFile(n) {
    var input = document.getElementById("fileinput" + n);
    if (typeof (FileReader) === 'undefined') {
        result.innerHTML = "抱歉，你的浏览器不支持 FileReader，请使用现代浏览器操作！";
        input.setAttribute('disabled', 'disabled');
    } else {
        input.addEventListener('change', readfile, false);
    }
}
function readfile() {
    var file = this.files[0];
    //readAsDataURL方法会读取指定的 Blob 或 File 对象。
    //读取操作完成的时候,result 属性将包含一个data:URL格式的字符串（base64编码）以表示所读取文件的内容
    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function (e) {
        //img的src属性或background的url属性，可以通过被赋值为图片网络地址或base64的方式显示图片
        var typee = this.result.substring(this.result.indexOf('/') + 1, this.result.indexOf(';'));
        if ((typee == "png") || (typee == "img")) {
            imggshow(this.result);
            person.type = "img";
        }
        else if (typee == "mp4") {
            videoshow(this.result);
            person.type = "video";

        }
        else if (typee == "mp3") {
            audioshow(this.result);
            person.type = "audio";
        }
        else if ((typee == "pdf") || (typee == "txt") || (typee == "docx") || (typee == "doc") || (typee == "xlsx")) {
            //TODO:
            alert("请传输img/png/mp3/mp4格式文件！");

        }
    }
}

function imggshow(src) {        ///将最新src属性赋给相关标签
    document.getElementById("imgshow").src = src;
    document.getElementById("imgshow").style.display = 'block';
    document.getElementById("vidshow").style.display = 'none';
    document.getElementById("audshow").style.display = 'none';
}
function videoshow(src) {
    document.getElementById("vidshow").src = src;
    document.getElementById("vidshow").style.display = 'block';
    document.getElementById("imgshow").style.display = 'none';
    document.getElementById("audshow").style.display = 'none';
}
function audioshow(src) {
    document.getElementById("audshow").src = src;
    document.getElementById("audshow").style.display = 'block';
    document.getElementById("vidshow").style.display = 'none';
    document.getElementById("imgshow").style.display = 'none';
}

function logout() {
    socket.close();
    window.location.href = '/logout';
}
//********************************* 聊天记录查询**************************************
var chathistory = new Array();  //聊天记录数组，通过用户发送history事件定时更新
socket.on('findhis', function (data) {
    chathistory = data;
    console.log(chathistory);
});
function send() {
    socket.emit('history');
}
window.onload = send;
//选择查询和某人的聊天记录后触发事件
function selechat() {
    send();
    var result = new Array();
    var sele = document.getElementById("historyfind");
    var index = sele.selectedIndex;
    var idname = myselect.options[index].text;
    console.log('idname:', idname);
    if (chathistory.length != 0) {
        for (var i = 0; i < chathistory.length; i++) {
            if ((chathistory[i].name == idname) || (chathistory[i].toname == idname)) {
                var one ={
                    "time":chathistory[i].Time,
                    "name":chathistory[i].name,
                    "toname":chathistory[i].toname,
                    "mess":chathistory[i].message,
                    "type":chathistory[i].type,
                };
                result.push(one);
            }
        }
        if (result.length == 0) {
            alert("未找到相关记录！");
        }
        else {
            //console.log("result:", result);
            var table = document.getElementById("table-1");
            var tb = document.createElement("tbody");
                tb.setAttribute("id","sbsb");
            for (var i = 0; i < result.length; i++) {
                var tr1 = document.createElement("tr");
                var th1 = document.createElement("th");
                th1.innerText =result[i].time;
                var th2 = document.createElement("th");
                th2.innerText = result[i].name;
                var th3 = document.createElement("th");
                th3.innerText = result[i].toname;
                var th4 = document.createElement("th");
                if(result[i].type == "text"){
                    th4.innerText =result[i].mess;
                }
                else if(result[i].type == "img"){
                    var im = document.createElement("img");
                    im.setAttribute("src",result[i].mess);
                    im.setAttribute("height","50");
                    im.setAttribute("width","100");
                    th4.appendChild(im);
                }
                else if(result[i].type == "video"){
                    var vi = document.createElement("video");
                    vi.setAttribute("src",result[i].mess);
                    vi.setAttribute("height","50");
                    vi.setAttribute("width","100");
                    th4.appendChild(vi);
                }
                else if(result[i].type == "audio"){
                    /*var aud = document.createElement("audio");
                    aud.setAttribute("src",result[i].mess);
                    aud.setAttribute("height","50");
                    aud.setAttribute("width","100");
                    th4.appendChild(aud);*/
                    th4.innerText = "<音频>";
                }
                tr1.appendChild(th1);
                tr1.appendChild(th2);
                tr1.appendChild(th3);
                tr1.appendChild(th4);
                tb.appendChild(tr1);
            }
            table.appendChild(tb);
            var mask = document.getElementById("pageMask");
            var modal = document.getElementById("ModalBody2");
            var closeBtn = document.getElementById("closeModalBtn2");
            modal.style.display = (modal.style.display == "block") ? "none" : "block";
            closeBtn.style.display = (closeBtn.style.display == "block") ? "none" : "block";
            mask.style.visibility = (mask.style.visibility == "visible") ? "hidden" : "visible";
            closeBtn.onclick = function () {
                modal.style.display = (modal.style.display == "block") ? "none" : "block";
                closeBtn.style.display = (closeBtn.style.display == "block") ? "none" : "block";
                mask.style.visibility = (mask.style.visibility == "visible") ? "hidden" : "visible";
                var tab = document.getElementById("sbsb");
                tab.parentNode.removeChild(tab);
            }
        }

    }
    else {
        alert("未找到相关记录！");
    }
}
