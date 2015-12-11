!function(){
	var Store = Util.Store;
	function login(username, pwd, callback){
		request.post('http://59.50.130.88:8888/decision-api/api/Json', {
			"command": "6001",
		    "object": {
				"username": username,
				"password": pwd
		    },
			"token": ""
		}, callback);
	}
	function afterLogin(){
		$body.addClass('auto');
		setTimeout(function(){
			location.replace('../index.html');
		}, 2000);
	}
	var $body = $('body'),
		$username = $('#username'),
		$pwd = $('#pwd');
	var login_info = Store.get('login_info');
	if(login_info){
		$body.addClass('auto');
		afterLogin();
	}
	var win = nwDispatcher.requireNwGui().Window.get();
	// win.showDevTools();
	win.show();
	var $logining = $('.logining');
	var $btn_login = $('#btn_login').click(function(){
		var username = $username.val(),
			pwd = $pwd.val();
		if(!username){
			return alert('用户名不能为空！');
		}
		if(!pwd){
			return alert('密码不能为空！');
		}
		if(login_info){
			afterLogin();
		}else{
			$logining.show();
			var date_show = new Date()
			login(username, pwd, function(e, data){
				if(e){
					alert('出现错误！');
				}else{
					if(data && data.status == 'true'){
						data = data.object;
						Store.set('channels', data.channels);
						Store.set('login_info', {
							name: data.username,
							uid: data.uid
						});

						setTimeout(function(){
							$logining.hide();
							afterLogin();
						}, Math.max(1000, new Date() - date_show));
						return;
					}else{
						alert('用户名不存在或密码错误！');
					}
				}
				$logining.hide();
			});
		}
	});
	$(document).on('keypress', function(e){
		if(e.keyCode == 13){
			$btn_login.click();
		}
	});
}();
