var colog = require("colog");
var prefs = require('../config/prefs.js');

module.exports = function onBet(socket, session, data){
	var username = session.passport.user.name;
	colog.info('bet recieved from ' + username);
	var outcomeID = data.outcomeID;
	var amount = data.amount ? data.amount : prefs.default_bet;
	db.User.find({where : {username : username}}).success(function(user){
		if (!user) return; // TODO Handle
		db.Outcome.find(outcomeID).success(function(outcome){
			if (!outcome) return; // TODO Handle
			db.Bet.createBet(outcome, user, amount, function(err){
				if (err) {
					console.log("ERROR: " + err);
					return;
				}
				db.User.find({where : {username : username}}).success(function(user){
					if (!user) return; // TODO Handle
					socket.emit('money_response', {
						money : user.values.money
					});
				});
				outcome.getEvent().success(function(event){
					event.emitEvent(function(data){
						data.betOn = outcomeID;
						socket.emit('event_response', data);
					});
				});
			});
		});
	});
}