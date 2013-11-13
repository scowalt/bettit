/**
 * LIBRARY IMPORTS
 */
// https://github.com/Slotos/passport-reddit/blob/master/examples/login/app.js
var express = require('express.io');
var passport = require('passport');
var crypto = require('crypto');
var request = require('request');
var SnuOwnd = require('snuownd');
var RedditStrategy = require('passport-reddit').Strategy;
var RedisStore = require('connect-redis')(express);

/**
 * MODULE IMPORTS
 */
var db = require('./models')('bettit');
var secrets = require('./config/secrets.js');
var prefs = require('./config/prefs.js');

/**
 * CONSTANTS
 */
var REDDIT_CONSUMER_KEY = secrets.reddit.consumer.key;
var REDDIT_CONSUMER_SECRET = secrets.reddit.consumer.secret;
var SERVER_URL = "http://bettit.us";
var PORT = 8080;

/**
 * SETUP
 */
var app = express().http().io();

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Reddit profile is
//   serialized and deserialized.
passport.serializeUser(function(user, done){
	done(null, user);
});

passport.deserializeUser(function(obj, done){
	done(null, obj);
});

passport.use(new RedditStrategy({
	clientID     : REDDIT_CONSUMER_KEY,
	clientSecret : REDDIT_CONSUMER_SECRET,
	callbackURL  : SERVER_URL + "/auth/reddit/callback"
}, function(accessToken, refreshToken, profile, done){
	process.nextTick(function(){
		db.User.findOrCreate({
			id       : profile.id,
			username : profile.name,
			money    : prefs.default_money
		}).success(function(user){
				console.log(user.values);
			});
		return done(null, profile);
	});
}));

// configure Express
app.configure(function(){
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.static(__dirname + '/public'));
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');
	app.use(express.logger());
	app.use(express.favicon());
	app.use(express.cookieParser());
	app.use(express.session({
		store  : new RedisStore,
		secret : secrets.secret
	}));
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(app.router);
});

/**
 * SOCKET.IO ROUTING
 */
app.io.route('money', function(req){
	console.log("route('money')");
	var username = req.session.passport.user.name;
	/*
	 db.getMoney(username, function(data) {
	 req.io.emit('money_response', {
	 money : data
	 });
	 });*/

});

app.io.route('thread_info', function(req){
	console.log("route('thread_title')");
	var referer = req.headers.referer;
	var subreddit = parseSubreddit(referer);
	var thread_id = parseThreadID(referer);
	var path = 'http://www.reddit.com/r/' + subreddit + '/comments/ ' + thread_id + '/.json';

	request({
		uri : path
	}, function(error, response, body){
		var json = JSON.parse(body);
		var post = json[0]['data']['children'][0]['data'];
		var title = post['title'];
		var content = post['is_self'] ? SnuOwnd.getParser().render(post['selftext']) : post['url'];
		var author = post['author'];
		/*
		 db.addUser(author);
		 db.addThread(thread_id, title, content, author, subreddit);
		 db.addThreadMod(author, thread_id);*/

		req.io.emit('thread_info_response', {
			title   : title,
			content : content
		});
	});
});

app.io.route('is_mod', function(req){
	console.log("route('is_mod')");
	var username = req.session.passport.user.name;
	var referer = req.headers.referer;
	var thread_id = parseThreadID(referer);
	/*
	 db.isModerator(username, thread_id, function(bool) {
	 if (bool) {
	 req.io.emit('add_event_form', {
	 // empty
	 });
	 }
	 });*/

});

/**
 * EXPRESS ROUTING
 */
app.get('/auth/reddit', function(req, res, next){
	req.session.state = crypto.randomBytes(32).toString('hex');
	passport.authenticate('reddit', {
		state    : req.session.state,
		duration : 'permanent'
	})(req, res, next);
});

app.get('/auth/reddit/callback', function(req, res, next){
	// Check for origin via state token
	if (req.query.state == req.session.state) {
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
				return res.redirect(req.session.redirect_to);
			});
		})(req, res, next);
	} else {
		next(new Error(403));
	}
});

app.get('/logout', function(req, res){
	req.logout();
	res.redirect('/');
});

app.get('/r/:subreddit/comments/:thread/', ensureAuthenticated, function(req, res){
	threadFunction(req, res);
});

app.get('/r/:subreddit/comments/:thread/:name/', ensureAuthenticated, function(req, res){
	threadFunction(req, res);
});

/**
 * PRIVATE HELPERS
 */
function threadFunction(req, res){
	res.render('thread', {
		user : req.user.name
	});
}

function parseThreadID(link){
	var idx = link.indexOf('/comments/');
	var ss = link.substring(idx + 10);
	return ss.substring(0, ss.indexOf('/'));
}

function parseSubreddit(link){
	return link.substring(link.indexOf('/r/') + 3, link.indexOf('/comments/'));
}

/**
 * MIDDLEWARE
 */
function ensureAuthenticated(req, res, next){
	if (req.isAuthenticated()) {
		return next();
	}
	req.session.redirect_to = req.path;
	res.redirect('/auth/reddit');
}

/**
 * START SERVER
 */
db.sequelize.sync({
	force : prefs.force_sync
}).complete(function(err){
		if (err) {
			throw err;
		} else {
			app.listen(PORT);
		}
	});
