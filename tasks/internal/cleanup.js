/*jslint node: true */
"use strict";

var utils = require('../../utils.js');

module.exports = function(log, data) {

	var _data = data;
	var _log = log;

	this.getDeleteTempFolders = function() {
		return function(callback) {

			if(!_data.tempFolderList || _data.tempFolderList.length === 0)
				return callback();


			// we add to the temp folder list
			_data.tempFolderList.forEach(function(tempFolder) {

				_log.info("Deleting temp folder " + tempFolder);

				try {
					utils.deleteFolder(tempFolder);
				} catch(err) {
					return callback(new Error("Unable to delete folder " + tempFolder + ": because: " + err));
				}

			});

			return callback();

		};
	};

	return [
		utils.getSetLogPrefixTask(_log, 'cleanup'),
		this.getDeleteTempFolders()
	];

};