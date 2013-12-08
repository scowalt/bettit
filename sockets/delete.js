module.exports = function onDelete(io, sessionSockets, socket, session, eventID) {
	// TODO
	var username = session.passport.user.name;
	db.User.find({
		where : {
			username : username
		}
	}).success(function gotUser(user) {
		if (!user)
			return; // TODO Handle
		
		db.Event.find({
			where : {
				id : eventID
			}
		}).success(function onEvent(event) {
			if (!event) {
				colog.error("Couldn't find event " + eventID);
				return;
			}
			event.getThread().success(function gotThread(thread) {
				if (!thread)
					return; // TODO Handle
				user.isModeratorOf(thread.values.redditID, function callback(bool){
					if (!bool) return; //TODO Handle
					event.deleteEvent(function callback(err) {
						if (err) {
							colog.error(err);
							throw err;
						}
						event.destroy().success(function onDestroy(){
							// this event no longer exists, better let everyone know
							forEveryUserInRoom(io, sessionSockets, thread.redditID, function callback(socket, user){
								socket.emit('event_response', {
									id : eventID,
									status : 'deleted'
								})
							});
						})
					})
				});
			});
		})
	});
}

/**
 * Calls callback on every user in a room
 * 
 * @param io
 * @param roomID
 *            (redditThreadID)
 * @param callback
 *            (socket, user)
 */
function forEveryUserInRoom(io, sessionSockets, roomID, callback) {
	io.sockets.clients(roomID).forEach(function(socket) {
		sessionSockets.getSession(socket, function(err, session) {
			if (err)
				return; // TODO Handle
			db.User.find({
				where : {
					username : session.passport.user.name
				}
			}).success(function(user) {
				if (!user)
					return; // TODO Handle
				callback(socket, user);
			});
		});
	});
}