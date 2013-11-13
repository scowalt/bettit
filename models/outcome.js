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
			defaultValue : null
		}
	});
};
