/*jslint node: true */
"use strict";

var utils = require('../../utils.js');

var fs = require('fs');
var path = require('path');
var os = require('os');
var request = require('request');
var unzip = require('unzip');

module.exports = function(log, data) {

	// uses _data.sourceURL
	var _data = data;
	var _log = log;
	var _tempFolder;
	
	this.getCreateTempFolderTask = function() {

		return function(callback) {
			_tempFolder = path.join(os.tmpdir(), "yoda-" + new Date().getTime());

			try {
				fs.mkdirSync(_tempFolder);
			} catch(e) {
				return callback(new Error("Unable to create temp folder " + _tempFolder + " because: " + e));
			}

			// we set the task list folder to the folder we just created
			_data.taskListFolder = _tempFolder;

			return callback();
		};
	};

	this.getDownloadZipTask = function() {

		return function(callback) {

			request
			  .get(_data.sourceURL)
			  .on('error', function(err) {
			    return callback(new Error("Unable to download " + _data.sourceURL + " because: " + err));
			  })
			  .on('end',function() {
			  	_log.info("Download complete");
			  	return callback();
			  })
			  .pipe(unzip.Extract({ path: _data.taskListFolder }));

			_log.info("Downloading & unzipping " + _data.sourceURL + " into " + _data.taskListFolder);

		};

	};

	return [
		utils.getSetLogPrefixTask(_log, 'downloadFromZip'),
		this.getCreateTempFolderTask(), 
		this.getDownloadZipTask()
		];

};