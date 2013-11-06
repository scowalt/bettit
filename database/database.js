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
function addUser(username, money) {
	if (!money)
		money = DEFAULT_MONEY;
	db.getConnection(function(err, connection) {
		safeName = connection.escape(username);
		safeMoney = connection.escape(money);
		connection.query('INSERT INTO bettit.users(username, money) VALUES (' + safeName + ', ' + safeMoney + ");");
		connection.release();
	});
}

function getMoney(username, callback) {
	var money = 0;
	db.getConnection(function(err, connection) {
		safeName = connection.escape(username);
		connection.query('SELECT money FROM bettit.users WHERE username = ' + safeName, function(err, results) {
			if (err)
				throw err;
			callback(results[0]['money']);
		});
	});
}
function addThread(id, title, content, author, subreddit){
	if(!id || !title || !content || !author || !subreddit)
		return;
}

/**
 * EXPORTS
 */
exports.getMoney = getMoney;
exports.addUser = addUser;
