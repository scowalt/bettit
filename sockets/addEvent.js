var colog = require('colog');
var _ = require('underscore');

module.exports = function onAddEvent(io, socket, session, data){
	if (data.outcomes.length < 2)
		return; // can't add event with less than 2 outcomes
	
	var username = session.passport.user.name;
	colog.info("add_event recieved from " + username);
	var threadRedditID = data.threadID;
	db.User.find({where : {username : username}}).success(function(user){
		if (!user) return;
		user.isModeratorOf(threadRedditID, function(bool){
			if (!bool) return;
			db.Event.create({title : data.title}).success(function(event){
				var len = data.outcomes.length;
				var finished = _.after(len + 1,
					function onEventCreation(){
						event.emitEvent(function(data){
							data.betOn = false;
							io.sockets.in(threadRedditID).emit('event_response',
								data);
						});
					});
				db.Thread.find({where : {redditID : threadRedditID}}).success(function(thread){
					colog.info("adding event " + event.id + " to thread " + thread.redditID);
					thread.addEvent(event).success(function(){
						finished();
					});
				});
				for (var i = 0; i < len; i++) {
					var outcome_title = data.outcomes[i];
					db.Outcome.create({title : outcome_title, order : i})
						.success(function(outcome){
							event.addOutcome(outcome).success(function(){
								finished();
							});
						});
				}
			});
		});
	});
};