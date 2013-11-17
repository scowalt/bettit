var prefs = require('../config/prefs.js');
var _ = require('underscore');

module.exports = function(sequelize, DataTypes){
	return sequelize.define("User", {
		username : {
			type       : DataTypes.STRING,
			allowNull  : false,
			primaryKey : true,
			unique     : true,
			notEmpty   : true
		},
		money    : {
			type         : DataTypes.BIGINT,
			allowNull    : false,
			primaryKey   : false,
			unique       : false,
			defaultValue : prefs.default_money
		}
	}, {
		instanceMethods : {
			/**
			 * Does this user moderated thread with id thread_id
			 * @param thread_id String
			 * @param callback (bool)
			 */
			isModeratorOf : function(thread_id, callback){
				this.getThreads().success(function(threads){
					for (var i = 0; i < threads.length; i++) {
						var thread = threads[i];
						if (thread.id === thread_id)
							return callback(true);
					}
					return callback(false);
				});
			},

			/**
			 * Has the user bet on the event? Callback on false for no bet, or
			 * the outcomeID that the user bet on
			 * @param event_id
			 * @param callback (bool/int) False, or the ID bet on
			 */
			betOn : function(event_id, callback){
				this.getBets().success(function(bets){
					var finished = _.after(bets.length+1, function(){
						return callback(false);
					});
					finished();
					console.log("User has " + bets.length + " bets");
					for (var i = 0; i < bets.length; i++) {
						var bet = bets[i];
						bet.getOutcome().success(function(outcome){
							outcome.getEvent().success(function(event){
								if (event_id === event.values.id){
									console.log("User bet on " + event_id);
									return callback(outcome.values.id);
								}
								else
									finished();
							});
						});
					}
				});
			}
		}
	});
};
