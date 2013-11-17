module.exports = function(sequelize, DataTypes){
	return sequelize.define("Thread", {
		id : {
			type       : DataTypes.STRING,
			allowNull  : false,
			primaryKey : true,
			comment    : "Taken from reddit",
			notEmpty   : true
		}
	}, {
		instanceMethods : {
			/**
			 * Wraps the events in the thread and their outcomes into a nice
			 * data packet and calls the callback on each of them
			 * @param callback
			 */
			emitEvents : function(callback){
				this.getEvents().success(function(events){
					for (var i = 0; i < events.length; i++) {
						var event = events[i];
						event.emitEvent(callback);
					}
				});
			}
		}});
};
