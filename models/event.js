var _ = require('underscore');
var colog = require('colog');

module.exports = function(sequelize, DataTypes){
	return sequelize.define("Event", {
		id     : {
			type          : DataTypes.BIGINT.UNSIGNED,
			autoIncrement : true,
			allowNull     : false,
			primaryKey    : true
		},
		title  : {
			type       : DataTypes.STRING,
			allowNull  : false,
			primaryKey : false
		},
		status : {
			type         : DataTypes.ENUM,
			values       : ['open', 'locked', 'closed'],
			allowNull    : false,
			primaryKey   : false,
			defaultValue : 'open'
		}
	}, {
		instanceMethods : {
			/**
			 * Wraps the event and its outcomes up into a nice JSON packet,
			 * which is passed to the callback.
			 * 
			 * @param callback
			 */
			emitEvent : function(callback){
				var data = {
					id     : this.id,
					title  : this.title,
					status : this.status
				};
				this.getOutcomes().success(function(outcomes){
					var outcomeInfos = [];
					var outcomeFinished = _.after(outcomes.length, function outcomesDone(){
						outcomeInfos.sort(function(o1, o2){
							return o1.order - o2.order;
						})
						data.outcomes = outcomeInfos;
						callback(data);
					})
					for (var i = 0; i < outcomes.length; i++) {
						var _outcome = outcomes[i]
						addOutcome(_outcome);
						
						function addOutcome(outcome){
							outcome.getBets().success(function(bets){
								outcomeInfos.push({
									title    : outcome.values.title,
									id    : outcome.values.id,
									order : outcome.values.order,
									bets  : bets.length});
								if (data.status == 'closed' &&
									outcome.values.winner === true)
									data.winner = outcome.values.id;
								outcomeFinished();
							})
						}						
					}
				});
			},

			/**
			 * Set the winner of the event and modify users with their payouts.
			 * NOTE: THIS WILL NOT CLOSE THE EVENT (you have to do that
			 * yourself)
			 * 
			 * @param outcomeID
			 *            Which outcome won
			 * @param callback
			 *            (error)
			 */
			declareWinner : function(outcomeID, pot, callback){
				if (!outcomeID || !callback)
					throw "declareWinner(" + outcomeID + ", " + callback +
						") not called properly";
				this.getOutcomes().success(function(outcomes){
					// after modifying all of the outcomes and users
					var finished = _.after(outcomes.length, function(){
						return callback(null);
					});
					// for outcomes of event
					for (var i = 0; i < outcomes.length; i++) {
						(function(idx){
							var outcome = outcomes[idx];
							outcome.updateAttributes({
								winner : outcome.values.id == outcomeID
							}).success(function(){
									if (outcome.values.id == outcomeID) {
										outcome.getBets().success(function(bets){
											var user_paid = _.after(bets.length + 1,
												function(){
													finished();
												})
											user_paid();
											var payout = Math.floor(pot /
												bets.length);
											for (var i = 0; i < bets.length; i++) {
												var bet = bets[i];
												bet.getUser().success(function(user){
													user.updateAttributes({
														money : user.values.money +
															payout
													}).success(function(){
															user_paid();
														})
												});
											}
										})
									}
									else {
										finished();
									}
								})
						})(i);
					}
				});
			},

			/**
			 * How much money has been bet on this event?
			 * 
			 * @param callback
			 *            (pot)
			 */
			calculatePot : function(callback){
				if (!callback)
					throw "calculatePot() called without callback"
				this.getOutcomes().success(function(outcomes){
					var pot = 0;
					// once all of the outcomes are done
					var outcome_finished = _.after(outcomes.length, function(){
						callback(pot);
					});
					for (var i = 0; i < outcomes.length; i++) {
						var outcome = outcomes[i];
						outcome.getBets().success(function(bets){
							// once all of the bets for this outcome are done
							var bet_finished = _.after(bets.length + 1, function(){
								outcome_finished();
							});
							bet_finished();
							for (var b = 0; b < bets.length; b++) {
								var bet = bets[b];
								pot = pot + bet.values.amount;
								bet_finished();
							}
						});
					}
				});
			},
			
			/**
			 * Returns money to users who bet on the event, deletes all bets 
			 * and outcomes. This method has no effect on closed events. 
			 * THIS DOES NOT DELETE THE EVENT (needs a better name)
			 * 
			 * @param callback
			 *            (error)
			 */
			deleteEvent : function(callback){
				if (this.values.status === 'closed'){
					colog.error("Cannot delete closed event");
					return callback("event is closed");
				}
				this.getOutcomes().success(function(outcomes){
					if (!outcomes){
						return callback("no outcomes");
					}
					var outcomeFinished = _.after(outcomes.length, function afterOutcomes(){
						return callback(null);
					})
					for(var i = 0; i < outcomes.length; i++){
						var outcome = outcomes[i];
						outcome.getBets().success(function onBets(bets){
							var betFinished = _.after(bets.length+1, function afterBets(){
								outcome.destroy().success(function onDestroy(){
									outcomeFinished();
								})
							});
							betFinished();
							for (var b = 0; b < bets.length; b++){
								var bet = bets[b];
								(function (bet){
									bet.getUser().success(function onUser(user){
										// give user their bet money back
										if (!user){
											colog.error("User of bet doesn't exist (for some reason)");
										} else {
											user.updateAttributes({
												money : user.values.money + bet.values.amount
											}).success(function onUpdate(){
												bet.destroy().success(function onDestroy(){
													betFinished();
												});
											});
										}
									})
								})(bet);
							}
						})
					}
				})
			}
		}
	});
};
