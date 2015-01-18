/*jslint node: true */
"use strict";

var utils = require('../utils.js');

var fs = require('fs');
var os = require('os');
var path = require('path');
var exec = require('child_process').exec;

module.exports = function(task) {

	var _self = this;
	var _task = task;
	var _tempFolder = path.join(os.tmpdir(), "" + new Date().getTime());
	var _log;

	this.getName = function() { return "git"; };
	this.getAction = function() { return _task.getAction(); };

	this.supportedActions = function() { return ['default', 'checkout']; };
	this.mandatoryParams = function() { return ['destination', 'repository']; };
	this.optionalParams = function() { return ['branch', 'revision', 'user', 'group', 'gitUser', 'gitPassword']; };

	this.getRunList = function(data, log) {

		_log = log;

		return [
			_self.getDestFolderTask(),
			_self.getUpdateDestFolderPermissionsTask(),
			_self.getCreateTempFolderTask(),
			_self.getGitCloneTask(),
			_self.getGitCheckoutTask(),
			_self.getGitCleanupTask(),
			_self.getRSyncTask(),
			_self.getTempFolderCleanupTask()
		];
	};

	this.getConstraints = function() {
		return {
			repository: { presence:true, format: /^https?:\/\/.+/ },
			revision: { format: /^([a-f0-9]{2}){20}$/i },
		};
	};

	this.validate = function() {

		return null;
	};

	this.getDestFolderTask = function() {

		return function(callback) {

			var stats;

			// if the folder doesn't exist, let's just create it
			try {
		    stats = fs.lstatSync(_task.getParam('destination'));
			} catch (e) {
				fs.mkdirSync(_task.getParam('destination'));
				_log.info("Destination folder ("+_task.getParam('destination') +") didn't exist and has been created");
	      return callback();
			}

			// the folder exists already and it's a directory
			if(stats.isDirectory()) {
				_log.info("Destination folder ("+_task.getParam('destination') +") already exists");
				return callback();
			}

			// the folder exists but it's not a folder
			try {
				fs.unlinkSync(_task.getParam('destination'));
				fs.mkdirSync(_task.getParam('destination'));
			} catch(e) {
				return callback(new Error("Unable to create folder " + _task.getParam('destination') + " because: " + e));
			}

			return callback();
		};

	};

	this.getCreateTempFolderTask = function() {

		return function(callback) {

			_log.info("Creating temp folder: " + _tempFolder);

			try {
				fs.mkdirSync(_tempFolder);
			} catch(e) {
				return callback(new Error("Unable to create temp folder " + _tempFolder + " because: " + e));
			}

			return callback();
		};

	};

	this.getUpdateDestFolderPermissionsTask = function() {

		return function(callback) {
			
			var target;

			if(_task.getParam('user') && !_task.getParam('group'))
				target = _task.getParam('user');
			else if(_task.getParam('user') && _task.getParam('group'))
				target = _task.getParam('user') + ":" + _task.getParam('group');

			var cmd = "chown " + target + " " + _task.getParam('path');

			if(!cmd)
				return callback();
			
			exec(cmd, function (error, stdout, stderr) {

				if(error)
					callback(new Error("Unable to chown folder: " + _task.getParam('destination') + " :" + error));

				_log.info("Chown destination folder '" + _task.getParam('path') + " to " + target + ": done");

				callback();

			});

		};
		
	};

	this.getGitCloneTask = function() {

		var url = _task.getParam('repository');

		// if we have basic auth in place, let's update the URL using regexes
		if(_task.getParam('gitUser') && _task.getParam('gitPassword')) {
			var matchList = /^(https?:\/\/)(.+)/.exec(url);
			url = matchList[1] + _task.getParam('gitUser') + ":" + _task.getParam('gitPassword') + "@" + matchList[2];
		}

		_log.info("Cloning from: '" + url + "' into '" + _tempFolder + "'");
		return utils.command("git clone " + url + " " + _tempFolder, _log);
	};

	this.getGitCheckoutTask = function() {

		if(_task.getParam('branch')) {
			//_log.info("Checking out branch: '" + _task.getParam('branch') + "'");
			return utils.command("git checkout " + _task.getParam('branch') + " " + _tempFolder, _log, null, _tempFolder);
		}

		if(_task.getParam('revision')) {
			//_log.info("Checking out revision: '" + _task.getParam('revision') + "'");
			return utils.command("git checkout " + _task.getParam('revision') + " " + _tempFolder, _log, null, _tempFolder);
		}

		// we return a nothing to do function
		return function(callback) {
			callback();
		};
		
	};

	this.getGitCleanupTask = function() {
		//_log.info("Removing .git folder");
		return utils.command("rm -fr " + _tempFolder + "/.git*", _log);
	};

	this.getRSyncTask = function() {
		//_log.info("Syncing dest folder: " + _task.getParam('destination'));

		var sudoString = "";

		if(_task.getParam('user'))
			sudoString += " -u " + _task.getParam('user');

		if(_task.getParam('group')) 
			sudoString += " -g " + _task.getParam('group');

		if(sudoString !== "")
			return utils.command("sudo "+sudoString+" rsync -zr " + _tempFolder + "/ " + _task.getParam('destination'), _log);
		else
			return utils.command("rsync -zr " + _tempFolder + "/ " + _task.getParam('destination'), _log);

	};

	this.getTempFolderCleanupTask = function() {
		//_log.info("Removing temp folder: " + _tempFolder);
		return utils.command("rm -fr " + _tempFolder, _log);
	};

};