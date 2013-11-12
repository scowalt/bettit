var Browser = require("zombie");
var assert = require("assert");
var prefs = require('../config/prefs.js');
var db = require('../models')('test', false);

describe('Array', function() {
	before(function(done) {
		db.sequelize.sync({
			force : true
		}).success(function() {
			done();
		});
	});

	it('test', function() {
		assert(true);
	});
});
