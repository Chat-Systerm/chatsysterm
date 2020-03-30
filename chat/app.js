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
var server = require('http').createServer(app)
var io = require('socket.io').listen(server);
server.listen(3001);
var _ = require('underscore');
var totalonline = 0;
var onlineUsers = []; //统计客户端登录用户
var person = {
  "name": "n",
  "socketid": "n",
  "toname": "n",
  "message": "n"
}
//将socket.io 附加到 http server上，当 http server 接收到 upgrade websocket 时就将请求转给 socket.io 处理。
//服务端启动一个io服务，并监听'connection'事件;每次刷新浏览器，套接字id都不同
io.on('connection', function (socket) { //这里的参数socket对应每个客户client
  totalonline++;
  console.log(socket.id + ' connected,在线人数：' + totalonline);
  socket.emit('welcome', { id: socket.id });
  socket.on('welcome', function (pers) {
    person = pers;
    person.online = 1;
    onlineUsers.push(person);
    console.log(onlineUsers);
  });
  socket.on('sayto', function (data) {
    var toname = data.toname;
    var msg = data.message;
    console.log('target:', data);
    var toid = find_online(toname);   //判读目标用户是否在线，在线返回其socketid，不在则返回0
    if(toid == 0){
      if(msg != ""){
        socket.emit('chat message', { "message": "该用户不在线，请稍后再试！","name":"server"});
      }
    }
    else {   //该用户在线，将消息传递给该用户
      // nodejs的underscore扩展中的findWhere方法，可以在对象集合中，通过对象的属性值找到该对象并返回。
      //服务器能接收到所有用户发的消息，只要改消息有toname并且可以找到，服务器就能转发给对应用户
      var toSocket = _.findWhere(io.sockets.sockets, { id: toid });
      if (msg != "") {
        toSocket.emit('chat message', data);
      }
    }
  });
  //每个 socket 还会触发一个特殊的 disconnect 事件
  socket.on('disconnect', function () {
    totalonline--;
    for (var index in onlineUsers) {
      if (onlineUsers[index].socketid == socket.id) {
        delete onlineUsers[index];
      }
    }
    console.log(socket.id + ' disconnected,在线人数：' + totalonline);
  })
});
//查询该用户是否在线
function find_online(str) {
  var toid = 0;
  for (var index in onlineUsers) {
    if (onlineUsers[index].name == str) {
      toid = onlineUsers[index].socketid;
      break;
    }
  }
  return toid;
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
