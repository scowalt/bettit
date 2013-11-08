var Browser = require("zombie");
var assert = require("assert");
var vows = require('vows');
var db = require('../database/database.js');

// modify test db instead of real one
db.test.changeDatabase('test');

vows.describe('Database tests').addBatch({
	'A user' : {
		'with a valid name and money amount' : {
			topic : {
				username : 'testuser',
				money : 400
			},

			'when added to the database' : {
				topic : function(info) {
					db.addUser(info.username, 400);
					return info;
				},

				'appears in the database' : function(info) {
					db.getMoney(info.username, function(money) {
						assert.equal(money, info.money);
					});
				},

				teardown : function(info) {
					db.removeUser(info.username);
				}
			}
		},
		'with a valid name and no money amount' : {
			topic : {
				username : 'testuser',
			},

			'when added to the database' : {
				topic : function(info) {
					db.addUser(info.username);
					return info;
				},

				'appears in the database with 500 money' : function(info) {
					db.getMoney(info.username, function(money) {
						assert.equal(money, 500);
					});
				},

				teardown : function(topic) {
					db.removeUser(topic.username);
				}
			}
		},
		'with an invalid name' : {
			topic : {
				username : null
			},

			"when added to the database" : {
				topic : function(info) {
					db.addUser(info.username);
					return info;
				},

				"doesn't appear in the database" : function(info) {
					db.getMoney(info.username, function(money) {
						assert.equal(money, null);
					});
				},

				teardown : function(topic) {
					db.removeUser(topic.username);
				}
			}
		}
	}
}).addBatch({
	'(cleanup)' : {
		'(destroy connections)' : function() {
			db.test.end();
		}
	}
}).export(module);
