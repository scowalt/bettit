/**
 * IMPORTS
 */
var mysql = require('mysql');

/**
 * CONSTANTS
 */
var MYSQL_USER = 'bettit';
var MYSQL_PASS = 'phAwupe9hA2RaWeb';

/**
 * Setup
 */
var db = mysql.createPool({
	host : 'localhost',
	user : MYSQL_USER,
	password : MYSQL_PASS,
});

/**
 * Methods
 */
function addUser(username, money) {
	db.getConnection(function(err, connection) {
		safeName = connection.escape(username);
		safeMoney = connection.escape(money);
		connection.query('INSERT INTO bettit.users VALUES (' + safeName
				+ ', ' + safeMoney + ");");
		connection.release();
	});
}

function getMoney(username, callback){
	var money = 0;
	db.getConnection(function(err, connection){
		safeName = connection.escape(username);
		connection.query()
	})
}

/**
 * Exports
 */
exports.getMoney = getMoney;
exports.addUser = addUser;