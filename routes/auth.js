var crypto = require('crypto');

module.exports = function(passport){
	return {
		reddit : function(req, res, next){
			req.session.state = crypto.randomBytes(32).toString('hex');
			passport.authenticate('reddit', {
				state    : req.session.state,
				duration : 'permanent'
			})(req, res, next);
		},
		redditCallback : function(req, res, next){
			// Check for origin via state token
			// if (req.query.state == req.session.state) {
				passport.authenticate('reddit', function(err, user, info){
					if (!user) {
						return res.redirect('/');
					}
					if (err) {
						return next(new Error(403));
					}
					req.logIn(user, function(err){
						if (err) {
							return next(new Error(403));
						}
						// return where the user was before
						return res.redirect(req.session.redirect_to);
					});
				})(req, res, next);
			// }
			// else {
				// next(new Error(403));
			// }
		}
	};
};
