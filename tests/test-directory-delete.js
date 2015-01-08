/*jslint node: true */
"use strict";

var conf = require('./config.js');
var Log = require('./log.js');
var AptPackage = require('./resources/apt-package.js');
var Directory = require('./resources/directory.js');
var Task = require('./task.js');
var async = require('async');
var fs = require('fs');

console.log("yoda: Starting up");

// we create our instance of the log
var log = new Log();
var data = {};

// we instanciate one instance of apt-package command

//var aptPackage = new AptPackage(new Task({"name": "apt-package", "package_list": ["nginx"]}));

var task = new Directory(new Task(
		{
			"name": "directory", 
			"action": "delete",
			"path": "/tmp/test-folder",
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