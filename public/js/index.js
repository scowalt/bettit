$(document).ready(function onReady() {
	io = io.connect();

	io.on('connect', function onConnect() {
		io.emit('top_threads');
	});

	io.on('top_threads_response', function(data) {
		$("#top_threads").empty();
		data.forEach(function(thread) {
			var $thread = $("<a>", {
				'href': '/t/' + thread.redditID
			}).text(thread.title);
			var $subreddit = $("<small>").text(' (/r/' + thread.subreddit + ')')

			$("#top_threads").append($("<li>", {
				'class': 'list-group-item'
			}).append($thread).append($subreddit));
		});
	})
});