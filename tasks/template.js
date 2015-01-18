/*jslint node: true */
"use strict";

var utils = require('../utils.js');
var fs = require('fs');
var exec = require('child_process').exec;
var Mustache = require('mustache');

module.exports = function(task) {

	var _self = this;
	var _task = task;
	var _data;
	var _log;

	this.getName = function() { return "template"; };
	this.getAction = function() { return _task.getAction(); };
	this.supportedActions = function() { return ['default']; };
	this.mandatoryParams = function() { return ['path', 'source']; };
	this.optionalParams = function() { return ['variables', 'mode', 'user', 'group']; };

	this.getRunList = function(data, log) {

		_data = data;
		_log = log;

		var actionList = [];

		// only one default action here
		actionList.push(_self._template);

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

	this._template = function(callback) {

		// we load the template file
		var templateContent; 
		try {
			templateContent = fs.readFileSync(_task.getParam('source'), {encoding: "UTF-8"});
		} catch(err) {
			return callback(new Error("Error loading template file: '" + _task.getParam('source') + "': " + err));
		}

		// we merge the global data with the local variables if any
		var finalData = _task.getParam('variables')?utils.mergeObj(_task.getParam('variables'), _data):_data;

		// we run the template with a combination of data + variables
		var output = Mustache.render(templateContent, finalData);

		// we output the content to the file (updating it or creating it)
		try {
			fs.writeFileSync(_task.getParam('path'), output);
		} catch(err) {
			return callback(new Error("Error writing dest file: '" + _task.getParam('path') + "': " + err));
		}

		_log.info("File " + _task.getParam('path') + " created/updated from template " + _task.getParam('source') + ": " + output.length + " bytes");
		
		// all good
		callback();
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