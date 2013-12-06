module.exports = function(req, res) {
	var thread_id = req.params.thread;
	var username = req.session.passport.user.name;
	db.User.find({
		where : {
			username : username
		}
	}).success(function(user) {
		if (!user)
			return;
		// TODO Handle
		user.isModeratorOf(thread_id, function onResult(bool) {
			res.render('thread', {
				user : req.user.name,
				mod : bool,
				threadID : thread_id
			});
		});
	});

};
