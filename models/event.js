module.exports = function(sequelize, DataTypes){
	return sequelize.define("Event", {
		id     : {
			type          : DataTypes.BIGINT.UNSIGNED,
			autoIncrement : true,
			allowNull     : false,
			primaryKey    : true
		},
		title  : {
			type       : DataTypes.STRING,
			allowNull  : false,
			primaryKey : false
		},
		status : {
			type       : DataTypes.ENUM,
			values: ['open', 'locked', 'closed'],
			allowNull  : false,
			primaryKey : false,
			defaultValue : 'open'
		}
	});
};
