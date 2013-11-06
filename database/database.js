/**
 * IMPORTS
 */
var mysql = require('mysql');

/**
 * CONSTANTS
 */
var MYSQL_USER = 'bettit';
var MYSQL_PASS = 'phAwupe9hA2RaWeb';
var DEFAULT_MONEY = 500;

/**
 * SETUP
 */
var db = mysql.createPool({
	host : 'localhost',
	user : MYSQL_USER,
	password : MYSQL_PASS,
});

/**
 * METHODS
 */
/**
 * Adds user to the user table
 * @return void
 */
function addUser(username, money) {
	if (!money)
		money = DEFAULT_MONEY;
	db.getConnection(function(err, connection) {
		if (err)
			throw err;
		safeName = connection.escape(username);
		safeMoney = connection.escape(money);
		connection.query('INSERT INTO bettit.users(username, money) VALUES (' + safeName + ', ' + safeMoney + ");");
		connection.release();
	});
}

/**
 * Get how much money a user has
 * @return int
 */
function getMoney(username, callback) {
	var money = 0;
	db.getConnection(function(err, connection) {
		if (err)
			throw err;
		safeName = connection.escape(username);
		connection.query('SELECT money FROM bettit.users WHERE username = ' + safeName, function(err, results) {
			if (err)
				throw err;
			callback(results[0]['money']);
		});
		connection.release();
	});
}

/**
 * Add a thread to the threads table
 * @return void
 */
function addThread(id, title, content, author, subreddit) {
	if (!id || !title || !content || !author || !subreddit)
		return;
	db.getConnection(function(err, connection) {
		if (err)
			throw err;
		safeId = connection.escape(id);
		safeTitle = connection.escape(title);
		safeContent = connection.escape(content);
		safeAuthor = connection.escape(author);
		safeSubreddit = connection.escape(subreddit);
		query = 'INSERT INTO bettit.threads(thread_id, title, content, original_poster, subreddit) VALUES (';
		query += safeId + ', ';
		query += safeTitle + ', ';
		query += safeContent + ', ';
		query += safeAuthor + ', ';
		query += safeSubreddit + ');';
		connection.query(query);
		connection.release();
	});
}

/**
 * EXPORTS
 */
exports.getMoney = getMoney;
exports.addUser = addUser;
exports.addThread = addThread;
