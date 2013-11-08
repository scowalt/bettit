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
	supportBigNumbers : true,
});

var database_name = 'bettit';

/**
 * METHODS
 */
/**
 * Changes the database (useful for testing)
 */
function changeDatabase(database) {
	database_name = database;
}

/**
 * Destroys all connections (useful for testing)
 */
function end() {
	db.end();
}

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
		var safeName = connection.escape(username);
		var safeMoney = connection.escape(money);
		var query = 'INSERT INTO ' + database_name + '.users(username, money) VALUES (' + safeName + ', ' + safeMoney + ");";
		connection.query(query, function(err, results) {
			if (err)
				console.log(err);
		});
		connection.release();
	});
}

/**
 * Get how much money a user has
 * @param callback Function to call on the money amount
 * @return void
 */
function getMoney(username, callback) {
	var money = 0;
	db.getConnection(function(err, connection) {
		if (err)
			throw err;
		safeName = connection.escape(username);
		connection.query('SELECT money FROM ' + database_name + '.users WHERE username = ' + safeName, function(err, results) {
			if (err)
				throw err;
			if (!callback)
				return;
			if (!results[0])
				return callback(null);
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
		query = 'INSERT INTO ' + database_name + '.threads(thread_id, title, content, original_poster, subreddit) VALUES (';
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
 *
 * @return void
 */
function addThreadMod(username, thread_id) {
	if (!thread_id || !username)
		return;
	db.getConnection(function(err, connection) {
		if (err)
			throw err;
		safeUsername = connection.escape(username);
		safeThreadID = connection.escape(thread_id);
		query = 'INSERT INTO ' + database_name + '.users_moderate_threads(username, thread_id) VALUES (';
		query += safeUsername + ', ';
		query += safeThreadID + ');';
		connection.query(query);
		connection.release();
	});
}

/**
 *
 * @param callback Function to call on the event ID
 * @return void
 */
function addEvent(name, thread_id, status, creator, callback) {
	if (!name || !thread_id || !status || !creator)
		return;
	db.getConnection(function(err, connection) {
		if (err)
			throw err;
		safeName = connection.escape(name);
		safeThreadID = connection.escape(thread_id);
		safeStatus = connection.escape(status);
		safeCreator = connection.escape(creator);
		query = 'INSERT INTO ' + database_name + '.events(name, thread_id, status, creator, created_at) VALUES(';
		query += safeName + ', ';
		query += safeThreadID + ', ';
		query += safeStatus + ', ';
		query += safeCreator + ');';
		connection.query(query, function(err, result) {
			if (err)
				throw err;
			if (callback)
				callback(result.insertId);
		});
		connection.release();
	});
}

/**
 *
 * @param callback Function to call on the outcome_id
 * @return void
 */
function addOutcome(name, event_id, thread_id, callback) {
	if (!name || !event_id || !thread_id)
		return;
	db.getConnection(function(err, connection) {
		if (err)
			throw err;
		safeName = connection.escape(name);
		safeEventID = connection.escape(event_id);
		safeThreadID = connection.escape(thread_id);
		query = 'INSERT INTO ' + database_name + '.outcomes(name, event_id, thread_id) VALUES (';
		query += safeName + ', ';
		query += safeEventID + ', ';
		query += safeThreadID + ');';
		connection.query(query, function(err, result) {
			if (err)
				throw err;
			if (callback)
				callback(result.insertId);
		});
		connection.release();
	});
}

/**
 *
 * @return void
 */
function addBet(username, outcome_id, event_id, thread_id, amount) {
	if (!username || !outcome_id || !event_id || !thread_id || !amount)
		return;

	db.getConnection(function(err, connection) {
		if (err)
			throw err;
		safeUser = connection.escape(username);
		safeOutcome = connection.escape(outcome_id);
		safeEvent = connection.escape(event_id);
		safeThread = connection.escape(thread_id);
		safeAmount = connection.escape(amount);
		query = 'INSERT INTO ' + database_name + '.bets(username, outcome_id, event_id, thread_id, amount) VALUES (';
		query += safeUser + ', ';
		query += safeOutcome + ', ';
		query += safeEvent + ', ';
		query += safeThread + ', ';
		query += safeAmount + ');';
		connection.query(query);
		connection.release();
	});
}

/**
 *
 * @param callback
 * @return void
 */
function isModerator(username, thread_id, callback) {
	if (!username || !thread_id)
		return;

	db.getConnection(function(err, connection) {
		if (err)
			throw err;
		safeUser = connection.escape(username);
		safeThreadID = connection.escape(thread_id);
		query = 'SELECT * from ' + database_name + '.users_moderate_threads where ';
		query += 'username = ' + safeUser + ' AND ';
		query += 'thread_id = ' + safeThreadID + ';';
		connection.query(query, function(err, result) {
			if (err)
				throw err;
			var b = result[0] ? true : false;
			if (callback)
				callback(b);
		});
		connection.release();
	});
}

/**
 * EXPORTS
 */
// for testing
exports.test = {};
exports.test.changeDatabase = changeDatabase;
exports.test.db = db;
exports.test.end = end;

exports.getMoney = getMoney;
exports.addUser = addUser;
exports.addThread = addThread;
exports.addThreadMod = addThreadMod;
exports.addEvent = addEvent;
exports.addOutcome = addOutcome;
exports.addBet = addBet;
exports.isModerator = isModerator;
