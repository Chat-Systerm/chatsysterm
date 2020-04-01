var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({
  extended: false
});
var app = express();
var udp = require('dgram');
const udp_server = udp.createSocket('udp4');
udp_server.on('close',() =>{
  console.log('套接字已关闭');
});
//实现chat_server2转发给chat_server1的消息的传递
udp_server.on('message',(msg,rinfo) =>{
  console.log('recv %s from chat_server2 %s:%d\n', msg, rinfo.address, rinfo.port);
  var mes = JSON.parse(msg);
  var tagname = mes.toname;
  var tagid = find_online1(tagname);
  var tosocket =socket_send(tagid);
  tosocket.emit('chat message', mes);
});
udp_server.on('error',(err) =>{
  console.log(err);
});
udp_server.on('listening',() =>{
  console.log('套接字正在监听中...');
});
udp_server.bind('8060');
//socket.io
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
server.listen(3001);
var _ = require('underscore');
var totalonline1 = 0;
var onlineUsers1 = []; //统计连接在服务器1的用户
var person = {
  "name": "n",
  "socketid": "n",
  "toname": "n",
  "chat_server": "n",
  "message": "n"
}
//将socket.io 附加到 http server上，当 http server 接收到 upgrade websocket 时就将请求转给 socket.io 处理。
//服务端启动一个io服务，并监听'connection'事件;每次刷新浏览器，套接字id都不同
io.on('connection', function (socket) { //这里的参数socket对应每个客户client
  totalonline1++;
  console.log(socket.id + ' connected,在线人数：' + totalonline1);
  socket.emit('welcome', { id: socket.id });
  socket.on('welcome', function (pers) {
    person = pers;
    onlineUsers1.push(person);  //可考虑将其存储于数据库
    console.log("chat_server1:", onlineUsers1);
  });
  socket.on('sayto', function (data) {
    var toname = data.toname;
    var msg = data.message;
    //查询数据库登录表，查看目标用户是否在线
    //TODO:if(不在线)
    //socket.emit('chat message', { "message": "该用户不在线，请稍后再试！", "name": "server", "toname": toname });
    //else(在线)
    var toid = find_online1(toname);   //判读目标用户是否在此服务器，在线返回其socketid，不在则返回0
    if (toid == 0) {  //该用户不在此服务器，则采取二者服务器之间的udp通道发送数据给chat_server2
      if (msg != "") {
        var datastr = JSON.stringify(data);
        udp_server.send(datastr,54321,"localhost");
      }
    }
    else {   //该用户在此服务器，将消息传递给该用户
      // nodejs的underscore扩展中的findWhere方法，可以在对象集合中，通过对象的属性值找到该对象并返回。
      //服务器能接收到所有用户发的消息，只要改消息有toname并且可以找到，服务器就能转发给对应用户
      var toSocket = socket_send(toid);
      if (msg != "") {
        toSocket.emit('chat message', data);
      }
    }
  });
  //每个 socket 还会触发一个特殊的 disconnect 事件
  socket.on('disconnect', function () {
    totalonline1--;
    for (var index in onlineUsers1) {
      if (onlineUsers1[index].socketid == socket.id) {
        delete onlineUsers1[index];
      }
    }
    console.log(socket.id + ' disconnected,在线人数：' + totalonline1);
  })
});
//查询该用户是否在本服务器
function find_online1(str) {
  var toid = 0;
  for (var index in onlineUsers1) {
    if (onlineUsers1[index].name == str) {
      toid = onlineUsers1[index].socketid;
      break;
    }
  }
  return toid;
}
//通过id转发消息
function socket_send(idd){
  var toSocket = _.findWhere(io.sockets.sockets, { id: idd });
  return toSocket;
}
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '/public')));

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
