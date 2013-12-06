module.exports = function(passport) {
	var user = require(__dirname + '/user');
	var thread = require(__dirname + '/thread');
	var auth = require(__dirname + '/auth')(passport);

	return {
		auth : auth,
		thread : thread,
		user : user
	};
};
