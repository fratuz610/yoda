/*jslint node: true */
"use strict";

var utils = require('../../utils.js');

var fs = require('fs');
var os = require('os');
var path = require('path');
var exec = require('child_process').exec;

module.exports = function(log, data) {

	// uses _data.sourceURL
	var _data = data;
	var _log = log;
	var _tempFolder = path.join(os.tmpdir(), "git-" + new Date().getTime());

	this.getCreateTempFolderTask = function() {

		return function(callback) {

			_log.info("Creating temp folder: " + _tempFolder);

			try {
				fs.mkdirSync(_tempFolder);
			} catch(e) {
				return callback(new Error("Unable to create temp folder " + _tempFolder + " because: " + e));
			}

			// we set the task list folder to the folder we just created
			_data.taskListFolder = _tempFolder;

			return callback();
		};

	};

	this.getGitCloneTask = function() {
		//_log.info("Cloning from: '" + _data.sourceURL + "' into '" + _tempFolder + "'");
		return utils.command("git clone " + _data.sourceURL + " " + _tempFolder, _log);
	};

	this.getGitCheckoutTask = function() {

		if(_data.branch) {
			//_log.info("Checking out branch/revision: '" + _data.branch + "'");
			return utils.command("git checkout " + _data.branch + " " + _tempFolder, _log, null, _tempFolder);
		}

		// we return a nothing to do function
		return function(callback) {
			callback();
		};
		
	};

	return [
		utils.getSetLogPrefixTask(_log, 'downloadFromGit'), 
		this.getCreateTempFolderTask(), 
		this.getGitCloneTask(), 
		this.getGitCheckoutTask()
	];

};