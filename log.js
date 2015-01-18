/*jslint node: true */
"use strict";

module.exports = function(size) {

	var _size = size | 20000;
	var _buffer = new Array(_size);
	var _nextRow = 0;
	var _overflow = false;

	var _prefix = "";
	var _self = this;

	this.info = function(message) {

		// if this is an array, let's recurse
		if(message instanceof Array) {
			message.forEach(function(singleMessage) {

				if(singleMessage.trim() === "")
					return;
				
				_self.info(singleMessage);
			});
			return;
		}

		if(_nextRow >= _size) {
			_overflow = true;
			return;
		}

		_buffer[_nextRow] = _prefix + message;
		console.log(_prefix + message);
		_nextRow++;

	};

	this.error = function(error) {
		_self.info("ERROR: " + error);
	};

	this.warning = function(message) {
		_self.info("WARNING: " + message);
	};

	this.setPrefix = function(prefix) { _prefix = prefix; };

	this.getLog = function() {

		if(_nextRow === 0)
			return "";

		return _buffer.slice(0, _nextRow).join("\n");
	};

	this.getOverflow = function() {
		return _overflow;
	};

	this.clear = function() {
		// we just reset the next row
		_nextRow = 0;
	};
};