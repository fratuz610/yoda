/*jslint node: true */
"use strict";

var conf = require('./config.js');
var Log = require('./log.js');
var AptPackage = require('./resources/apt-package.js');
var User = require('./resources/user.js');
var Task = require('./task.js');
var async = require('async');
var fs = require('fs');

console.log("yoda: Starting up");

// we create our instance of the log
var log = new Log();
var data = {};

var task = new User(new Task(
		{
			"name": "user",
			"action": "remove",
			"username": "yoda"
		}));

var errorStr = task.validate();

if(task.validate())
	return console.error("ERROR: task can't run: " + task.validate().message);

async.series(

	task.getRunList(data, log),

	function(err, results){

    if(err)
    	return console.log("ERROR: " + err.stack);

    return console.log("ALL GOOD");
});

console.log("yoda: setup complete");