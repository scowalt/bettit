$(document).ready(function onReady() {
	io = io.connect();

	io.on('connect', function onConnect() {
		io.emit('top_threads');
	});

	io.on('top_threads_response', function(data) {
		data.forEach(function(thread) {
			$("#top_threads").append($("<li>", {
				'class': 'list-group-item'
			}).append($("<a>", {
				'href': '/t/' + thread.redditID
			}).text(thread.title)));
		});
	})
});