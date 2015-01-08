/*jslint node: true */
"use strict";

var conf = require('./config.js');
var moment = require('moment-timezone');
var request = require('request');

exports.sendNotification = function(emailSubject, emailBody) {

	console.log("notify: sending notification to " + conf.notification.email.toList.join(","));

	var apiURL = "https://api.mailgun.net/v2/"+ conf.notification.email.domain + "/messages";
	var options = {
		"form": {
			"to": conf.notification.email.toList.join(","),
			"from" : conf.notification.email.from,
			"text" : emailBody,
			"subject" : "Singtel Backend - " + conf.env.toUpperCase() + " - " + emailSubject
		}
	};
	
	request.post(apiURL, options,     
	    function (error, response, body) {

	    	if (error !== null) {
	    		console.error("Unable to send notification email " + error);
	            return;
	    	}

	        if (response.statusCode > 300) {
	            console.error("Unable to send notification email response code: " + response.statusCode + " body: '" + body + "'");
	            return;
	        } 

        	console.log("Notification email sent correctly: '" + body + "'");
	    }
	).auth("api", conf.notification.email.apiKey);

};