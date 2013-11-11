module.exports = function(database) {
	if (!global.hasOwnProperty('db')) {
		var info = require('../config/secrets.js').mysql;
		var Sequelize = require('sequelize');
		var sequelize = new Sequelize(database, info.username, info.password);

		global.db = {
			Sequelize : Sequelize,
			sequelize : sequelize,
			User : sequelize.import(__dirname + '/user'),
			Bet : sequelize.import(__dirname + '/bet')
			// add your other models here
		};

		/*
		 Associations can be defined here. E.g. like this:
		 global.db.User.hasMany(global.db.SomethingElse)
		 */
		global.db.User.hasMany(global.db.Bet);
	}

	return global.db;
};

