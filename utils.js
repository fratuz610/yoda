/*jslint node: true */
"use strict";

var request = require('request');
var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');

module.exports.command = function(commandLine, log, commandEnv, cwd) {

	return function(callback){

		// we set the prefix in log
		//log.setPrefix(commandLine + ": ");
		log.info("Running '"+commandLine+"'...");

		// we setup the environment if needed
		var mergedEnv = module.exports.mergeObj(process.env, commandEnv);

		var options = {env:null};

		if(commandEnv)
			options.env = mergedEnv;

		if(cwd)
			options.cwd = cwd;

		//we run the command
		exec(commandLine + " 2>&1", options, function(error, stdout, stderr) {
				
			console.log("Command complated " +error + " / " + stdout.toString().trim());
			
			if(error)
				return callback(new Error("Command failed with error: " + error + " output: " + stdout.toString().trim()));

			if(stdout.toString().trim().length > 0) {

				var logList = stdout.toString().split('\n');

				logList.forEach(function(item) {
					if(item.trim().length > 0)
						log.info("** " + item.trim());
				});

			}

			// nothing to report
			callback();

		});
	};

};

module.exports.getSetLogPrefixTask = function(log, name) {
	return function(callback) {
		log.setPrefix(name + ": ");
		callback();
	};
};

module.exports.numberToPercent = function(number) { return parseInt(number * 100) + "%"; };

module.exports.nowSec = function() { return parseInt(new Date().getTime()/1000); };

module.exports.twoDecimals = function(value) { return module.exports.nDecimals(value,2); };

module.exports.nDecimals = function(value, n) {
	return Math[value < 0 ? 'ceil' : 'floor'](value*10*n)/(10*n);
};

module.exports.sendEmail = function(conf, toList, subject, body, callback) {

	var apiURL = "https://api.mailgun.net/v2/"+ conf.notification.email.domain + "/messages";
	var options = {
		"form": {
			"to": toList.join(","),
			"from" : conf.notification.email.from,
			"text" : body,
			"subject" : subject
		}
	};
	
	request.post(apiURL, options,     
	    function (error, response, body) {

	    	if (error !== null)
	    		return callback(error);
	      
        if (response.statusCode > 300)
          return callback(new Error("Unable to send notification email response code: " + response.statusCode + " body: '" + body + "'"));
        
        callback(null, JSON.parse(body));
	    }
	).auth("api", conf.notification.email.apiKey);
};


module.exports.mergeObj = function(obj1, obj2) {
	var obj3 = {};
  for (var attrname in obj1)
  	obj3[attrname] = obj1[attrname];
  for (attrname in obj2)
  	obj3[attrname] = obj2[attrname];
  return obj3;
};

module.exports.mergeRecursive = function(obj1, obj2) {
	for (var p in obj2) {

		if(!obj2.hasOwnProperty(p))
			continue;

    try {
      // Property in destination object set; update its value.
      if ( obj2[p].constructor==Object ) {
        obj1[p] = module.exports.mergeRecursive(obj1[p], obj2[p]);
      } else {
        obj1[p] = obj2[p];

      }

    } catch(e) {
      // Property in destination object not set; create it and set its value.
      obj1[p] = obj2[p];

    }
  }

  return obj1;
};

module.exports.uppercaseToCamelCase = function(str) {
	
	str = str.replace("-", "_");

	return str.split('_').map(function(x,i){

    return (i>0?x[0].toUpperCase():x[0].toLowerCase()) + x.slice(1).toLowerCase();

	}).join('');
};


module.exports.deleteFolder = function(startFolder) {

	fs.readdirSync(startFolder).forEach(function(fileName) {
      
      var currentFile = startFolder + path.sep + fileName;

      //console.log("Analyzying file/folder: " + currentFile);

      // if this is a file let's delete it
      var pathStat = fs.statSync(currentFile);

      if(pathStat.isDirectory())
      	return module.exports.deleteFolder(currentFile);

      // if this is a file let's delete it
      fs.unlinkSync(currentFile);
  });

	// we then delete the current folder
	fs.rmdirSync(startFolder);
};

module.exports.httpError = function(httpCode, msg) {
	var error = new Error(msg);
	error.httpCode = httpCode;
	return error;
};