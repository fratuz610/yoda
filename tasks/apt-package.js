/*jslint node: true */
"use strict";

var utils = require('../utils.js');

module.exports = function(task) {

	var _self = this;
	var _task = task;

	this.getName = function() { return "apt-package"; };
	this.getAction = function() { return _task.getAction(); };

	this.supportedActions = function() { return ['default', 'install', 'upgrade', 'remove', 'purge']; };
	this.mandatoryParams = function() { return ['packageList']; };
	this.optionalParams = function() { return []; };

	this.getRunList = function(data, log) {

		var actionList = [];
		
		var env = { "DEBIAN_FRONTEND": "noninteractive" };

		switch(_task.getAction()) {

			case 'default':	
			case 'install': actionList.push(utils.command("apt-get -q -y install " + _task.getParam("packageList").join(" "), log, env)); break;

			case 'upgrade': actionList.push(utils.command("apt-get -q -y upgrade " + _task.getParam("packageList").join(" "), log, env)); break;

			case 'remove': actionList.push(utils.command("apt-get -q -y remove " + _task.getParam("packageList").join(" "), log, env)); break;

			case 'purge': actionList.push(utils.command("apt-get -q -y --purge remove " + _task.getParam("packageList").join(" "), log, env)); break;

			default: 
				throw new Error("Unrecognized action '" + _task.getAction() + "'");
		}

		return actionList;
	};

	this.validate = function() {

		if(!(_task.getParam("packageList") instanceof Array))
			return new Error("packageList is not an array: " + typeof _task.getParam("packageList") + " => " + JSON.stringify(_task.getParam("packageList")));
		
		return null;
	};


};