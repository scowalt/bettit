module.exports = function(sequelize, DataTypes) {
	return sequelize.define("Bet", {
		amount : {
			type : DataTypes.BIGINT.UNSIGNED,
			allowNull : false,
			primaryKey : false,
			unique : false
		},
		winner : {
			type : DataTypes.BOOLEAN,
			allowNull : true,
			primaryKey : false,
			unique : false,
			defaultValue : null
		}
	});
};
