var colog = require('colog');
var async = require('async');

module.exports = function(database, logging) {
	if (logging === true || typeof logging == "undefined") {
		logging = console.log;
	}
	if (!global.hasOwnProperty('db')) {
		var info = require('../config/secrets.js').mysql;
		var Sequelize = require('sequelize');
		var sequelize = new Sequelize(database, info.username, info.password, {
			logging: logging,
			pool: {
				maxConnections: 5,
				maxIdleTime: 30
			}
		});

		global.db = {
			Sequelize: Sequelize,
			sequelize: sequelize,
			User: sequelize.import(__dirname + '/user'),
			Bet: sequelize.import(__dirname + '/bet'),
			Thread: sequelize.import(__dirname + '/thread'),
			Event: sequelize.import(__dirname + '/event'),
			Outcome: sequelize.import(__dirname + '/outcome')
			// other models here
		};

		/**
		 * ASSOCIATIONS
		 */
		global.db.Thread.hasMany(global.db.User, {
			joinTableName: "UserThreads"
		});
		global.db.User.hasMany(global.db.Thread, {
			joinTableName: "UserThreads"
		});

		global.db.Thread.hasMany(global.db.Event);
		global.db.Event.belongsTo(global.db.Thread);

		global.db.Event.hasMany(global.db.Outcome);
		global.db.Outcome.belongsTo(global.db.Event);

		global.db.Outcome.hasMany(global.db.Bet);
		global.db.Bet.belongsTo(global.db.Outcome);
		global.db.User.hasMany(global.db.Bet);
		global.db.Bet.belongsTo(global.db.User);

		/**
		 * Multi-class functions
		 */
		global.db.getActiveThreads = function(number, callback) {
			if (!callback) return colog.error("no callback provided");
			if (!number) return callback('number not defined', null);
			global.db.Event.findAll({
				order: [
					['updatedAt', 'DESC']
				],
				limit: 20
			}).success(function(events) {
				threads = [];
				async.each(events, function forEachEvent(event, done) {
					if (threads.length >= number) done();
					event.getThread().success(function gotThread(eventThread) {
						if (!eventThread) return done('couldn\'t find thread for event' + event.id);
						oldEvent = threads.some(function(thread) {
							if (thread.id === eventThread.id) {
								return true;
							}
							return false;
						})
						if (!oldEvent)
							threads.push(eventThread);
						return done();
					});
				}, function doneIterating(err) {
					if (err) return callback(err, null);
					return callback(null, threads);
				});
			});
		}
	}

	return global.db;
};