/*jslint node: true */
"use strict";

var conf = require('./config.js');
var Log = require('./log.js');
var AptPackage = require('./resources/apt-package.js');
var Template = require('./resources/template.js');
var Task = require('./task.js');
var async = require('async');
var fs = require('fs');

console.log("yoda: Starting up");

// we create our instance of the log
var log = new Log();
var data = {};

// we instanciate one instance of apt-package command

//var aptPackage = new AptPackage(new Task({"name": "apt-package", "package_list": ["nginx"]}));

var template = new Template(new Task(
		{
			"name": "template", 
			"source": "/tmp/test-mustache",
			"path": "/tmp/test-file-mustache",
			"variables": {
				"hello": "this is a title"
			},
			"user": "root",
			"group": "root",
			"mode": "0644"
		}));

var errorStr = template.validate();

if(template.validate())
	return console.error("ERROR: task can't run: " + template.validate().message);

async.series(

	template.getRunList(data, log),

	function(err, results){

    if(err)
    	return console.log("ERROR: " + err.stack);

    return console.log("ALL GOOD");
});

console.log("yoda: setup complete");