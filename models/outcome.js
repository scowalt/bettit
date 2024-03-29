module.exports = function(sequelize, DataTypes){
	return sequelize.define("Outcome", {
		id     : {
			type          : DataTypes.BIGINT.UNSIGNED,
			autoIncrement : true,
			allowNull     : false,
			primaryKey    : true
		},
		winner : {
			type         : DataTypes.BOOLEAN,
			allowNull    : true,
			primaryKey   : false,
			unique       : false,
			defaultValue : null,
			comment      : "null = event not closed, " +
				"true/false = selected when event is closed"
		},
		title  : {
			type       : DataTypes.STRING,
			allowNull  : false,
			primaryKey : false,
			unique     : false,
			notEmpty   : true
		},
		order  : {
			type      : DataTypes.INTEGER.UNSIGNED,
			allowNull : false,
			unique    : false,
			comment   : "the relative ordering of this outcome compared to " +
				"others in the same event"
		}
	});
};
