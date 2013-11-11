var Browser = require("zombie");
var assert = require("assert");
var vows = require('vows');
var db = require('../models')('test');

db.sequelize.sync({
	force : true
});

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
				}
			}
		}
	},
}).export(module);
