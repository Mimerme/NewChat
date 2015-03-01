var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

//List of rooms
var roomList = [];
//key - room : pair - chatlog of room in array form
var roomChatLogs = {};
//Key - toom : psit - array of user list for room
var roomConnectedUsers = {};

  app.get('/', function(req, res){
    res.sendFile(__dirname + '/client.html');
  });

    //TODO remove createroom default
    createRoom('developer');

  io.on('connection', function(socket){
    socket.on('UserConnectionAttempt', function(room, nickname){
      //Meaninless debug
      console.log('User ' + nickname + ' is attempting to connect to ' + 
        'room ' + room + ' from ip ' + socket.handshake.address);
      if(roomList.indexOf(room) <= -1){
        socket.emit('UserConnectionFailed', "roomNonExistant");
        //TODO handle reponse properly
        return;
      }

      socket.join(room);
      //Tell the room who has walked in ;)
      sendServerMessage(nickname + " has joined room " + room, room);
      io.to(room).emit('userJoin', nickname);
      socket.emit('init', roomChatLogs[room], roomConnectedUsers[room]);
      //get userList array and push
      roomConnectedUsers[room].push(nickname);
      
      socket.on('disconnect', function(){
        var userList = roomConnectedUsers[room];
        delete userList[userList.indexOf(nickname)];
        roomConnectedUsers[room] = userList;
        io.to(room).emit('userLeave', userList);
      });
    });
    socket.on('OnChatMessage', function(room, message, nickname){
      sendChatMessage(message, room, nickname);
    });

  });

  http.listen(3000, function(){
    console.log('listening on *:3000');
  });

  function createRoom(room){
    if(roomList.indexOf(room) >= 0)
      return;
    console.log('Creating new room ' + room);
    roomChatLogs[room] = [];
    roomConnectedUsers[room] = [];
    roomList.push(room);
  }

  function sendServerMessage(message, room){
    io.to(room).emit('serverMessage', message);
  }

  function sendChatMessage(message, room, nickname){
    var timestamp = getTimestamp();
    console.log(nickname + ' : ' + message + ' @ ' + timestamp);
    io.to(room).emit('chatMessage', message, nickname, timestamp);
    roomChatLogs[room].push(message + "," + nickname + "," + timestamp);
  }

  function getTimestamp(){
    return new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') 
  }