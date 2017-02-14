$(document).ready(function(){
	var ctrlPressed = false;
	var userName = prompt("What's your name?")||"User";
	var msgObj = {};
	var blockedUsers = []; //blocked list for client side use
	
	var socket = io(); //connect to the server that sent this page
	socket.on('connect', function(){
		socket.emit("intro", userName);
	});
	
	//ctrl press checker
	document.body.onclick = function(kk){
		if(kk.ctrlKey){
			ctrlPressed = true;
		} else {
			ctrlPressed = false;
		}
	}
	
	$('#inputText').keypress(function(ev){
	
			if(ev.which===13){
				//send message
				socket.emit("message",$(this).val());
				ev.preventDefault(); //if any
				$("#chatLog").append((new Date()).toLocaleTimeString()+", "+userName+": "+$(this).val()+"\n")
				$(this).val(""); //empty the input
			}
	});
	socket.on("message",function(data){
		$("#chatLog").append(data+"\n");
		$('#chatLog')[0].scrollTop=$('#chatLog')[0].scrollHeight; //scroll to the bottom
	});
	
	socket.on("userList",function(data){
		//$("#userListText").append(data+"\n");

		$("#userListText").empty();
		//append names to list
		for(var i = 0;i<data.length;i++){
			$("#userListText").append("<li id='"+data[i].name+"'>"+data[i].name+"</li>");
			$("#"+data[i].name).dblclick(sendMessage);
		}
	});
	
	
	socket.on("privateMessage",function(data){
		//if there's a message, emit private message
		if(data.msgBody !== null){
			var msgRes = prompt(data.target+" says: "+data.msgBody);
			data.msgBody = msgRes;
			socket.emit("privateMessage",data);
			
		}
	});

	function sendMessage(){
		var _choice = $(this).attr('id'); 
		
		if(_choice !== userName){
			msgObj.target = _choice;
			if(ctrlPressed){ //if ctrl+double-click, then block
				if(blockedUsers.length>0){
					for(var i = 0;i<blockedUsers.length;i++){
						if(_choice === blockedUsers[i]){
							blockedUsers.splice(i,1);
							alert("Unblocking: "+_choice);
						} else {
							blockedUsers.push(_choice);
							alert("Blocking: "+_choice);
						}	
					}
				} else {
					alert("Blocking: "+_choice);
					blockedUsers.push(_choice);
				}
				socket.emit("blockUser",msgObj)
			} else { //otherwise send private message
				var privMsg = prompt("What would you like to send?: ");
				if(privMsg!== ""){
					msgObj.msgBody = privMsg;
					socket.emit("privateMessage",msgObj);
				}
			}
		} else {
			alert("Can't block or message yourself, dude");
		}
	}
	
	
	
});
