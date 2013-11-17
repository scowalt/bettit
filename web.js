/**
 * LIBRARY IMPORTS
 */
// https://github.com/Slotos/passport-reddit/blob/master/examples/login/app.js
var express = require('express');
var passport = require('passport');
var crypto = require('crypto');
var request = require('request');
var SnuOwnd = require('snuownd');
var RedditStrategy = require('passport-reddit').Strategy;
var RedisStore = require('connect-redis')(express);
var _ = require('underscore');
var SessionSockets = require('session.socket.io');

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
var app = express();
var io = require('socket.io').listen(app.listen(PORT));
var sessionStore = new RedisStore;
var cookieParser = express.cookieParser(secrets.secret);
var sessionSockets = new SessionSockets(io, sessionStore, cookieParser);
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
	app.use(cookieParser);
	app.use(express.session({
		store  : sessionStore,
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
sessionSockets.on('connection', function(err, socket, session){
	if (err) return; // TODO Handle this
	var username = session.passport.user.name;
	socket.on('ready', function(threadID){
		socket.join(threadID);
		db.User.find({where : {username : username}}).success(function(user){
			if (!user) return; //TODO Handle this
			socket.emit('money_response', {
				money : user.values.money
			});
		});
		db.Thread.findOrCreate({id : threadID}).success(function(thread){
			if (!thread) { //TODO Handle this
				return;
			}
			thread.emitEvents(function(data){
				socket.emit('event_response', data);
			});
		});

		sendThreadInfo(threadID, socket);
	});
	socket.on('add_event', function(data){
		var thread_id = data.threadID;
		db.User.find({where : {username : username}}).success(function(user){
			if (!user) return;
			user.isModeratorOf(thread_id, function(bool){
				if (!bool) return;
				db.Event.create({title : data.title}).success(function(event){
					var len = data.outcomes.length;
					var finished = _.after(len + 1,
						function(){
							event.emitEvent(function(data){
								io.sockets.in(thread_id).emit('event_response',
									data);
							});
						});
					db.Thread.find({where : {id : thread_id}}).success(function(thread){
						thread.addEvent(event).success(function(){
							finished();
						})
					});
					for (var i = 0; i < len; i++) {
						var outcome_title = data.outcomes[i];
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
	socket.on('bet', function(data){
		var outcomeID = data.outcomeID;
		var amount = data.amount ? data.amount : prefs.default_bet;
		db.User.find({where : {username : username}}).success(function(user){
			if (!user) return; //TODO Handle
			db.Outcome.find(outcomeID).success(function(outcome){
				if (!outcome) return; //TODO Handle
				db.Bet.createBet(outcome, user, amount, function(err){
					if (err) {
						console.log("ERROR: " + err);
						return;
					}
					db.User.find({where : {username : username}}).success(function(user){
						if (!user) return; //TODO Handle
						socket.emit('money_response', {
							money : user.values.money
						});
					})
				})
			});
		});
	});
});

function sendThreadInfo(thread_id, socket){
	var path = 'http://redd.it/' + thread_id;
	request({uri : path}, function(error, response, body){
		var path = 'http://reddit.com' + response.request.path + '.json';
		request({ uri : path }, function(error, response, body){
			var json = JSON.parse(body);
			var post = json[0]['data']['children'][0]['data'];
			var title = post['title'];
			// TODO Handle different content types
			var content = post['is_self']
				? SnuOwnd.getParser().render(post['selftext'])
				: post['url'];
			var author = post['author'];

			socket.emit('thread_info_response', {
				title   : title,
				content : content
			});

			db.User.findOrCreate({username : author}).success(function(user){
				db.Thread.findOrCreate({id : thread_id}).success(function(thread){
					thread.addUser(user).success(function(){});
				});
			});
		});
	});
}
//
///**
// * 'bet' is called when a user attempts to bet on an event
// */
//app.io.route('bet', function(req){
//	var username = req.session.passport.user.name;
//	var outcome_id = req.data.outcome_id;
//	var amount = req.data.amount ? req.data.amount : prefs.default_bet;
//	db.Bet.findOrCreate({})
//});

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
				user     : req.user.name,
				mod      : bool,
				threadID : thread_id
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

		}
	});
