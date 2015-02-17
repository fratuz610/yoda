/*jslint node: true */
"use strict";

var utils = require('../utils.js');
var fs = require('fs');
var exec = require('child_process').exec;
var request = require('request');

var validURLRegex = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/i;

module.exports = function(task) {

	var _self = this;
	var _task = task;
	var _log;

	this.getName = function() { return "remote-file"; };
	this.getAction = function() { return _task.getAction(); };

	this.supportedActions = function() { return ['default', 'create']; };
	this.mandatoryParams = function() { return ['source', 'path']; };
	this.optionalParams = function() { return ['group', 'mode', 'user', 'authUser', 'authPass']; };

	this.getRunList = function(data, log) {

		_log = log;

		var actionList = [];

		switch(_task.getAction()) {

			case 'default':	
			case 'create':
				actionList.push(_self._retrieveFile); 
				
				if(_task.getParam('user'))
					actionList.push(_self._chown);
			
				if(_task.getParam('mode'))
					actionList.push(_self._chmod);
				break;

			default: 
				throw new Error("Unrecognized action '" + _task.getAction() + "'");
		}

		return actionList;
	};

	this.validate = function() {

		if(_task.getParam('authUser') && typeof _task.getParam('authUser') !== "string")
			return new Error("Invalid authUser '" + _task.getParam('authUser') + "' only string values are allowed");

		if(_task.getParam('authPass') && typeof _task.getParam('authPass') !== "string")
			return new Error("Invalid authPass '" + _task.getParam('authPass') + "' only string values are allowed");

		if(_task.getParam('authPass') && !_task.getParam('authPass'))
			return new Error("authPass passed but no authUser");

		if(!_task.getParam('authPass') && _task.getParam('authPass'))
			return new Error("authUser passed but no authPass");

		if(!validURLRegex.test(_task.getParam('source')))
			return new Error("Invalid source: not a valid URL: " + _task.getParam('source'));

		if(_task.getParam('mode') && typeof _task.getParam('mode') !== "string")
			return new Error("Invalid file mode '" + _task.getParam('mode') + "' only string values are allowed");

		if(_task.getParam('mode') && !/^[0124]?[0-7]{3}$/.test(_task.getParam('mode')))
			return new Error("Invalid file mode '" + _task.getParam('mode') + "' please enter values like 755 or 0666 etc");

		if(!_task.getParam('user') && _task.getParam('group'))
			return new Error("Invalid chown request: group passed '" + _task.getParam('group') + "' but no user name");

		return null;
	};

	this._retrieveFile = function(callback) {

		var writeStream;

		try {
			writeStream = fs.createWriteStream(_task.getParam('path'));
		} catch(err) {
			return callback("Unable to open file '" + _task.getParam('path') + "' for writing: " + err);
		}

		var options = {
		    url: _task.getParam('source'),
		    headers: {
		        'User-Agent': 'yoda'
		    }
		};

		if(_task.getParam('authUser') && _task.getParam('authPass')) {
			options.user = _task.getParam('authUser');
			options.pass = _task.getParam('authPass');
			options.sendImmediately = true;
		}
			
		request(options)
				.on('response', function(response) {
			    _log.info("Status code: " + response.statusCode);
			    _log.info("Content type: " + response.headers['content-type']);
			  })
				.on('error', function(err) {
					callback(err);
				})
				.on('end', function() {
					callback();
				})
				.pipe(writeStream);

	};

	this._chmod = function(callback) {
		
		if(_task.getParam('mode')) {
			try {
				fs.chmodSync(_task.getParam('path'), _task.getParam('mode'));

				_log.info("Chmod file '" + _task.getParam('path') + " to mode " + _task.getParam('mode') + ": done");

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

			_log.info("Chown file '" + _task.getParam('path') + " to " + target + ": done");

			callback();
		});
	
	};


};