#!/usr/bin/env node
var colors = require('colors');
var xxx = require('./xxx.js');

var x = new xxx('./utils/binder.js');
x.start(function(e, r){
	if ( e ){
		console.log( JSON.stringify(r).red );
	}
	else{
		console.log( JSON.stringify(r).green );
	}
});

process.on('uncaughtException', function (err) {
  var msg = ' Caught exception: ' + err.stack;
  console.error(msg.red);
});

