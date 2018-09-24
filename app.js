//few modules init
var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	users = {};

//server listening to
server.listen(3000);

//creating routing #expressjs
app.get('/', function(req, res){
	res.sendfile(__dirname+'/index.html');
});

io.sockets.on('connection', function(socket){
	
	socket.on('new user', function(data, callback){
		if(data in users){
			callback(false);
		}else{
			callback(true);
			//set nickname to their own socket
			socket.nickname = data;
			users[socket.nickname] = socket;
			updateNicknames();
		}
	});

	function updateNicknames(){
		io.sockets.emit('usernames', Object.keys(users));
	}

	socket.on('send message', function(data, callback){
		var msg = data.trim();
		if(msg.substr(0,3) == '/w '){
			msg = msg.substr(3);
			var ind = msg.indexOf(' ');
			if(ind !== -1){
				var name = msg.substring(0, ind);
				var msg = msg.substring(ind + 1);
				if(name in users){
					users[name].emit('whisper', {msg: msg, nick: socket.nickname});
					console.log('whisper');
				}else{
					callback('error! enter a valid user');
				}
			}else{
				callback('error! please enter your message for your whisper');
			}
		}else{
			//would send data to everone including me
			io.sockets.emit('new message', {msg: msg, nick: socket.nickname});

			//would send data to everyone except me
			// socket.braodcast.emit('new message', data);
		}
	});

	//on user disconnect
	socket.on('disconnect', function(data){
		//if user dc without setting nickname
		if(!socket.nickname) return;
		//removing username from the array
		delete users[socket.nickname];
		//sending the update to client
		updateNicknames();
	});
});