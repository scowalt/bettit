/**
 * LIBRARY IMPORTS
 */
var express = require('express');
var passport = require('passport');
var request = require('request');
var SnuOwnd = require('snuownd');
var RedditStrategy = require('passport-reddit').Strategy;
var RedisStore = require('connect-redis')(express);
var _ = require('underscore');
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
db.sequelize.sync({ force : prefs.force_sync }).complete(function(err){
	if (err)
		throw err;
	colog.info("Database sync completed");
});


/**
 * Passport serialization
 */
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
		db.User.findOrCreate({username : profile.name}).success(function(user){
			return done(null, profile);
		});

	});
}));

/**
 * Configure express NOTE: The order of this configuration is VERY important
 */
app.configure(function(){
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.static(__dirname + '/public'));
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');
	if (prefs.logging.express) app.use(express.logger());
	app.use(express.favicon());
	app.use(cookieParser);
	app.use(express.session({
		store  : sessionStore,
		secret : secrets.secret,
		cookie : { maxAge : 5 * 365 * 24 * 60 * 60 * 1000 }
	}));
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(force(prefs.server_url));
	app.use(app.router);
});

/**
 * SOCKET.IO ROUTING
 */
sessionSockets.on('connection', function(err, socket, session){
	if (err) return; // TODO Handle this
	var username = session.passport.user.name;
	socket.on('ready', function onReady(threadRedditID){
		colog.info('ready from ' + username + ' at page ' + threadRedditID);
		socket.join(threadRedditID);
		db.User.find({where : {username : username}}).success(function(user){
			if (!user) return; // TODO Handle this
			socket.emit('money_response', {
				money : user.values.money
			});

			db.Thread.findOrCreate({redditID : threadRedditID}).success(function(thread){
				if (!thread) {
					colog.error("Couldn't find thread with ID " + threadRedditID);
					return;
				}
				thread.emitEvents(function(data){
					user.betOn(data.id, function(outcome_id){
						data.betOn = outcome_id;
						socket.emit('event_response', data);
					});
				});
			});
		});
		sendThreadInfo(threadRedditID, socket);
	});
	socket.on('add_event', function(data){
		colog.info("add_event recieved from " + username);
		var threadRedditID = data.threadID;
		db.User.find({where : {username : username}}).success(function(user){
			if (!user) return;
			user.isModeratorOf(threadRedditID, function(bool){
				if (!bool) return;
				db.Event.create({title : data.title}).success(function(event){
					var len = data.outcomes.length;
					var finished = _.after(len + 1,
						function onEventCreation(){
							event.emitEvent(function(data){
								data.betOn = false;
								io.sockets.in(threadRedditID).emit('event_response',
									data);
							});
						});
					db.Thread.find({where : {redditID : threadRedditID}}).success(function(thread){
						colog.info("adding event " + event.id + " to thread " + thread.redditID);
						thread.addEvent(event).success(function(){
							finished();
						});
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
		colog.info('bet recieved from ' + username);
		var outcomeID = data.outcomeID;
		var amount = data.amount ? data.amount : prefs.default_bet;
		db.User.find({where : {username : username}}).success(function(user){
			if (!user) return; // TODO Handle
			db.Outcome.find(outcomeID).success(function(outcome){
				if (!outcome) return; // TODO Handle
				db.Bet.createBet(outcome, user, amount, function(err){
					if (err) {
						console.log("ERROR: " + err);
						return;
					}
					db.User.find({where : {username : username}}).success(function(user){
						if (!user) return; // TODO Handle
						socket.emit('money_response', {
							money : user.values.money
						});
					});
					outcome.getEvent().success(function(event){
						event.emitEvent(function(data){
							data.betOn = outcomeID;
							socket.emit('event_response', data);
						});
					});
				});
			});
		});
	});
	socket.on('lock', function onLock(data){
		var eventID = data.eventID;
		colog.info('lock recieved from ' + username + ' for event ' + eventID);
		db.User.find({where : {username : username}}).success(function(user){
			if (!user) {
				colog.error("Couldn't find user with name " + username);
				return; // TODO Handle
			}
			db.Event.find({where : {id : eventID}}).success(function(event){
				if (!event) {
					colog.error("Couldn't find event with id " + eventID);
					return; // TODO Handle
				}
				event.getThread().success(function gotThread(thread){
					if (!thread){
						colog.error("Couldn't find thread of event " + eventID);
						return; // TODO Handle
					}
					colog.info('event ' + eventID + ' is in thread ' + thread.redditID);
					user.isModeratorOf(thread.redditID, function(bool){
						if (!bool) {
							colog.error(username + ' is not a mod of thread ' + thread.redditID);
							return;
						}
						event.updateAttributes({status : 'locked'})
							.success(function onUpdatedLocked(){
								colog.success("locked event " + eventID);
								event.emitEvent(function(data){
									forEveryUserInRoom(thread.redditID,
										function(socket, user){
											user.betOn(event.id,
												function(outcome_id){
													data.betOn =
														outcome_id;
													socket.emit('event_response',
														data);
												});
										});
								});
							});
					});
				});
			});
		});
	});
	socket.on('close', function onClose(data){
		colog.info('close recieved from ' + username);
		var eventID = data.eventID;
		db.User.find({where : {username : username}}).success(function(user){
			if (!user) return; // TODO Handle this
			db.Event.find({where : {id : eventID}}).success(function(event){
				if (!event) return; // TODO Handle this
				event.getThread().success(function(thread){
					if (!thread) return; // TODO Handle this
					user.isModeratorOf(thread.values.redditID, function(bool){
						if (!bool) return; // isn't moderator, can't close
											// event
						event.calculatePot(function(pot){
							event.declareWinner(data.outcomeID, pot,
								function(error){
									if (error) throw error;
									// users have been paid
									event.status = 'closed';
									event.save().success(function(){
										event.emitEvent(function(data){
											forEveryUserInRoom(thread.values.redditID,
												function(socket, user){
													socket.emit('money_response', {
														money : user.values.money
													});
													user.betOn(eventID,
														function(outcomeID){
															data.betOn = outcomeID;
															socket.emit('event_response',
																data);
														});
												});
										});
									});
								}
							);
						});
					});
				});
			});
		});
	});
});

/**
 * Calls callback on every user in a room
 * 
 * @param roomID
 * @param callback
 *            (socket, user)
 */
function forEveryUserInRoom(roomID, callback){
	io.sockets.clients(roomID)
		.forEach(function(socket){
			sessionSockets.getSession(socket,
				function(err, session){
					if (err) return; // TODO Handle
					db.User.find({where : {username : session.passport.user.name}})
						.success(function(user){
							if (!user) return; // TODO Handle
							callback(socket, user);
						});
				});
		});
}

function sendThreadInfo(thread_id, socket){
	var path = 'http://redd.it/' + thread_id;
	request({uri : path}, function(error, response, body){
		if (error) {
			colog.error("Error loading info from reddit");
			return; // TODO Handle
		}
		var path = 'http://reddit.com' + response.request.path + '.json';
		request({ uri : path }, function(error, response, body){
			if (error) {
				colog.error("Error loading info from reddit");
				return; // TODO Handle
			}
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
				db.Thread.findOrCreate({redditID : thread_id}).success(function(thread){
					// TODO Don't add if duplicate
					thread.addUser(user).success(function(){});
				});
			});
		});
	});
}

/**
 * EXPRESS ROUTING
 */
// authentication
app.get('/auth/reddit', routes.auth.reddit);
app.get('/auth/reddit/callback', routes.auth.redditCallback);

// logout
app.get('/logout', function(req, res){
	req.logout();
	res.redirect('/');
});

// thread pages
app.get('/r/:subreddit/comments/:thread', middleware.ensureAuthenticated, routes.thread);
app.get('/r/:subreddit/comments/:thread/:title', middleware.ensureAuthenticated, routes.thread);

// user pages
app.get('/u/:username', routes.user);
app.get('/user/:username', routes.user);

/**
 * PRIVATE HELPERS
 */
function parseThreadID(link){
	var idx = link.indexOf('/comments/');
	var ss = link.substring(idx + 10);
	return ss.substring(0, ss.indexOf('/'));
}

function parseSubreddit(link){
	return link.substring(link.indexOf('/r/') + 3, link.indexOf('/comments/'));
}