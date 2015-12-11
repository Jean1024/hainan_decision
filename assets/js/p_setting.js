$(function(){
	var U = Util,
		Store = U.Store,
		MyCity = U.My.City;
	var _command = U.command;

	var $doc = $(document);
	var _alert = Util.alert;
	var $btn_version,$version;

	var width_win = $(window).width();
	$('body,.view').width(width_win);
	var $container = $('.container').width($('.view').length*width_win);

	_command('getLoginName',function(name){
		$('#btn_account span:last').text(name);
	});
	/*缓存清理按钮*/
	var $btn_cache = $('#btn_cache').click(function(){
		if(parseFloat($cache_val.text()) > 0){
			_command('clearCache',function(){
				_command('getCacheSize',function(d){
					$cache_val.text(d);
					_alert('缓存清理完成');
				});
			});
		}else{
			_alert('没有要清理的缓存');
		}
	});
	var $cache_val = $btn_cache.find('span:last');
	_command('getCacheSize',function(d){
		$cache_val.text(d);
	});
	/*检测版本按钮*/
	$btn_version = $('#btn_version').click(function(){
		if($(this).data('have_new')){
			_command('updateVersion');
		}else{
			_alert('当前是最新版本');
		}
	});
	$version = $btn_version.find('span:last');
	_command('getVersion',function(version){
		$version.text(version);

		/*检测最新版本*/
		!function(){
			var cache_name_version = 'new_version';
			var cache_val_version = Store.get(cache_name_version);
			var initNewVersion = function(newVersion){
				var oldVersion = $version.text();
				if(newVersion > oldVersion){
					$version.html(oldVersion+' ( <font color="red">最新版本为:'+newVersion+'</font> )');
					$btn_version.data('have_new',true);
				}
			}
			if(cache_val_version){
				var time = cache_val_version[1];
				if(time < new Date().getTime()){
					var version = cache_val_version[0];
					initNewVersion(version);
					return;
				}
			}
			_command('getUpdateVersion',function(data){
				console.log('getUpdateVersion:'+JSON.stringify(data));
				if(data){
					data = data.data;
					var version = data.latestVersion;
					if(version){
						Store.set(cache_name_version,[version,new Date().getTime() + 1000*60*5]);//缓存5分钟
						initNewVersion(version);
					}
				}
			});
		}();
	});

	/*退出按钮*/
	$('#btn_logout').click(function(){
		_command('logout');
	});
	// var _scrollTo = function(toLeft){
	// 	$container.css('margin-left',-toLeft);
	// }
	var _scrollTo = function(toEleClassName){
		var toLeft = toLeftCache[toEleClassName] || 0;
		$container.css('margin-left',-toLeft);
	}
	$('.nav_top').click(function(e){
		var $target = $(e.target);
		var toEle = $target.data('to');
		if(!toEle){
			location.href = './index.html';
		}else{
			_scrollTo(toEle);
		}
	});
	var toLeftCache = {};
	$('[data-to]').each(function(i,v){
		var toClassName = $(this).data('to');
		try{
			toLeftCache[toClassName] = $('.'+toClassName).position().left;
		}catch(e){}
	});
	$('li[data-to]').click(function(){
		var $to = $(this).data('to');
		_scrollTo($to);
	});

	/*对反馈信息结果进行处理*/
	!function(){
		var $fb_content = $('#fb_content'),
			$fb_email = $('#fb_email'),
			$fb_tel = $('#fb_tel');
		var isUploading = false;
		function isEmail(str){
			var reg = /^[A-Za-z\d]+([-_.][A-Za-z\d]+)*@([A-Za-z\d]+[-.])+[A-Za-z\d]{2,5}$/;
			return reg.test(str);
		}
		function isTel(str){
			var reg = /^1[358]\d{9}$|^((0\d{2,3})-)?(\d{7,8})(-(\d{3,}))?$/;
			return reg.test(str);
		}
		var $btn_submit = $('#btn_submit').click(function(){
			if(isUploading){
				return;
			}
			var content = $fb_content.val().trim() || '';
			if(!content){
				return _alert('意见内容不可为空！');
			}else{
				var tel = $fb_tel.val().trim() || '';
				var email = $fb_email.val().trim() || '';
				if(email && !isEmail(email)){
					return _alert('请输入正确的邮箱');
				}
				if(tel && !isTel(tel)){
					return _alert('请输入正确的电话');
				}
				$btn_submit.val('正在提交');
				isUploading = true;
				_command('feedback',{
					email: email,
					mobile: tel,
					content: content
				},function(data){
					isUploading = false;
					try{
						var error = data.e;
						if(error){
							_alert(error);
						}else{
							_alert('我们已经收到您的反馈信息！');
						}
						$fb_content.val('');
						$fb_email.val('');
						$fb_tel.val('');
						_scrollTo('main');
					}catch(e1){}
				});
			}
		});
	}();

	var $hotcitylist = $('.hotcitylist');
	var cache_name_hotcity = "hotcitylist";
	var cache_val_hotcity = Store.get(cache_name_hotcity);
	var init_hotcity = function(data){
		var html = '';
		$.each(data,function(i,v){
			html += '<li data-id="'+v[0]+'" data-name="'+v[1]+'">'+v[1]+'</li>';
		});
		$hotcitylist.html(html);
		refresh_hotcity();
	}
	var refresh_hotcity = function(){
		var myCity = MyCity.get();
		var $li = $hotcitylist.find('li').removeClass('on');
		$.each(myCity,function(i,v){
			var id = v.id;
			$li.filter('[data-id='+id+']').addClass('on');
		});
	}
	if(cache_val_hotcity){
		init_hotcity(cache_val_hotcity);
	}else{
		_command('getHotCity',function(data){
			console.log($.isArray(data)+'getHotCity:'+JSON.stringify(data));
			if(data){
				if($.isArray(data)){
					Store.set(cache_name_hotcity,data);
					init_hotcity(data);
				}
			}
		});
	}


	var $citylist = $('.citylist').height($(window).height() - 190);
	/*搜索城市*/
	var pollSearchCityResult = (function(){
		var delay = 50;
		var pollTT;
		function poll(){
			_command('getSearchCityResult',function(result){
				if(result){
					var keyword = $cityname.val();
					try{
						var data = JSON.parse(result);
					}catch(e1){}
					if(data){
						/*防止延时操作*/
						if(data.k == keyword){
							var error = data.e;
							if(error){
								$citylist.html('<li>'+error+'</li>');
							}else{
								var isHaveData = false;
								if(data.status == 'SUCCESS'){
									var arr = data.data.records;
									if($.isArray(arr) && arr.length > 0){
										isHaveData = true;
										$citylist.html('');
										var html = '';
										$.each(arr,function(i,v){
											html += '<li data-id="'+v.areaId+'" data-name="'+v.nameZh+'">'+[v.nameZh,v.provZh].join('-')+'</li>';
										});
										$citylist.html(html);
									}
								}
								if(!isHaveData){
									$citylist.html('<li>没有匹配数据</li>');
								}
							}
						}
					}
				}
			});

			pollTT = setTimeout(poll,delay);
		}

		return {
			start: function(){
				$hotcitylist.hide();
				$citylist.show();
				clearTimeout(pollTT);
				pollTT = setTimeout(poll,delay);
			},stop: function(){
				clearTimeout(pollTT);
			}
		}
	})();

	var $cityname = $('.cityname').on('keyup',function(e){
		var val = $cityname.val();
		if(val){
			_command('searchCity',{
				kw: val
			});
		}
	})
	.on('focus',pollSearchCityResult.start)
	.on('blur',pollSearchCityResult.stop);

	var $added_citylist = $('.added_citylist');
	$added_citylist.delegate('.btn_add','click',function(){
		if(U.OS.isIOS){
			/*IOS的safari启动原生的搜索城市*/
			var myCity = MyCity.get();
			var idArr = [];
			$.each(myCity,function(i,v){
				var id = v.id;
				idArr.push(id);
			});
			_command('searchCity',{
				cityList: idArr.join(',')
			},function(data){
				if(data){
					var id = data.id;
					var name = data.name;
					if(id && name){
						MyCity.set(id,name);
						initMyCity();
					}
				}
			});
		}else{
			_scrollTo('addcity');
		}
	}).delegate('.btn_close','click',function(){
		var $this = $(this)
		var id = $this.data('id');
		MyCity.rm(id);
		$this.closest('li').remove();
		refresh_hotcity();
	});
	/*初始化已经定制的城市*/
	var initMyCity = function(){
		var myCity = MyCity.get();
		var html = '<li class="locate"><div><span>自动定位</span></div></li>';
		$.each(myCity,function(i,v){
			html += '<li><div><span>'+v.name+'</span><div class="btn_close" data-id="'+v.id+'">X</div></div></li>';
		});
		html += '<li ><div class="btn_add"><div></div></div></li>';
		$added_citylist.html(html);
	}
	initMyCity();
	/*热门城市和搜索下拉列表的click事件*/
	$hotcitylist.add($citylist).click(function(e){
		var $target = $(e.target);
		if($target.is('li')){
			var id = $target.data('id');
			var name = $target.data('name');
			if(id && name){
				$target.addClass('on');
				MyCity.set(id,name);
				initMyCity();
			}

			_scrollTo('cityset');

			$hotcitylist.show();
			$cityname.val('');
			$citylist.hide().empty();
		}
	});
})
