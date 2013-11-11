var Browser = require("zombie");
var assert = require("assert");
var vows = require('vows');
var db = require('../models');

// TODO modify to use test db instead of real one

vows.describe('Database tests').addBatch({
	'A user' : {
		'with a valid name and money amount' : {
			topic : {
				username : 'testuser',
				money : 499
			},

			'when added to the database' : {
				topic : function(info) {
					db.User.findOrCreate(info).success(this.callback());
				},

				'appears in the database' : function(info) {
					db.User.find({
						where : info
					}).success(function(user) {
						assert.equal(info.money, user.money);
					});
				},

				teardown : function(info) {
					db.User.destroy(info);
				}
			}
		}
	},
}).export(module);
