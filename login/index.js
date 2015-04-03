!function(){
	var storage = localStorage;
	function login(username, pwd, callback){
		getUId(function(e, uid){
			request('http://u.weather.com.cn/mobile/login', {
				userName: username,
				password: pwd
			}, callback);
		})
	}
	function getUId(callback){
		var uid = storage.getItem('uid');
		if(uid){
			callback && callback(null, uid);
		}else{
			request('http://app.weather.com.cn/smartWeather', {"method":"uuid"}, function(e, data){
				console.log(e, data);
				if(!e){
					storage.setItem('uid', data);
				}
				callback && callback(e, data);
			});
		}
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
		if(storage.getItem('login_info')){
			afterLogin();
		}else{
			login(username, pwd, function(e, data){
				if(e){
					alert('出现错误！');
				}else{
					var result = data.result;
					if(result && result.status == 'SUCCESS' && result.data.groupId.indexOf(83) > -1){
						storage.setItem('login_info', JSON.stringify({
							name: result.data.userName,
							uid: result.data.uId,
							userId: storage.getItem('uid')
						}));
						afterLogin();
					}else{
						alert('用户名不存在或密码错误！');
					}
				}
			});
		}
	});
	$(document).on('keypress', function(e){
		if(e.keyCode == 13){
			$btn_login.click();
		}
	});
}();