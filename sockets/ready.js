var colog = require('colog');
var request = require('request');
var SnuOwnd = require('snuownd');

module.exports = function(socket, session, threadRedditID) {
	var username = session.passport.user.name;
	colog.info('ready from ' + username + ' at page ' + threadRedditID);
	socket.join(threadRedditID);
	db.User.find({
		where : {
			username : username
		}
	}).success(function(user) {
		if (!user)
			return; // TODO Handle this
		socket.emit('money_response', {
			money : user.values.money
		});

		db.Thread.findOrCreate({
			redditID : threadRedditID
		}).success(function(thread) {
			if (!thread) {
				colog.error("Couldn't find thread with ID " + threadRedditID);
				return;
			}
			thread.emitEvents(function(data) {
				user.betOn(data.id, function(outcome_id) {
					data.betOn = outcome_id;
					socket.emit('event_response', data);
				});
			});
		});
	});
	sendThreadInfo(threadRedditID, socket);
}

function sendThreadInfo(thread_id, socket) {
	var path = 'http://redd.it/' + thread_id;
	request({
		uri : path
	}, function(error, response, body) {
		if (error) {
			colog.error("Error loading info from reddit");
			return; // TODO Handle
		}
		var path = 'http://reddit.com' + response.request.path + '.json';
		request({
			uri : path
		}, function(error, response, body) {
			if (error) {
				colog.error("Error loading info from reddit");
				return; // TODO Handle
			}
			var json = JSON.parse(body);
			var post = json[0]['data']['children'][0]['data'];
			var title = post['title'];
			// TODO Handle different content types
			var content = post['is_self'] ? SnuOwnd.getParser().render(
					post['selftext']) : post['url'];
			var author = post['author'];

			socket.emit('thread_info_response', {
				title : title,
				content : content
			});

			db.User.findOrCreate({
				username : author
			}).success(function(user) {
				db.Thread.findOrCreate({
					redditID : thread_id
				}).success(function(thread) {
					// TODO Don't add if duplicate
					thread.addUser(user).success(function() {
					});
				});
			});
		});
	});
}
