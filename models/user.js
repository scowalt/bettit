var prefs = require('../config/prefs.js');

module.exports = function(sequelize, DataTypes){
	return sequelize.define("User", {
		id       : {
			type         : DataTypes.STRING,
			allowNull    : true,
			primaryKey   : false,
			comment      : "This ID is given from reddit auth",
			defaultValue : null,
			notEmpty : true
		},
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
			isModeratorOf : function(thread_id, callback){
				this.getThreads().success(function(threads){
					for (var i = 0; i < threads.length; i++) {
						var thread = threads[i];
						if(thread.id === thread_id)
							return callback(true);
					}
					return callback(false);
				});
			}
		}
	});
};
