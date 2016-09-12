!function(){
	try{
		var Loading = Util.Loading;
		var map;

		var _reqCache = (function() {
			var _cache = {};
			var uniqueUrl;
			var fn = function(url, option, cb) {
				if (typeof option == 'function') {
					cb = option;
					option = null;
				}
				option = $.extend(true, {
					type: 'json',
					unique: true,
					loading: true,
					dealError: true,//是否自动处理错误
				}, option);

				var isUseUnique = option.unique;
				if (isUseUnique) {
					uniqueUrl = url;
				}
				var val = _cache[url];
				if (val) {
					var def = $.Deferred();
					def.resolve([val]); // 兼容$.when使用Deferred
					cb && cb(null, val);
					return def;
				} else {
					var is_json = option.type == 'json';
					return $[is_json? 'getJSON': 'get'](url, function(data) {
						if (is_json && typeof data == 'string') {
							try {
								data = $.parseJSON(data);
							} catch(e){}
						}
						_cache[url] = data;
						if (!isUseUnique || uniqueUrl == url) {
							Loading.hide();
							cb && cb(null, data);
						} else {
							console.log(uniqueUrl, url);
						}
					}).error(function(req, status, error) {
						Loading.hide();
						if (option.dealError) {
							alert('数据请求出现错误！');
						}
						cb && cb(error);
					});
				}
			}
			fn.text = function(url, cb, options) {
				return fn(url, $.extend({
					type: 'text'
				}, options), cb);
			}
			return fn;
		})();

		var URL_TYPHOON = 'http://typhoon.nmc.cn/weatherservice/typhoon/jsons/';
		var URL_LIST = URL_TYPHOON + 'list_default';
		/*统一提示窗口*/
		var infoWin = function(message,option){
			this.infoWindow = new BMap.InfoWindow(message,$.extend({enableAutoPan:false,enableMessage:false},option));  // 创建信息窗口对象
		}
		infoWin.prototype.show = function(point){
			map.openInfoWindow(this.infoWindow,point); //开启信息窗口
		}
		function _formatData(str) {
			if (typeof str == 'string') {
				var m = /^[^(]+\(+([^)]+)\)+/.exec(str);
				if (m) {
					var data = m[1];
					try {
						return $.parseJSON(data);
					} catch(e){}
				}
			}
		}
		$(function(){
			var $map_container = $('#map_container');
			var $title = $map_container.find('.title');
			var is_debug = false;
			var cache_typhoon = {};
			function loadTyphoons(cb, is_active){
				function _getList(list){
					if(is_active){
						list = list.filter(function(v){
							if(is_debug || v.is_active){
								return v;
							}
						});
						if (is_debug) {
							list = list.slice(-6);
						}
					}
					cb(list);
				}
				var val_cache = cache_typhoon[URL_LIST];
				if(val_cache){
					_getList(val_cache);
				}else{
					_reqCache.text(URL_LIST, function(err, result){
						// [2301121,"MELOR","茉莉",1527,"1527",null,"名字来源于：马来西亚 意为：一种花","stop"]
						result = _formatData(result);
						var typhoonList = [];
						if (result) {
							typhoonList = result.typhoonList;
						}
						
						var list = [];
						$.each(typhoonList, function(i, v) {
							list.push({
								is_active: v[7] != 'stop',
								index: v[4],
								code: v[0],
								cnName: v[2],
								enName: v[1],
								nameDesc: v[6]
							});
						});
						var cache = {};
						$.each(list, function(i, v){
							var index = v.index;
							var val = cache[index];
							if(val){
								val.push(v);
							}else{
								cache[index] = [v];
							}
						});
						var list_new = [];
						for(var i in cache){
							var val = cache[i];
							if(val.length > 1){
								val.sort(function(a, b){
									return a.index.localeCompare(b.index);
								});
								var flag_active = false;
								var code_list = [];
								$.each(val, function(i_val, v_val){
									if(v_val.is_active){
										flag_active = true;
									}
									code_list.push(v_val.code);
								});
								val[0].is_active = flag_active;
								val[0].code_list = code_list;
								list_new.push(val[0]);
							}else{
								list_new.push(val[0]);
							}
						}

						list_new.sort(function(a, b){
							return a.index.localeCompare(b.index);
						});
						cache_typhoon[URL_LIST] = list_new;
						_getList(list_new);
					});
				}
			}

			var typhoonList;

			loadTyphoons(function(list) {
				typhoonList = list;
				var activeTyphoons = [];
				var now = new Date().getTime()
				var totalNum = typhoonList.length;
				for(var i = totalNum-1; i>=0;i--){
					var typhoon = typhoonList[i];
					typhoon.i = i;

					var text = (typhoon.cnName||'') + '(第'+typhoon.index+'号台风'+typhoon.enName+')';
					typhoon.title = text;
					$typhoon_list_ul.append($('<li>').html(text));

					if (typhoon.is_active) {
						activeTyphoons.push(typhoon);
					}
				}
				if (activeTyphoons.length > 0) {
					$.each(activeTyphoons, function(i, t) {
						loadTyphoonDetail(t.i, false, true);
					});
				}
			});

			var currentTyphoonIndex = -1;
			var loadTyphoonDetail = (function(){
				var conf_navigation = {
					19: 0.02,
					18: 0.05,
					17: 0.1,
					16: 0.2,
					15: 0.5,
					14: 1,
					13: 2,
					12: 4,
					11: 10,
					10: 20,
					9: 25,
					8: 50,
					7: 100,
					6: 200,
					5: 500,
					4: 1000,
					3: 2000
				}
				function isDefaultWind(wind_val){
					return !wind_val || /^9{4,}/.test(wind_val);
				}
				function SOverlay(point,sPoint, title){//point,icon,text
			        this._point = point;
			        this.sPoint = sPoint;
			        this.title = title;
			    }
			    var supportTouch = 'ontouchstart' in document;
			    var _prop = SOverlay.prototype = new BMap.Overlay();

			    _prop._initWindRadiu = function(labelPane, sPoint, level){
		    		var EN = sPoint['r'+level+'_en'],
		    			ES = sPoint['r'+level+'_es'],
		    			WS = sPoint['r'+level+'_ws'],
		    			WN = sPoint['r'+level+'_wn'];
		    		if(!isDefaultWind(EN) && !isDefaultWind(ES) && !isDefaultWind(WS) && !isDefaultWind(WN)){
			            var div_wind_radiu = $('<div class="wind_radiu level'+level+'">'+
											        '<div class="radiu radiu_en"></div>'+
											        '<div class="radiu radiu_es"></div>'+
											        '<div class="radiu radiu_wn"></div>'+
											        '<div class="radiu radiu_ws"></div>'+
											        '<div class="line line_up"></div>'+
											        '<div class="line line_down"></div>'+
											        '<div class="line line_left"></div>'+
											        '<div class="line line_right"></div>'+
											    '</div>').data('radii'+level, {
											    	EN: EN,
											    	ES: ES,
											    	WS: WS,
											    	WN: WN
											    }).get(0);
			            labelPane.appendChild(div_wind_radiu);
			            this['_div_wind_radiu'+level] = div_wind_radiu;
			        }
			    }
			    function isLegal(val){
			    	return val && !/^9{4,}/.test(val);
			    }

			    _prop.initialize = function(map){
			    	var _this = this;
			    	var title = _this.title;
			    	_this._map = map;
			    	var point = _this._point;
			    	var sPoint = _this.sPoint;
			    	var html = '<p>'+(title||'')+'<br/>'+point.time;
			    	var max_wind_speed = sPoint.wind;
			    	if(isLegal(max_wind_speed)){
						html += '<br/>最大风速：'+max_wind_speed+'(米/秒)';
					}
					var pressure = sPoint.yq;
			    	if(isLegal(pressure)){
						html += '<br/>中心气压：'+pressure+'(百帕)';
					}

			    	var move_speed = sPoint.move_speed;
			    	if(isLegal(move_speed)){
						html += '<br/>移动速度：'+move_speed+'(公里/小时)';
					}
			    	var en7 = sPoint.r7_en;
					if(isLegal(en7)){
						html += '<br/>7级风圈半径：'+en7+'(公里)';
					}
					var en10 = sPoint.r10_en;
					if(isLegal(en10)){
						html += '<br/>10级风圈半径：'+en10+'(公里)';
					}
					html += '</p>';
					var infoWindow = new infoWin(html);
					var $div = $('<div></div>').addClass('c c_'+(_getWindLevel(sPoint.level)));
					$div.html('<div><span></span></div>');
			    	var div = $div.get(0);
			    	$div.on(supportTouch? 'touchstart':'click', function(){
			    		infoWindow.show(point);
			    		$('.wind_radiu').hide()
			    		$(_this['_div_wind_radiu7']).show();
			    		$(_this['_div_wind_radiu10']).show();
			    	});
			    	var labelPane = map.getPanes().labelPane;

			    	_this._initWindRadiu(labelPane, sPoint, 7);
			    	_this._initWindRadiu(labelPane, sPoint, 10);
		            labelPane.appendChild(div);
		            _this._div = div;
		            return div;
			    }
			    _prop._drawWindRadiu = function(level, pos){
			    	var _this = this;
			    	var _div = _this['_div_wind_radiu'+level];
			    	if(_div){
			    		var map = _this._map;
			    		var zoom = map.getZoom();
			    		var navigation = conf_navigation[zoom];
				    	if(navigation){
				    		var $wind_radiu = $(_div).css({
				    			left: pos.x,
				    			top: pos.y
				    		});
				    		var _data = $wind_radiu.data('radii'+level);
				    		var pixel_km = navigation/67;
				    		var pixel_en = _data.EN/pixel_km,
					    		pixel_es = _data.ES/pixel_km,
					    		pixel_ws = _data.WS/pixel_km,
					    		pixel_wn = _data.WN/pixel_km;
					    	var pixel_top_height = Math.abs(pixel_en - pixel_wn),
					    		pixel_bottom_height = Math.abs(pixel_es - pixel_ws),
					    		pixel_left_width = Math.abs(pixel_wn - pixel_ws),
					    		pixel_right_width = Math.abs(pixel_en - pixel_es);
					    	$wind_radiu.find('.radiu_en').css({
					    		width: pixel_en,
					    		height: pixel_en
					    	});
					    	$wind_radiu.find('.radiu_es').css({
					    		width: pixel_es,
					    		height: pixel_es
					    	});
					    	$wind_radiu.find('.radiu_wn').css({
					    		width: pixel_wn,
					    		height: pixel_wn
					    	});
					    	$wind_radiu.find('.radiu_ws').css({
					    		width: pixel_ws,
					    		height: pixel_ws
					    	});

					    	$wind_radiu.find('.line_up').css({
					    		height: pixel_top_height,
					    		'margin-top': -Math.max(pixel_en, pixel_wn)
					    	});
					    	$wind_radiu.find('.line_down').css({
					    		height: pixel_bottom_height,
					    		'margin-top': Math.max(pixel_es, pixel_ws) - pixel_bottom_height
					    	});
					    	$wind_radiu.find('.line_left').css({
					    		width: pixel_left_width,
					    		'margin-right': Math.max(pixel_wn, pixel_ws) - pixel_left_width
					    	});
					    	$wind_radiu.find('.line_right').css({
					    		width: pixel_right_width,
					    		'margin-left': Math.max(pixel_en, pixel_es) - pixel_right_width
					    	});
				    	}
			    	}
			    }
			    _prop.draw = function(){
			    	var _this = this;
			    	var map = _this._map;
		            var pixel = map.pointToOverlayPixel(_this._point);
		            _this._div.style.left = pixel.x + "px";
		            _this._div.style.top  = pixel.y + "px";

		            _this._drawWindRadiu(7, pixel);
		            _this._drawWindRadiu(10, pixel);
			    }
			    _prop.remove = function(){
			    	var _this = this;
			    	$(_this._div).remove();
			    	$(_this['_div_wind_radiu7']).remove();
			    	$(_this['_div_wind_radiu10']).remove();
			    }
				function addClickPoint(points, point, title){
					var index = point._index;
					var sPoint = points[index];
					// var circle = new BMap.Circle(point,2000);

					map.addOverlay(new SOverlay(point, sPoint, title));              // 将标注添加到地图中
					if(sPoint.isForcast){
						var lng = sPoint.lng,
							lat = sPoint.lat;
						var label = new BMap.Label(point.time.replace('中国预报', ''), {
							position: new BMap.Point(point.lng, point.lat),
							offset: new BMap.Size(10, -10)
						});  // 创建文本标注对象
						label.setStyle({
							 color : "rgba(0, 0, 255, 0.6)",
							 fontSize : "16px",
							 height : "20px",
							 lineHeight : "20px",
							 fontFamily:"微软雅黑",
							 width: '34px',
							 textAlign: 'center',
							 border: 'none',
							 background: 'none',
							 fontWeight: 'bold',
						 });
						map.addOverlay(label);
					}
				}
				function formatNum(num){
					return num < 10?'0'+num:num;
				}
				
				var LEVEL = [{
					val: [10.8, 17.1],
					code: 'TD',
					name: '热带低压',
					color: 'rgba(110,196,186, 0.8)'
				}, {
					val: [17.2, 24.4],
					code: 'TS',
					name: '热带风暴',
					color: 'rgba(239,234,58, 0.8)'
				}, {
					val: [24.5, 32.6],
					code: 'STS',
					name: '强热带风暴',
					color: 'rgba(239,124,27, 0.8)'
				}, {
					val: [32.7, 41.4],
					code: 'TY',
					name: '台风',
					color: 'rgba(231,31,30, 0.8)'
				}, {
					val: [41.5, 50.9],
					code: 'STY',
					name: '强台风',
					color: 'rgba(230,38,135, 0.8)'
				}, {
					val: [51.0, 99],
					code: 'SuperTY',
					name: '超强台风',
					color: 'rgba(126,64,149, 0.8)'
				}];
				function _getWindLevel(wind_level) {
					var level = 1;
					for (var i = 1, j = LEVEL.length; i <= j; i++) {
						if (LEVEL[i - 1].code == wind_level) {
							level = i;
							break;
						}
					}
					return level;
				}

				// #4CEEDF
				// #90F46D
				// #FFF203
				// #FF7E00
				// #F71A08
				// #940EE9
				function getLineOpt(is_forcast){
					// var point = points.eq(index);
					// var type = point.attr('type');
					var color = is_forcast?'blue':"#732C37";

					// if(type == 1){
					// 	color = '#4CEEDF';
					// }else if(type == 2){
					// 	color = '#90F46D';
					// }else if(type == 3){
					// 	color = '#FFF203';
					// }else if(type == 4){
					// 	color = '#FF7E00';
					// }else if(type == 5){
					// 	color = '#F71A08';
					// }else if(type == 6){
					// 	color = '#940EE9';
					// }else{
					// 	color = 'blue';
					// }
					return {strokeColor: color, strokeWeight:2, strokeOpacity:0.5,strokeStyle: is_forcast?'dashed':'solid'};//画折线样式
				}
				var typhoonIcon = new BMap.Icon("./img/typhoon/move.png", new BMap.Size(28, 28));

				function drawPoints(points, isReplay, title) {
					function getBDPoint(index) {
						var point = points[index];
					    var bdPoint = new BMap.Point(point.lng, point.lat);
					    bdPoint.time = new Date(point.time).format('yyyy年MM月dd日hh时');
					    var aging = point.aging;
					    var isForcast = !!aging;
					    bdPoint.isForcast = isForcast;
					    if (isForcast) {
					    	var time = new Date(point.time);
					    	time.setHours(time.getHours() + Number(aging));
					    	bdPoint.time = time.format('yyyy/MM/dd hh时 中国预报');
					    }
					    bdPoint._index = index;
					    return bdPoint
					}
					var lastShiKuangPointTime;
					var numOfPoints = points.length;

					var _lastSKPointIndex = numOfPoints - 1;
					var _lastPoint = points[_lastSKPointIndex];
					lastShiKuangPointTime = _lastPoint[1];

					var lastPoint = getBDPoint(_lastSKPointIndex);
					for (var i = _lastSKPointIndex; i>=0; i--) {
						var p = getBDPoint(i);
						if (!p.isForcast) {
							lastPoint = p;
							break;
						}
					}
					
					initMap(lastPoint);
					var mark = new BMap.Label('<img src="./img/typhoon/move.png" class="rotate"/><span class="typhoon_name">'+title+'</span>', {
						position: lastPoint,
						offset: new BMap.Size(-14, -14)
					});
					mark.setStyle({
						border: 'none',
						'background': 'none'
					});
					mark.setZIndex(9999);
					map.addOverlay(mark);
					var currentIndex = 0;
					if(isReplay){
						var runDelay = Math.min(5000/numOfPoints,500);
					}else{
						var runDelay = 0;
					}
					function run(){
						var one = getBDPoint(currentIndex);
					    var two = getBDPoint(currentIndex+1);
					    var polyline = new BMap.Polyline([one,two], getLineOpt(two.isForcast));
					    map.addOverlay(polyline);
					    addClickPoint(points, one, title);
					    var _lastPoint = points[currentIndex+1];

				        
				        if(currentIndex++ < numOfPoints-2){
				        	runTT = setTimeout(run,runDelay);
				        }else{
				        	addClickPoint(points,two, title);
					        $('.wind_radiu').hide().last().show();
				        }
					}
					if(isReplay){
						runTT = setTimeout(run, 1000);
					}else{
						runTT = setTimeout(run, 0);
					}
				}
				var $t_title = $('.t_title');
				var _current_title;

				var cache_typhoon = {};
				var _is_inited = false;
				return function(typhoon_index, isReplay, isFromInit) {
					if(!isReplay && currentTyphoonIndex == typhoon_index){
						return;
					}
					currentTyphoonIndex = typhoon_index;
					var typhoon = typhoonList[typhoon_index];
					function cb(points) {
						Loading.hide();

						// var cname = data[2];
						drawPoints(points, isReplay, typhoon.title);
					}
					var code = typhoon.code;
					var key = 'typhoon_'+code;
					var val_cache = cache_typhoon[key];
					if (val_cache) {
						cb(val_cache);
					} else {
						Loading.show();
						_reqCache.text(URL_TYPHOON + 'view_' + code, function(err, data) {
							if (!err) {
								data = _formatData(data).typhoon;
								var points = data[8];
								var items = [];
								$.each(points, function(i, v) {
									var time = new Date(v[2]);
									// time.setHours(time.getHours());
									var obj = {
										time: time,
										lat: v[5],
										lng: v[4],
										level: v[3],
										wind: v[7],
										yq: v[6],
										move_speed: v[9],
										move_dir: v[8]
									};
									var wind_radius = v[10];
									var wr_7 = wind_radius[0];
									if (wr_7) {
										obj.r7_en = wr_7[1];
										obj.r7_es = wr_7[2];
										obj.r7_ws = wr_7[3];
										obj.r7_wn = wr_7[4];
									}
									var wr_10 = wind_radius[1];
									if (wr_10) {
										obj.r10_en = wr_10[1];
										obj.r10_es = wr_10[2];
										obj.r10_ws = wr_10[3];
										obj.r10_wn = wr_10[4];
									}
									var wr_12 = wind_radius[2];
									if (wr_12) {
										obj.r12_en = wr_12[1];
										obj.r12_es = wr_12[2];
										obj.r12_ws = wr_12[3];
										obj.r12_wn = wr_12[4];
									}

									// _init(obj.lng, obj.lat);
									var forecast = [];
									var babj_forecast = v[11];
									if (babj_forecast && (babj_forecast = babj_forecast.BABJ)) {
										$.each(babj_forecast, function(i_f, v_f) {
											var time = v_f[1];
											time = new Date(time.substr(0, 4)+'/'+time.substr(4, 2)+'/'+time.substr(6, 2)+' '+time.substr(8, 2)+':'+time.substr(10, 2));
											time.setHours(time.getHours() + 8);
											forecast.push({
												aging: v_f[0],//预报时效
												time: time.getTime(),
												lat: v_f[3],
												lng: v_f[2],
												level: v_f[7],
												wind: v_f[5],
												qy: v_f[4]
											});
										});
									}
									obj.forecast = forecast;
									items.push(obj);
								});
								var p_last = items[items.length - 1];

								items = items.concat(p_last.forecast);
								cache_typhoon[key] = items;
								// 24小时更新的自动显示
								if (isFromInit || _is_inited || new Date().getTime() - p_last.time.getTime() < 1000*60*60*24) {
									cb(items);
								}

								_is_inited = true;
							}
						}, {
							unique: !isFromInit
						});
					}
				}
				
			})();


			/*回放按钮*/
			$('.btn_reset').click(function(){
				if(currentTyphoonIndex > -1){
					reset();
					loadTyphoonDetail(currentTyphoonIndex,true);
				}
			});

			/*台风列表按钮事件*/
			var $typhoon_list = $('.typhoon_list').click(function(){
				$typhoon_list_ul.parent().toggle();
			});
			/*切换台风*/
			var $typhoon_list_ul = $typhoon_list.find('ul').click(function(e){
				setTimeout(function(){
					reset();
					loadTyphoonDetail(typhoonList.length - 1 - $(e.target).index());
				},100);
			});
			var $typhoon_list_container = $typhoon_list_ul.parent();
			var year = 0;

			// var $info = $map_container.find('.info');
			// var $info_title = $info.find('div:first span');
			// var $info_list = $info.find('ul');
			// /*展开按钮事件*/
			// $info.click(function(){
			// 	$info.toggleClass('on');
			// });

			//图例按钮
			$('.btn_legend').click(function(){
				$(this).find('ul').toggle();
			})

			var runTT;
			function reset(){
				$('.t_title').children().remove();
				clearTimeout(runTT);
				map && map.clearOverlays();
			}
			var lastPointForCenter;
			/*初始化地图*/
			function initMap(centerPoint){
				if(!map){
					var map_id = 'map_'+new Date().getTime();
					$('<div></div>').attr('id',map_id).addClass('map_c').prependTo($map_container);
					map = new BMap.Map(map_id,{minZoom: 4/*,mapType: BMAP_HYBRID_MAP*/});
					map.setZoom(5);
					map.disableInertialDragging();
				    map.enableScrollWheelZoom();    //启用滚轮放大缩小，默认禁用
				    map.enableContinuousZoom();    //启用地图惯性拖拽，默认禁用
					map.addControl(new BMap.NavigationControl({anchor: BMAP_ANCHOR_BOTTOM_RIGHT, type: BMAP_NAVIGATION_CONTROL_ZOOM,offset: new BMap.Size(20, 100)}));  //右下角，仅包含缩放按钮
					map.addEventListener('zoomend',function(){
						lastPointForCenter && map.setCenter(lastPointForCenter);
					});
				}
				map.centerAndZoom(centerPoint, map.getZoom());
			}

			initMap(new BMap.Point(121.423856,31.294332));

			var Nav = Util.Nav;
			/*初始化头部及左侧导航*/
			Nav.Top.init(function($nav){
				$nav.prependTo($('body'));
			});


			$('.btn_nav').click(function(){
				Nav.toggle();

			});
			$(document).on('back',function(){
				Nav.toggle(true);
			});
		})
	}catch(e){
		console.log(e);
	}
}();
