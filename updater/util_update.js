!function() {
	var style = 'width:100%;position:absolute; left:0; top:50%;text-align:center;padding: 10px 0;color:white;background-color:rgba(0,0,0,0.5)';
	var $update_version = $('<div style="'+style+'">test</div>').appendTo($('body'));
	$update_version.hide();

	var ext = this.global.require.extensions;
	ext['.gts'] = ext['.js'];

	var gui = nwDispatcher.requireNwGui();
	var copyPath, execPath;
	if (gui.App.argv.length) {
		copyPath = gui.App.argv[0];
		execPath = gui.App.argv[1];
	}
	//download new version of app in tmp
	//unpack
	//run updater
	//updater will copy itself to origin directory
	//updater will run app
	var pkg = require('../package.json');
	var request = require('request');
	var url = require('url');
	var path = require('path');
	var os = require('os');
	var fs = require('fs');
	var k = 0;
	var d = false;

	var dir_assets = path.dirname(location.href).replace('file:///', '');
	
	var updater = require(path.join(dir_assets, 'updater/updater.js'));
	var upd = new updater(pkg);
	var newVersionCheckIntervalId = null;
	var tryingForNewVersion = false;

	//for test purposes

	// Util.update = function(){
		if (!copyPath) {
			var _url = url.resolve(pkg.manifestUrl, '/version/' + pkg.version);
			request.get(_url);
			// $update_version.html('当前版本：' + pkg.version);
			function check() {
				if (!d && !tryingForNewVersion) {
					tryingForNewVersion = true; //lock
					upd.checkNewVersion(versionChecked);
				}
			}
			check();
			newVersionCheckIntervalId = setInterval(check, 1000*60*10);
		} else {
			$update_version.show().html('正在更新文件...');
			upd.install(copyPath, newAppInstalled);

			function newAppInstalled(err) {
				if (err) {
					console.log(err);
					return;
				}
				alert('升级完成，马上打开最新应用！');
				upd.run(execPath, null);
				gui.App.quit();
			}
		}
	// }
	// Util.update();
	function versionChecked(err, newVersionExists, manifest) {
		tryingForNewVersion = false; //unlock
		if (err) {
			console.log(err);
			return Error(err);
		} else if (d) {
			console.log('Already downloading');
			return;
		} else if (!newVersionExists) {
			console.log('No new version exists');
			return;
		}
		d = true;
		clearInterval(newVersionCheckIntervalId);
		if(confirm('发现最新版本'+manifest.version+'，是否下载并安装？')){
			var loaded = 0;
			var newVersion = upd.download(function(error, filename) {
				console.log(error, filename, manifest);
				newVersionDownloaded(error, filename, manifest);
			}, manifest);
			
			newVersion.on('data', function(chunk) {
				loaded += chunk.length;
				$update_version.show().html("正在下载安装包: " + Math.floor(Math.min(loaded / newVersion['content-length'], 1) * 100) + '%');
			})
		}else{
			$update_version.hide();
		}
	}

	function newVersionDownloaded(err, filename, manifest) {
		if (err) {
			console.log(err)
			return Error(err);
		}
		$update_version.html("正在处理... ");
		// $update_version.html("unpacking: " + filename);
		upd.unpack(filename, newVersionUnpacked, manifest);
	}

	function newVersionUnpacked(err, newAppPath) {
		console.log(err, newAppPath);

		if (err) {
			console.log(err)
			return Error(err);
		}

		var runner = upd.runInstaller(newAppPath, [upd.getAppPath(), upd.getAppExec()]);
		console.log(runner);
		gui.App.quit();
	}
}();