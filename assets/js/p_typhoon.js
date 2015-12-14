!function(){
	// var win = nwDispatcher.requireNwGui().Window.get();
	// win.showDevTools();
	try{
		var Loading = Util.Loading;
		var map;
		var cache = {};
		/*得到xml并缓存数据*/
		var loadXML = function(xmlURl,callback){

			var xmlDoc = cache[xmlURl];
			if(xmlDoc){
				callback(xmlDoc,xmlURl);
			}else{
				$.get(xmlURl,function(html){
					html = html.replace('<?xml version="1.0" encoding="utf-8"?>','');
					cache[xmlURl] = html;
					callback(html,xmlURl);
				},'text');
			}

		}
		var currentYear = new Date().getFullYear();
		var NUM_SHOW_TYPHOON_NUM = 2;
		function getXmlPath(year,name){
			return 'http://typhoon.weather.com.cn/data/typhoondata/'+year+"/"+name;
			// return '../test/data/typhoon/'+name;
		}
		/*统一提示窗口*/
		var infoWin = function(message,option){
			this.infoWindow = new BMap.InfoWindow(message,$.extend({enableAutoPan:false,enableMessage:false},option));  // 创建信息窗口对象
		}
		infoWin.prototype.show = function(point){
			map.openInfoWindow(this.infoWindow,point); //开启信息窗口
		}

		$(function(){
			var $map_container = $('#map_container');
			var $title = $map_container.find('.title');
			var totalNum = 0;
			var typhoonList;
			var loadTyphoons = (function(){
				var _cb;
				var loadTyphoonNum = 0;
				var $loadedTyphoon;
				var loadCallback = function(typhoonInfo,path){
					// console.log(path,'is loaded');
					var $c = $(typhoonInfo).children();
					if($loadedTyphoon){
						$loadedTyphoon = $loadedTyphoon.add($c);
					}else{
						$loadedTyphoon = $c;
					}

					loadTyphoonNum++;
					if(loadTyphoonNum == NUM_SHOW_TYPHOON_NUM){
						Loading.hide();
						$loadedTyphoon.sort(function(a,b){
							return $(a).attr('typhoonNo').localeCompare($(b).attr('typhoonNo'));
						});
						_cb && _cb($loadedTyphoon);
					}
				}

				return function(callback){
					Loading.show();
					_cb = callback;
					for(var i = 0;i<NUM_SHOW_TYPHOON_NUM;i++){
						var path = getXmlPath(currentYear-i,'list.xml');
						// console.log(path,'is loading');
						loadXML(path,loadCallback);
					}
				}
			})();
			loadTyphoons(function($loadedTyphoon){
				typhoonList = $loadedTyphoon;
				/*初始化台风列表*/
				for(var i = typhoonList.length-1;i>=0;i--){
					var $elem = typhoonList.eq(i);
					var text = title = $elem.attr('nameCN');
					var m = /^(\d{2})(\d{2})$/.exec($elem.attr('typhoonNo'));

					if(m){
						var _y = m[1];
						if(_y != year){
							text = '<div>20'+_y+'</div>'+text;
							year = _y;
						}
						$elem.data('year','20'+year);
						var en = '(第'+m[2]+'号台风'+$elem.attr('nameEN')+')';
						text += en;
						title += en;
					}
					$elem.data('title',title);
					$typhoon_list_ul.append($('<li>').html(text));
				}
				totalNum = typhoonList.length;
				// initTyphoon(0);
				var isHaveActive = false;
				var now = new Date().getTime()
				for(var i = totalNum - 1;i>0;i--){
					var _item = typhoonList.eq(i);
					if(_item.attr('isActive') == '1'){
						var dtCode = _item.attr('dtCode');
						var dtTime = new Date(dtCode.substr(0, 4)+'/'+dtCode.substr(4, 2)+'/'+dtCode.substr(6, 2)+' '+dtCode.substr(8, 2)+':'+dtCode.substr(10, 2)+':00');
						dtTime.setDate(dtTime.getDate() + 3);
						if (dtTime.getTime() > now) { //只显示更新时间小于当前时间3天的数据
							isHaveActive = true;
							loadTyphoonDetail(i);
						}
					}
				}
				// if(!isHaveActive){
				// 	loadTyphoonDetail(0);
				// }
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
			    	var EN = sPoint.attr('EN'+level+'Radii'),
		    			ES = sPoint.attr('ES'+level+'Radii'),
		    			WS = sPoint.attr('WS'+level+'Radii'),
		    			WN = sPoint.attr('WN'+level+'Radii');
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
			    	var max_wind_speed = sPoint.attr('CenterWindSpeed');
			    	if(isLegal(max_wind_speed)){
						html += '<br/>最大风速：'+max_wind_speed+'(米/秒)';
					}
					var pressure = sPoint.attr('CenterPressure');
			    	if(isLegal(pressure)){
						html += '<br/>中心气压：'+pressure+'(百帕)';
					}

			    	var move_speed = sPoint.attr('FutureWindSpeed');
			    	if(isLegal(move_speed)){
						html += '<br/>移动速度：'+move_speed+'(公里/小时)';
					}
			    	var en7 = sPoint.attr('EN7Radii');
					if(isLegal(en7)){
						html += '<br/>7级风圈半径：'+en7+'(公里)';
					}
					var en10 = sPoint.attr('EN10Radii');
					if(isLegal(en10)){
						html += '<br/>10级风圈半径：'+en10+'(公里)';
					}
					html += '</p>';
					var infoWindow = new infoWin(html);
					var $div = $('<div></div>').addClass('c c_'+(sPoint.attr('type')||'yb'));
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
					var sPoint = points.eq(index);
					// var circle = new BMap.Circle(point,2000);

					// var myIcon = new BMap.Icon('img/a.png', new BMap.Size(10, 10),{imageOffset: new BMap.Size(3, 3)});
					// // var marker1 = new BMap.Marker(point,{icon:myIcon});  // 创建标注
					// var html = '<p>'+point.time+'<br/>经度：'+sPoint.attr('jd')+'<br/>纬度：'+sPoint.attr('wd')+'<br/>气压：'+sPoint.attr('qy')+'百帕<br/>最大风速：'+sPoint.attr('fs')+'米/秒<br/>7级风半径：'+sPoint.attr('b7')+'公里<br/>10级风半径：'+sPoint.attr('b10')+'公里</p>';
					// var infoWindow = new infoWin(html);
					// marker1.addEventListener('click', function(){
					// 	infoWindow.show(point);
					// });
					map.addOverlay(new SOverlay(point, sPoint, title));              // 将标注添加到地图中
					if(!sPoint.attr('type')){
						var lng = sPoint.attr('jd'),
							lat = sPoint.attr('wd');
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
				var parseDetail = function(html){
					var $html = $(html);
					var $c = $html.children();
					return {
						points: $c.find('PathPoint'),
						incpoints: $c.find('IncPoint'),
						loadpoints: $c.find('LoadPoint'),
						cname: $html.attr('cnName')
					}
				}
				function formatNum(num){
					return num < 10?'0'+num:num;
				}

				// #4CEEDF
				// #90F46D
				// #FFF203
				// #FF7E00
				// #F71A08
				// #940EE9
				function getLineOpt(points,index){
					var point = points.eq(index);
					var type = point.attr('type');
					var color = type?"#732C37":'blue';

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
					return {strokeColor: color, strokeWeight:2, strokeOpacity:0.5,strokeStyle: type?'solid':'dashed'};//画折线样式
				}
				var typhoonIcon = new BMap.Icon("./img/typhoon/move.png", new BMap.Size(28, 28));



				function drawPoints(points,incpoints,loadpoints,title,isReplay){
					var lastShiKuangPointTime;
					function getBDPoint(index){
					    var point = points.eq(index);
					    var bdPoint = new BMap.Point(point.attr('x'), point.attr('y'));
					    var type = point.attr('type');
					    bdPoint.time = point.attr('year')+'年'+point.attr('month')+'月'+point.attr('day')+'日'+point.attr('time')+'时';
					    if(!type){
					    	if(lastShiKuangPointTime){
					    		var date = new Date(lastShiKuangPointTime);
					    		date.setHours(date.getHours()+parseInt(point.attr('limitation')));
					    		var year = formatNum(date.getFullYear());
					    		var month = formatNum(date.getMonth()+1);
					    		var day = formatNum(date.getDate());
					    		var hour = formatNum(date.getHours());
					    		bdPoint.time = [year,month,day].join('/')+' '+hour+'时 中国预报';
					    	}
					    }
					    bdPoint._index = index;
					    return bdPoint
					}
					var _lastSKPointIndex = 0;
					var numOfPoints = points.length;
					if(!isReplay){
						for(var i = numOfPoints-1;i>0;i--){
							var point = points.eq(i);
							// console.log(title,i,point.attr('type'));
							if(point.attr('type')){

								_lastSKPointIndex = i;
								break;
							}
						}
					}
					var _lastPoint = points.eq(_lastSKPointIndex);
					var year = _lastPoint.attr('year');
	        		var month = _lastPoint.attr('month');
	        		var day = _lastPoint.attr('day');
	        		var hour = _lastPoint.attr('time');
	        		lastShiKuangPointTime = new Date(year+'/'+month+'/'+day+' '+hour+':00:00').getTime();
	        		initMap(getBDPoint(_lastSKPointIndex));
	        		// console.log(lastShiKuangPointTime);

					var firstPoint = getBDPoint(0);
					if(!typhoonMark){
						typhoonMark = new BMap.Marker(firstPoint,{icon:typhoonIcon});
						typhoonMark.setTop(true);
						map.addOverlay(typhoonMark);
						setTimeout(function(){
							$('.BMap_Marker.BMap_noprint').remove();//减少对可点区域的遮挡
							$('img[src="./img/typhoon/move.png"]').addClass('rotate').parent().parent().append('<span class="typhoon_name">'+title+'</span>');
						}, 200);
					}
					// new infoWin(firstPoint.time).show();
					var currentIndex = 0;
					if(isReplay){
						var runDelay = Math.min(5000/numOfPoints,500);
					}else{
						var runDelay = 0;
					}
					function run(){
						var one = getBDPoint(currentIndex);
					    var two = getBDPoint(currentIndex+1);
					    var polyline = new BMap.Polyline([one,two], getLineOpt(points,currentIndex+1));
					    map.addOverlay(polyline);
					    addClickPoint(points,one, title);
					    var _lastPoint = points.eq(currentIndex+1);

				        if(_lastPoint.length > 0){
				        	if(_lastPoint.attr('type')){
				        		lastPointForCenter = two;
				        		if(isReplay){
				        			initMap(two);
				        		}
				        		typhoonMark.setPosition(two);
				        	}
				        }
				        if(currentIndex++ < numOfPoints-2){
				        	runTT = setTimeout(run,runDelay);
				        }else{
				        	addClickPoint(points,two);
				        	var pathArr = [];
				        	incpoints.each(function(){
				        		var $this = $(this);
				        		pathArr.push(new BMap.Point($this.attr('x'), $this.attr('y')));
				        	});
				        	var polygon = new BMap.Polygon(pathArr, {strokeWeight: 1,strokeColor:'#7B9AE3',fillColor:'#7B9AE3',strokeOpacity:0.7,fillOpacity:0.7});
					        // pathOverlay.push(polygon);
					        map.addOverlay(polygon);

					        $('.wind_radiu').hide().last().show();
				        }
					}
					if(isReplay){
						runTT = setTimeout(run,1000);
					}else{
						runTT = setTimeout(run,0);
					}
					loadpoints.each(function(){
						var $this = $(this);
						var myIcon = new BMap.Icon('img/typhoon/1.png', new BMap.Size(14, 14));
						var posPoint = new BMap.Point($this.attr('x'), $this.attr('y'));
						var carMk = new BMap.Marker(posPoint,{icon: myIcon,title: $this.attr('cityName')});
						map.addOverlay(carMk);

						var info = $this.attr('inf');
						if(info){
							new infoWin('<br/>'+info).show(posPoint);
						}
					});
				}
				var $t_title = $('.t_title');
				var _current_title;
				return function(typhoon_index,isReplay){
					if(!isReplay && currentTyphoonIndex == typhoon_index){
						return;
					}
					currentTyphoonIndex = typhoon_index;
					// typhoon_index = typhoonList.length - 1 - typhoon_index;
					var $info = typhoonList.eq(typhoon_index);
					var title = $info.data('title');

					var detailPath = getXmlPath($info.data('year'),$info.attr('typhoonNo')+'.xml');
					// console.log(detailPath+" is loading!");
					Loading.show();
					loadXML(detailPath,function(html){
						Loading.hide();
						var points = parseDetail(html);
						var cname = points.cname;
						// 修正没有中文名的情况
						if(title.indexOf('(') == 0){
							title = cname + title;
							$info.data('title',title);
						}
						title = title.replace('(', '('+$info.data('year')+'年');
						$t_title.append('<li>'+title+'</li>');
						// console.log(detailPath+" is loaded!",points);
						drawPoints(points.points,points.incpoints,points.loadpoints,title,isReplay);
					});
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
			var typhoonMark;
			function reset(){
				$('.t_title').children().remove();
				typhoonMark = null;
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
