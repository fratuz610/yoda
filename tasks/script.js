/*jslint node: true */
"use strict";

var utils = require('../utils.js');

var exec = require('child_process').exec;

module.exports = function(task) {

	var _self = this;
	var _task = task;

	this.getName = function() { return "script"; };
	this.getAction = function() { return _task.getAction(); };
	this.supportedActions = function() { return ['default', 'run']; };
	this.mandatoryParams = function() { return ['cmd']; };
	this.optionalParams = function() { return ['cwd', 'env', 'timeout', 'user', 'group']; };

	this.getRunList = function(data, log) {

		var actionList = new Array(1);

		var options = {
			env: _task.getParam('env')?_task.getParam('env'):{},
			cwd: _task.getParam('cwd')?_task.getParam('cwd'):process.cwd(),
			timeout: _task.getParam('timeout')?_task.getParam('timeout'):0,
			log: log
		};
		
		var cmd = _task.getParam('cmd');

		actionList[0] = _self.runScript(cmd, options);

		return actionList;
	};

	this.validate = function() {

		return null;
	};

	this.runScript = function(cmd, srcOptions) {

		var log = srcOptions.log;
		var env = srcOptions.env;
		var cwd = srcOptions.cwd;
		var timeout = srcOptions.timeout;
		
		return function(callback){

			// we set the prefix in log
			//log.setPrefix(commandLine + ": ");
			log.info("Running '"+cmd+"'...");

			// we setup the environment if needed
			var mergedEnv = utils.mergeObj(process.env, env);

			var options = {env:null};

			if(env) options.env = mergedEnv;
			if(timeout > 0) options.timeout = timeout;
			if(cwd !== null) options.cwd = cwd;

			//we run the command
			var childProcess = exec(cmd, options, function(error, stdout, stderr) {
				
				if(error)
					return callback(error);

				if(stderr.toString().length !== 0)
					return callback(new Error(cmd + " returned error '" + stderr.toString() + "'"));
				
				if(stdout.toString().trim().length > 0) {
					log.info("**************************************************");
					log.info(stdout.toString().split('\n'));
					log.info("**************************************************");
				}
				
				// nothing to report
				callback();
			});
		};

	};
};