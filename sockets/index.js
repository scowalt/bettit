var ready = require(__dirname + '/ready');
var addEvent = require(__dirname + '/addEvent');
var bet = require(__dirname + '/bet');
var close = require(__dirname + '/closeLock').close;
var lock = require(__dirname + '/closeLock').lock;

module.exports = {
	addEvent : addEvent,
	bet : bet,
	close : close,
	lock : lock,
	ready : ready
};