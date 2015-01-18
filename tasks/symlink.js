/*jslint node: true */
"use strict";

var utils = require('../utils.js');
var fs = require('fs');
var exec = require('child_process').exec;

module.exports = function(task) {

	var _self = this;
	var _task = task;
	var _data;
	var _log;

	this.getName = function() { return "symlink"; };
	this.getAction = function() { return _task.getAction(); };
	this.supportedActions = function() { return ['default', 'create', 'remove']; };
	this.mandatoryParams = function() { return ['source', 'dest']; };
	this.optionalParams = function() { return ['mode', 'user', 'group']; };

	this.getRunList = function(data, log) {

		_data = data;
		_log = log;

		var actionList = [];

		switch(_task.getAction()) {

			case 'default':	
			case 'create': actionList.push(_self._createSymlink); break;

			default: 
				throw new Error("Unrecognized action '" + _task.getAction() + "'");
		}

		if(_task.getParam('user'))
			actionList.push(_self._chown);
	
		if(_task.getParam('mode'))
			actionList.push(_self._chmod);

		return actionList;
	};

	this.validate = function() {

		if(_task.getParam('mode') && typeof _task.getParam('mode') !== "string")
			return new Error("Invalid file mode '" + _task.getParam('mode') + "' only string values are allowed");

		if(_task.getParam('mode') && !/^[0124]?[0-7]{3}$/.test(_task.getParam('mode')))
			return new Error("Invalid file mode '" + _task.getParam('mode') + "' please enter values like 755 or 0666 etc");

		if(!_task.getParam('user') && _task.getParam('group'))
			return new Error("Invalid chown request: group passed '" + _task.getParam('group') + "' but no user name");

		return null;
	};

	this._createSymlink = function(callback) {

		// we check if dest exists and/or is a link
		try {
			var stats = fs.lstatSync(_task.getParam('dest'));

			// if the file exists we try and delete it
			if(stats.isSymbolicLink())
				fs.unlinkSync(_task.getParam('dest'));

		} catch(err) {
			// the file does not exist or we can't delete it, let's move on
		}

		try {
			fs.symlinkSync(_task.getParam('source'), _task.getParam('dest'));
			_log.info("Created soft symlink from '" + _task.getParam('source') + "' to '" + _task.getParam('dest') + "'");
		} catch(err) {
			return callback(new Error("Unable to symlink " + _task.getParam('source') + " to " + _task.getParam('dest') + " : " + err));
		}

		callback();
	};

	this._chmod = function(callback) {
		
		if(_task.getParam('mode')) {
			try {
				fs.chmodSync(_task.getParam('path'), _task.getParam('mode'));

				_log.info("Chmod symlink '" + _task.getParam('path') + " to mode " + _task.getParam('mode') + ": done");

			} catch(err) {
				return callback(new Error("Unable to chmod file: " + _task.getParam('path') + " to mode: " + _task.getParam('mode') + ": " + err));
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
				callback(new Error("Unable to chown file: " + _task.getParam('path') + " :" + error));

			_log.info("Chown symlink '" + _task.getParam('path') + " to " + target + ": done");

			callback();
		});
	
	};



};