var Browser = require("zombie");
var assert = require("assert");
var vows = require('vows');
var db = require('../database/database.js');

// modify test db instead of real one
db.test.changeDatabase('test');

vows.describe('Database tests').addBatch({
	'Adding a user' : {
		'with a valid name and money amount' : {
			topic : {
				username : 'testuser',
				money : 400
			},

			'is added to the database with the correct money amount' : function(topic) {
				db.addUser(topic.username, 400);
				db.getMoney(topic.username, function(money) {
					assert.equal(money, topic.money);
				});
			},

			teardown : function(topic) {
				db.removeUser(topic.username);
			}
		}
	}
}).addBatch({
	'Cleanup' : {
		'destroy connections' : function() {
			db.test.end();
		}
	}
}).run();
