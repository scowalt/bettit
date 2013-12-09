var colog = require('colog');

module.exports = function(socket) {
	db.getActiveThreads(5, function(err, threads) {
		if (err) return colog.error(err);
		var data = [];
		threads.forEach(function(thread) {
			data.push({
				'title': thread.title,
				'redditID': thread.redditID
			});
		});
		return socket.emit('top_threads_response', data);
	});
};