
/**
 * Module dependencies.
 */

var express = require('express');
var expressSession = require('express-session');
var http = require('http');
var path = require('path');
var mongoose = require('mongoose');
var socketio = require('socket.io');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressSession = require('express-session');
var mongoose = require('mongoose');
var hash = require('bcrypt-nodejs');
var path = require('path');
var passport = require('passport');
var localStrategy = require('passport-local' ).Strategy;
var app = express();

var routes = require('./routes/api.js');

//Connect to local MongoDB
var db = mongoose.connection;
db.on('error', console.error);
mongoose.connect('mongodb://localhost/GDG');

//MongoDB Schemas
var chatMessage = new mongoose.Schema({
	username: String,
	message: String
});
var Message = mongoose.model('Message', chatMessage);
var User = require('./models/user.js');
// all environments
app.set('port', process.env.PORT || 3000);
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(passport.session());
app.use(expressSession({secret: 'mySecretKey'}));
app.use(passport.initialize());
app.use(passport.session());


app.post('/message', function (req, res) {

	var message = new Message ({
		username: req.body.username,
    	message : req.body.message
    });

    message.save(function (err, saved) {
    	if (err) {
    		res.send(400);
    		return console.log('error saving to db');
    	}
    	res.send(saved);
    	io.sockets.emit('receiveMessage', saved);
    })
});

app.get('/message', function (req, res) {
	Message.find(function (err, allMessages) {
  	if (err) {
  		return res.send(err);
  	};
  	res.send(allMessages);
  })
});
// routes
app.use('/user/', routes);

app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname, '../client', 'index.html'));
});
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
// error hndlers
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

app.use(function(err, req, res) {
	res.status(err.status || 500);
	res.end(JSON.stringify({
		message: err.message,
		error: {}
	}));
});
app.get('/chat', function (req, res) {
	res.sendFile('./public/index.html');
});

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

//Start Socket.io
var io = socketio.listen(server);
io.set('log level', 1);

//Socket on connect
io.sockets.on('connection', function (socket) {
  console.log('client connected');
  Message.find(function (err, allMessages) {
  	if (err) {
  		return console.error(err)
  	};
  	socket.emit('pastMessages', allMessages);
  })
});

