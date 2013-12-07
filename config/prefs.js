/**
 * Every user will start with this much money
 */
exports.default_money = 500;

/**
 * Default amount of money to bet
 * @type {number}
 */
exports.default_bet = 20;

/**
 * If true, tables will be dropped every server restart.
 * WARNING: DON'T SET THIS TO TRUE EVER
 */
exports.force_sync = false;

/**
 * Port the app will listen on 
 */
exports.port = 8080;

/**
 * Server url 
 */
exports.server_url = 'http://bettit.us';

/**
 * Logging
 */
exports.logging = {
	express : false,
	mysql : false,
	socket : 1
};