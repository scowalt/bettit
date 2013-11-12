module.exports = function(sequelize, DataTypes) {
	return sequelize.define("Thread", {
		id : {
			type : DataTypes.STRING,
			allowNull : false,
			primaryKey : true
		}
	});
};
