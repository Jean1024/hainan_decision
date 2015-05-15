!function(U){
	var gui = require('nw.gui');
	var copyPath, execPath;
	if(gui.App.argv.length){
		copyPath = gui.App.argv[0];
		execPath = gui.App.argv[1];
	}

	//download new version of app in tmp
	//unpack
	//run updater
	//updater will copy itself to origin directory
	//updater will run app
	var pkg = require('../../package.json');
	var request = require('request');
	var url = require('url');
	var path = require('path');
	var os = require('os');
	var fs = require('fs');
	var k = 0;
	var d = false;
	var updater = require('./app/updater.js');
	var upd = new updater(pkg);
	var newVersionCheckIntervalId = null;
	var tryingForNewVersion = false;

	if(!copyPath){
		request.get(url.resolve(pkg.manifestUrl, '/version/'+ pkg.version));
		// document.getElementById('version').innerHTML = 'current version ' + pkg.version;
		newVersionCheckIntervalId = setInterval(function(){
		  if(!d && !tryingForNewVersion) {
		      tryingForNewVersion = true; //lock
		      upd.checkNewVersion(versionChecked);
		  }
		}, 500);
	} else {
		document.getElementById('version').innerHTML = 'copying app';
		upd.install(copyPath, newAppInstalled);

		function newAppInstalled(err){
		  if(err){
		    console.log(err);
		    return;
		  }
		  upd.run(execPath, null);
		  gui.App.quit();
		}
	}
	U.Updater = {
		install: function(){

		},
		check: function(){

		}
	};
}(this.Util);