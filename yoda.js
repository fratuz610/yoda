/*jslint node: true */
"use strict";

var yaml = require('js-yaml');
var fs   = require('fs');
var async = require('async');

var Log = require('./log.js');
var Task = require('./task.js');

var Identify = require('./tasks/internal/identify.js');
var DownloadFromGit = require('./tasks/internal/downloadFromGit.js');
var DownloadFromZip = require('./tasks/internal/downloadFromZip.js');

var PhoneHome = require('./tasks/internal/phoneHome.js');
var Provision = require('./tasks/internal/provision.js');

// usage node yoda git URL or node yoda zip URL

if(process.argv.length != 4)
	return console.log("Usage:\n\n\tyoda git <URL>\nOR\n\tyoda zip <URL>");

var taskList =[];

// we create our instance of the log
var log = new Log();
var data = {};

// the identify task runs first
taskList = taskList.concat(new Identify(log, data));

// the sourceURL is always the same argument
data.sourceURL = process.argv[3];

switch(process.argv[2].toLowerCase()) {
	case 'git': 
		
		if(process.argv[4]) 
			data.branch = process.argv[4];

		taskList = taskList.concat(new DownloadFromGit(log, data));
		break;

	case 'zip':
		taskList = taskList.concat(new DownloadFromZip(log, data));
		break;

	default:
		return console.log("Usage:\n\n\tyoda git <URL>\nOR\n\tyoda zip <URL>");

}

console.log("yoda: setup complete and jobs kicking off");

async.series(

	taskList,

	function(err, results){

    if(err) {
    	// we add to the log
    	log.error(err);
    	return;
    }

    // we phone home (no matter what happened)
    async.series(
			new PhoneHome(log, data),
			function(err, results) {
				if(err)
					return console.error("Error phoning home: " + err);
			
				return console.log('yoda: all done');
			}
		);

});

