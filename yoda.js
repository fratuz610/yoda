/*jslint node: true */
"use strict";

var yaml = require('js-yaml');
var fs   = require('fs');
var async = require('async');

var Log = require('./log.js');
var Task = require('./task.js');

var AptPackage = require('./resources/apt-package.js');
var Directory = require('./resources/directory.js');
var File = require('./resources/file.js');
var Git = require('./resources/git.js');
var Script = require('./resources/script.js');
var Symlink = require('./resources/symlink.js');
var Template = require('./resources/template.js');
var User = require('./resources/user.js');

// usage yoda URL or yoda file

var doc;
// Get document, or throw exception on error
try {
  doc = yaml.safeLoad(fs.readFileSync('tests/php-nginx/php-nginx.yaml', 'utf8'));
} catch (e) {
  return console.log(e);
}

// we change the cwd to where the yaml file is
process.chdir('tests/php-nginx/');

var taskList = [];
doc.forEach(function(item) {

	// this is one object with 1 key only
	for(var name in item) {

		// we add back a reference to the name
		item[name].name = name;

		var task = new Task(item[name]);

		
		switch(name.toLowerCase()) {
			case 'apt_package': case 'apt-package': taskList.push(new AptPackage(task)); break;
			case 'directory': taskList.push(new Directory(task)); break;
			case 'file': taskList.push(new File(task)); break;
			case 'git': taskList.push(new Git(task)); break;
			case 'script': taskList.push(new Script(task)); break;
			case 'symlink': taskList.push(new Symlink(task)); break;
			case 'template': taskList.push(new Template(task)); break;
			case 'user': taskList.push(new User(task)); break;
			default: throw new Error("Unrecognized task: " + name);
		}

		break;
	}

});

console.log("yoda: Starting up: " + taskList.length + " tasks to carry out");

// we create our instance of the log
var log = new Log();

// the shared data is empty for the time being
var data = {};

// the run list contains all callbacks
var runList = [];

// we validate each task + create the final run list
taskList.forEach(function(item) {
	var errorStr = item.validate();

	if(item.validate())
		throw new Error("ERROR: task can't run: " + item.validate().message);
	
	var localTaskList = item.getRunList(data, log);

	// we set the log prefix before each execution
	localTaskList.unshift(function(callback) {
		log.setPrefix(item.getName() + ": ");
		log.info("Action: " + item.getAction());
		callback();
	});

	runList = runList.concat(localTaskList);

});

console.log("yoda: Run list has " + runList.length + " small tasks to run");

async.series(

	runList,

	function(err, results){

    if(err)
    	return console.log("ERROR: " + err.stack);

    return console.log("ALL GOOD");
});

console.log("yoda: setup complete and jobs kicked off");