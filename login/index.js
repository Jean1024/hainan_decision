!function(){
	var Buffer = require('buffer').Buffer;
	var URL = require('url');
	var zlib = require('zlib');
	var KEY = new Buffer('Crackers and the thief will suffer misfortune');
	function encrypt(str){
		str = new Buffer(str);
		var len_key = KEY.length;
		var result = '';
		var pos = 0;
		for(var i = 0, j = str.length; i<j; i++){
			var code = str[i] ^ KEY[pos];
			result += String.fromCharCode(code);
			if(++pos == len_key){
				pos = 0;
			}
		}
		return result;
	}
	function request(url, params, callback){
		var arr_url = URL.parse(url);
		var data_send = encrypt(JSON.stringify(params));
		var req = require('http').request({
			hostname: arr_url.hostname,
			port: 80,
			method: 'POST',
			path: arr_url.pathname,
		}, function(res){
			var chunks =[];
			res.on('data', function(chunk){
				chunks.push(chunk);
			}).on('end', function(){
				var buffer = Buffer.concat(chunks);
				var data = encrypt(buffer, true);
				// console.log(data);
				if(!data){
					callback && callback(new Error('no data'));
				}else{
					callback && callback(null, JSON.parse(data));
				}
				
			});
		}).on('error', function(e){
			callback && callback(e);
		});
		req.write(data_send);
		req.end();
	}
	function login(username, pwd, callback){
		request('http://u.weather.com.cn/mobile/login', {
			userName: username,
			password: pwd
		}, callback);
	}
	function afterLogin(){
		location.replace('../index.html');
	}
	var $username = $('#username'),
		$pwd = $('#pwd')
	var $btn_login = $('#btn_login').click(function(){
		var username = $username.val(),
			pwd = $pwd.val();
		if(!username){
			return alert('用户名不能为空！');
		}
		if(!pwd){
			return alert('密码不能为空！');
		}
		if(localStorage.getItem('auto')){
			afterLogin();
		}else{
			login(username, pwd, function(e, data){
				if(e){
					alert('出现错误！');
				}else{
					var result = data.result;
					if(result && result.status == 'SUCCESS' && result.data.groupId.indexOf(83) > -1){
						localStorage.setItem('login_info', {
							name: result.data.userName
						});
						afterLogin();
					}else{
						alert('用户名不存在或密码错误！');
					}
				}
			});
		}
	}).click();
	$(document).on('keypress', function(e){
		if(e.keyCode == 13){
			$btn_login.click();
		}
	});
}();