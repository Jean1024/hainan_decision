$(function(){
	var U = Util;
	var Nav = U.Nav;
	var getScroll = U.getScroll;
	var Store = U.Store;
	var getJson = U.getJson;
	var Parse = U.Parse;
	var Loading = U.Loading;

	var geoinfo;
	// var win = nwDispatcher.requireNwGui().Window.get();
	// win.showDevTools();

	var DATA_GLOBAL;
	// 格式化返回的数据
	function _format(data) {
		// l 实况
		// c, f 15天预报
		// w 预警
		// jh 逐小时预报
		// p 空气质量
		var result = {};
		for (var i = 0, j = data.length; i<j; i++) {
			var item = data[i];
			var key;
			if (item.l) {
				key = 'shikuang';
			} else if (item.c && item.f) {
				key = '15yb';
			} else if (item.w) {
				key = 'warning';
			} else if (item.jh) {
				key = 'hoursyb';
			} else if(item.p) {
				key = 'air';
			}
			if (key) {
				result[key] = item;
			}
		}
		return result;
	}
	function init(cb) {
		var url = U.getEncodeUrl('http://hfapi.tianqi.cn/data/?areaid='+ geoinfo.id + '&type=all');
		Loading.show();
		getJson(url, function(result) {
			result = _format(result);
			DATA_GLOBAL = result;
			initForcast(result['shikuang']);
			// initAlarm(result['warning']);
			//101310212
			U.getHost(function(host) {
				getJson(host+'/decision-admin/alarm/cityAlarm/' + geoinfo.id, function(data) {
					initAlarm(data);
				})
			})
			
			initAir(result['air']);
			initForcast7d(result['15yb']);
			Loading.hide();
			cb && cb();
		});
	}
	var warning_info;
	$('.warning').click(function(){
		if(warning_info){
			Store.set('c_warning',{
				title: '灾害预警',
				info: warning_info
			});
			Nav.change('./item.html');
		}
	});
	/*实况*/
	function initForcast(data, callback){
		if(!data || !data.l){
			return;
		}
		var data = data.l;
		var l1 = data.l1; //当前温度 (摄氏度 )
		var l2 = data.l2; //当前湿度 (单位 %)
		var l3 = data.l3; //当前风力 (单位是级 单位是级 )
		var l4 = data.l4; //当前风向编号 当前风向编号
		var l5 = data.l5; //当前天气现象编号 当前天气现象编号 当前天气现象编号
		var l6 = data.l6; //当前降水量 当前降水量 (单位是毫米 单位是毫米 )
		var l7 = data.l7; //实况发布时间

		$('.temp').html(l1+'<sup>℃</sup>');
		// $('.weather').text(Parse.weatherText(l5)+"  8℃~23℃");
		$('.weather_icon').attr('src',Parse.weatherIcon(l7,l5)).show();
		$('.shidu').text('相对湿度：'+l2+'%');
		$('.wind').html(Parse.windDirec(l4)+' '+Parse.windLevel(l3,true));
		// $('.time').text(l7);
		$('.time').text(data.l13.substr(0, 16));
		$('.weather_info').show();
		callback && callback();
	}
	// 预警
	function initAlarm(data, callback){
		var isHaveWarning = false;
		var $warning = $('.warning');
		warning_info = null;
		Store.rm('c_warning');
		if(data){
			var w = data.w;
			if($.isArray(w) && w.length > 0){
				isHaveWarning = true;
				var info = w[0];
				$warning.show();
				$warning.find('img').attr('src','./img/waring/icon_warning_'+info.w4+''+info.w6+'.png');
				// $yubao.find('.warning_color').attr('class','warning_color '+color);
				var text = info['w5']+info['w7']+'预警';
				$warning.find('.warning_text').html(text);
				var org = info.w1+info.w2+"气象台";
				warning_info = {
					c1: org+"发布"+text,
					c2: "",
					c3: org,
					c4: info.w8,
					c5: "",
					c6: "",
					c7: info.w9,
					type: "jcbw"
				};
			}
		}
		if(!isHaveWarning){
			$warning.hide();
		}
		callback && callback();
	}
	// 空气质量
	function initAir(data, callback){
		if(data && data.p){
			var aqi = data.p.p2;
			var aqiStr = '';
			if(aqi > 0 && aqi <= 50){
				aqiStr = '优';
			}else if(aqi > 50 && aqi <= 100){
				aqiStr = '良';
			}else if(aqi > 100 && aqi <= 150){
				aqiStr = '轻度污染';
			}else if(aqi > 150 && aqi <= 200){
				aqiStr = '中度污染';
			}else if(aqi > 200 && aqi <= 300){
				aqiStr = '重度污染';
			}else if(aqi > 300){
				aqiStr = '严重污染';
			}
			$('.AQI').html('AQI：'+aqiStr);
		}
		callback && callback();
	}
	function initForcast7d(data) {
		var v = data.f.f1[0];
		var fa = v.fa; //白天天气现象编号
		var fb = v.fb; //晚上天气现象编号
		var fc = v.fc; //白天天气温度
		var fd = v.fd; //晚上天气温度
		var temp = fd + '℃';
		if(fc || fc === 0){
			temp = fc + '℃~' + temp;
		}else{
			var data_next_day = data.f.f1[1];
			fa = fb;
			fb = data_next_day.fa;
			temp += '~' + data_next_day.fc+'℃';
		}
		$('.weather').text(forecastWeatherText(fa,fb)+"  " + temp);
	}
	// 7天预报
	// function initForcast7d1(areaid,callback,no_cache){
	// 	var REG_TIME = /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/
	// 	initData('forcast7d','http://webapi.weather.com.cn/data/?areaid='+ areaid + '&type=forecast7d',callback,no_cache)
	// };
	function getDate(date,addDate){
		var todayDate = new Date(date);
		if(addDate > 0){
			todayDate.setDate(todayDate.getDate()+addDate);
		}
		return [todayDate.getFullYear(),todayDate.getMonth()+1,todayDate.getDate()].join('-');
	}

	// 定位
	var cache_name_index_geo = 'index_geo';
	var cache_val_index_geo = Store.get(cache_name_index_geo);
	if(cache_val_index_geo){
		geoinfo = cache_val_index_geo;
		init();
	}else{
		Loading.show();
		U.getGeoInfo(function(info){
			geoinfo = info;
			var cityName = geoinfo.city;
			if(/瓦里/.test(cityName)){
				geoinfo = DEFAULT_CONFIG.geo; //修复客户端里的错误信息
			}
			Store.set(cache_name_index_geo, geoinfo);
			init();
		});
	}
	/*刷新按钮*/
	!function(){
		var isRefreshing = false;
		var $btn_refresh, $btn_refresh_parent;
		var fn_click = function(){
			if(!isRefreshing){
				var $this = $(this).addClass('refreshing');
				isRefreshing = true;
				var runTime = 600;//最小运行时间，防止速度太快按钮没有反应
				var startTime = new Date().getTime();

				init(function(){
					var delayTime = runTime - (new Date().getTime()-startTime);
					delayTime = delayTime < 0?0:delayTime;
					setTimeout(function(){
						/*在手机上测试刷新按钮状态不还原，暂时这样强制UI重绘*/
						$btn_refresh = $this.removeClass('refreshing').remove().appendTo($btn_refresh_parent);

						$btn_refresh.click(fn_click);
						isRefreshing = false;
					},delayTime);
				},true);
			}
		}
		$btn_refresh = $('#btn_refresh').click(fn_click);
		$btn_refresh_parent = $btn_refresh.parent();
	}();
	/*导航按钮*/
	$('.btn_nav').on('click',Nav.toggle);
	Nav.init(function($html){
		$html.prependTo($('#main'));
	});
	function forecastWeatherText(day_code,night_code){
		var day_text = Parse.weatherText(day_code);
		var night_text = Parse.weatherText(night_code);
		var show_text = day_text;
		if(day_text != night_text){
			show_text += '转'+night_text;
		}
		return show_text.replace(/^无?转|转无?$/,'');
	}
	/*对图标进行缓存*/
	var cacheImg = (function(){
		return function(url,callback){
			var cacheName = 'icon_'+base64encode(str_hmac_sha1('',url))
			var imgData = Store.get(cacheName);
			var $img = $('<img>');
			if(imgData){
				$img.attr('src',imgData);
				callback($img);
			}else{
				var img = new Image();

				img.onload = function(){
					var canvas = document.createElement("canvas");
					canvas.width = this.width;
					canvas.height = this.height;
					var ctx = canvas.getContext("2d");
					ctx.drawImage(this, 0, 0);

					var data = canvas.toDataURL('image/png');
					Store.set(cacheName,data);
					$img.attr('src',data);
					callback($img);
				}
				img.src = url;
			}
		}
	})();
	// 初始化大图标
	U.getAppInfo(function(appinfo){
		var $sort_list = $('.sort_list');
		var html = '';
		$.each(appinfo,function(i,v){
			var color = v.color;
			html += '<li data-id="'+v.id+'"><img src="./img/bg_img.png" data-icon="'+v.icon+'"/><span>'+v.title+'</span></li>';
		});
		$sort_list.html(html).find('li img').each(function(){
			var $this = $(this);
			cacheImg($this.data('icon'),function($img){
				$this.parent().addClass('loaded');
				$this.replaceWith($img);
			});
		});
		$sort_list.find('li').click(function(e){
			Nav.changeBig($(this).data('id'));
		});
	});
	$(document).on('back',function(){
		if(Nav.isShow()){
			Nav.toggle(true);
		}else{
			$btn_quit.click();
		}
	});
	var $nav_top = $('.nav_top');
	var $btn_quit = $('.btn_quit');

	$(function(){
		var isInitedForcast = false;
		var $dialog_forcast = $('.dialog_forcast'),
			$dialog_trend = $('.dialog_trend'),
			$yb_container = $('.yb_container');
		var $cuttent_dialog;
		var show = function($dialog){
			$cuttent_dialog = $dialog;
			$cuttent_dialog.velocity({
				left: 0
			});
		}
		var hide = function(){
			$cuttent_dialog.velocity({
				left: '100%'
			});
		}
		var $yb_date = $('.yb_date').height($dialog_forcast.height() - $dialog_forcast.find('.nav_top').height());
		$btn_quit.click(function(){
			$(this).parent().parent().removeClass('show');
			// hide();
			U.canBack(false,'dialog');
		});
		$('.btn_yubao').click(function(){
			$dialog_forcast.addClass('show');
			// show($dialog_forcast);
			U.canBack(true,'dialog');
			if(!isInitedForcast){
				_initForcast7d();
			}
		});
		$('.btn_forecast').click(function(){
			$yb_container.removeClass('trend');
		});
		$('.btn_trend').click(function(){
			$dialog_forcast.addClass('show');
			$yb_container.addClass('trend');
		});
		function getDate(date,addDate){
			var todayDate = new Date(date);
			if(addDate > 0){
	            todayDate.setDate(todayDate.getDate()+addDate);
	        }
	        return [todayDate.getFullYear(),todayDate.getMonth()+1,todayDate.getDate()].join('-');
		}

		function _initForcast7d(){
			Loading.show();
			// $('.nav_top span').text($('.top_nav h1').text());
			var REG_TIME = /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/;
			var data = DATA_GLOBAL['15yb'];
			data = data.f;
            var html = '';
            var m = REG_TIME.exec(data.f0);
            if(m){
            	var today = [m[1],m[2],m[3]].join('-');
            }else{
            	var today = new Date();
            }
            var Hours = today.getHours();
            var isNight = Hours >= 18 || Hours <= 6;
            var maxTemp = [],
            	minTemp = [],
            	labels_top = [],
            	labels_bottom = [];
			$.each(data.f1.slice(0, 7),function(i,v){
				var fa = v.fa; //白天天气现象编号
                var fb = v.fb; //晚上天气现象编号
                var fc = v.fc; //白天天气温度
                var fd = v.fd; //晚上天气温度
                var fe = v.fe;
                var ff = v.ff;
                var fg = v.fg;
                var fh = v.fh;
                // var fi = v.fi;
                /*晚上发布后当天白天数据为空*/
                var week = Parse.week(today,i);
                var date = getDate(today,i);
                /*对当天没有白天数据时进行处理*/
                if(!isNaN(fc) && fc != ''){
                	maxTemp.push(fc);
                    minTemp.push(fd);
                    labels_top.push(week+'<img src="'+Parse.weatherIcon('12:00',fa)+'"/>');
                    labels_bottom.push('<img src="'+Parse.weatherIcon('23:00',fb)+'"/>'+date.substring(5));
                }

                html += '<li>'+
						'<div class="yb_top">'+date+' '+week+'</div>'+
						'<div class="clear yb_c">'+
							'<div class="fl">'+
								(fa?'<img class="w_img" src="'+Parse.weatherIcon('12:00',fa)+'"/><span>'+(fc?fc+'℃':'')+'</span>':'')+
							'</div>'+
							'<div class="fl">'+
								'<img class="w_img" src="'+Parse.weatherIcon('23:00',fb)+'">'+
								'<span>'+fd+'℃</span>'+
							'</div>'+
							'<div class="fl yb_text">'+
								'<div>'+forecastWeatherText(fa,fb)+'</div>'+
								'<div>'+Parse.windDirec(isNight?ff:fe)+' '+Parse.windLevel(isNight?fh:fg)+'</div>'+
							'</div>'+
						'</div>'+
					'</li>';
			});
			$yb_date.html(html);
			initTrend(maxTemp,minTemp,labels_top,labels_bottom);
			Loading.hide();
			isInitedForcast = true;
		}
		function initTrend(max,min,labels_top,labels_bottom){
			var data = [{
	         		name : '最高温',
	         		value: max,
	         		color:'#FF7E00',
	         		line_width: 2
	         	},{
	         		name : '最低温',
	         		value: min,
	         		color: '#0d8ecf',
	         		line_width: 2
	         	}
	        ];
	        var html = '';
	        var len = labels_top.length;
	        $.each(labels_top,function(i,v){
	        	html += '<div class="fl" style="width:'+(1/len*100)+'%">'+v+'</div>';
	        });
	        $('#chart_top').html(html);
	        html = '';
	        var len = labels_bottom.length;
	        $.each(labels_bottom,function(i,v){
	        	html += '<div class="fl" style="width:'+(1/len*100)+'%">'+v+'</div>';
	        });
	        $('#chart_bottom').html(html);
	        var line = new iChart.LineBasic2D({
				render : 'chart_content',
				data: data,
				align:'center',
				width : $('#chart_content').width(),
				height : $('#chart_content').height(),
				// fit:true,
				border: null,
				sub_option : {
					smooth:true,
					listeners : {
						parseText : function(r, t) {
							return t +'℃';
						}
					}
				},
				background_color: 'rgba(0,0,0,0)',
				coordinate:{
					width: '90%',
					height: 240,
					striped: true,
					axis:{
						width: 0
					},
					scale2grid:false,
					offsetx: -3,
					// grids:{
					// 	horizontal:{
					// 		way:'share_alike',
					// 		value: 6
					// 	}
					// },
					grid_color : '#ffffff',
					scale:[{
						position:'left',
						start_scale: Math.min.apply(Math,min),
						end_scale: Math.max.apply(Math,max),
						scale_enable: false,
						listeners: {
							parseText : function(text) {
								return {text:''}
							}
						}
					}
					// ,{
					// 	 position:'top',
					// 	 labels:labels,
					// 	 label: {color:'white',fontsize: 14},
					// 	 textAlign: 'center',
					// 	 color_factor: 0.5,
					// 	 scale_space: 1,
					// 	 scaleAlign: 'center',
					// 	 offsety: -30
					// }
					]
				}
			});
			//开始画图
			line.draw();
		}
	});

	// 检查自动升级
	(function() {
		var style = 'width:100%;position:absolute; left:0; top:50%;text-align:center;padding: 10px 0;color:white;background-color:rgba(0,0,0,0.5)';
		var $update_version = $('<div style="'+style+'"></div>').appendTo($('body'));
		$update_version.hide();

		var Upgrade = require('upgrade');
		var App = require('nw.gui').App;
		var manifest = App.manifest;
		// manifest = {
		// 	version: 'v0.0.1',
		// 	manifestUrl: 'http://10.14.85.116/projects/upgrade_test/package.json'
		// }
		var upgrader = new Upgrade(manifest, function() {
			console.log.apply(console, arguments);
		});
		upgrader.check(function(newVersion) {
			if (confirm('发现新版本'+newVersion+'，是否下载？')) {
				upgrader.download({
					onprocess: function(downloaded, total) {
						var info = Math.floor(Math.min(downloaded/total, 1)*100)+'%';
						// console.log(info, downloaded, total);
						$update_version.html('正在下载安装包:' + info).show();
					},
					onfinish: function(src) {
						require('nw.gui').Window.get().hide();
						require('nw.gui').Shell.openItem(src);
						App.quit();
						// console.log('download', src);
						// upgrader.install();
						// // window.close();
						// setTimeout(function() {
							// App.quit();
						// }, 100);
					}
				});
			}
		});
	})();
});
