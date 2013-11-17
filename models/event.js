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
			type         : DataTypes.ENUM,
			values       : ['open', 'locked', 'closed'],
			allowNull    : false,
			primaryKey   : false,
			defaultValue : 'open'
		}
	}, {
		instanceMethods : {
			/**
			 * Wraps the event and its outcomes up into a nice JSON packet,
			 * which is passed to the callback.
			 * @param callback
			 */
			emitEvent : function(callback){
				var data = {
					id     : this.id,
					title  : this.title,
					status : this.status
				};
				this.getOutcomes().success(function(outcomes){
					var outcomeInfos = [];
					for (var i = 0; i < outcomes.length; i++) {
						var outcome = outcomes[i]
						outcomeInfos.push(
							{title    : outcome.values.title,
								id    : outcome.values.id,
								order : outcome.values.order});
					}
					outcomeInfos.sort(function(o1, o2){
						return o1.order - o2.order;
					})
					data.outcomes = outcomeInfos;
					callback(data);
				});
			}
		}
	});
};
