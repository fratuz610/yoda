/*jslint node: true */
"use strict";

var utils = require('../../utils.js');
var yaml = require('js-yaml');

var fs = require('fs');
var os = require('os');
var path = require('path');
var exec = require('child_process').exec;

var async = require('async');

var AptPackage = require('../../tasks/apt-package.js');
var Directory = require('../../tasks/directory.js');
var File = require('../../tasks/file.js');
var Git = require('../../tasks/git.js');
var Script = require('../../tasks/script.js');
var Symlink = require('../../tasks/symlink.js');
var Template = require('../../tasks/template.js');
var User = require('../../tasks/user.js');
var RemoteFile = require('../../tasks/remote-file.js');

var Task = require('../../task.js');

module.exports = function(log, data) {

	// uses _data.taskListFolder
	var _data = data;
	var _log = log;
	var _yodaDoc;
	var _runList;

	this.getLoadGlobalDataTask = function() {

		return function(callback) {

			var globalDoc;
			var globalBytes;

			// we try and load global.yaml
			try {
			  globalBytes = fs.readFileSync(path.join(_data.taskListFolder, 'global.yaml'), 'utf8');
			} catch (e) {
				_log.info("No global.yaml found, skipping");
			  return callback();
			}

			// we try and parse global.yaml
			try {
			  globalDoc = yaml.safeLoad(globalBytes);
			} catch (e) {
			  return callback(new Error("Unable to parse yaml file " + path.join(_data.taskListFolder, 'global.yaml') + " because: " + e));
			}

			_data = utils.mergeRecursive(_data, globalDoc);

			callback();
		};
	};

	this.getUpdateTaskFolderTask = function() {

		return function(callback) {
			if(_data.sourceFolder) {
				_data.taskListFolder = path.join(_data.taskListFolder, _data.sourceFolder);
				_log.info("Updating taskListFolder to '" + _data.taskListFolder + "'");
			}
			
			callback();
		};
	};

	this.getLoadLocalDataTask = function() {

		return function(callback) {

			var localDoc;
			var localBytes;

			// we try and load data.yaml
			try {
			  localBytes = fs.readFileSync(path.join(_data.taskListFolder, 'data.yaml'), 'utf8');
			} catch (e) {
				_log.info("No data.yaml found, skipping");
			  return callback();
			}

			// we try and parse data.yaml
			try {
			  localDoc = yaml.safeLoad(localBytes);
			} catch (e) {
			  return callback(new Error("Unable to parse yaml file " + path.join(_data.taskListFolder, 'data.yaml') + " because: " + e));
			}

			_data = utils.mergeRecursive(_data, localDoc);

			return callback();
		};
	};

	this.getLoadYamlTask = function() {

		return function(callback) {

			// Get document, or throw exception on error
			try {
			  _yodaDoc = yaml.safeLoad(fs.readFileSync(path.join(_data.taskListFolder, 'yoda.yaml'), 'utf8'));
			} catch (e) {
			  return callback(new Error("Unable to read yaml file " + path.join(_data.taskListFolder, 'yoda.yaml') + " because: " + e));
			}

			if(!_yodaDoc.taskList || !(_yodaDoc.taskList instanceof Array))
				return callback(new Error("No taskList in the yaml file:" + JSON.stringify(_yodaDoc.taskList)));

			_log.info("Tasklist loaded: " + _yodaDoc.taskList.length + " items");

			return callback();
		};

	};

	this.getReadCmdParamsTask = function() {

		return function(callback) {

			if(_data.cmdlineData) {
				_log.info("Injecting command line additional parameters");
				_data = utils.mergeRecursive(_data, _data.cmdlineData);
			}

			if(!_data.phoneHome)
				_log.warning("No phoneHome information supplied, logging information will be saved locally");
			else
				_log.info("PhoneHome data supplied, all logging information will be sent to " + _data.phoneHome.to);

			return callback();
		};

	};

	this.getCreateTaskListTask = function() {
		
		return function(callback) {

			var taskList = [];

			var lastError;

			_yodaDoc.taskList.forEach(function(item) {

				// this is one object with 1 key only
				for(var name in item) {

					// we add back a reference to the name
					item[name].name = name;

					var task = new Task(item[name]);

					switch(name.toLowerCase()) {
						case 'apt_package': 
						case 'apt-package': taskList.push(new AptPackage(task)); break;
						case 'directory': taskList.push(new Directory(task)); break;
						case 'file': taskList.push(new File(task)); break;
						case 'git': taskList.push(new Git(task)); break;
						case 'script': taskList.push(new Script(task)); break;
						case 'symlink': taskList.push(new Symlink(task)); break;
						case 'template': taskList.push(new Template(task)); break;
						case 'user': taskList.push(new User(task)); break;
						case 'remote_file': 
						case 'remote-file': taskList.push(new RemoteFile(task)); break;
						default: lastError = new Error("Unrecognized task: " + name);
					}

					break;
				}

			});

			if(lastError)
				 return callback(lastError);

			// the run list contains all callbacks
			_runList = [];

			// we validate each task + create the final run list
			taskList.forEach(function(item) {
				var errorStr = item.validate();

				if(item.validate()) {
					lastError = new Error("ERROR: task can't run: " + item.validate().message);
					return;
				}
				
				var localTaskList = item.getRunList(_data, _log);

				// we set the log prefix before each execution
				localTaskList.unshift(function(callback) {
					_log.setPrefix(item.getName() + ": ");
					_log.info("Action: " + item.getAction());
					callback();
				});

				_runList = _runList.concat(localTaskList);

			});

			if(lastError)
				 return callback(lastError);

			_log.info("provision: Run list has " + _runList.length + " small tasks to run");

			return callback();
		};

	};

	this.getRunTaskListTask = function() {
			
		return function(callback) {

			_log.info("Kicking off tasks");

			// we change the cwd to where the yaml file is
			process.chdir(_data.taskListFolder);

			async.series(

				_runList,

				function(err, results){

			    if(err)
			    	return callback(new Error("TaskList error: " + err.stack));

			    _log.info("All tasks completed successfully");

			    return callback();
			});

		};
		
	};

	return [
		utils.getSetLogPrefixTask(_log, 'provision'),
		this.getLoadGlobalDataTask(),
		this.getUpdateTaskFolderTask(),
		this.getLoadLocalDataTask(),
		this.getLoadYamlTask(),
		this.getReadCmdParamsTask(),
		this.getCreateTaskListTask(), 
		this.getRunTaskListTask()
	];

};