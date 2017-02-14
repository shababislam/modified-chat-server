/*SocketIO based chat room. Extended to not echo messages
to the client that sent them.

Using code base provided in tutorial

*/



var http = require('http').createServer(handler);
var io = require('socket.io')(http);
var fs = require('fs');
var url = require('url');
const ROOT = "./files";
var mime = require('mime-types');

http.listen(2406);


var userDB = [];

console.log("Chat server listening on port 2406");

/*

users {data: name, socket.id, blockedList}

*/
function handler(req,res){
	var urlObj = url.parse(req.url,true);
	var filename = ROOT+urlObj.pathname;

		
	//the callback sequence for static serving...
	fs.stat(filename,function(err, stats){
		if (err){
			console.log(err);
		} else {
			if(stats.isDirectory())	filename+="/index.html"; 
			fs.readFile(filename,"utf8",function(err, data){
				if(err){
					if(err.code==="ENOENT"){
						filename=ROOT+"/404.html";
						res.writeHead(404, {'content-type': mime.lookup(filename)|| 'text/html'});
						res.end(data);
					}
					console.log(err);
				} else {
					res.writeHead(200, {'content-type': mime.lookup(filename)|| 'text/html'});
					res.end(data);
				}
			})
		}	
	});
};

io.on("connection", function(socket){
	var username;
	var thisGuy = {};
	socket.on("intro",function(data){
		username = data;
		console.log(username+" connected");
		
		thisGuy.name = username;
		thisGuy.id = socket.id;
		thisGuy.blockedList = [];
		//keep track of name, id and blocked list
		userDB.push(thisGuy);
		
		
		for(var i = 0;i<userDB.length;i++)
			console.log(userDB[i].name);
		
		socket.broadcast.emit("message", timestamp()+": "+username+" has entered the chatroom.");
		socket.emit("message","Welcome, "+username+".");
		
		socket.broadcast.emit("userList",userDB);
		socket.emit("userList",userDB);
	});
		
	socket.on("message", function(data){
		console.log("got message: "+data);
		socket.broadcast.emit("message",timestamp()+", "+username+": "+data);
		
	});

	socket.on("userList", function(data){
		socket.broadcast.emit("userList",userDB);
		
	});
	
	socket.on("blockUser", function(data){
		/*check if person is in the blocked list
		if they aren't, then add them
		else, remove
		
		*/
		for (var i = 0;i<userDB.length;i++){
			if(socket.id === userDB[i].id){
				if(userDB[i].blockedList.length>0){
					for(var j = 0;j<userDB[i].blockedList.length;j++){
						if(userDB[i].blockedList[j] === data.target){
							console.log("Unblocking.. ")
							userDB[i].blockedList.splice(j,1);
						} else {		
							console.log("Blocking.. ")					
							userDB[i].blockedList.push(data.target);
						}
					}
				} else {
					console.log("Blocking.. ")					
					userDB[i].blockedList.push(data.target);		
				}
			console.log(userDB[i]);
			}
			
		}
	
	});
	
	socket.on("privateMessage", function(data){
		//socket.broadcast.emit("userList",users);
		if(data.msgBody !== ""){
		var target = data.target;
		var targetSocket;
		var sender;
		
		for(var i = 0;i<userDB.length;i++){
			if(target === userDB[i].name)
				targetSocket = userDB[i].id;
			
			if(socket.id === userDB[i].id){
				data.target = userDB[i].name;
				sender = userDB[i].name;
			}
		}
		
		/*if blocked, don't emit message */
		for(var k = 0;k<userDB.length;k++){
			if(userDB[k].name === target){
				if (userDB[k].blockedList.length >0){
					for(var l = 0;l<userDB[k].blockedList.length;l++){
						if(userDB[k].blockedList[l]!==sender){
							console.log("Target Socket: "+targetSocket+" | Sender: "+data.target);
							io.to(targetSocket).emit("privateMessage",data);
						} else {
							console.log(target+" has blocked "+sender+"!");
						}
					}	
				} else {
					console.log("Target Socket: "+targetSocket+" | Sender: "+data.target);
					io.to(targetSocket).emit("privateMessage",data);
				}
			}
		}
		}
//		data.target = users[socket.id];
		
		

		//users[.emit("privateMessage",data);
	});
	
	socket.on("disconnect", function(){
		console.log(username+" disconnected");
		/*
		for(var i = 0;i<users.names.length;i++){
			if(users.names[i] === username){
				users.names.splice(i,1);
			}
		} */
		
		for(var i = 0;i<userDB.length;i++){
			if(userDB[i].name === username){
				userDB.splice(i,1);
			}
		}
		console.log(userDB);
		socket.broadcast.emit("userList",userDB);
		io.emit("message", timestamp()+": "+username+" disconnected.");
	});
	
});

function timestamp(){
	return new Date().toLocaleTimeString();
}