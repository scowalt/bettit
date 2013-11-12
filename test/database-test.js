var Browser = require("zombie");
var assert = require("assert");
var prefs = require('../config/prefs.js');
var db = require('../models')('test', false);

describe('Database tests', function() {
	before(function(done) {
		db.sequelize.sync({
			force : true
		}).success(function() {
			done();
		});
	});

	describe('A user', function() {
		describe('with a username and money amount', function() {
			var user = {
				username : 'testuser',
				money : 475
			};

			describe('when added to the database', function() {

				before(function(done) {
					db.User.create(user).success(function() {
						done();
					});
				});

				it('is in the database with the correct money value', function(done) {
					db.User.find({
						where : user
					}).success(function(info) {
						assert.equal(user.money, info.money);
						assert.equal(user.username, info.username);
						done();
					});
				});

				after(function(done) {
					db.User.destroy(user).success(function() {
						done();
					});
				});

			});
		});
		describe('with a username and no money amount', function() {
			var user = {
				username : 'testuser2'
			};

			describe('when added to the database', function() {
				before(function(done) {
					db.User.create(user).success(function() {
						done();
					});
				});

				it('is in the database with the default money value', function(done) {
					db.User.find({
						where : user
					}).success(function(info) {
						assert.equal(user.username, info.username);
						assert.equal(prefs.default_money, info.money);
						done();
					});
				});

				after(function(done) {
					db.User.destroy(user).success(function() {
						done();
					});
				});
			});
		});
		describe('with no information', function() {
			var user = {
				/* empty */
			};

			it("can't be added to the database", function(done) {
				db.User.create(user).error(function() {
					done();
				});
			});
		});
	});
});
