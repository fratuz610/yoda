/*jslint node: true */
"use strict";

var utils = require('../utils.js');
var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;

module.exports = function(task) {

	var _self = this;
	var _task = task;
	var _log;

	this.getName = function() { return "directory"; };
	this.getAction = function() { return _task.getAction(); };
	this.supportedActions = function() { return ['default', 'create', 'delete']; };
	this.mandatoryParams = function() { return ['path']; };
	this.optionalParams = function() { return ['group', 'mode', 'user', 'recursive']; };

	this.getRunList = function(data, log) {

		_log = log;

		var actionList = [];

		switch(_task.getAction()) {

			case 'default':	
			case 'create': 
				actionList.push(_self._safeCreateFolder); 

				if(_task.getParam('user'))
					actionList.push(_self._chown);
			
				if(_task.getParam('mode'))
					actionList.push(_self._chmod);
				break;
			case 'delete': actionList.push(_self._deleteFolder); break;

			default: 
				throw new Error("Unrecognized action '" + _task.getAction() + "'");
		}

		return actionList;
	};

	this.validate = function() {

		if(_task.getParam('mode') && typeof _task.getParam('mode') !== "string")
			return new Error("Invalid file mode '" + _task.getParam('mode') + "' only string values are allowed");

		if(_task.getParam('mode') && !/^[0124]?[0-7]{3}$/.test(_task.getParam('mode')))
			return new Error("Invalid file mode '" + _task.getParam('mode') + "' please enter values like 755 or 0666 etc");

		if(!_task.getParam('user') && _task.getParam('group'))
			return new Error("Invalid chown request: group passed '" + _task.getParam('group') + "' but no user name");

		if(_task.getParam('recursive') !== null && typeof _task.getParam('recursive') !== "boolean")
			return new Error("Invalid recursive flag '" + _task.getParam('recursive') + "' only boolean values are allowed");

		return null;
	};

	this._safeCreateFolder = function(callback) {

		try {
			var pathStat = fs.statSync(_task.getParam('path'));

			if(!pathStat.isDirectory())
				return callback(new Error("Path " + _task.getParam('path') + " already exists and is not a folder"));

			_log.info("Folder " + _task.getParam('path') + " exists already");
			// the folder exists already, all good
			return callback();

		} catch(err) {
			// the folder doesn't exist
		}

		try {
			fs.mkdirSync(_task.getParam('path'));

			_log.info("Folder " + _task.getParam('path') + " created");
		} catch(err) {
			return callback(new Error("Unable to create directory: " + _task.getParam('path') + " : " + err));
		}

		callback();
	};

	this._deleteFolder = function(callback) {

		try {
			utils.deleteFolder(_task.getParam('path'));
			_log.info("Folder " + _task.getParam('path') + " deleted");
		} catch(err) {
			return callback(new Error("Unable to delete directory: " + _task.getParam('path') + ": " + err));
		}
		
		callback();
	};

	this._chmod = function(callback) {
		
		if(_task.getParam('mode')) {
			try {
				fs.chmodSync(_task.getParam('path'), _task.getParam('mode'));

				_log.info("Chmod folder '" + _task.getParam('path') + " to mode " + _task.getParam('mode') + ": done");

			} catch(err) {
				return callback(new Error("Unable to chmod folder: " + _task.getParam('path') + " to mode: " + _task.getParam('mode') + ": " + err));
			}
		}

		callback();
	};

	this._chown = function(callback) {

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
				callback(new Error("Unable to chown folder: " + _task.getParam('path') + " :" + error));

			_log.info("Chown folder '" + _task.getParam('path') + " to " + target + ": done");

			callback();
		});
	
	};


};