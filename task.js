/*jslint node: true */
"use strict";

module.exports = function(srcObj) {

	var _self = this;

	if(!srcObj || !srcObj.name)
		throw new Error("Task: must include a name: " + JSON.stringify(srcObj) + " passed");

	var _name = srcObj.name;
	var _action = srcObj.action?srcObj.action:'default';

	var _optionalParams = {};

	for(var key in srcObj) {
		if(key == "name" || key == "action")
			continue;
		_optionalParams[key] = srcObj[key];
	}

	this.getName = function() { return _name; };
	this.getAction = function() { return _action; };
	this.getParam = function(name) { return _optionalParams[name]?_optionalParams[name]:null; };

};