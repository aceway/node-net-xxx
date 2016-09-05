'use strict';
var logger = require('../utils/logger.js');

//var handler = function () {
var handler = { };

handler.dataProcess = function(data){
	logger.trace('handler dataProcess data...');
};

//var core = new handler();
module.exports = handler;
