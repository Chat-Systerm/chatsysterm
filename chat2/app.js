var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var query = require('./db/db.config');
var OnlineuserSQL = require('./db/onlineuser.sql');
var Onlineuser2SQL = require('./db/onlineuser2.sql');
var ChatHistorySQL = require('./db/chathistory.sql');
var userSQL = require('./db/user.sql');
const sd = require('silly-datetime');
var app = express();
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({
  extended: false
});
//***********************************udp套接字连接两个服务器,实现两个服务器之间的文字传递
var udp = require('dgram');
var clientSocket = udp.createSocket('udp4');
//实现chat_server1转发给chat_server2的消息的传递
clientSocket.on('message', async function (msg, rinfo) {
  //console.log('recv %s of %d bytes from chat_server1 %s:%d\n', msg, msg.length, rinfo.address, rinfo.port);
  var mes = JSON.parse(msg);
  var tagname = mes.toname;
  let target = await query(Onlineuser2SQL.getUserbyName, [tagname]);
  var tagid = target[0].SocketID;
  var tosocket = socket_send(tagid);
  tosocket.emit('chat message', mes);
});
clientSocket.on('error', function (err) {
  console.log('error, msg - %s, stack - %s\n', err.message, err.stack);
});
clientSocket.bind(54320);
//**********************************tcp套接字实现两个聊天传输服务器chatServer的图片、视频、音频传输
var net = require("net");
var chatserver1_message = "";
var client = net.connect({ port: 8124 }, function () {
  console.log('tcp套接字已连接');
});
//监听TCP服务器chatserver1转发给TCP客户端chatserver2的信息data(chat_message1)
client.on('data', async function (data) { 
  //console.log('recv %d bytes from tcp_chat_server1\n',data.length );
  chatserver1_message = chatserver1_message + data.toString();  //多个包拼接
  if (chatserver1_message.substr(chatserver1_message.length - 1, 1) == '}') {  //接收结束
    //console.log(chatserver1_message);
    var mes = JSON.parse(chatserver1_message);
    var tagname = mes.toname;
    let target = await query(Onlineuser2SQL.getUserbyName, [tagname]);
    var tagid = target[0].SocketID;
    var tosocket = socket_send(tagid);
    tosocket.emit('chat message', mes);
    chatserver1_message = ""; //每转发完一次都清空全局变量chatserver1_mseeage
  }
});
client.on('end', function () {
  console.log('client disconnected');
});

//*********************************socket.io实现前端客户与聊天转发服务器chatserver2的文字、图片、视频、音频转发
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
server.listen(3002);
var _ = require('underscore');
var totalonline2 = 0;
//将socket.io 附加到 http server上，当 http server 接收到 upgrade websocket 时就将请求转给 socket.io 处理。
//服务端启动一个io服务，并监听'connection'事件;每次刷新浏览器，套接字id都不同
io.on('connection', function (socket) { //这里的参数socket对应每个客户client
  totalonline2 ++;
  console.log(socket.id + ' connected,在线人数：' + totalonline2);
  socket.emit('welcome', { id: socket.id });
  socket.on('welcome', async function (pers) {
    var username = pers.name;
    var socketid = pers.socketid;
    var q = await query(OnlineuserSQL.getUserbyName,[username]);
    if(q.length == 0){
      await query(OnlineuserSQL.insert,[username,2]);
    }
    await query(Onlineuser2SQL.insert,[username,socketid]);
  });
  socket.on('friendadd',async function(){
    var allfriend = await query(userSQL.queryAll);
    socket.emit('friend',allfriend);
  });
  socket.on('history',async function(){
    var q = await query(Onlineuser2SQL.getUserbyID,[socket.id]);
    if(q.length != 0){
      var name = q[0].UserName;
      var allsend = await query(ChatHistorySQL.getUserbyName,[name]);
      var allrev = await query(ChatHistorySQL.getUserbyToName,[name]);
      var all = allsend.concat(allrev);
      socket.emit('findhis',all); 
    }
    else{
      socket.emit('findhis',"null");
    }
  });
  socket.on('sayto', async function (data) {
    //console.log(data);
    var toname = data.toname;
    var type = data.type;
    //查询数据库登录表，查看目标用户是否在线
    var online = await query(OnlineuserSQL.getUserbyName,[toname]);
    var updatetimes = sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss');
    await query(ChatHistorySQL.insert, [updatetimes,data.name,data.toname,data.message,data.type]);
    if(online.length == 0){
      socket.emit('chat message', { "message": "该用户不在线，请稍后再试！", "name": "server", "toname": toname });
      await query(ChatHistorySQL.insert, [updatetimes,"server",data.name,"该用户不在线，请稍后再试！","text"]);
    }
    else{
      //判读目标用户是否在此服务器，在线返回其socketid，不在则返回0
      let target = await query(Onlineuser2SQL.getUserbyName, [toname]);
      //目的用户不在此服务器，则采取二者服务器之间的udp/tcp通道发送数据给chat_server1
      if (target.length == 0) {
        var strdata = JSON.stringify(data);
        if (type == "text") { //文本消息采用udp传输
          clientSocket.send(strdata, 8061, "localhost");
        }
        else if (type != "none") { //图片、视频、音频采用tcp传输
           //tcp客户端（chat_server2）转发消息给tcp服务端（chat_server1），由于是Tcp客户端，所以不用触发事件即可发送给tcp服务端
          client.write(strdata);
        }
      }
       //目的用户在此服务器，直接将消息传递给该用户
      else {  
        // nodejs的underscore扩展中的findWhere方法，可以在对象集合中，通过对象的属性值找到该对象并返回。
        //服务器能接收到所有用户发的消息，只要改消息有toname并且可以找到，服务器就能转发给对应用户
        toid = target[0].SocketID;
        var toSocket = socket_send(toid);
        if (type != "none") {
          toSocket.emit('chat message', data);
        }
      }
    }
  });
  //每个 socket 还会触发一个特殊的 disconnect 事件
  socket.on('disconnect', function () {
    totalonline2--;
    var logoutuserid = socket.id;
    logout(logoutuserid);
    console.log(socket.id + ' disconnected,在线人数：' + totalonline2);
  })
});
async function logout(userid){
  var fsq = await query(Onlineuser2SQL.getUserbyID,[userid]);
  if(fsq.length != 0){
    var username = fsq[0].UserName;
    await query(OnlineuserSQL.deleteUserbyName,[username]); 
    await query(Onlineuser2SQL.deleteUserbyID,[userid]); 
  }
}
//通过socketid查询对应的socket
function socket_send(idd) {
  var toSocket = _.findWhere(io.sockets.sockets, { id: idd });
  return toSocket;
}
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
