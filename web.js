/**
 * LIBRARY IMPORTS
 */
// https://github.com/Slotos/passport-reddit/blob/master/examples/login/app.js
var express = require('express.io');
var passport = require('passport');
var util = require('util');
var crypto = require('crypto');
var RedditStrategy = require('passport-reddit').Strategy;

/**
 * MODULE IMPORTS
 */
var db = require('./database/database.js');

/**
 * CONSTANTS
 */
var REDDIT_CONSUMER_KEY = "jGlGPJP7pQnoUQ";
var REDDIT_CONSUMER_SECRET = "vUztQ_CUKOKtLNNPCc5WiqTkBGU";
var SERVER_URL = "http://bettit.us";
var DEFAULT_MONEY = 500;
var PORT = 8080;

/**
 * Setup
 */
var app = express().http().io();
app.use(express.logger());
app.listen(PORT);

// Passport session setup.
// To support persistent login sessions, Passport needs to be able to
// serialize users into and deserialize users out of the session. Typically,
// this will be as simple as storing the user ID when serializing, and finding
// the user by ID when deserializing. However, since this example does not
// have a database of user records, the complete Reddit profile is
// serialized and deserialized.
passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(obj, done) {
	done(null, obj);
});

// Use the RedditStrategy within Passport.
// Strategies in Passport require a `verify` function, which accept
// credentials (in this case, an accessToken, refreshToken, and Reddit
// profile), and invoke a callback with a user object.
passport.use(new RedditStrategy({
	clientID : REDDIT_CONSUMER_KEY,
	clientSecret : REDDIT_CONSUMER_SECRET,
	callbackURL : SERVER_URL + "/auth/reddit/callback"
}, function(accessToken, refreshToken, profile, done) {
	// asynchronous verification, for effect...
	process.nextTick(function() {

		// To keep the example simple, the user's Reddit profile is returned to
		// represent the logged-in user. In a typical application, you would
		// want
		// to associate the Reddit account with a user record in your database,
		// and return that user instead.
		return done(null, profile);
	});
}));

// configure Express
app.configure(function() {
	app.set('views', __dirname + '/pages');
	app.set('view engine', 'ejs');
	app.use(express.logger());
	app.use(express.cookieParser());
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.session({
		secret : 'shark shark shark'
	}));
	// Initialize Passport! Also use passport.session() middleware, to support
	// persistent login sessions (recommended).
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
});

/**
 * Socket.io routing
 */
app.io.route('username', function(req) {
	var username = "no username";
	if (req.user)
		username = req.user.name;
	req.io.emit('username_response', {
		message : username
	})
});

/**
 * Express routing
 */
// GET /auth/reddit
// Use passport.authenticate() as route middleware to authenticate the
// request. The first step in Reddit authentication will involve
// redirecting the user to reddit.com. After authorization, Reddit
// will redirect the user back to this application at /auth/reddit/callback
//
// Note that the 'state' option is a Reddit-specific requirement.
app.get('/auth/reddit', function(req, res, next) {
	req.session.state = crypto.randomBytes(32).toString('hex');
	console.log(req.redirect_to);
	passport.authenticate('reddit', {
		state : req.session.state,
		duration : 'permanent'
	})(req, res, next);
});

// GET /auth/reddit/callback
// Use passport.authenticate() as route middleware to authenticate the
// request. If authentication fails, the user will be redirected back to the
// login page. Otherwise, the primary route function function will be called,
// which, in this example, will redirect the user to the home page.
app.get('/auth/reddit/callback', function(req, res, next) {
	// Check for origin via state token
	if (req.query.state == req.session.state) {
		passport.authenticate('reddit', function(err, user, info) {
			if (!user) {
				return res.redirect('/')
			}
			if (err) {
				return next(new Error(403))
			}
			req.logIn(user, function(err) {
				if (err) {
					return next(new Error(403))
				}
				db.addUser(req.user.name, DEFAULT_MONEY);
				return res.redirect(req.session.redirect_to);
			})
		})(req, res, next);
	} else {
		next(new Error(403));
	}
});

app.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/');
});

app.get('/r/:subreddit/comments/:thread/', ensureAuthenticated, function(req,
		res) {
	threadFunction(req, res);
});

app.get('/r/:subreddit/comments/:thread/:name/', ensureAuthenticated, function(
		req, res) {
	threadFunction(req, res);
});

function threadFunction(req, res) {
	res.render('thread', {
		user : req.user.name,
		title : req.params.thread
	});
}

// Simple route middleware to ensure user is authenticated.
// Use this route middleware on any resource that needs to be protected. If
// the request is authenticated (typically via a persistent login session),
// the request will proceed. Otherwise, the user will be redirected to the
// login page.
function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	req.session.redirect_to = req.path;
	res.redirect('/auth/reddit');
}