!function(){
	var U = Util;
	var os = require('os'),
		fs = require('fs'),
		path = require('path');
    var tmpPath = os.tmpdir() || os.tmpDir || global.window.nwDispatcher.requireNwGui().App.dataPath;
    tmpPath = path.join(tmpPath, '.pdf');
    var os_info = os.platform() + ','+os.type();
    var manifest = require('nw.gui').App.manifest;
    var soft_info = manifest.name+','+manifest.version;
	var _command_old = U.command;
	var userInfo = {};
	try{
		userInfo = JSON.parse(localStorage.getItem('login_info'));
	}catch(e){}
	var fn_obj = {
		'alert': function(msg){
			alert(msg.msg);	
		},
		'getLoginName': function(p, callback){
			callback && callback(userInfo.name || '');
		},
		'getCacheSize': function(p, callback){
			fs.readdir(tmpPath, function(e, files){
				if(!e){
					var size_total = 0;
					files.forEach(function(file){
						var f_path = path.join(tmpPath, file);
						size_total += fs.statSync(f_path).size;
					});
					size_total /= 1024;
					if(size_total < 512){
						size_total = size_total.toFixed(2) + 'K';
					}else{
						size_total /= 1024;
						if(size_total < 512){
							size_total = (size_total.toFixed(2))+'M';
						}else{
							size_total /= 1024;
							size_total = (size_total.toFixed(2))+'G';
						}
					}
				}
				callback && callback(e?0: size_total);
			});
		},
		'clearCache': function(p, callback){
			fs.readdir(tmpPath, function(e, files){
				if(!e){
					files.forEach(function(file) {
				        var fullName = path.join(tmpPath, file);
				        if (fs.statSync(fullName).isDirectory()) {
				        }else{
				        	fs.unlinkSync(fullName);
				        }
				    });
				}
				callback && callback();
			});
		},
		'logout': function(p, callback){
			localStorage.removeItem('login_info');
			location.replace('./center/index.html');
		},
		'feedback': function(p, callback){
			p.userId = userInfo.userId;
			p.osVersion = os_info;
			p.softVersion = soft_info;
			request('http://app.weather.com.cn/second/feedback/upload', {
				appKey: '6f688d62594549a2',
				data: p
			}, function(e, data){
				var return_data = {};
				if(e){
					return_data.e = e;
				}else{
					if(!data || data.status !== 'SUCCESS'){
						return_data.e = new Error('出现错误, 请联系管理员！');
					}
				}
				callback && callback(return_data);
			});
		}
	};
	U.command = function(fnName, param, callback){
		var args = [].slice.call(arguments);
		if(args.length == 2 && typeof param == 'function'){
			callback = param;
			param = null;
		}
		var fn = fn_obj[fnName];
		if(fn){
			fn(param, function(){
				callback && callback.apply(null, arguments);
			});
		}
	}
	$('#btn_version').off('click').on('click', function(){
		
	});
}();