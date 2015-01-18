#!/usr/bin/env node

/*jslint node: true */
"use strict";

// make sure we are running from the local folder
process.chdir(__dirname);

var yaml = require('js-yaml');
var fs   = require('fs');
var async = require('async');

var Log = require('./log.js');
var Task = require('./task.js');

var Identify = require('./tasks/internal/identify.js');
var DownloadFromGit = require('./tasks/internal/downloadFromGit.js');
var DownloadFromZip = require('./tasks/internal/downloadFromZip.js');

var PhoneHome = require('./tasks/internal/phoneHome.js');
var Cleanup = require('./tasks/internal/cleanup.js');
var Provision = require('./tasks/internal/provision.js');

var argv = require('yargs')
    .demand(2)
    .usage('Usage: yoda git <gitURL> or yoda zip <zipURL>')
    .alias('b', 'branch')
    .describe('b', 'GIT branch or commit hash')
    .alias('f', 'folder')
    .describe('f', 'The folder containing the selected taskList in the repo')
    .describe('yoda', 'Additional command line parameters (take precedence over file based data)')
    .argv;

var taskList =[];

// we create our instance of the log
var log = new Log();
var data = {};

// the identify task runs first
taskList = taskList.concat(new Identify(log, data));

// the sourceURL is always the same argument
data.sourceURL = argv._[1];

// we initialize the temp folder list
data.tempFolderList = [];

// if we have additional parameters, let's store them
if(argv.yoda)
	data.cmdlineData = argv.yoda;

// the optional params 
if(argv.b) data.sourceBranch = argv.b;
if(argv.f) data.sourceFolder = argv.f;

switch(argv._[0].toLowerCase()) {
	case 'git': 
		taskList = taskList.concat(new DownloadFromGit(log, data));
		break;
	case 'zip':
		taskList = taskList.concat(new DownloadFromZip(log, data));
		break;

	default: 
		console.log(argv.help());
		process.exit(1);
}

taskList = taskList.concat(new Provision(log, data));

console.log("yoda: setup complete and jobs kicking off");

async.series(

	taskList,

	function(err, results){

    if(err) {
    	// we add to the log
    	log.error("yoda: Fatal ERROR: " + err);
    	return;
    }

    var finalTaskList = [];
    finalTaskList = finalTaskList.concat(new Cleanup(log, data));
    finalTaskList = finalTaskList.concat(new PhoneHome(log, data));

    // we phone home (no matter what happened)
    async.series(
    	
    	finalTaskList,
			
			function(err, results) {

				if(err)
					return console.error("Error phoning home: " + err);
			
				return console.log('yoda: all done');
			}
		);

});

