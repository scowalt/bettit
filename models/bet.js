var _ = require('underscore');
module.exports = function(sequelize, DataTypes){
	return sequelize.define("Bet", {
		amount : {
			type       : DataTypes.BIGINT.UNSIGNED,
			allowNull  : false,
			primaryKey : false,
			unique     : false
		},
		id     : {
			type          : DataTypes.BIGINT.UNSIGNED,
			autoIncrement : true,
			allowNull     : false,
			primaryKey    : true
		}
	}, {
		classMethods : {
			/**
			 * Add an event to the database. Also sets up the appropriate
			 * associations
			 * @param outcome required
			 * @param user required
			 * @param amount required
			 * @param callback (err)
			 */
			createBet : function(outcome, user, amount, callback){
				var Bet = this;
				if (!outcome || !user || !amount) {
					return callback("parameters");
				}
				console.log("This request's username is: " + user.username);
				outcome.getBets().success(function(bets){
					console.log("Found " + bets.length + " bets")
					var finished = _.after(bets.length + 1, function(){
						// only get here if bet doesn't exist
						Bet.create({amount : amount}).success(function(bet){
							if (!bet) throw "Bet just created doesn't exist";
							bet.setUser(user);
							bet.setOutcome(outcome);
							user.updateAttributes({
								money : (user.values.money - amount)
							}).success(function(){
									return callback(null);
								});
						})
					});
					finished();
					for (var i = 0; i < bets.length; i++) {
						var bet = bets[i];
						bet.getUser().success(function(better){
							console.log("Better = " + better.username);
							if (better.username === user.username) {
								return callback("duplicate");
							}
							else {
								finished();
							}
						});
					}
				});
			}
		}
	});
};
