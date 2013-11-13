var prefs = require('../config/prefs.js');

module.exports = function(sequelize, DataTypes){
	return sequelize.define("User", {
		id       : {
			type          : DataTypes.STRING,
			allowNull     : false,
			primaryKey    : true
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
	});
};
