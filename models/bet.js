module.exports = function(sequelize, DataTypes) {
	return sequelize.define("User", {
		amount : {
			type : DataTypes.BIGINT.UNSIGNED,
			allowNull : false,
			primaryKey : false,
			unique : false
		},
		winner : {
			type : DataTypes.BOOLEAN,
			allowNull : false,
			primaryKey : false,
			unique : false
		}
	});
};
