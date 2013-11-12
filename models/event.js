module.exports = function(sequelize, DataTypes) {
	return sequelize.define("Event", {
		id : {
			type : DataTypes.INTEGER.UNSIGNED,
			autoIncrement : true,
			allowNull : false,
			primaryKey : true
		}
	});
};
