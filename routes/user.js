module.exports = function(req, res) {
	db.User.find({
		where: {
			username: req.params.username
		}
	}).success(function onSuccess(user) {
		var data = {
			user: req.params.username,
			money: "N/A"
		};
		if (user)
			data = {
				user: user.values.username,
				money: user.values.money
			};
		// TODO Serve special page for user not found
		res.render('user', data);
	});
};