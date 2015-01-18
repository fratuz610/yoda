/*jslint node: true */
"use strict";

var utils = require('../../utils.js');
var nodemailer = require('nodemailer');
var validate = require("validate.js");

module.exports = function(log, data) {

	var _data = data;
	var _log = log;
	var _self = this;


	this.getRecordEndTimeTask = function() {

		return function(callback) {
			_log.info("Ending at " + new Date());
			return callback();
		};
	};

	// valid submission constraint
	var phoneHomeConstraints = {
		from: { presence:true, email: true},
		to: { presence:true},
		service: { presence:true, format: /^[\w-\._]+$/},
		user: { presence:true, length: {minimum:3}},
		pass: { presence:true, length: {minimum:3}}
	};

	this.getPhoneHomeTask = function() {

		return function(callback) {

			if(!_data.phoneHome) {
				_log.warning("No phoneHome data supplied, nothing to do");
				return callback();
			}

			var validationResults = validate(_data.phoneHome, phoneHomeConstraints, {flatten:true});

			if(validationResults)
				return callback(new Error("Unable to send phoneHome email because: " + validationResults.join(",")));

			var toList = _data.phoneHome.to.split(',');

			toList.forEach(function(item) {
				if(!_self.isValidEmailAddress(item))
					return callback(new Error("Unable to send phoneHome email because recipient email address " + item + " doesn't appear to be valid"));
			});

			// create reusable transporter object using SMTP transport
			var transporter = nodemailer.createTransport({
			    service: _data.phoneHome.service,
			    auth: {
			        user: _data.phoneHome.user,
			        pass: _data.phoneHome.pass
			    }
			});

			// setup e-mail data with unicode symbols
			var mailOptions = {
			    from: 'Yoda Provisioning Tool <'+_data.phoneHome.from+'>', // sender address
			    to: toList.join(','), // list of receivers
			    subject: 'Yoda run results for ' + _data.instanceId, // Subject line
			    text: _log.getLog() // plaintext body
			};

			// send mail with defined transport object
			transporter.sendMail(mailOptions, function(error, info){
				
			    if(error)
			        return callback(new Error("Unable to send phoneHome email because: " + error));

			    callback();
			});

		};
	};

	this.isValidEmailAddress = function(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
	};

	return [
		utils.getSetLogPrefixTask(_log, 'phoneHome'),
		this.getRecordEndTimeTask(),
		this.getPhoneHomeTask()
		];
};