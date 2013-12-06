module.exports = function(req, res) {
	db.User.find({
		where : {
			username : req.params.username
		}
	}).success(function onSuccess(user) {
		if (!user)
			return;
		// TODO Serve special page for user not found
		res.render('user', {
			user : user.values.username,
			money : user.values.money
		});
	});
}; 