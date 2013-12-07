var colog = require("colog");

module.exports = {
	close : function onClose(io, sessionSockets, socket, session, data){
		var username = session.passport.user.name;
		colog.info('close recieved from ' + username);
		var eventID = data.eventID;
		db.User.find({where : {username : username}}).success(function onUser(user){
			if (!user) return; // TODO Handle this
			db.Event.find({where : {id : eventID}}).success(function(event){
				if (!event) return; // TODO Handle this
				event.getThread().success(function(thread){
					if (!thread) return; // TODO Handle this
					user.isModeratorOf(thread.values.redditID, function(bool){
						if (!bool) return; // isn't moderator, can't close
											// event
						event.calculatePot(function(pot){
							event.declareWinner(data.outcomeID, pot,
								function(error){
									if (error) throw error;
									// users have been paid
									event.status = 'closed';
									event.save().success(function(){
										event.emitEvent(function(data){
											forEveryUserInRoom(io, sessionSockets, thread.values.redditID,
												function onUser(socket, user){
													socket.emit('money_response', {
														money : user.values.money
													});
													user.betOn(eventID,
														function(outcomeID){
															data.betOn = outcomeID;
															socket.emit('event_response',
																data);
														});
												});
										});
									});
								}
							);
						});
					});
				});
			});
		});
	},
	lock : function onLock(io, sessionSockets, socket, session, data){
		var username = session.passport.user.name;
		var eventID = data.eventID;
		colog.info('lock recieved from ' + username + ' for event ' + eventID);
		db.User.find({where : {username : username}}).success(function(user){
			if (!user) {
				colog.error("Couldn't find user with name " + username);
				return; // TODO Handle
			}
			db.Event.find({where : {id : eventID}}).success(function(event){
				if (!event) {
					colog.error("Couldn't find event with id " + eventID);
					return; // TODO Handle
				}
				event.getThread().success(function gotThread(thread){
					if (!thread){
						colog.error("Couldn't find thread of event " + eventID);
						return; // TODO Handle
					}
					colog.info('event ' + eventID + ' is in thread ' + thread.redditID);
					user.isModeratorOf(thread.redditID, function(bool){
						if (!bool) {
							colog.error(username + ' is not a mod of thread ' + thread.redditID);
							return;
						}
						event.updateAttributes({status : 'locked'})
							.success(function onUpdatedLocked(){
								colog.success("locked event " + eventID);
								event.emitEvent(function(data){
									forEveryUserInRoom(io, sessionSockets, thread.redditID,
										function onUser(socket, user){
											user.betOn(event.id,
												function(outcome_id){
													data.betOn =
														outcome_id;
													socket.emit('event_response',
														data);
												});
										});
								});
							});
					});
				});
			});
		});
	}
};

/**
 * Calls callback on every user in a room
 * 
 * @param io
 * @param roomID (redditThreadID)
 * @param callback
 *            (socket, user)
 */
function forEveryUserInRoom(io, sessionSockets, roomID, callback){
	io.sockets.clients(roomID)
		.forEach(function(socket){
			sessionSockets.getSession(socket,
				function(err, session){
					if (err) return; // TODO Handle
					db.User.find({where : {username : session.passport.user.name}})
						.success(function(user){
							if (!user) return; // TODO Handle
							callback(socket, user);
						});
				});
		});
}