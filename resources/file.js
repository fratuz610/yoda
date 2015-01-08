/*jslint node: true */
"use strict";

var utils = require('../utils.js');
var fs = require('fs');
var exec = require('child_process').exec;

module.exports = function(task) {

	var _self = this;
	var _task = task;

	this.getName = function() { return "file"; };
	this.getAction = function() { return _task.getAction(); };

	this.supportedActions = function() { return ['default', 'create', 'delete', 'remove']; };
	this.mandatoryParams = function() { return ['path']; };
	this.optionalParams = function() { return ['content', 'group', 'mode', 'user']; };

	this.getRunList = function(data, log) {

		var actionList = [];

		switch(_task.getAction()) {

			case 'default':	
			case 'create': 
				actionList.push(_self._createFile); 
				if(_task.getParam('user'))
					actionList.push(_self._chown);
			
				if(_task.getParam('mode'))
					actionList.push(_self._chmod);
				break;

			case 'delete':
			case 'remove':
				actionList.push(_self._deleteFile); 
				break;

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

		return null;
	};

	this._createFile = function(callback) {

		if(_task.getParam('content') === null)
			return _self._touchFile(callback);

		try {
			// we try and do a file put contents
			fs.writeFileSync(_task.getParam('path'), _task.getParam('content'));
		} catch(err) {
			return callback(new Error("Unable to create file " + _task.getParam('path') + " : " + err));
		}
		
		callback();
	};

	this._deleteFile = function(callback) {

		try {
			fs.unlinkSync(_task.getParam('path'));
		} catch(err) {
			return callback();
		}
		
		callback();
	};

	this._touchFile = function(callback) {
		
		var mode = 'w';

		try {
			// if the file doesn't exist let's create it
			if(!fs.existsSync(_task.getParam('path')))
				fs.closeSync(fs.openSync(_task.getParam('path'), 'w'));
			else{
				var fd = fs.openSync(_task.getParam('path'), 'r+');
				fs.futimesSync(fd, new Date(), new Date());
				fs.closeSync(fd);
			}
		} catch(err) {
			return callback(new Error("Unable to touch file: " + _task.getParam('path') + " : " + err));
		}

		// all good
		callback();
	};

	this._chmod = function(callback) {
		
		if(_task.getParam('mode')) {
			try {
				fs.chmodSync(_task.getParam('path'), _task.getParam('mode'));
			} catch(err) {
				return callback(new Error("Unable to chmod file: " + _task.getParam('path') + " to mode: " + _task.getParam('mode') + ": " + err));
			}
		}

		callback();
	};

	this._chown = function(callback) {

		var cmd;

		if(_task.getParam('user') && !_task.getParam('group'))
			cmd = "chown " + _task.getParam('user') + " " + _task.getParam('path');
		else if(_task.getParam('user') && _task.getParam('group'))
			cmd = "chown " + _task.getParam('user') + ":" + _task.getParam('group') +" " + _task.getParam('path');

		if(!cmd)
			return callback();
		
		exec(cmd, function (error, stdout, stderr) {

			if(error)
				callback(new Error("Unable to chown file: " + _task.getParam('path') + " :" + error));

			callback();
		});
	
	};


};