if (!global.hasOwnProperty('db')) {
	var info = require('../config/secrets.js').mysql;
	var Sequelize = require('sequelize');

	// the application is executed on the local machine ... use mysql
	var sequelize = new Sequelize('test', info.username, info.password);

	global.db = {
		Sequelize : Sequelize,
		sequelize : sequelize,
		User : sequelize.import(__dirname + '/user')
		// add your other models here
	};

	/*
	 Associations can be defined here. E.g. like this:
	 global.db.User.hasMany(global.db.SomethingElse)
	 */
}

module.exports = global.db;
