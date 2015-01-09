/*jslint node: true */
"use strict";

var utils = require('../utils.js');
var fs = require('fs');
var passwd = require('etc-passwd');

module.exports = function(task) {

	var _self = this;
	var _task = task;
	var _data;
	var _log;
	var _userPresent = false;
	var _groupPresent = false;

	this.getName = function() { return "user"; };
	this.getAction = function() { return _task.getAction(); };
	this.supportedActions = function() { return ['default', 'create', 'delete', 'modify']; };
	this.mandatoryParams = function() { return ['username']; };
	this.optionalParams = function() { return ['comment', 'group', 'home', 'shell']; };

	this.getRunList = function(data, log) {

		_data = data;
		_log = log;

		var taskList = [
			_self.getCheckUserExistanceTask(),
			_self.getCheckGroupExistanceTask()
		];

		switch(_task.getAction()) {

			case 'default':	
			case 'create':
			case 'modify': 
				taskList.push(_self.getCreateGroupTask());
				taskList.push(_self.getCreateModifyUserTask());
				break;
			case 'delete': 
				taskList.push(_self.getDeleteUserTask());
				break;
			default: 
				throw new Error("Unrecognized action '" + _task.getAction() + "'");
		}

		return taskList;

	};

	this.validate = function() {

		if(_task.getParam('username') && !/^[a-z_][a-z0-9_\.]{0,60}$/.test(_task.getParam('username')))
			return new Error("Invalid user name: '" + _task.getParam('username') + "' please enter a valid linux user name");

		if(_task.getParam('group') && !/^[a-z_][a-z0-9_\.]{0,60}$/.test(_task.getParam('group')))
			return new Error("Invalid group name: '" + _task.getParam('group') + "' please enter a valid linux group name");

		if(_task.getParam('comment') && !/^[\w\s-\.]{1,50}$$/.test(_task.getParam('comment')))
			return new Error("Invalid comment: '" + _task.getParam('comment') + "' only letters, numbers, underscore and space are allowed");

		return null;
	};

	this.getCheckUserExistanceTask = function() {

		return function(callback) {

			passwd.getUsers()
				.on('user', function(user) {
					if(user.username === _task.getParam('username')) {
						_log.info("User '" + _task.getParam('username') + " is already present on the system");
						_userPresent = true;
					}
				})
				.on('end', function() {
					callback();
				});
		};
	};

	this.getCheckGroupExistanceTask = function() {

		return function(callback) {

			// no group specified
			if(!_task.getParam('group'))
				return callback();

			passwd.getGroups()
				.on('group', function(group) {
					if(group.groupname === _task.getParam('group')) {
						_log.info("Group '" + _task.getParam('group') + " is already present on the system");
						_groupPresent = true;
					}
				})
				.on('end', function() {
					callback();
				});
		};
	};

	this.getCreateModifyUserTask = function() {

		return function(callback) {

			var userCommand;

			var taskAction = _task.getAction();

			// the default action is create
			if(taskAction === 'default')
				taskAction = 'create';

			// if a user is already present and the action is 'create' let's switch to 'modify'
			if(_userPresent && taskAction === 'create')
				taskAction = 'modify';

			if(taskAction === "create")
				userCommand = "useradd " + _task.getParam('username');
			else if(taskAction === "modify")
				userCommand = "usermod " + _task.getParam('username');
			else 
				return callback("Unrecognized action: " + taskAction);

			if(_task.getParam('comment'))
				userCommand += " -c \"" + _task.getParam('comment') + "\"";

			if(_task.getParam('group'))
				userCommand += " -g " + _task.getParam('group');

			if(_task.getParam('home')) {

				try {
					var homeFolderStats = fs.statSync(_task.getParam('home'));

					if(!homeFolderStats.isDirectory())
						return callback(new Error("Home folder " + _task.getParam('home') + " exists and is not a directory"));

					// the home folder exists and is a directory
				} catch(err) {
					// the home folder doesn't exist
					userCommand += " -d " + _task.getParam('home') + " -m ";	
				}

			}

			if(_task.getParam('shell'))
				userCommand += " -s " + _task.getParam('shell');

			utils.command(userCommand, _log)(function(err) {

				if(err)
					return callback(err);

				callback();
			});
		};

		
	};

	this.getCreateGroupTask = function() {

		return function(callback) {

			// if no group has been specified
			if(!_task.getParam('group') || _groupPresent)
				return callback();

			// the group doesn't exist, let's create it
			utils.command("groupadd " + _task.getParam('group'), _log)(function(err) {
				if(err)
					return callback(err);

				return callback();
			});
			
		};

	};

	this.getDeleteUserTask = function() {

		return function(callback) {

			if(_task.getAction() !== "delete")
				return callback();

			utils.command("userdel " + _task.getParam('username'), _log)(function(err) {

				if(err)
					return callback(err);

				callback();
			});
		};

	};

};