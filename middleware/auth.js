module.exports = function (req, res, next){
	if (req.isAuthenticated()) {
		db.User.findOrCreate({
			username : req.user.name}).success(function(user){
				next();
			}).error(function(){
				console.log("Error finding or adding user!");
			});
	}
	else {
		req.session.redirect_to = req.path;
		res.redirect('/auth/reddit');
	}
};