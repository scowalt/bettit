/**
 * LIBRARY IMPORTS
 */
var express = require('express');
var passport = require('passport');
var RedditStrategy = require('passport-reddit').Strategy;
var RedisStore = require('connect-redis')(express);
var SessionSockets = require('session.socket.io');
var colog = require('colog');
var force = require('express-force-domain');

/**
 * MODULE IMPORTS
 */
var prefs = require('./config/prefs.js');
var db = require('./models')('bettit', prefs.logging.mysql);
var secrets = require('./config/secrets.js');
var routes = require('./routes')(passport);
var middleware = require('./middleware');
var socketHandlers = require('./sockets');

/**
 * CONSTANTS
 */
var REDDIT_CONSUMER_KEY = secrets.reddit.consumer.key;
var REDDIT_CONSUMER_SECRET = secrets.reddit.consumer.secret;
var SERVER_URL = prefs.server_url;
var PORT = prefs.port;

/**
 * SETUP
 */
var app = express();
var io = require('socket.io').listen(app.listen(PORT));
io.set('log level', prefs.logging.socket);
var sessionStore = new RedisStore;
var cookieParser = express.cookieParser(secrets.secret);
var sessionSockets = new SessionSockets(io, sessionStore, cookieParser);

// sync server
db.sequelize.sync({
	force : prefs.force_sync
}).complete(function(err) {
	if (err)
		throw err;
	colog.info('Database sync completed');
});

/**
 * Passport serialization
 */
passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(obj, done) {
	done(null, obj);
});

/**
 * Define authentication strategy
 */
passport.use(new RedditStrategy({
	clientID : REDDIT_CONSUMER_KEY,
	clientSecret : REDDIT_CONSUMER_SECRET,
	callbackURL : SERVER_URL + "/auth/reddit/callback"
}, function(accessToken, refreshToken, profile, done) {
	process.nextTick(function() {
		// add user to database when authenticated
		db.User.findOrCreate({
			username : profile.name
		}).success(function(user) {
			return done(null, profile);
		});

	});
}));

/**
 * Configure express NOTE: The order of this configuration is VERY important
 */
app.configure(function() {
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.static(__dirname + '/public'));
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');
	if (prefs.logging.express)
		app.use(express.logger());
	app.use(express.favicon());
	app.use(cookieParser);
	app.use(express.session({
		store : sessionStore,
		secret : secrets.secret,
		cookie : {
			maxAge : 5 * 365 * 24 * 60 * 60 * 1000
		}
	}));
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(force(prefs.server_url));
	app.use(app.router);
});

/**
 * SOCKET.IO ROUTING
 */
sessionSockets.on('connection', function(err, socket, session) {
	if (err) {
		colog.error('Error on socket connection');
		return; // TODO Handle this
	}
	socket.on('ready', function onReady(threadRedditID) {
		return socketHandlers.ready(socket, session, threadRedditID);
	});
	socket.on('add_event', function(data) {
		return socketHandlers.addEvent(io, socket, session, data);
	});
	socket.on('bet', function(data) {
		return socketHandlers.bet(socket, session, data);
	});
	socket.on('lock', function onLock(data) {
		return socketHandlers.lock(io, sessionSockets, socket, session, data);
	});
	socket.on('close', function onClose(data) {
		return socketHandlers.close(io, sessionSockets, socket, session, data);
	});
	socket.on('delete', function onDelete(data){
		return socketHandlers.delete(io, sessionSockets, socket, session, data);
	})
});

/**
 * EXPRESS ROUTING
 */
// authentication
app.get('/auth/reddit', routes.auth.reddit);
app.get('/auth/reddit/callback', routes.auth.redditCallback);

// logout
app.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/');
});

// thread pages
app.get('/r/:subreddit/comments/:thread', middleware.ensureAuthenticated,
		routes.thread);
app.get('/r/:subreddit/comments/:thread/:title',
		middleware.ensureAuthenticated, routes.thread);

// user pages
app.get('/u/:username', routes.user);
app.get('/user/:username', routes.user);