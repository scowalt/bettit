var Browser = require("zombie");
var assert = require("assert");
var vows = require('vows');
var db = require('../database/database.js');

db.changeDatabase('test');

vows.describe('Database tests').addBatch({});
