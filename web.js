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
var _ = require('underscore');

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

/**
 * Define authentication strategy
 */
passport.use(new RedditStrategy({
	clientID     : REDDIT_CONSUMER_KEY,
	clientSecret : REDDIT_CONSUMER_SECRET,
	callbackURL  : SERVER_URL + "/auth/reddit/callback"
}, function(accessToken, refreshToken, profile, done){
	process.nextTick(function(){
		// add user to database when authenticated
		db.User.findOrCreate({
			username : profile.name
		}).success(function(user){
				console.log(user.values);
			});
		return done(null, profile);
	});
}));

/**
 * Configure express
 * NOTE: The order of this configuration is VERY important
 */
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
		secret : secrets.secret,
		cookie : { maxAge : 5 * 365 * 24 * 60 * 60 * 1000 }
	}));
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(app.router);
});

/**
 * SOCKET.IO ROUTING
 */
/**
 * 'ready' is called by the client on page load
 */
app.io.route('ready', function(req){
	var threadID = parseThreadID(req.headers.referer);
	req.io.join(threadID);
	var username = req.session.passport.user.name;
	db.User.find({where : {username : username}}).success(function(user){
		if (!user) return; //TODO Handle this
		req.io.emit('money_response', {
			money : user.values.money
		});
		db.Thread.find({where : {id : threadID}}).success(function(thread){
			if (!thread) { //TODO Handle this
				console.log("Can't find thread with ID " + threadID);
				return;
			}
			thread.getEvents().success(function(events){
				for (var i = 0; i < events.length; i++) {
					var event = events[i];
					event.emitEvent(function(data){
						console.log(data);
						req.io.emit('event_response', data);
					});
				}
			});
		});
	});
});

app.io.route('thread_info', function(req){
	var referer = req.headers.referer;
	var subreddit = parseSubreddit(referer);
	var thread_id = parseThreadID(referer);
	var path = 'http://www.reddit.com/r/' + subreddit + '/comments/ ' + thread_id +
		'/.json';

	request({
		uri : path
	}, function(error, response, body){
		var json = JSON.parse(body);
		var post = json[0]['data']['children'][0]['data'];
		var title = post['title'];
		var content = post['is_self'] ? SnuOwnd.getParser().render(post['selftext'])
			: post['url'];
		var author = post['author'];

		req.io.emit('thread_info_response', {
			title   : title,
			content : content
		});

		db.User.findOrCreate({username : author}).success(function(user){
			db.Thread.findOrCreate({id : thread_id}).success(function(thread){
				thread.addUser(user).success(function(){
					if (req.session.passport.user.name === author)
						req.io.emit('is_mod_response', {});
				});
			});
		});
	});
});

/**
 * 'add_event' is called when a client is attempting to add an event
 */
app.io.route('add_event', function(req){
	var username = req.session.passport.user.name;
	var thread_id = parseThreadID(req.headers.referer);
	db.User.find({where : {username : username}}).success(function(user){
		if (!user) return;
		user.isModeratorOf(thread_id, function(bool){
			if (!bool) return;
			db.Event.create({title : req.data.title}).success(function(event){
				var len = req.data.outcomes.length;
				var finished = _.after(len + 1,
					function(){
						event.emitEvent(function(data){
							app.io.room(thread_id).broadcast('event_response', data);
						});
					});
				db.Thread.find({where : {id : thread_id}}).success(function(thread){
					thread.addEvent(event).success(function(){
						finished();
					})
				});
				for (var i = 0; i < len; i++) {
					var outcome_title = req.data.outcomes[i];
					db.Outcome.create({title : outcome_title, order : i})
						.success(function(outcome){
							event.addOutcome(outcome).success(function(){
								finished();
							});
						});
				}
			});
		});
	});
});

/**
 * 'bet' is called when a user attempts to bet on an event
 */
app.io.route('bet', function(req){
	var username = req.session.passport.user.name;
	var outcome_id = req.data.outcome_id;
	var amount = req.data.amount ? req.data.amount : prefs.default_bet;
	db.Bet.findOrCreate({})
});

/**
 * EXPRESS ROUTING
 */
/**
 * Authentication route
 */
app.get('/auth/reddit', function(req, res, next){
	req.session.state = crypto.randomBytes(32).toString('hex');
	passport.authenticate('reddit', {
		state    : req.session.state,
		duration : 'permanent'
	})(req, res, next);
});

/**
 * Authentication callback
 */
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
				// return where the user was before
				return res.redirect(req.session.redirect_to);
			});
		})(req, res, next);
	}
	else {
		next(new Error(403));
	}
});

/**
 * Logout
 */
app.get('/logout', function(req, res){
	req.logout();
	res.redirect('/');
});

/**
 * Thread route with thread title in url
 */
app.get('/r/:subreddit/comments/:thread/', ensureAuthenticated, function(req, res){
	threadFunction(req, res);
});

/**
 * Thread route without thread title in url
 */
app.get('/r/:subreddit/comments/:thread/:title/', ensureAuthenticated,
	function(req, res){
		threadFunction(req, res);
	});

/**
 * PRIVATE HELPERS
 */
function threadFunction(req, res){
	var thread_id = req.params.thread;
	var username = req.session.passport.user.name;
	db.User.find({where : {username : username}}).success(function(user){
		user.isModeratorOf(thread_id, function(bool){
			res.render('thread', {
				user : req.user.name,
				mod  : bool
			});
		});
	})
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
		db.User.findOrCreate({
			username : req.user.name}).success(function(){
				next();
			}).error(function(){
				console.log("Error finding or adding user!");
			});
	}
	else {
		req.session.redirect_to = req.path;
		res.redirect('/auth/reddit');
	}
}

/**
 * START SERVER
 */
db.sequelize.sync({
	force : prefs.force_sync
}).complete(function(err){
		if (err) {
			throw err;
		}
		else {
			app.listen(PORT);
		}
	});
