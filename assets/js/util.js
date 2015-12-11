!function(U){
	!function(){
		var fn_error = function(e){
			console.log('sysErr',e.stack);
			return false;
		}
		try{process.on('uncaughtException',fn_error);}catch(e){}
		window.onerror = fn_error;
	}();

	!function(){
		var os = U.OS = {};
		var n = navigator.userAgent;
		if(~n.indexOf('Android')){
			os.isAndroid = true;
		}else if($.browser.safari){//这里粗略通过浏览器是不是safrari来判断是否是IOS操作系统
			/*小米的手机$.browser.safari竟然为true*/
			os.isIOS = true;
		}else{
			os.isPC = true;
		}
	}();

	!function(){
		var _injectedObject = window.injectedObject;
		var is_android = typeof _injectedObject != 'undefined';
		var unique_id = 0;
		var callback_cache = {};
		/*调用本地方法*/
		U.command = function(fnName,param,callback){
			var args = [].slice.call(arguments);
			if(args.length == 2 && typeof param == 'function'){
				callback = param;
				param = null;
			}
			if(fnName == 'getSearchCityResult' && is_android){
				var cache_val = _injectedObject.getSearchCityResult();
				callback && callback(cache_val);
				return;
			}
			var paramArr = [];
			if(param){
				for(var i in param){
					paramArr.push(i+'='+param[i]);
				}
			}

			if(callback){
				var u_id = new Date().getTime()+'_'+unique_id++;
				callback_cache[u_id] = function(){
					callback.apply(this,arguments);
					delete callback_cache[u_id];
				};
				paramArr.push('cb='+u_id);
			}

			var paramStr = paramArr.length > 0 ? '?'+paramArr.join('&'): '';
			var src = encodeURI('js://'+fnName+paramStr);
			console.log('src:'+src);
			var $iframe = $('<iframe onload="var $this = $(this);setTimeout(function(){$this.remove();},1000)">').hide().appendTo($('body')).attr('src',src);
		}
		/*本地方法的回调*/
		U.command.callback = function(callback_name,param){
			var callback = callback_cache[callback_name];
			if(isNaN(param)){
				param = param.replace(/\r/g,'').replace(/\n/g,'\\n');
				try{
					param = JSON.parse(param);
				}catch(e){}
			}

			console.log(JSON.stringify(param));
			callback && callback(param);
		}
	}();
	/*重写alert方法*/
	U.alert = U.OS.isPC? function(msg){
		alert(msg);
	}:function(msg){
		if(msg){
			U.command('alert',{'msg':msg});
		}
	};
    /*本地存储*/
    if(typeof localStorage != 'undefined'){
		var store = localStorage;
		var prefix = 'hn_';
		var formateName = function(name){
			return prefix+name;
		}
		var _localstorage = {
			set: function(name,val){
				if(val === undefined || val === null){
					return _localstorage.rm(name);
				}
				try {
	                var json = JSON.stringify(val);
	                store.setItem(formateName(name),json);
	                return true;
	            } catch (e) {console.log(e);}
			},
			get: function(name){
				var val = localStorage[formateName(name)];
				if(val != undefined && val != null){
					try{val = JSON.parse(val);}catch(e){}
					return val;
				}
			},
			rm: function(name){
				name = formateName(name);
				if(name){
					store.removeItem(name);
				}else{
					store.clear();
				}
			},
			rmAll: function(){
				for(var i in store){
					if(i.indexOf(prefix) == 0){
						store.removeItem(i);
					}
				}
			}
		}
		U.Store = _localstorage;
	}
	/*请求网络数据*/
	!function(){
		var nextRequestTime = 0;
		var isHaveNetwork = true;
		var isCanUseNetwork = function(callback){
			var requestTime = new Date().getTime();
			if(nextRequestTime && requestTime < nextRequestTime){
				callback && callback(isHaveNetwork);
			}else{
				if(!U.OS.isIOS && !U.OS.isAndroid){
					callback && callback(true);
				}else{
					U.command('isCanUseNetwork',function(d){
						isHaveNetwork = !!d;
						nextRequestTime = requestTime + 1000 * 20;//缓存20s
						callback && callback(isHaveNetwork);
					});
				}
			}
		}
		var isNoticedNet = false;
		var netTT;
		var alertTT;
		/*优先处理Ajax请求，否则Jsonp请求（方便本地调试）*/
		var cache = {};
		/*option = {no_cache: false,onerror: null,format: null}*/
		U.getJson = function(url, callback,option) {
			var cache_name = encodeURIComponent(url);
			var cacheVal = cache[cache_name];
			try{
				//可以通过设置no_cache强制不缓存
				var is_no_cache = option.no_cache;
			}catch(e){}

			if(cacheVal && !is_no_cache){
				callback(cacheVal);
			}else{
				var onerrorFn;
				if(option){
					/*对外提供错误处理接口*/
					var fn = option.onerror;
					if($.isFunction(fn)){
						onerrorFn = fn;
					}
				}

				$.ajax({
		            async: true,
		            cache: true,
		            url: url,
		            type: 'GET',
		            dataType: 'text',
		            timeout: 20000,
		            success: function(json) {
		            	if(json.indexOf('_callback') > -1){
		            		var m = /^_callback\(([\s\S]*)\)$/.exec(json);
		            		if(m){
		            			json = m[1];
		            		}
		            	}else if(json.indexOf('var') == 0){
		            		json = json.substring(json.indexOf('{'),json.lastIndexOf('}')+1);
		            	}

		            	try{
			            	json = JSON.parse(json);
		            	}catch(e){
		            		json = json.replace(/\t/g,'');
		            		try{
		            			json = JSON.parse(json);
		            		}catch(e1){
		            			U.alert('数据解析错误1');
		            			onerrorFn && onerrorFn(e);
		            			return ;
		            		}
		            	}

		            	if(option){
		            		/*对外提供可格式化数据的接口*/
		            		var formatFn = option.format;
		            		if($.isFunction(formatFn)){
		            			json = formatFn(json);
		            		}
		            	}
		                cache[cache_name] = json;
		            	if(json){
		            		callback && callback(json);
		            	}
		            },
		            error: function(xhr,textStatus,error) {
	                    var errMsg;
	                    switch(textStatus){
							case 'timeout':
								errMsg = '请求超时';
								break;
							case 'parsererror':
								errMsg = '数据解析错误';
								break;
							case 'abort':
								break;
							case 'error':
								var sts = xhr.status;
	                            if(sts == 404){
	                                errMsg = '请求地址不存在';
	                                break;
	                            }
	                            if(sts == 0 && xhr.readyState == 0){
	                            	if(isNoticedNet){
	                            		return;
	                            	}else{
	                            		isCanUseNetwork(function(d){
	                            			if(!d){
	                            				errMsg = '当前网络不可用，请检查网络设置';
	                            				clearTimeout(alertTT);
						                    	alertTT = setTimeout(function(){
						                    		U.alert(errMsg);
						                    	},100);

	                        					onerrorFn && onerrorFn();
				                                isNoticedNet = true;
				                                clearTimeout(netTT);
				                                netTT = setTimeout(function(){
				                                    isNoticedNet = false;
				                                },5000);
	                            			}else{
	                            				onerrorFn && onerrorFn();
	                            			}
	                            		});
	                            	}

	                                break;
	                            }else{
	                                errMsg = '数据加载错误';
	                            }
							case 'notmodified':
								return;
						}
	                    if(errMsg){
	                    	clearTimeout(alertTT);
	                    	alertTT = setTimeout(function(){
	                    		U.alert(errMsg);
	                    	},100);

	                        onerrorFn && onerrorFn();
	                    }
	                }
		        });
			}
		}
		var Store = U.Store;
		/*localStorage级缓存*/
		U.initData = function (
			name,
			url,
			render,
			no_cache/*强制不缓存*/,
			format
		){
			var cacheVal = Store.get(name);
			var getData = function(callback){
				url = U.getEncodeUrl(url);
				U.getJson(url,function(data){
					Store.set(name,data);
					callback && callback(data);
				},{
					no_cache: no_cache,
					format: format
				});
			}
			if(cacheVal && !no_cache){
				render(cacheVal);
				getData();
			}else{
				getData(render);
			}
		}
	}();
	var timeout = 30000;
	/*根据定位得到城市信息*/
	U.getGeoInfo = U.OS.isPC? function(successCallback, onerrorFn){
		// 兼容pc端写法
		// var cache_name = 'ip_geo_info_pc';
		// var geoinfo = _localstorage.get(cache_name);
		var geoinfo = DEFAULT_CONFIG.geo;
		successCallback && successCallback(geoinfo);
	}:
	function(successCallback,onerrorFn){
	    var areaidValideTimeCache = 'aread_time';
	    var geoinfoCache = 'geo_info';
	    var geoinfo = _localstorage.get(geoinfoCache);
	    // 有效时间内不重复操作
	    if(geoinfo && (parseInt(_localstorage.get(areaidValideTimeCache)) || Number.MAX_VALUE) > new Date().getTime()){
	        console.log('cache: '+JSON.stringify(geoinfo));
	        successCallback && successCallback(geoinfo);
	        return ;
	    }
	    var errorFn = function(type){
	    	if($.isFunction(onerrorFn)){
	    		onerrorFn(type);
	    	}else{
	    		U.alert('为了得到更好的定位服务，请开启位置服务（设置->位置服务）;code('+type+')');
	    	}
	    	/*定位失败时使用默认的定位数据*/
	    	successCallback(DEFAULT_CONFIG.geo);
	    }
	    var geolocation = navigator.geolocation;
	    var fn_success = function(position){
            var lat = position.coords.latitude;
            var lon = position.coords.longitude;
            var url = U.getEncodeUrl('http://geo.weather.com.cn/ag9/?lon='+lon+'&lat='+lat);
            // alert('lat = '+lat+', lon = '+lon);
            // alert(url);
            U.getJson(url, function(json){
                if(json && json.status == 0){
                	geoinfo = json.geo;
                	geoinfo.lng = lon;
                	geoinfo.lat = lat;
                	// alert(JSON.stringify(geoinfo));
                    _localstorage.set(geoinfoCache,geoinfo);
                    // 设置有效时间为半小时
                    _localstorage.set(areaidValideTimeCache,new Date().getTime()+1000*60*5);
                    successCallback && successCallback(geoinfo);
                }else{
                    // U.alert('请求城市信息出错：'+json.msg);
                    successCallback && successCallback(DEFAULT_CONFIG.geo);
                }
            });
        }
        var fn_command_geo = (function(){
        	var isRuned = false;
        	var timeoutTT;
        	return function(type){
        		timeoutTT = setTimeout(function(){
	        		isRuned = true;
        			errorFn(type);
        		},timeout);
        		U.command('getGeo',function(data){
        			clearTimeout(timeoutTT);
	        		if(isRuned){
	        			return;
	        		}
	        		if(data.lat && data.lon){
	        			fn_success({
	        				coords: {
	        					latitude: data.lat,
	        					longitude: data.lon
	        				}
	        			});
	        		}else{
	        			errorFn(type);
	        		}
        		});
        	}
        })();
        /*ios下的safari会出现讨厌的提示框，这里safari的时候就直接调用原生定位接口*/
        // 手机直接调用原生定位
	    if(geolocation && !U.OS.isIOS && !U.OS.isAndroid){
	    	 geolocation.getCurrentPosition(fn_success,function(error){
	    	 	fn_command_geo(1);
	    	 },{
                maximumAge: 60*1000*2,
                timeout: timeout
            });
	    }else{
	    	fn_command_geo(2);
	    }
	}
    /*得到城市码*/
	U.getAreaId = function(){
	    var geoInfo = _localstorage.get('geo_info');
	    var areaid;
	    if(geoInfo){
	        areaid = geoInfo.id;
	    }
	    areaid = areaid || 101010100;
	    return areaid;
	}
	/*得到加密后的url*/
	U.getEncodeUrl = function(url){
	    var appid = "a1b42a4dccd7493f";
	    var myDate = new Date();
        var date = myDate.getFullYear() + "" + (parseInt(myDate.getMonth()) + 1) + "" + myDate.getDate() + "" + myDate.getHours() + "" + myDate.getMinutes();
	    url += (~url.indexOf('?')?'&':'?') + 'date='+date+'&appid='+appid;
	    var private_key = 'chinaweather_jcb_webapi_data';
	    var key = base64encode(str_hmac_sha1(private_key, url));
	    key = encodeURIComponent(key);

	    return url.replace(/appid=.*/,'appid='+appid.substr(0,6)) + '&key=' + key;
	}
	/*得到配置文件内容*/
	U.getAppInfo = function(callback,no_refresh){
		callback(U.Store.get('channels'));
	}

	/*得到一个iscroll实例，依赖iscroll.js*/
	!function(){
		U.getScroll = function(el,option){
			option = $.extend({
				scrollX: true,
				mouseWheel: true,
				tap: true,
				disableMouse: IScroll.utils.hasTouch,/*当有触屏事件时把mouse事件去掉，防止多次触发click*/
				click: true/*放开其它元素的click事件*/
			},option)
			var scroll = new IScroll(el, option);
			return scroll;
		}
	}();
}(this.Util ={});
/*统一loading*/
!function(){
	var $loading;
	var delay = 3;
	var showTT;
	var clearTT = function(){
		clearTimeout(showTT);
	}
	var $body = $('body');
	Util.Loading = {
		show: function(){
			if(!$loading){
				$loading = $('<div>').addClass('loading').appendTo($('body'));
			}
			/*防止从缓存中读取数据时Loading闪现现象*/
			clearTT();
			showTT = setTimeout(function(){
				$loading.show();
				$body.addClass('b_loading');
			},delay);
		},
		hide: function(){
			clearTT();
			$loading && $loading.hide();
			$body.removeClass('b_loading');
		}
	};
}();
!function(){
	var U = Util;
	var isShowNav = isShowSubMap = false;
	U.canBack = function(flag,type){
		if(type == 'nav'){
			isShowNav = flag;
		}else{
			isShowSubMap = flag;
		}
		// U.command(!isShowNav && !isShowSubMap?'setCanBack':'setNoBack');
	}
}();
/*可以访问内部方法*/
!function(){
	var U = Util;
	var invokeCallback = {};
	U.invoke = function(name){
		var fn = invokeCallback[name];
		if($.isFunction(fn)){
			var args = [].slice.call(arguments,1);
			fn.apply(null,args);
		}
	}
	U.invoke.reg = function(name,fn){
		invokeCallback[name] = fn;
	}
	U.invoke.rm = function(name){
		delete invokeCallback[name];
		invokeCallback[name] = null;
	}
}();
/*导航相关*/
!function(nav){
	var $doc = $(document);
	var U = Util;
	var Loading = U.Loading;
	var $nav_move;
	var isShowNav = false;
	var Store = U.Store;
	var REG_FILE_NAME = /\/([^\/]+)\.html/;
	var m = REG_FILE_NAME.exec(location.pathname);
	if(m){
		var file_name = m[1];
	}

	var _specialSortName = '_';//处理第二级分类想显示到三级,只适合二级直接显示到三级
	/*跳转页面*/
	var _changePage = (function(){
		var _resetTT;
		$(window).on('resize', function(){
			clearTimeout(_resetTT);
			_resetTT = setTimeout(function(){
				location.reload();
			}, 10);
		});
		return window.nwDispatcher? (function(){
			var gui = nwDispatcher.requireNwGui();
			var title = gui.App.manifest.window.title;
			var WindowGui = gui.Window;
			var win_current = WindowGui.get();
			var _win_sub;
			function _isIndex(url){
				return /\/($|index\.\w+$)/.test(url);
			}
			function _open(url){
				if(_win_sub){

					_win_sub.window.location.href = url;
				}else{
					_win_sub = WindowGui.open(url, {
						"toolbar": false,
						"title": title ,
						"icon": "./center/img/logo.png",
						"min_width": 320,
				    	"min_height": 600
					});
					_win_sub.on('close', function(){
						_win_sub.close(true);
						_win_sub = null;
					});
				}
				try{
					_win_sub.focus();
				}catch(e){}
			}
			return function(url){
				var _href = location.href;
				if(_isIndex(_href)){
					if(_href != url){
						_open(url);
					}else{
						win_current.focus();
					}
				}else{
					if(_isIndex(url)){
						opener.focus();
						win_current.close();
					}else{
						location.href = url;
					}
				}
			}
		})(): function(url){
			location.href = url;
		}
	})();
	nav.change = _changePage;// 方便在其它地方调用
	/*左侧导航初始化*/
	nav.init = function(callback){
		Loading.show();
		var old_file_url = './'+file_name+'.html';
		U.getAppInfo(function(appinfo){
			Loading.hide()
			var list = appinfo;
			var columnId = Store.get('columnId');
			var twoId = Store.get('twoId');
			var $nav = $('<div class="nav_left nav_animate">'+
							'<div class="nav_left_c">'+
								'<ul>'+
									'<li class="on">首页</li>'+
								'</ul>'+
								'<div class="bg"></div>'+
							'</div>'+
						'</div>');
			$nav_move = $('.nav_animate');
			$nav_move = $nav_move.add($nav);
			var _middle_name;
			var html = '';
			$.each(list, function(i,v){
				var id = v.id;
				var columnstyle = v.columnstyle;
				var sort_middle = v.child;
				var sub_html = '';
				var is_middle_sort_on = false;
				if(sort_middle){
					var str = '';
					var sid;//要跳过的分类ID
					$.each(v.child,function(s_i,s_v){
						var name = s_v.title;
						var s_id = s_v.id;
						var c_style = s_v.columnstyle || columnstyle;
						if(s_id == twoId){
							_middle_name = name;
						}
						if(name == _specialSortName){
							sid = s_id;
							return;
						}

						var dataUrl = s_v.module == 'weburl'?' data-url="'+s_v.dataurl+'"':'';
						/*小分类统一走上一级分类的columnstyle*/
						str += '<li class="'+(twoId == s_id && (is_middle_sort_on = true)?' on':'')+'" data-id="'+id+'" data-sid="'+s_id+'" data-type="'+s_v.columnType+'" data-style="'+c_style+'"'+dataUrl+'>'+name+'</li>';
					});
					sub_html = '<li class="s" '+(is_middle_sort_on?'style="display:block"':'')+'><ul>'+str+'</ul></li>';
				}
				html += '<li '+(columnId == id && !is_middle_sort_on?'class="on"':'')+' '+(sid?'data-sid="'+sid+'"':'')+' data-id="'+id+'" data-type="'+v.columnType+'" data-style="'+columnstyle+'"'+(v.module == 'weburl'?' data-url="'+v.dataurl+'"':'')+'>'+v.title+'</li>'+sub_html;
			});
			var $li = $nav.find('ul').append(html).find('li').on('click',function(e){
				e.stopPropagation();
				var $this = $(this);
				$doc.trigger('before_nav_click',$this);
				$li.removeClass('on');
				$this.addClass('on');
				// var $li_small = $this.parent().parent();
				// if($li_small.is('.s')){
				// 	$li_small.prev().addClass('on');
				// }
				var weburl = $this.data('url');
				var toUrl;
				if(weburl){
					toUrl = weburl;
				}else{
					var id = $this.data('id');
					var sid = $this.data('sid');
					// var columnstyle = $this.data('style');
					var type = $this.data('type');
					if(!id && !type){
						toUrl = './index.html';
					}else{
						Store.set('columnId',id);
						if(!sid){
							var $s_sort = $this.next();
							if($s_sort.is('.s')){
								if($prev_sub_sort && !$prev_sub_sort.is($s_sort)){
									$prev_sub_sort.hide();
								}

								$prev_sub_sort = $s_sort.toggle(function(){
									scroll_nav.refresh();
									scroll_nav.scrollToElement($s_sort.prev().get(0));
								});
								return;
							}
							// if($s_sort.is('.s')){
							// 	sid = $s_sort.data('sid');
							// }
						}
						Store.set('twoId',sid);
						Store.rm('threeId');
						toUrl = "./item.html";
						if('json_map' == type){
							toUrl = "./geomap.html"
						}else if('tf_track' == type){
							if(U.OS.isAndroid){
		                		toUrl = "wisp://typhoon.wi";
		                	}else{
		                		toUrl = "./typhoon.html";
		                	}
						}
					}
				}
				hide();

	            if(toUrl){
	            	//和当前页面一样的不跳转
	            	if(old_file_url != toUrl){
	            		_changePage(toUrl);
	            	}else{
	            		$doc.trigger('sort_change');
	            	}
	            }
			});
			var $prev_sub_sort = $li.filter('.s[style]');
			if(columnId){
				$li.first().removeClass('on');
			}
			callback && callback($nav);

			/*这里暂时只针对首页的点击，这时会跳转页面*/
			var is_from_change_big = Store.get('is_c_b');
			if(is_from_change_big){
				twoId && _middle_name != _specialSortName &&  show();//只有二级分类时才默认显示菜单
			}
			Store.rm('is_c_b');

			$nav.height($(window).height());
			var $nav_left_c = $nav.find('.nav_left_c');
			$nav_left_c.click(hide);
			var scroll_nav = Util.getScroll($nav_left_c.get(0),{
				scrollX: false
			});
			//滚动到当前选中的分类
			var elem = $nav.find('.on').get(0);
			if(elem){
				scroll_nav.scrollToElement(elem);
			}

			scroll_nav.on('flick', function () {
				var x = Math.abs(this.distX),
					y = Math.abs(this.distY);
				//确定是左右滑动
				if(x > y){
					if(this.distX < 0){
						hide();
					}
				}
			});
		})
	}
	/*更改大分类*/
	nav.changeBig = function(id){
		var $big_nav = $('.nav_left_c li[data-id='+id+']');
		var $to_nav = $big_nav;
		if(!$big_nav.is('.s,[data-style=2]')){
			var $temp_big_nav = $big_nav.next().find('li:first');
			if($temp_big_nav.length > 0){
				$to_nav = $temp_big_nav;
			}
		}
		Store.set('is_c_b',true);
		$to_nav.click();
	}
	var show = function (){
		isShowNav = true;
		$doc.trigger('nav_toggle');
		$nav_move.addClass('nav_left_show');
		U.canBack(true,'nav');
	};
	var hide = function (){
		isShowNav = false;
		$doc.trigger('nav_toggle');
		$nav_move.removeClass('nav_left_show');
		U.canBack(false,'nav');
	}
	/*对外提供打开关闭导航*/
	nav.toggle = function(force_hide/*强制关闭，默认为false*/){
		if(isShowNav || force_hide === true){
			hide();
		}else{
			show();
		}
	}
	$doc.on('menu',nav.toggle);

	nav.isShow = function(){
		return isShowNav;
	}

	/*内容页初始化头头部导航*/
	!function(Top){
		var TYPE_BIG_SORT = 10,
			TYPE_MIDDLE_SORT = 11,
			TYPE_SMALL_SORT = 12;

		var TYPE_IMGS_PLAY = 1;//多图播放模式
		var CACHE_SMALL_TRIGGER_DATA;//存储小分类触发数据
		var TYPE_LIST = 1,	//主栏目
			TYPE_CONTENT = 2; 	//内容栏目
		var COLUMNSTYLE_TYPHOON = 2; //栏目模板风格是“台风路径”
		var $_nav_top;
		/*得到头部html并进行代理点击事件(保证小分类容器不断初始化造成的绑定事件的性能开销)*/
		var _get_nav_top = function(name){
			name = name || '';
			if(!$_nav_top){
				$_nav_top = $('<div class="nav_top nav_animate"><div class="nav_title"><span id="btn_nav"></span><h1>'+name+'</h1></div></div>');
				$_nav_top.on('click',function(e){
					var $target = $(e.target);
					if($target.is('li')){
						$target.siblings().removeClass('on');
						$target.addClass('on');
						var id = $target.data('id');
						Store.set('threeId',id);
						trigger(CACHE_SMALL_TRIGGER_DATA[id]);
					}
				});
			}
			$_nav_top.find('h1').text(name);
			return $_nav_top
		}

		/*触发更新数据事件*/
		var trigger = function(data){
			var type = data.type;
			var is_geomap = type == 'json_map';
			var is_geomap_page = file_name == 'geomap';
			if(is_geomap && !is_geomap_page){
				_changePage('./geomap.html');
			}else if(!is_geomap && is_geomap_page){
				_changePage('./item.html');
			}else{
				$doc.trigger('init_data',data);
			}
		}
		/*得到要初始化的数据*/
		var _getTriggerData = function(appinfo){
			var columnId = Store.get('columnId');
			var twoId = Store.get('twoId');
			var threeId = Store.get('threeId');
			var sort_item,sort_item_middle,sort_item_small;
			/*得到一级分类*/
			for(var list = appinfo,i=0,j=list.length;i<j;i++){
				var item = list[i];
				if(item.id == columnId){
					sort_item = item;
					break;
				}
			}
			if(sort_item){
				var list = sort_item.child;
				var _returnData;
				/*一级分类为内容或是台风路径的模板*/
				if(sort_item.type == TYPE_CONTENT || sort_item.columnstyle == COLUMNSTYLE_TYPHOON || (!list || list.length == 0)){
					_returnData = {
						type: TYPE_BIG_SORT,
						on_id: 0,
						data: {
							l_url: sort_item.listUrl,
							d_url: sort_item.dataUrl,
							// module: sort_item.module,
							type: sort_item.columnType,
							cstyle: sort_item.style,
							color: sort_item.color
							// typeproperty: sort_item.typeproperty
						},
						title: sort_item.title
					};
				}else{
					if(list && list.length > 0){
						twoId || (twoId = list[0].id);
						/*得到二级分类*/
						for(var i=0,j=list.length;i<j;i++){
							var item = list[i];
							if(item.id == twoId){
								sort_item_middle = item;
								break;
							}
						}
						if(sort_item_middle){
							sort_item_small = sort_item_middle.child;

							if(sort_item_small && sort_item_small.length > 0){
								var cache_small = {};
								/*得到三级分类*/
								threeId || (threeId = sort_item_small[0].id);
								$.each(sort_item_small,function(i,v){
									var _id = v.id;
									cache_small[_id] = {
										l_url: v.listUrl,
										d_url: v.dataUrl,
										// module: v.module,
										type: v.columnType,
										cstyle: v.style,
										color: v.color
										// typeproperty: v.typeproperty
									};
								});
								_returnData = {
									list: sort_item_small,
									data: cache_small,
									on_id: threeId,
									type: TYPE_SMALL_SORT
								};
							}else{
								_returnData = {
									type: TYPE_MIDDLE_SORT,
									on_id: 0,
									data: {
										l_url: sort_item_middle.listUrl,
										d_url: sort_item_middle.dataUrl,
										// module: sort_item_middle.module,
										type: sort_item_middle.columnType,
										cstyle: sort_item_middle.style,
										color: sort_item_middle.color
										// typeproperty: v.typeproperty
									}
								};
							}
							var name = sort_item_middle.title;
							if(name == _specialSortName){
								name = sort_item.title;
							}
							_returnData.title = name;
						}
					}
				}

				return _returnData;
			}
		}
		var scroll_nav_top;
		/*渲染头部导航,chage_callback为头部导航发生改变时触发*/
		var _render = function(data,change_callback){
			var $nav_top = _get_nav_top(data.title);
			$nav_top.find('.nav_top_c').remove();
			var type = data.type;
			CACHE_SMALL_TRIGGER_DATA = null;//先清除数据
			if(type == TYPE_SMALL_SORT){
				CACHE_SMALL_TRIGGER_DATA = data.data;
				var html = '<div class="nav_top_c"><ul>';
				var on_id = data.on_id;
				var list = data.list;
				$.each(list,function(i,v){
					var _id = v.id;
					html += '<li class="fl'+(on_id == _id?' on':'')+'" data-id="'+_id+'">'+v.title+'</li>';
				});
				html += '</ul></div>';
				var $nav_top_c = $(html);
				$nav_top.append($nav_top_c);

				change_callback && change_callback();

				var to_width = 10;
				var $li = $nav_top_c.find('li').each(function(){
					to_width += $(this).outerWidth()+20;
				});
				$li.parent().width(to_width);
				if(scroll_nav_top){
					scroll_nav_top.destroy();
				}
				scroll_nav_top = U.getScroll($nav_top_c.get(0));
				scroll_nav_top.scrollToElement($li.filter('.on').click().get(0));//滑动到选中元素
			}else if(type == TYPE_MIDDLE_SORT || type == TYPE_BIG_SORT){
				change_callback && change_callback();
				trigger(data.data);
			}
		}
		/*对外提供初始化接口*/
		Top.init = function(callback,nav_top_chage_callback){
			Loading.show();
			U.getAppInfo(function(appinfo){
				Loading.hide();
				var $nav_top = _get_nav_top();
				callback && callback($nav_top);
				var sort_change = function(){
					var _data = _getTriggerData(appinfo);
					if(_data){
						_render(_data,nav_top_chage_callback);
					}
				}
				sort_change();
				$doc.on('sort_change',sort_change);
				/*左侧导航*/
				nav.init(function($nav){
					$nav.insertBefore($nav_top);
				})
				/*导航按钮*/
				$('#btn_nav').click(function(){
					nav.toggle();
				});
				/*供外部调用，这里暂时只会在信息检索里用到*/
				U.invoke.reg('nav',function(columnId,twoId,threeId){
					Store.set('columnId',columnId);
					Store.set('twoId',twoId);
					Store.set('threeId',threeId);
					sort_change();
				});
			});
		}
		Top.title = function(title){
			_get_nav_top(title);
		}
		Top.initByData = function(title, sortArr, nav_top_chage_callback){
			var dataObj = {};
			$.each(sortArr, function(i, v){
				v.id = i;
				dataObj[i] = v;
			});
			var data = {
				title: title,
				type: TYPE_SMALL_SORT,
				data: dataObj,
				on_id: 0,
				list: sortArr
			};
			_render(data, nav_top_chage_callback);
		}
	}(nav.Top = {});
}(Util.Nav = {});
/*解析天气数据*/
!function(parse){
	/*根据天气现象得到天气现象名*/
	parse.weatherText = function(index){
		var phenomenon = {};
		phenomenon["00"] = "晴";
		phenomenon["01"] = "多云";
		phenomenon["02"] = "阴";
		phenomenon["03"] = "阵雨";
		phenomenon["04"] = "雷阵雨";
		phenomenon["05"] = "雷阵雨伴有冰雹";
		phenomenon["06"] = "雨夹雪";
		phenomenon["07"] = "小雨";
		phenomenon["08"] = "中雨";
		phenomenon["09"] = "大雨";
		phenomenon["10"] = "暴雨";
		phenomenon["11"] = "大暴雨";
		phenomenon["12"] = "特大暴雨";
		phenomenon["13"] = "阵雪";
		phenomenon["14"] = "小雪";
		phenomenon["15"] = "中雪";
		phenomenon["16"] = "大雪";
		phenomenon["17"] = "暴雪";
		phenomenon["18"] = "雾";
		phenomenon["19"] = "冻雨";
		phenomenon["20"] = "沙尘暴";
		phenomenon["21"] = "小到中雨";
		phenomenon["22"] = "中到大雨";
		phenomenon["23"] = "大到暴雨";
		phenomenon["24"] = "暴雨到大暴雨";
		phenomenon["25"] = "大暴雨到特大暴雨";
		phenomenon["26"] = "小到中雪";
		phenomenon["27"] = "中到大雪";
		phenomenon["28"] = "大到暴雪";
		phenomenon["29"] = "浮尘";
		phenomenon["30"] = "扬沙";
		phenomenon["31"] = "强沙尘暴";
		phenomenon["53"] = "霾";
		phenomenon["99"] = "无";
		return phenomenon[index] || '无';
	}
	/*得到天气图标*/
	parse.weatherIcon = function(time,weather_code){
		var m = /(\d{2}):\d{2}/.exec(time);
		if(m){
			Hours = m[1];
		}else{
			Hours = new Date().getHours();
		}
		return './img/weather/icon_weather_'+(Hours >= 18 || Hours <= 6?'night':'day')+'_'+weather_code+'.png';
	}
	/*得到天气图标*/
	parse.weatherBg = function(time,weather_code){
		var m = /(\d{2}):\d{2}/.exec(time);
		if(m){
			Hours = m[1];
		}else{
			Hours = new Date().getHours();
		}
		var isNight = Hours >= 18 || Hours <= 6;
		weather_code = parseInt(weather_code);
		var imgCode;
		switch (weather_code) {
			case 0: {
				imgCode = (isNight?'n':'')+'00';
				break;
			}
			case 1: {
				imgCode = (isNight?'n':'')+'01';
				break;
			}
			case 2:
			case 33:
				imgCode = '02';
				break;
			case 3:
			case 6:
			case 7:
			case 19:
			case 21:{
				imgCode = (isNight?'n':'')+'03';
				break;
			}
			case 4:
			case 5: {
				imgCode = '04';
				break;
			}
			case 8:
			case 9:
			case 10:
			case 11:
			case 12:
			case 22:
			case 23:
			case 24:
			case 32:
			case 25:
				imgCode = '10';
				break;
			case 13:
			case 14:
			case 15:
			case 16:
			case 17:
			case 26:
			case 27:
			case 28:
			case 34:
				imgCode = '15';
				break;
			case 18:
			case 35:
			case 53:
				imgCode = '18';
				break;
			case 20:
			case 29:
			case 30:
			case 31: {
				imgCode = '20';
				break;
			}
		}
		imgCode || (imgCode = (isNight?'n':'')+'00');
		return './img/bg_weather/static_'+imgCode+'.jpg';
	}
	/*得到风向*/
	parse.windDirec = function(wind_code){
		var wind = {};
        wind[0] = "无持续风";
        wind[1] = "东北风";
        wind[2] = "东风";
        wind[3] = "东南风";
        wind[4] = "南风";
        wind[5] = "西南风";
        wind[6] = "西风";
        wind[7] = "西北风";
        wind[8] = "北风";
        wind[9] = "旋转风";
        return wind[wind_code] || '';
	}
	/*得到风速等级*/
	parse.windLevel = function(wind_level,is_forcast){
		if(is_forcast){
			return wind_level == 0?'微风':wind_level+'级';
		}
		var wind = {};
        wind[0] = "微风";
        wind[1] = "3-4级";
        wind[2] = "4-5级";
        wind[3] = "5-6级";
        wind[4] = "6-7级";
        wind[5] = "7-8级";
        wind[6] = "8-9级";
        wind[7] = "9-10 级";
        wind[8] = "10-11 级";
        wind[9] = "11-12 级";
        return wind[wind_level] || '';
	}
	/*得到周*/
	parse.week = function(date,addDate){
		var todayDate = new Date(date);
        if(addDate > 0){
            todayDate.setDate(todayDate.getDate()+addDate);
        }
        var dateweek = "";
        switch (todayDate.getDay())
        {
            case 0:
                dateweek += "周日";
                break;
            case 1:
                dateweek += "周一";
                break;
            case 2:
                dateweek += "周二";
                break;
            case 3:
                dateweek += "周三";
                break;
            case 4:
                dateweek += "周四";
                break;
            case 5:
                dateweek += "周五";
                break;
            case 6:
                dateweek += "周六";
                break;
        }
        return dateweek;
	}
}(Util.Parse = {});
/*用户定制相关*/
!function(My){
	var cache_name_my_city = 'my_city';
	var Store = Util.Store;
	/*定制城市*/
	My.City = {
		get: function(){
			return Store.get(cache_name_my_city) || [];
		},
		/*添加一个城市*/
		set: function(cityId,cityName){
			var oldArr = this.get() || [];
			oldArr.push({id: cityId, name: cityName});

			var tempHash = {};
			var newArr = [];
			$.each(oldArr,function(i,v){
				var id = v.id;
				if(tempHash[id]){
					return;
				}
				tempHash[id] = id;
				newArr.push(v);
			});
			Store.set(cache_name_my_city,newArr);
		},
		rm: function(cityId){
			var oldArr = this.get() || [];
			var index = -1;
			for(var i = 0,j=oldArr.length;i<j;i++){
				var v = oldArr[i];
				if(v.id == cityId){
					index = i;
					break;
				}
			}
			if(index > -1){
				oldArr.splice(index,1);
			}
			Store.set(cache_name_my_city,oldArr);
		}
	}
}(Util.My = {});
