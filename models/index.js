module.exports = function(database, logging){
	if (logging === true || typeof logging == "undefined") {
		logging = console.log;
	}
	if (!global.hasOwnProperty('db')) {
		var info = require('../config/secrets.js').mysql;
		var Sequelize = require('sequelize');
		var sequelize = new Sequelize(database, info.username, info.password, {
			logging : logging,
			pool: { maxConnections: 5, maxIdleTime: 30}
		});

		global.db = {
			Sequelize : Sequelize,
			sequelize : sequelize,
			User      : sequelize.import(__dirname + '/user'),
			Bet       : sequelize.import(__dirname + '/bet'),
			Thread    : sequelize.import(__dirname + '/thread'),
			Event     : sequelize.import(__dirname + '/event'),
			Outcome   : sequelize.import(__dirname + '/outcome')
			// other models here
		};

		/**
		 * ASSOCIATIONS
		 */
		global.db.Thread.hasMany(global.db.User, {
			joinTableName : "UserThreads"
		});
		global.db.User.hasMany(global.db.Thread, {
			joinTableName : "UserThreads"
		});

		global.db.Thread.hasMany(global.db.Event);
		global.db.Event.belongsTo(global.db.Thread);

		global.db.Event.hasMany(global.db.Outcome);
		global.db.Outcome.belongsTo(global.db.Event);

		global.db.Outcome.hasMany(global.db.Bet);
		global.db.Bet.belongsTo(global.db.Outcome);
		global.db.User.hasMany(global.db.Bet);
		global.db.Bet.belongsTo(global.db.User);
	}

	return global.db;
};

