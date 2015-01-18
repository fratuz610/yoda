/*jslint node: true */
"use strict";

var utils = require('../../utils.js');

var request = require('request');
var os = require('os');

var awsIdentityURL = 'http://169.254.169.254/latest/meta-data/instance-id';

module.exports = function(log, data) {

	var _data = data;
	var _log = log;

	this.getRecordStartTimeTask = function() {

		return function(callback) {
			_log.info("Starting at " + new Date());
			return callback();
		};
	};

	this.getIdentityTask = function() {

		return function(callback) {

			request({url:awsIdentityURL, timeout:5000}, function (error, response, body) {

			  if (!error && response.statusCode == 200) {
			  	_log.info("InstanceId: " + body);
			  	_data.instanceId = body;
			  	return callback();
			  }
			  
			  _log.info("InstanceId: " + os.hostname());
			  _data.instanceId = os.hostname();
			  return callback();
			});

		};

	};

	this.getLocalIpsTask = function() {

		return function(callback) {

			var ifaces = os.networkInterfaces();

			_data.localIps = [];

			Object.keys(ifaces).forEach(function (ifname) {
			  
			  ifaces[ifname].forEach(function (iface) {
			    if ('IPv4' !== iface.family || iface.internal !== false) {
			      // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
			      return;
			    }

			    _data.localIps.push(ifname + " : " + iface.address);
			    _log.info("Local Interface: " + ifname + " -> " + iface.address);

			  });
			});

			return callback();
		};

	};

	return [
		utils.getSetLogPrefixTask(_log, 'identify'),
		this.getRecordStartTimeTask(),
		this.getIdentityTask(), 
		this.getLocalIpsTask()
	];

};