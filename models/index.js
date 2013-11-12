module.exports = function(database, logging) {
	if (logging === true || typeof logging == "undefined") {
		logging = console.log;
	}
	if (!global.hasOwnProperty('db')) {
		var info = require('../config/secrets.js').mysql;
		var Sequelize = require('sequelize');
		var sequelize = new Sequelize(database, info.username, info.password, {
			logging : logging
		});

		global.db = {
			Sequelize : Sequelize,
			sequelize : sequelize,
			User : sequelize.import(__dirname + '/user'),
			Bet : sequelize.import(__dirname + '/bet'),
			Thread : sequelize.import(__dirname + '/thread'),
			Event : sequelize.import(__dirname + '/event'),
			Outcome : sequelize.import(__dirname + '/outcome')
			// add your other models here
		};

		/*
		 Associations can be defined here. E.g. like this:
		 global.db.User.hasMany(global.db.SomethingElse)
		 */
		global.db.Thread.hasMany(global.db.User, {
			joinTableName : "UserThreads"
		});
		global.db.User.hasMany(global.db.Thread, {
			joinTableName : "UserThreads"
		});
		global.db.Thread.hasMany(global.db.Event);
		global.db.Event.hasMany(global.db.Outcome);
		global.db.Outcome.hasMany(global.db.Bet);
		global.db.User.hasMany(global.db.Bet);
	}

	return global.db;
};

