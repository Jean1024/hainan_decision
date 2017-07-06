/*简单播放器*/
var win = nwDispatcher.requireNwGui().Window.get();
	win.showDevTools();
(function(global){
	var Store = Util.Store;
	var $container;
	var progressWidth;
	$(function(){
		$container = $('.container');
		progressWidth = $container.width() - 55;
	})
	var delay = 1000;
	var isShowMenu = Store.get('play');

	var isShowedNotice = isShowMenu;//是否已经显示过提示
	var Player = function(_totalNum,callback,tuli){
		var self = this;
		self.cIndex = -1;
		self.tIndex = _totalNum;
		var width = progressWidth / _totalNum - 5;
		self.pWidth = width;
		var $html = '<div class="fix_layer bottom_layer nav_animate">';
					if(tuli){
						$html += '<div class="tuli_layer"><img src="'+tuli+'"/></div>';
					}
					$html +='<span class="btn_player">';
					if(!isShowedNotice){
						isShowedNotice = true;
						$html += '<div class="notice" id="n_play"><i>点击这里播放</i><div><div></div></div></div>';
					}
					$html += '</span>';
						$html +='<div class="progress">';
						$html += '<div class="handle" style="left:'+(width*_totalNum)+'px"><i></i></div>';
						for(var i = 0;i<_totalNum;i++){
							$html += '<span data-index='+i+' style="width:'+width+'px" class="on"></span>'
						}
			$html +=			'</div>'+
							'</div>';
		$html = $($html).appendTo($container);
		self.playerTT;
		var $btn_play = $html.find('.btn_player').click(function(){
			Store.set('play',true);
			var $this = $(this);
			$('#n_play').hide();
			if($this.hasClass('pause')){
				self.stop();
				$this.removeClass('pause');
			}else{
				$this.addClass('pause');
				self.play(0);
			}
		});
		var $btns = self.progressBtns = $html.find('.progress span').click(function(){
			self.stop();
			self.play($(this).data('index'),true);
		});
		var $handle = self.handle = $html.find('.progress .handle');
		self.playerHTML = $html;
		self.callback = callback || function(toIndex,fn){fn()};
	}
	var prop = Player.prototype;
	prop.play = function(index,isFromProgress){
		var self = this;
		var callback = self.callback;
		var cIndex = self.cIndex;
		var tIndex = self.tIndex;
		var toIndex = index != null? index:cIndex+1<tIndex?cIndex+1:-1;
		if(toIndex < 0){
			self.stop();
			// callback(0);
		}else{
			var $span = self.progressBtns.removeClass('on');
			self.playerHTML.find('.progress .time').show();
			$span.filter(':lt('+toIndex+'),:eq('+toIndex+')').addClass('on');
			self.handle.css({left: self.pWidth * (toIndex+1) + 2});
			self.cIndex = toIndex;
			callback(toIndex,function(){
				if(!isFromProgress){//当点击进度条上的按钮时不继续播放
					self.playerTT = setTimeout(function(){;
						self.play();
					},delay);
				}
			});
		}
	}
	prop.stop = function(){
		var self = this;
		self.cIndex = -1;
		// self.playerHTML.find('.progress .time').hide();
		// self.progressBtns.removeClass('on');
		self.playerHTML.find('.btn_player').removeClass('pause');
		// self.handle.css({left: 0});
		clearTimeout(this.playerTT);
	}
	prop.hide = function(){
		this.stop();
		this.playerHTML.remove();
	}
	var relativeWidth;//时间提示参考最外层容器的宽度
	prop.showText = function(text){
		var self = this;
		var $html = self.playerHTML;
		var $time = $html.find('.progress .time');
		if($time.length == 0){
			$time = $('<div class="time"><i></i><div></div></div>').appendTo($html.find('.progress'));
		}
		if(text){
			try{
				$time.find('i').text(text);
				var toItem = $html.find('span.on').last();

				var toItemW = toItem.width();
				var timeW = $time.width();
				var toItemLeft = toItem.position().left + toItemW - timeW/2;
				var toLeft = toItemLeft;// - (timeW - toItemW)/2;
				var sorrowLeft = timeW / 2 - 10;
				if(!relativeWidth){
					relativeWidth = $html.find('.progress').width()+10;
				}
				if(toLeft + timeW > relativeWidth){
					var fixedLeft = relativeWidth - timeW;
					sorrowLeft += toLeft - fixedLeft;
					toLeft = fixedLeft;
				}else if(toLeft < 0){
					sorrowLeft += toLeft;
					toLeft = 0;
				}

				$time.find('div').css({
					left: sorrowLeft
				});
				$time.css({
					left:  toLeft
				}).show();
			}catch(e){}
		}else{
			$time.hide();
		}
	}
	global.Player = Player;
})(this);
$(function(){
	var U = Util;
	var Nav = U.Nav;
	var getJson = U.getJson;
	var Store = U.Store;
	var Loading = U.Loading;
	var $win = $(window),
		$doc = $(document);
	var _w_width = $win.width();
	var $map_container = $('#map_container');
	var $operator = $('#operator');
	var _middle_left = (_w_width-$operator.width())/2;
	$operator.css('left',_middle_left);//水平居中
	var _oldStyle = {
		left: _middle_left,
		top: parseFloat($operator.css('top')),
		width: $operator.width(),
		height: $operator.height(),
		'transform-origin': '50% 50%',
		'transform': 'scale(1)'
	}
	var gm;
	function resetMap(){
		gm && gm.resize();
		$doc.trigger('map_resize');
	}
	var isShowNav = false;
	$doc.on('nav_toggle',function(){
		isShowNav = Nav.isShow();
	});
	var resetBackground;
	var resetToOldOffset;
	var _is_operate = false;
	// 初始化缩放事件
	var GLOBAL_CAN_SCALE = true;// 是否可缩放
	!function(){
		var data_pinch = {
			origin: {
				x: 0,
				y: 0
			},
			middle: {
				x: 0,
				y: 0
			},
			move: {
				x: 0,
				y: 0,
				offset: null
			},
			size: {
				width: 0,
				height: 0
			}
		}


	    resetToOldOffset = function(callback){
	    	var _o_width = _oldStyle.width,
	    		_o_height = _oldStyle.height;
	    	data_pinch.size = {
    			width: _o_width,
    			height: _o_height
    		}
    		//缩放时会用到原始尺寸
	    	_oldOffset = {
				left: _oldStyle.left,
				top: _oldStyle.top
			}
	    	$operator.css(_oldStyle);
	    	resetMap();
	    	callback && callback();
	    }

		var _oldOffset = $operator.position();
		var _width_operator = $operator.width();
		/*
		ios移动设备对canvas的最大的尺寸有限制
		thx for http://stackoverflow.com/questions/6081483/maximum-size-of-a-canvas-element
		iPod Touch 16GB = 1448x1448
		iPad Mini       = 2290x2289
		iPhone 3        = 1448x1448
		iPhone 5        = 2290x2289
		*/
		var MAX_WIDTH = $.browser.safari ? 2285 : _width_operator * 4,
			MIN_WIDTH = Math.min($win.width(),_width_operator/2);
		var _operate_tt;
		var _isPinched = false;
		var _resizeFn;
		var _isMoving = false;
	    resetBackground = (function(){
	    	var size_data = {};
	    	// {"xin_jiang":{"w":6795.146734439438,"h":6795.146734439438,"l":-2943.6683086741596,"t":-2313.423411248769},"xi_zang":{"w":7514.949667826937,"h":7514.949667826937,"l":-3437.010625680976,"t":-2282.952603870369},"nei_meng_gu":{"w":5407.087123025369,"h":5407.087123025369,"l":-2972.080837513267,"t":-1923.6518929381639},"qing_hai":{"w":11442.163179916313,"h":11442.163179916313,"l":-5850.088658885705,"t":-3742.5109006826665},"si_chuan":{"w":13964.808503776176,"h":13964.808503776176,"l":-7688.000268766632,"t":-4188.131668772007},"hei_long_jiang":{"w":11224.883449631669,"h":11224.883449631669,"l":-7491.722569076891,"t":-4322.662727645879},"gan_su":{"w":9535.077656184056,"h":9535.077656184056,"l":-5014.878594542354,"t":-3166.0362925671516},"yun_nan":{"w":18097.197241475402,"h":18097.197241475402,"l":-9978.604576643103,"t":-4990.316255093868},"guang_xi":{"w":20622.688231791995,"h":20622.688231791995,"l":-12073.87918237744,"t":-5660.03314149632},"hu_nan":{"w":28605.407949790766,"h":28605.407949790766,"l":-17352.08192028186,"t":-8381.510129927321},"shan_xi_1":{"w":27285.497304299108,"h":27285.497304299108,"l":-16104.190204453153,"t":-8942.209249404843},"guang_dong":{"w":20887.498854734014,"h":20887.498854734014,"l":-12758.429427520468,"t":-5663.573604358297},"ji_lin":{"w":16270.872851014052,"h":16270.872851014052,"l":-10901.628198035492,"t":-6062.31792987546},"he_bei":{"w":24294.979582294272,"h":24294.979582294272,"l":-15292.781764339157,"t":-8480.87001246883},"hu_bei":{"w":20385.35133721309,"h":20385.35133721309,"l":-12330.607572091798,"t":-6412.658601974756},"gui_zhou":{"w":26470.458505272807,"h":26470.458505272807,"l":-15383.358092618064,"t":-7750.257527128227},"shan_dong":{"w":19706.02002503129,"h":19706.02002503129,"l":-12531.708044146091,"t":-6234.461031},"jiang_xi":{"w":32245.881050889508,"h":32245.881050889508,"l":-20325.398179561427,"t":-9427.326851468753},"he_nan":{"w":24979.021681649956,"h":24979.021681649956,"l":-15346.248545743018,"t":-8148.604874765647},"liao_ning":{"w":22449.605236627594,"h":22449.605236627594,"l":-14721.877221534123,"t":-8122.3541780683845},"shan_xi_2":{"w":36193.97427264489,"h":36193.97427264489,"l":-22205.100842872693,"t":-12369.163280469946},"an_hui":{"w":32843.08990539602,"h":32843.08990539602,"l":-20900.156086049603,"t":-10388.169549735574},"fu_jian":{"w":31670.003250777085,"h":31670.003250777085,"l":-20303.913691866925,"t":-9108.697047887994},"zhe_jiang":{"w":31670.003250777085,"h":31670.003250777085,"l":-20645.435157154723,"t":-9648.295678498123},"jiang_su":{"w":27711.393599999996,"h":27711.393599999996,"l":-17837.74112,"t":-8956.286399999999},"chong_qing":{"w":31670.64671461666,"h":31670.64671461666,"l":-18665.027185176194,"t":-9832.910520541283},"ning_xia":{"w":46672.4321815678,"h":46672.4321815678,"l":-27284.846038684973,"t":-16101.109946703406},"hai_nan":{"w":59118.06007509407,"h":59118.06007509407,"l":-35810.09511889875,"t":-15422.102628285409},"tai_wan":{"w":80614.70262722389,"h":80614.70262722389,"l":-53351.89015308237,"t":-22542.514480761285},"bei_jing":{"w":77109.3687855557,"h":77109.3687855557,"l":-49269.20197872894,"t":-28197.808063319466},"tian_jin":{"w":118240.6045664877,"h":118240.6045664877,"l":-76315.1542137605,"t":-42703.368353182326},"shang_hai":{"w":147792.347586992,"h":147792.347586992,"l":-98448.44344363356,"t":-47670.62434815601},"xiang_gang":{"w":197062.69152971,"h":197062.69152971,"l":-124383.64323641009,"t":-55317.66940581563},"ao_men":{"w":2365350.364188193,"h":2365350.364188193,"l":-1489792.3566009288,"t":-663534.1502276256}}
	    	var d = size_data.china = {
	    		"w": 2526,
	    		"h": 2526,
	    		"l": -1094,
	    		"t": -660
	    	}
	    	var b_width = d.w,b_height = d.h,b_left = d.l,b_top = d.t;
	    	var currentLeft,currentTop,currentWidth;
	    	var w_per,
	    		b_left_per,
	    		b_top_per;

	    	currentLeft = b_left+_oldOffset.left,
	    	currentTop = b_top+_oldOffset.top,
	    	currentWidth = b_width;
	    	w_per = b_width/_width_operator,
	    	b_left_per = b_left/b_width;
	    	b_top_per = b_top/b_height;

	    	var is_show_map = false;
	    	var method = {
	    		r: function(id,is_not_use_old_data){
	    			_width_operator = $operator.width();
	    			if(id){
	    				$map_container.removeClass('map');
	    				is_show_map = false;
	    			}else{
	    				$map_container.addClass('map');
	    				is_show_map = true;
			    		this.c();
	    			}
	    		},
	    		c: function(zoom){
	    			if(!is_show_map){
	    				return;
	    			}
		    		zoom = zoom || 1;
	    			currentWidth = w_per * _width_operator * zoom;
		    		var _offset = $operator.position();
		    		currentLeft = currentWidth*b_left_per+_offset.left,
	    			currentTop = currentWidth*b_top_per+_offset.top;
		    		var css = {
		    			'background-size': currentWidth+'px',
			    		'backgroundPosition': currentLeft+'px '+currentTop+'px'
			    	};
		    		$map_container.css(css);
		    	}
	    	}
	    	// method.r();

	    	return method;
	    })();
	    var SUPPORTS_TOUCH = 'ontouchstart' in window;
	    if(!SUPPORTS_TOUCH){ //是pc的话绑定缩放功能
	    	var zoom_step = 1.2;
			$operator.on('mousewheel', function(e){
				e.stopImmediatePropagation();
			})
	    	$map_container.on('mousewheel', function(e){
				e.stopImmediatePropagation();
	    		var e_o = e.originalEvent;
	    		var pinchZoom = e_o.wheelDelta > 0? zoom_step: 1/zoom_step;
	    		$operator.css({
					transform: 'scale('+pinchZoom+')',
					'transform-origin': '50% 50%'
					// 'transform-origin': e_o.layerX+'px '+e_o.layerY+'px'
				});
				resetBackground.c(pinchZoom);
				_getResizeFn(pinchZoom)();
				_isPinched = true;
	    	});
	    }
	    function _getResizeFn(zoom){
	    	return function(){
				var _oldWidth = $operator.width(),
					_oldHeight = $operator.height(),
					_newWidth = _oldWidth * zoom,
					_newHeight = _oldHeight * zoom;
				if(_newWidth > MAX_WIDTH){
					_newHeight = _oldHeight * MAX_WIDTH / _oldWidth;
					_newWidth = MAX_WIDTH;
				}else if(_newWidth < MIN_WIDTH){
					_newHeight = _oldHeight * MIN_WIDTH / _oldWidth;
					_newWidth = MIN_WIDTH;
				}

				var _oldLeft = _oldOffset.left,
					_oldTop = _oldOffset.top,
					_origin = data_pinch.origin,
					_newLeft = _oldLeft - (_newWidth - _oldWidth) * _origin.x/_oldWidth,
					_newTop = _oldTop - (_newHeight - _oldHeight) * _origin.y/_oldHeight;
				$operator.css({
					transform: 'scale(1)',
					width: _newWidth,
					height: _newHeight,
					left: _newLeft,
					top: _newTop
				});
				data_pinch.size = {
					width: _newWidth,
					height: _newHeight
				}
				_width_operator = $operator.width();
				resetOrigin();
				resetMap();
			}
	    }
		var pinchStatus = function(e, phase, direction, distance , duration , fingerCount, pinchZoom){
			if(!SUPPORTS_TOUCH){//兼容pc
				fingerCount = 1;
			}
			if(!GLOBAL_CAN_SCALE && fingerCount == 2){
				return;
			}
			//当菜单打开时不可操作
			if(isShowNav){
				return;
			}
			if(phase == 'start'){
				_oldOffset = $operator.position();
			}
			if(phase == 'move'){
				_is_operate = true;
			}
			if(fingerCount == 2){// 缩放
				var fn = _getResizeFn();
				_resizeFn = function(){
					fn();
					_resizeFn = null;
				};
				if(phase == 'end'){
					_resizeFn();
					_isPinched = true;
				}else if(phase == 'move'){
					/*一个手指的缩放变成两个手指*/
					if(_isMoving){
						resetOrigin();
						_isMoving = false;
					}
					var _toWidth = $operator.width() * pinchZoom;
					if(_toWidth > MAX_WIDTH || _toWidth < MIN_WIDTH){
						return;
					}
					$operator.css({
						transform: 'scale('+pinchZoom+')'
					});
					resetBackground.c(pinchZoom);
				}
			}else if(fingerCount == 1){// 移动
				var touchEvent = SUPPORTS_TOUCH? e.targetTouches[0]: e; //兼容pc
				var _moveData = data_pinch.move;
				if(phase == 'start'){
					_moveData.x = touchEvent.pageX;
					_moveData.y = touchEvent.pageY;
					_moveData.offset = $operator.position();
				}else if(phase == 'move'){
					/*两个手指的缩放变成一个手指*/
					if(_resizeFn){
						_resizeFn();
						_moveData.offset = $operator.position();
					}
					_isMoving = true;
					var _offset = _moveData.offset;
					var _xStep = touchEvent.pageX - _moveData.x,
						_yStep = touchEvent.pageY - _moveData.y;
					var _newLeft = _offset.left + _xStep,
						_newTop = _offset.top + _yStep;
					var _width = data_pinch.size.width,
						_height = data_pinch.size.height;
					var _xM = data_pinch.middle.x,
						_yM = data_pinch.middle.y;

					// 拖拽时边界不可超过中心点
					if(_xM < _newLeft || _xM > _newLeft + _width || _yM < _newTop || _yM > _newTop + _height){
						return;
					}

					$operator.css({
						left:_newLeft,
						top: _newTop
					});
					resetBackground.c();
				}else if(phase == 'end'){
					_isMoving = false;
					resetOrigin();
				}
			}
			if(phase == 'end'){
				_is_operate = false;
			}
		};
		/*https://github.com/mattbryson/TouchSwipe-Jquery-Plugin*/
		$map_container.swipe({
			pinchStatus: pinchStatus,
			pinchThreshold:0,
			triggerOnTouchEnd: true,
			triggerOnTouchLeave: true,
			fingers: 2,
			fallbackToMouseEvents: true,
			tap: function(event, target){/*在$map_container tap事件取代了click事件*/
				var $target = $(target);
				if($target.attr("id") == 'btn_back_china' ||
					$target.is('.layer_weather') || $target.closest('.layer_weather').length > 0 ||
					$target.is('.data_time') || $target.closest('.data_time').length > 0
				){
					$target.click();
				}
			}
		});


		data_pinch.middle = {
			x: $map_container.width() / 2,
			y: $map_container.height() / 2
		}
		data_pinch.size = {
			width: $operator.width(),
			height: $operator.height()
		}
		// 重置transform-origin
		var resetOrigin = function(){
			var _p = $operator.position();
			var _middle = data_pinch.middle;
			var _origin = data_pinch.origin = {
				x:_middle.x  - _p.left,
				y:_middle.y - _p.top
			}
			$operator.css({
				'transform-origin': _origin.x+'px '+_origin.y+'px'
			});
		}
		resetOrigin();
		var _origin = data_pinch.origin;
		_oldStyle['transform-origin'] = _origin.x+'px '+_origin.y+'px';
		/*
		2014-05-23发现在三星note 2/3 都出现了播放时上一个时次的数据影像还在
		！！暂时对所有移动设备进行强制重绘处理
		*/
		var isSpecialSet = /Nexus/.test(navigator.userAgent);//目前只发现Nexus有重绘bug
		$doc.on('resizePinch',function(e,isForce){
			// if(!isSpecialSet){
			// 	return;
			// }
			//手动重置，修复部分mobile上出现的重影现象
			if(!_isPinched || isForce){
				pinchStatus(null,'start');
				pinchStatus(null,'end','in',null,0,2,1);
			}
		});
	}();
	// 初始化数据
	!function(){
		var header_title = $('.fix_layer:first h1');
		var $table_pm = $('#table_pm');
		var $container = $('#container');
		var player;
		var isInitMap = false;
		var global_jsonid;
		/*清除map相关数据*/
		var clearMap = function(){
			if(isInitMap && gm){
				gm.zr.clear();
				gm.zr.un();//清除已经绑定的事件

				isInitMap = false;
				global_jsonid = null;
			}
			$operator.html('');
			$('#n_back').remove();
			$('#btn_back_china').remove();
			U.canBack(false);
		}
		/*根据数据得到一个渲染函数*/
		var renderImg = function(img_items){
			return function(toIndex,nextFn){
				Loading.show();
				$operator.html($('<img>').on('load',function(){
					Loading.hide();
					nextFn && nextFn();
				}).attr('src',img_items[toIndex]['i']));
				return img_items[toIndex]['n']
			}
		}
		/*初始化播放器*/
		var initPlayer = function(items_arr,renderFn,tuli){
			var len = items_arr.length;
			var fn = function(toIndex,nextFn){
				var text = renderFn(toIndex,nextFn);
				player && player.showText(text||'');
			}
			if(len > 1){
				player = new Player(len,fn,tuli);
			}
			// renderFn(items_arr.length-1);//初始化第一个数据
			fn(items_arr.length-1);
		}
		/*配色方案*/
		var COLOR = {
			'jiangshui': function(val){
				val = parseFloat(val);
				if(val >= 0 && val < 1){
					return 'rgba(46,173,6,1)';
				}else if(val >= 1 && val < 10){
					return 'rgba(0,0,0,1)';
				}else if(val >= 10 && val < 25){
					return 'rgba(9,1,236,1)';
				}else if(val >= 25 && val < 50){
					return 'rgba(200,4,200,1)';
				}else if(val >= 50){
					return 'rgba(197,7,36,1)';
				}
			},
			'wendu': function(val){
				val = parseFloat(val);
				if(val < -30){
					return 'rgba(32,24,133,1)';
				}else if(val >= -30 && val < -20){
					return 'rgba(17,74,217,1)';
				}else if(val >= -20 && val < -10){
					return 'rgba(77,180,247,1)';
				}else if(val >= -10 && val < 0){
					return 'rgba(209,248,243,1)';
				}else if(val >= 0 && val < 10){
					return 'rgba(249,242,187,1)';
				}else if(val >= 10 && val < 20){
					return 'rgba(249,222,69,1)';
				}else if(val >= 20 && val < 30){
					return 'rgba(255,168,0,1)';
				}else if(val >= 30 && val < 40){
					return 'rgba(255,109,0,1)';
				}else if(val >= 40 && val < 50){
					return 'rgba(230,0,0,1)';
				}else if(val >= 50){
					return 'rgba(158 ,0,1,1)';
				}

			},
			'bianwen': function(val){
				val = parseFloat(val);
				return val > 0?'rgba(255,0,0,1)':val == 0?'rgba(0,0,0,1)':'rgba(0,0,255,1)'
			},
			'radar': function(){
				return '#f0f';
			},
			'shidu': function(val){
				// return '#000';
				val = parseFloat(val);
				if(val >= 0 && val < 10){
					return 'rgba(255,96,0,1)';
				}else if(val >= 10 && val < 30){
					return 'rgba(254,165,26,1)';
				}else if(val >= 30 && val < 50){
					return 'rgba(255,252,159,1)';
				}else if(val >= 50){
					return '#D6E6DA';
				}
			}
		};
		var fnObj = {
			/*解析风力风向数据*/
			'parseWind': function(data){
				var features = [];
				$.each(data.features,function(i,v){
					var properties = v.properties;
					var speed = properties.speed;
					if(speed == 0){
						return;
					}
					var imgName = '';
					if(speed >= 1 && speed <=2){
						imgName = '1_2';
					}else if(speed >= 3 && speed <=4){
						imgName = '3_4';
					}else if(speed >= 5 && speed <=6){
						imgName = '5_6';
					}else if(speed >= 7 && speed <=8){
						imgName = '7_8';
					}else if(speed >8){
						imgName = '8_';
					}

					properties.rotation = -properties.rotation;//画图为逆时针画，而风数据里为顺时针
					properties.image = './img/geomap/wind_icon/'+imgName+'.gif';
					properties.width = 11;
					properties.height = 13;
					features.push(v);
				});
				data.features = features;
				return data;
			},
			/*解析气压场数据*/
			'parseQYC': function(data){
				$.each(data.features,function(i,v){
					var properties = v.properties;
					var value = properties.value;
					properties.value = 1000 + parseInt(value);
				});
				return data;
			},
			/*单站雷达点击事件*/
			'randarClick': function(e){
				var id = e.target.id;
				initData("http://data.weather.com.cn/cnweather/provdata/pmsc/cmadecision/radar/jc_radar_"+id.toLowerCase()+"_jb.html","单站雷达 - "+e.target.style.title);
			},
			'parseRandar': function(data){
				var features = [];
				$.each(data.features,function(i,v){
					var properties = v.properties;
					properties.rotation = 0;//画图为逆时针画，而风数据里为顺时针
					properties.image = './img/geomap/icon_randar.png';
					properties.width = 40;
					properties.height = 40;
					features.push(v);
					v.geometry.type = 'PointImage';
				});
				data.features = features;
				return data;
			}
		}
		var tt_geo_bg;
		$doc.on('map_resize',function(){
			clearTimeout(tt_geo_bg);
			_afterInitGm();
		});
		function _refreshBg() {
			var left_up = gm.makePoint([107.95,20.62]),
				right_down = gm.makePoint([111.876809,17.576628]);

			if ($operator.find('.bg_img').length == 0) {
				$operator.append('<img class="bg_img" src="./img/geomap/hainan.jpg">');
			}

			$operator.find('.bg_img').css({
				left: left_up[0],
				top: left_up[1],
				width: right_down[0] - left_up[0],
				height: right_down[1] - left_up[1]
			});
		}
		function _afterInitGm() {
			tt_geo_bg = setTimeout(_refreshBg, 400)
		}
		/*解析json类型数据*/
		var parseJson = (function(){
			require_web.config({
		        paths:{
		            zrender:'./js/zrender' ,
					GeoMap:'./js/GeoMap' ,
					"zrender/tool/util":'./js/zrender'
		        }
		    });
			var data,items,no_cache;
			return function (_data,_items,_no_cache,cb){
				data = _data;
				items = _items;
				no_cache = _no_cache;
				try{
					/*对配置文件里的点击事件进行处理（尤其是单站雷达）*/
					var click = data.config.weatherStyle.onclick;
					if(typeof click == 'string'){
						// json文件里不允许定义函数
						data.config.weatherStyle.onclick = fnObj[click];
					}
				}catch(e){}
				var conf = $.extend(true,{
					container: 'operator',
					mapStyle: {
						clickable: false,
						style: {
							strokeColor: 'rgba(0,0,0,0)',
							color: 'rgba(0,0,0,0)'
						}
					}
				},data.config);
				var GeoMap;
				var geomap_config = DEFAULT_CONFIG.geomap || {};
				if(geomap_config.is_forbid_scale){
					GLOBAL_CAN_SCALE = false;
				}
				var _province_id = geomap_config.province_id;
				var isRresized = false;
				var initProvince = function(provinceId,iscanback,callback){
					global_jsonid = provinceId;
					resetBackground.r(global_jsonid);
					getJson('./data/map/'+provinceId+'.geo.json',function(json){
						var fn_run = function(){
							resetBackground.r(global_jsonid);
							gm.clear();
							gm.load(json,{showName: geomap_config.show_name !== false?true:false});
							isInitMap && gm.refreshWeather(provinceId);
							isInitMap && $doc.trigger('resizePinch',true);//手动重置缩放
							if(iscanback){
								var isShowBack = Store.get('back');
								var $n_back = $('#n_back');
								if(isShowBack){
									$n_back.remove();
								}else{
									$n_back = $('<div class="notice" id="n_back"><i>点击返回全国地图</i><div><div></div></div></div>').appendTo($map_container);
									$n_back.show();
								}
								var back = function(){
									Store.set('back',true);
									$n_back.remove();//删除提示

									$btn_back_china.remove();
									U.canBack(false);
									initChina(callback);
								}
								var $btn_back_china = $('<div id="btn_back_china">返回</div>').appendTo($map_container).click(back);
								U.canBack(true);
							}
							callback && callback();
						}
						if(!isInitMap){
							gm = GeoMap.init(conf);
							_afterInitGm();
							fn_run();
							isInitMap = true;
						}else{
							resetToOldOffset(fn_run);
						}
					});
				}
				var initChina = function(callback){
					getJson('./data/map/china.geo.json',function(mapData){
						var fn_run = function(){
							gm.clear();
							gm.load(mapData,{showName:false});
							global_jsonid = null;
							gm.render();
							isInitMap && gm.refreshWeather();
							isInitMap && $doc.trigger('resizePinch',true);//手动重置缩放
							resetBackground.r(global_jsonid);console.log('china');
							gm.zr.on("click",function(e){
				 				//菜单打开时不可操作
				 				if(isShowNav){
									return;
								}
								if(global_jsonid || _is_operate){//防止多次点击
									return;
								}
								var target = e.target;
								if(target){
									/*暂时以此来区分单站雷达点击*/
									if(target.pshapeId && target.pshapeId != target.id){
										return;
									}
									var jsonid = target.id.replace('text','');
									if(isNaN(jsonid)){
										initProvince(jsonid,true,callback);
									}
								}
							 });
							callback && callback();
						}
						if(!isInitMap){
							gm = GeoMap.init(conf);
							_afterInitGm();
							fn_run();
							isInitMap = true;
						}else{
							resetToOldOffset(fn_run);
						}
					});
				}
				return function(toIndex,nextFn){
					Loading.show();
					var fn = cb || function(){
						var colorType = COLOR[data.color];
						var parseFn = fnObj[data.fnname];
						getJson(items[toIndex]['src'],function(pointData){
							if(colorType){
								$.each(pointData.features,function(i,v){
									v.properties.color = colorType(v.properties.value);
								});
							}
							if($.isFunction(parseFn)){
								pointData = parseFn(pointData);
							}
				 			gm.loadWeather(pointData,global_jsonid);
							gm.refresh();

							/*暂时用此方案修复播放时前一个时效的数据重影*/
							// if(++fnNum >= 2){
								isInitMap && $doc.trigger('resizePinch',true);//手动重置缩放
							// }

							if(!isRresized){
								resetBackground.r(global_jsonid);
							}
							isRresized = true;
							Loading.hide();
							nextFn && nextFn();
						},{
							no_cache: no_cache
						});
					}
					if(!isInitMap){
						require_web(['GeoMap'],function(_GeoMap) {
							GeoMap = _GeoMap;
							if(_province_id){
								initProvince(_province_id,geomap_config.is_can_back,fn);
							}else{
								initChina(fn);
							}
						});
					}else{
						conf.showName = !!global_jsonid; //强制对地区名进行处理，点击进各省时显示地区名
						gm.updateCfg(conf);
						if(!global_jsonid){
							$map_container.addClass('map');
						}
						fn();
					}
					var item = items[toIndex];
					return item && item['text']
				}
			}
		})();
		/*地图叠加天气预报数据*/
		var parseJsonForecast = (function(){
			var Parse = U.Parse;
			var currentData;
			var REG_TIME = /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/;
			var today = new Date();
			function getDate(date,addDate){
				var todayDate = new Date(date);
				if(addDate > 0){
		            todayDate.setDate(todayDate.getDate()+addDate);
		        }
		        return [todayDate.getFullYear(),todayDate.getMonth()+1,todayDate.getDate()].join('-');
			}
			function forecastWeatherText(day_code,night_code){
				var day_text = Parse.weatherText(day_code);
				var night_text = Parse.weatherText(night_code);
				var show_text = day_text;
				if(day_text != night_text){
					show_text += '转'+night_text;
				}
				return show_text.replace(/^无?转|转无?$/,'');
			}
			// 绑定刷新按钮
			$map_container.delegate('.data_time', 'click', function(){
				var $btn_refresh = $(this).find('.btn_refresh');
				if($btn_refresh.hasClass('refreshing')){
					return;
				}
				$btn_refresh.addClass('refreshing');
				$('div[data-c_id]').each(function(){
					load7Forecast($(this), true);
				});
			});
			var _fn_refresh = (function(){
				var num_refreshing = 0;
				var time_min = 1000;
				var time_start;
				return {
					add: function(){
						if(num_refreshing == 0){
							time_start = new Date();
						}
						num_refreshing++;
					},
					rm: function(){
						setTimeout(function(){
							if(--num_refreshing == 0){
								setTimeout(function(){
									$('.btn_refresh').removeClass('refreshing');
								}, Math.max(time_min, new Date() - time_start));
							}
						}, 10);
					}
				}
			})();
			var global_time_release;// 显示的发布时间
			function load7Forecast($div, is_fromrefresh){
				is_fromrefresh && _fn_refresh.add();
				var city_id = $div.data('c_id');
				U.initData('forcast7d_'+city_id,'http://hfapi.tianqi.cn/data/?areaid='+ city_id + '&type=forecast7d',function(data){
					is_fromrefresh && _fn_refresh.rm();
					if(data){
						var m = REG_TIME.exec(data.f0);
		                if(m){
		                	today = [m[1],m[2],m[3]].join('-');
		                }
		                var time = data.f.f0;
		                if(time){
							var time_old = $div.data('time');
							if(time_old){
								if(time <= time_old){
									return;
								}
								$div.find('img').remove();
							}
							$div.data('time', time);
							var time_release = time.substr(0, 4)+'年'+time.substr(4, 2)+'月'+time.substr(6, 2)+'日'+time.substr(8, 2)+'时';
							if(!global_time_release){
								$('<div class="data_time"><span>'+time_release+'</span><span>发布的市县未来24小时预报</span><span class="btn_refresh"></span></div>').appendTo($map_container);
								global_time_release = time_release;
							}else if(time_release.localeCompare(global_time_release) > 0){
								$('.data_time').find('span:first').text(time_release);
								global_time_release = time_release;
							}
						}
						data = data.f.f1;
						var firstData = data[0]
						var fa = firstData.fa,
							fb = firstData.fb;
						var src = '';
						if(fa){
							src = Parse.weatherIcon('12:00',fa);
						}else{
							src = Parse.weatherIcon('23:00',fb);
						}
						if(src){
							var html = '<img src="'+Parse.weatherIcon(fa?'12:00':'23:00',fa||fb)+'"/>';
						}
						$div.append(html).click(function(e){
							e.stopPropagation();
							currentData = data;
							showForecast();
						});
					}
				});
			}
			function showForecast(){
				U.canBack(true,'dialog');
				$yb_container.removeClass('trend');
				var Hours = today.getHours();
                var isNight = Hours >= 18 || Hours <= 6;
                var maxTemp = [],
                	minTemp = [],
                	labels_top = [],
                	labels_bottom = [];
                var html = '';
				$.each(currentData,function(i,v){
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
				$dialog_forcast.addClass('show');
				if(typeof iChart == 'undefined'){
					$.getScript('./js/ichart.js',function(){
						showTrend(maxTemp,minTemp,labels_top,labels_bottom);
					});
				}else{
					showTrend(maxTemp,minTemp,labels_top,labels_bottom);
				}
			}
			function showTrend(max,min,labels_top,labels_bottom){
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
						]
					}
				});
				//开始画图
				line.draw();
			}
			$(document).on('before_nav_click',function(){
				if($dialog_forcast){
					$btn_quit.click();
				}
			});
			var tpl_dialog_forcast = '<div class="dialog dialog_forcast">'+
										'<div class="dialog_nav_top">'+
											'<div class="btn_quit fl"></div>'+
											'<div class="btn_forcast_nav fl">'+
												'<span class="btn_forecast">预 报</span>'+
												'<span class="btn_trend">趋 势</span>'+
											'</div>'+
										'</div>'+
										'<div class="yb_container">'+
											'<ul class="yb_date fl">'+
											'</ul>'+
											'<div class="fl" id="forcast_chart">'+
												'<div id="chart_top"></div>'+
												'<div id="chart_content"></div>'+
												'<div id="chart_bottom"></div>'+
											'</div>'+
										'</div>'+
									'</div>';
			var $dialog_forcast,$yb_container,$yb_date,$btn_quit;
			return function(data,items,no_cache){
				// data.list.push({
				// 	city_id: '101310217',
				// 	name: '三沙',
				// 	geo: [112.293524, 16.923996]
				// });
				var _nextFn;
				var fn = parseJson(data,items,no_cache,function(){
					gm.refresh();
					Loading.hide();
					_nextFn && _nextFn();
				});
				var $layer_weather = $('.layer_weather');
				var resizeTT;
				$doc.off('map_resize');
				// 地图大小改变时重置天气元素位置
				$doc.on('map_resize',function(){
					$layer_weather.hide();
					clearTimeout(resizeTT);

					resizeTT = setTimeout(function(){
						_refreshBg();
						$layer_weather.each(function(i,v){
							var $v = $(v);
							var pos = gm.makePoint($v.data('geo'));
							$v.css({
								left: pos[0],
								top: pos[1]
							});
							setTimeout(function(){
								$v.fadeIn();
							},10);
						});
					},10);
				});
				if(!$dialog_forcast){
					$dialog_forcast = $(tpl_dialog_forcast).appendTo($('.container'));
					$yb_container = $('.yb_container');

					$yb_date = $('.yb_date').height($dialog_forcast.height() - $dialog_forcast.find('.dialog_nav_top').height());
				}
				$('.btn_forecast').click(function(){
					$yb_container.removeClass('trend');
				});
				$('.btn_trend').click(function(){
					$dialog_forcast.addClass('show');
					$yb_container.addClass('trend');
				});
				$btn_quit = $('.btn_quit').click(function(){
					$(this).parent().parent().removeClass('show');
					// hide();
					U.canBack(false,'dialog');
				});
				return function(toIndex,nextFn){
					_nextFn = function(){
						gm.weatherShowid = global_jsonid;
						var $container = $(gm.container);
						$.each(data.list,function(i,v){
							var city_id = v.city_id;
							var pos = gm.makePoint(v.geo);
							var $div = $('<div class="layer_weather" style="left:'+pos[0]+'px;top:'+pos[1]+'px"></div>');
							$div.data('geo',v.geo);
							var $c_div = $('<div data-c_id="'+city_id+'">'+v.name+'</div>');
							$div.append($c_div);
							$container.append($div);
							load7Forecast($c_div);
						});
						$layer_weather = $('.layer_weather');
						nextFn && nextFn();
					};
					fn(toIndex);
				}
			}
		})();
		/*解析img_json类型数据*/
		var parseImgJson = function(data,no_cache){
			clearMap();
			var url = data.url;
			if(url){
				Loading.show();
				getJson(url,function(imgData){
					Loading.hide();
					renderFn = renderImg(imgData);
					initPlayer(imgData,renderFn);
				},{
					format: function(d){
						return d;
					},
					no_cache: no_cache
				});
			}
		}
		window.initData = function(data,no_cache){
			if(typeof data == 'string'){
				getJson(data,function(d){
					initData(d,no_cache);
				},{
					format: function(d){
						var type = d.type;
						/*对数据进行倒序处理*/
						if('multipleimg' == type){
							d.imgs.reverse();
						}else if('json'){
							d.items.reverse();
						}
						return d;
					},
					no_cache: no_cache
				});
				return;
			}
			if(player){
				player.hide();
				player = null;
			}

			var type = data.type;
			var items = data.items || data.imgs;
			var renderFn;

			// 不同容器的显示
			$map_container.show().removeClass('map');
			$container.hide();
			$table_pm.hide();

			GLOBAL_CAN_SCALE = true;
			switch(type){
				case 'multipleimg':
					clearMap();
					renderFn = renderImg(items,no_cache);
					break;
				case 'img_json':
					return parseImgJson(data,no_cache);
					break;
				case 'json':
					renderFn = parseJson(data,items,no_cache);
					break;
				case 'json_forecast':
					renderFn = parseJsonForecast(data,items,no_cache);
					break;
				case 'weburl':
					window.location.href='wisp://pUrl.wi?url='+data.url;
					return;
					break;
			}
			if(renderFn){
				initPlayer(items,renderFn);
			}
		}
	}();
	!function(){
		var lastRequestTime = 0;
		/*绑定头部导航点击触发事件*/
		var _current_data_url;
		var init_tt;
		var nav_animate_time = 401;
		$doc.on('init_data',function(e,data){
			Loading.show();
			clearTimeout(init_tt);
			/*延时处理占大cpu资源方法，防止出现菜单动画卡*/
			init_tt = setTimeout(function(){
				var url = data.d_url;
				/*相同数据不进行渲染*/
				if(_current_data_url != url){
					_current_data_url = url;
					lastRequestTime = new Date().getTime();
					initData(data.d_url);
				}
			},nav_animate_time);
		}).on('restart',function(){
			if(_current_data_url && new Date().getTime() - lastRequestTime > 1000 * 60){
				initData(_current_data_url,true);
			}
		});
	}();

	/*初始化头部及左侧导航*/
	Nav.Top.init(function($html){
		$('.container').prepend($html);
	});

	//初始化菜单后得到菜单状态
	isShowNav = Nav.isShow();
	$doc.on('back',function(){
		if(isShowNav){
			Nav.toggle(true);
		}else if($('.dialog_forcast').is('.show')){
			$('.btn_quit').click();
		}else{
			$('#btn_back_china').click();
		}
	});

	// window.onload = function(){
	// 	initData({type: 'json_forecast',items: [{src: 'http://10.14.85.116/android/ChinaWeatherDecision_assets/test/data/hainan_forecast.html'}]})
	// }
})
// $(function(){
// 	$('[data-sid="656"]').click(function(){
// 		$('.minute_rain').show()
// 	})
// })
// //////// 分钟级降水
$(function () {
	
            // $('.content.nav_animate').after('<div class="minute_rain" style="margin-top:50px;"><div class="map"><div id="mapDiv" style="position:absolute;width:100%; height:100%"></div></div><div class="titleTip"></div><div class="mask"><div class="rainLevel"></div><ul>  <li id="radarStand"></li> <li>    <a id="togglePlay" class="pause" href="javascript:void(0)"></a><div class="timeProgress"><div class="allTime" id="allTime"><div class="jindu" id="jindu"></div><span class="moveRoll" id="moveRoll"></span>     </div>      <span class="currentTime" id="currentTime">       00:00:00      </span>   </div>  </li> <li class="set-btn"><a  class="pen" href="javascript:void(0)"></a></li></ul><div class="middleMask" id="middleMask">  <div class="title">   <div class="content clearfix">      <span class="fl radar"></span>      <span class="fl infoNational">中国气象局</span>      <span class="fl infoTime" id="infoTime"></span>     <span class="fl" id="close"></span>     </div>  </div>  <div class="forecast">    <div class="futrueWeather">未来2小时：</div>   <div class="futrueWeatherInfo" id="futrueWeatherInfo">晴，明天早晨6点钟后转阴，其后多云。</div>  </div>  <div class="chart">   <span class="chartTitle" id="chartTitle">未来两小时不会下雨，放心出门吧</span>   <div class="chartIcon">     <div></div>     <div></div>     <div></div>   </div>    <div class="chartTxt">      <p>大雨</p>     <p>中雨</p>     <p>小雨</p>   </div>    <div id="main"  style="width: 30.25rem;height: 11.75rem;"></div>  </div></div><div class="paint"><canvas id="paintCanvas"></canvas></div></div></div>')
            $('#btn_nav').click()
            $('.nav_title h1').text('分钟级降水')
            $('.map').height($('body').height() - 50)
            !function() {
               window.T = window.T || {}; (function() {T.Version="4.0.3",T.q={W:function(t,i){switch(arguments.length){case 1:return parseInt(Math.random()*t+1);case 2:return parseInt(Math.random()*(i-t+1)+t);default:return 0}}},T.w={E:"http://api.tianditu.com",e:"http://api.tianditu.com/v4.0/image",R:"http://map.tianditu.com/query.shtml",IPSERVER:"http://map.tianditu.com/cityNode/getCityName.shtml",r:"http://api.tianditu.com/apiserver/ajaxproxy?proxyReqUrl=",T:function(){return"http://t"+T.q.W(0,7)+".tianditu.com/DataServer?T=vec_c&"},TILE_VECTOR_WGS84_URLS_POI:function(){return"http://t"+T.q.W(0,7)+".tianditu.com/DataServer?T=cva_c&"},t:function(){return"http://t"+T.q.W(0,7)+".tianditu.com/DataServer?T=vec_w&"},TILE_VECTOR_Mercator_URLS_POI:function(){return"http://t"+T.q.W(0,7)+".tianditu.com/DataServer?T=cva_w&"},Y:function(){return"http://t"+T.q.W(0,7)+".tianditu.com/img_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&"},U:function(){return"http://t"+T.q.W(0,7)+".tianditu.com/cia_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&"},u:function(){return"http://t"+T.q.W(0,7)+".tianditu.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&"},I:function(){return"http://t"+T.q.W(0,7)+".tianditu.com/cia_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&"},i:function(){return"http://t"+T.q.W(0,7)+".tianditu.com/ter_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ter&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&"},O:function(){return"http://t"+T.q.W(0,7)+".tianditu.com/cta_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cta&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&"},o:function(){return"http://t"+T.q.W(0,7)+".tianditu.com/ter_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ter&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&"},P:function(){return"http://t"+T.q.W(0,7)+".tianditu.com/cta_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cta&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&"},p:["/v4.0/components.js","/v4.0/service.js","/v4.0/military.js"],A:["/v4.0/css/tianditu4.0.css"]},window.T_ANCHOR_TOP_LEFT="topleft",window.T_ANCHOR_TOP_RIGHT="topright",window.T_ANCHOR_BOTTOM_LEFT="bottomleft",window.T_ANCHOR_BOTTOM_RIGHT="bottomright",T.a={extend:function(t){var i,n,e,s;for(n=1,e=arguments.length;n<e;n++){s=arguments[n];for(i in s)t[i]=s[i]}return t},S:Object.create||function(){function t(){}return function(i){return t.prototype=i,new t}}(),s:function(t,i){var n=Array.prototype.slice;if(t.s)return t.s.apply(t,n.call(arguments,1));var e=n.call(arguments,2);return function(){return t.apply(i,e.length?e.concat(n.call(arguments)):arguments)}},D:function(t){return t.d=t.d||++T.a.F,t.d},F:0,f:function(t,i,n){var e,s,o,h;return h=function(){e=!1,s&&(o.apply(n,s),s=!1)},o=function(){e?s=arguments:(t.apply(n,arguments),setTimeout(h,i),e=!0)}},G:function(t,i,n){var e=i[1],s=i[0],o=e-s;return t===e&&n?t:((t-s)%o+o)%o+s},g:function(){return!1},H:function(t,i){var n=Math.pow(10,i||5);return Math.round(t*n)/n},h:function(t){return t.h?t.h():t.replace(/^\s+|\s+$/g,"")},J:function(t){return T.a.h(t).split(/\s+/)},setOptions:function(t,i){t.hasOwnProperty("options")||(t.options=t.options?T.a.S(t.options):{});for(var n in i)t.options[n]=i[n];return t.options},j:function(t,i,n){var e=[];for(var s in t)e.push(encodeURIComponent(n?s.toUpperCase():s)+"="+encodeURIComponent(t[s]));return(i&&i.indexOf("?")!==-1?"&":"?")+e.join("&")},K:function(t,i){return t.replace(T.a.k,function(t,n){var e=i[n];return void 0===e||"function"==typeof e&&(e=e(i)),e})},k:/\{ *([\w_\-]+) *\}/g,L:Array.L||function(t){return"[object Array]"===Object.prototype.toString.call(t)},indexOf:function(t,i){for(var n=0;n<t.length;n++)if(t[n]===i)return n;return-1},l:"data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="},function(){function t(t){return window["webkit"+t]||window["moz"+t]||window["ms"+t]}function i(t){var i=+new Date,e=Math.max(0,16-(i-n));return n=i+e,window.setTimeout(t,e)}var n=0,e=window.requestAnimationFrame||t("RequestAnimationFrame")||i,s=window.cancelAnimationFrame||t("CancelAnimationFrame")||t("CancelRequestAnimationFrame")||function(t){window.clearTimeout(t)};T.a.Z=function(t,n,s){return s&&e===i?void t.call(n):e.call(window,T.s(t,n))},T.a.C=function(t){t&&s.call(window,t)}}(),T.extend=T.a.extend,T.s=T.a.s,T.D=T.a.D,T.setOptions=T.a.setOptions,T.V=function(){},T.V.extend=function(t){var i=function(){this.initialize&&this.initialize.apply(this,arguments),this.c()},n=i.__super__=this.prototype,e=T.a.S(n);e.constructor=i,i.prototype=e;for(var s in this)this.hasOwnProperty(s)&&"prototype"!==s&&(i[s]=this[s]);return t.B&&(T.extend(i,t.B),delete t.B),t.includes&&(T.a.extend.apply(null,[e].concat(t.includes)),delete t.includes),e.options&&(t.options=T.a.extend(T.a.S(e.options),t.options)),T.extend(e,t),e.v=[],e.c=function(){if(!this.N){n.c&&n.c.call(this),this.N=!0;for(var t=0,i=e.v.length;t<i;t++)e.v[t].call(this)}},i},T.V.b=function(t){return T.extend(this.prototype,t),this},T.V.M=function(t){return T.extend(this.prototype.options,t),this},T.V.n=function(t){var i=Array.prototype.slice.call(arguments,1),n="function"==typeof t?t:function(){this[t].apply(this,i)};return this.prototype.v=this.prototype.v||[],this.prototype.v.push(n),this},T._=T.V.extend({on:function(t,i,n){if("object"==typeof t)for(var e in t)this.m(e,t[e],i);else{t=T.a.J(t);for(var s=0,o=t.length;s<o;s++)this.m(t[s],i,n)}return this},off:function(t,i,n){if(t)if("object"==typeof t)for(var e in t)this.qQ(e,t[e],i);else{t=T.a.J(t);for(var s=0,o=t.length;s<o;s++)this.qQ(t[s],i,n)}else delete this.QQ;return this},m:function(t,i,n){var e=this.QQ=this.QQ||{},s=n&&n!==this&&T.D(n);if(s){var o=t+"_idx",h=t+"_len",r=e[o]=e[o]||{},a=T.D(i)+"_"+s;r[a]||(r[a]={fn:i,ctx:n},e[h]=(e[h]||0)+1)}else e[t]=e[t]||[],e[t].push({fn:i})},qQ:function(t,i,n){var e,s,o,h,r=this.QQ,a=t+"_idx",u=t+"_len";if(r){if(!i){s=r[a];for(o in s)s[o].fn=T.a.g;for(s=r[t]||[],o=0,h=s.length;o<h;o++)s[o].fn=T.a.g;return delete r[t],delete r[a],void delete r[u]}var c,l=n&&n!==this&&T.D(n);if(l)c=T.D(i)+"_"+l,s=r[a],s&&s[c]&&(e=s[c],delete s[c],r[u]--);else if(s=r[t]){for(o=0,h=s.length;o<h;o++)if(s[o].fn===i){e=s[o],s.splice(o,1);break}0===s.length&&delete r[t]}e&&(e.fn=T.a.g)}},WQ:function(t,i,n){if(!this.wQ(t,n))return this;var e=T.a.extend({},i,{type:t,target:this}),s=this.QQ;if(s){var o,h,r,a,u=s[t+"_idx"];if(s[t])for(r=s[t].slice(),o=0,h=r.length;o<h;o++)r[o].fn.call(this,e);for(a in u)u[a].fn.call(u[a].ctx,e)}return n&&this.EQ(e),this},trigger:function(t,i,n){return this.WQ(t,i,n),this},wQ:function(t,i){var n=this.QQ;if(n&&(n[t]||n[t+"_len"]))return!0;if(i)for(var e in this.eQ)if(this.eQ[e].wQ(t,i))return!0;return!1},RQ:function(t,i,n){if("object"==typeof t){for(var e in t)this.RQ(e,t[e],i);return this}var s=T.s(function(){this.off(t,i,n).off(t,s,n)},this);return this.on(t,i,n).on(t,s,n)},rQ:function(t){return this.eQ=this.eQ||{},this.eQ[T.D(t)]=t,this},TQ:function(t){return this.eQ&&delete this.eQ[T.D(t)],this},EQ:function(t){for(var i in this.eQ)this.eQ[i].WQ(t.type,T.extend({layer:t.target},t),!0)}});var pro=T._.prototype;pro.addEventListener=pro.on,pro.removeEventListener=pro.tQ=pro.off,pro.YQ=pro.RQ,pro.UQ=pro.trigger,pro.uQ=pro.wQ,T.IQ={iQ:pro},function(){var t=navigator.userAgent.toLowerCase(),i=document.documentElement,n="ActiveXObject"in window,e="Microsoft Internet Explorer"==navigator.appName&&"MSIE8.0"==navigator.appVersion.split(";")[1].replace(new RegExp("[ ]","g"),""),s="Microsoft Internet Explorer"==navigator.appName&&"MSIE7.0"==navigator.appVersion.split(";")[1].replace(new RegExp("[ ]","g"),""),o="Microsoft Internet Explorer"==navigator.appName&&"MSIE6.0"==navigator.appVersion.split(";")[1].replace(new RegExp("[ ]","g"),""),h=t.indexOf("webkit")!==-1,r=t.indexOf("phantom")!==-1,a=t.search("android [23]")!==-1,u=t.indexOf("chrome")!==-1,c=t.indexOf("gecko")!==-1&&!h&&!window.opera&&!n,l=0===navigator.platform.indexOf("Win"),f="undefined"!=typeof orientation||t.indexOf("mobile")!==-1,d=!window.PointerEvent&&window.MSPointerEvent,p=window.PointerEvent||d,m=n&&"transition"in i.style,v="WebKitCSSMatrix"in window&&"m11"in new window.WebKitCSSMatrix&&!a,w="MozPerspective"in i.style,y="OTransition"in i.style,g=!window.L_NO_TOUCH&&(p||"ontouchstart"in window||window.DocumentTouch&&document instanceof window.DocumentTouch);T.OQ={ie:n,ie8:e,ie7:s,ie6:o,ielt9:n&&!document.addEventListener,edge:"msLaunchUri"in navigator&&!("documentMode"in document),webkit:h,gecko:c,android:t.indexOf("android")!==-1,android23:a,chrome:u,safari:!u&&t.indexOf("safari")!==-1,win:l,ie3d:m,webkit3d:v,gecko3d:w,opera12:y,any3d:!window.L_DISABLE_3D&&(m||v||w)&&!y&&!r,mobile:f,mobileWebkit:f&&h,mobileWebkit3d:f&&v,mobileOpera:f&&window.opera,mobileGecko:f&&c,touch:!!g,msPointer:!!d,pointer:!!p,retina:(window.oQ||window.screen.deviceXDPI/window.screen.logicalXDPI)>1}}(),T.Point=function(t,i,n){this.x=n?Math.round(t):t,this.y=n?Math.round(i):i},T.Point.prototype={PQ:function(){return new T.Point(this.x,this.y)},pQ:function(t){return this.PQ().AQ(T.aQ(t))},AQ:function(t){return this.x+=t.x,this.y+=t.y,this},SQ:function(t){return this.PQ().sQ(T.aQ(t))},sQ:function(t){return this.x-=t.x,this.y-=t.y,this},DQ:function(t){return this.PQ().dQ(t)},dQ:function(t){return this.x/=t,this.y/=t,this},FQ:function(t){return this.PQ().fQ(t)},fQ:function(t){return this.x*=t,this.y*=t,this},GQ:function(t){return new T.Point(this.x*t.x,this.y*t.y)},gQ:function(t){return new T.Point(this.x/t.x,this.y/t.y)},HQ:function(){return this.PQ().hQ()},hQ:function(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this},JQ:function(){return this.PQ().jQ()},jQ:function(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this},KQ:function(){return this.PQ().kQ()},kQ:function(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this},distanceTo:function(t){t=T.aQ(t);var i=t.x-this.x,n=t.y-this.y;return Math.sqrt(i*i+n*n)},equals:function(t){return t=T.aQ(t),t.x===this.x&&t.y===this.y},contains:function(t){return t=T.aQ(t),Math.abs(t.x)<=Math.abs(this.x)&&Math.abs(t.y)<=Math.abs(this.y)},LQ:function(){return"Point("+T.a.H(this.x)+", "+T.a.H(this.y)+")"}},T.aQ=function(t,i,n){return t instanceof T.Point?t:T.a.L(t)?new T.Point(t[0],t[1]):void 0===t||null===t?t:"object"==typeof t&&"x"in t&&"y"in t?new T.Point(t.x,t.y):new T.Point(t,i,n)},T.lQ=function(t,i){if(t)for(var n=i?[t,i]:t,e=0,s=n.length;e<s;e++)this.extend(n[e])},T.lQ.prototype={extend:function(t){return t=T.aQ(t),this.min||this.max?(this.min.x=Math.min(t.x,this.min.x),this.max.x=Math.max(t.x,this.max.x),this.min.y=Math.min(t.y,this.min.y),this.max.y=Math.max(t.y,this.max.y)):(this.min=t.PQ(),this.max=t.PQ()),this},getCenter:function(t){return new T.Point((this.min.x+this.max.x)/2,(this.min.y+this.max.y)/2,t)},ZQ:function(){return new T.Point(this.min.x,this.max.y)},CQ:function(){return new T.Point(this.max.x,this.min.y)},getSize:function(){return this.max.SQ(this.min)},contains:function(t){var i,n;return t="number"==typeof t[0]||t instanceof T.Point?T.aQ(t):T.VQ(t),t instanceof T.lQ?(i=t.min,n=t.max):i=n=t,i.x>=this.min.x&&n.x<=this.max.x&&i.y>=this.min.y&&n.y<=this.max.y},intersects:function(t){t=T.VQ(t);var i=this.min,n=this.max,e=t.min,s=t.max,o=s.x>=i.x&&e.x<=n.x,h=s.y>=i.y&&e.y<=n.y;return o&&h},cQ:function(t){t=T.VQ(t);var i=this.min,n=this.max,e=t.min,s=t.max,o=s.x>i.x&&e.x<n.x,h=s.y>i.y&&e.y<n.y;return o&&h},BQ:function(){return!(!this.min||!this.max)}},T.VQ=function(t,i){return!t||t instanceof T.lQ?t:new T.lQ(t,i)},T.vQ=function(t,i,n,e){this._a=t,this._b=i,this._c=n,this._d=e},T.vQ.prototype={NQ:function(t,i){return this.bQ(t.PQ(),i)},bQ:function(t,i){return i=i||1,t.x=i*(this._a*t.x+this._b),t.y=i*(this._c*t.y+this._d),t},MQ:function(t,i){return i=i||1,new T.Point((t.x/i-this._b)/this._a,(t.y/i-this._d)/this._c)}},T.nQ={_Q:function(t){return"string"==typeof t?document.getElementById(t):t},getStyle:function(t,i){var n=t.style[i]||t.currentStyle&&t.currentStyle[i];if((!n||"auto"===n)&&document.defaultView){var e=document.defaultView.getComputedStyle(t,null);n=e?e[i]:null}return"auto"===n?null:n},S:function(t,i,n){var e=document.createElement(t);return e.className=i||"",n&&n.appendChild(e),e},mQ:function(t){var i=t.parentNode;i&&i.removeChild(t)},Qq:function(t){for(;t.firstChild;)t.removeChild(t.firstChild)},qq:function(t){t.parentNode.appendChild(t)},Wq:function(t){var i=t.parentNode;i.insertBefore(t,i.firstChild)},wq:function(t,i){if(void 0!==t.classList)return t.classList.contains(i);var n=T.nQ.Eq(t);return n.length>0&&new RegExp("(^|\\s)"+i+"(\\s|$)").test(n)},eq:function(t,i){if(void 0!==t.classList)for(var n=T.a.J(i),e=0,s=n.length;e<s;e++)t.classList.add(n[e]);else if(!T.nQ.wq(t,i)){var o=T.nQ.Eq(t);T.nQ.Rq(t,(o?o+" ":"")+i)}},rq:function(t,i){void 0!==t.classList?t.classList.remove(i):T.nQ.Rq(t,T.a.h((" "+T.nQ.Eq(t)+" ").replace(" "+i+" "," ")))},Rq:function(t,i){void 0===t.className.baseVal?t.className=i:t.className.baseVal=i},Eq:function(t){return void 0===t.className.baseVal?t.className:t.className.baseVal},setOpacity:function(t,i){"opacity"in t.style?t.style.opacity=i:"filter"in t.style&&T.nQ.Tq(t,i)},Tq:function(t,i){var n=!1,e="DXImageTransform.Microsoft.Alpha";try{n=t.filters.item(e)}catch(oO){if(1===i)return}i=Math.round(100*i),n?(n.Enabled=100!==i,n.Opacity=i):t.style.filter+=" progid:"+e+"(opacity="+i+")"},tq:function(t){for(var i=document.documentElement.style,n=0;n<t.length;n++)if(t[n]in i)return t[n];return!1},Yq:function(t,i,n){var e=i||new T.Point(0,0);t.style[T.nQ.Uq]=(T.OQ.ie3d?"translate("+e.x+"px,"+e.y+"px)":"translate3d("+e.x+"px,"+e.y+"px,0)")+(n?" scale("+n+")":"")},setPosition:function(t,i){t._tdt_pos=i,T.OQ.any3d?T.nQ.Yq(t,i):(t.style.left=i.x+"px",t.style.top=i.y+"px")},getPosition:function(t){return t._tdt_pos||new T.Point(0,0)}},function(){T.nQ.Uq=T.nQ.tq(["NQ","WebkitTransform","OTransform","MozTransform","msTransform"]);var t=T.nQ.uq=T.nQ.tq(["webkitTransition","transition","OTransition","MozTransition","msTransition"]);if(T.nQ.Iq="webkitTransition"===t||"OTransition"===t?t+"End":"transitionend","onselectstart"in document)T.nQ.iq=function(){T.Oq.on(window,"selectstart",T.Oq.preventDefault)},T.nQ.oq=function(){T.Oq.off(window,"selectstart",T.Oq.preventDefault)};else{var i=T.nQ.tq(["userSelect","WebkitUserSelect","OUserSelect","MozUserSelect","msUserSelect"]);T.nQ.iq=function(){if(i){var t=document.documentElement.style;this.Pq=t[i],t[i]="none"}},T.nQ.oq=function(){i&&(document.documentElement.style[i]=this.Pq,delete this.Pq)}}T.nQ.pq=function(){T.Oq.on(window,"dragstart",T.Oq.preventDefault)},T.nQ.Aq=function(){T.Oq.off(window,"dragstart",T.Oq.preventDefault)},T.nQ.aq=function(t){for(;t.tabIndex===-1;)t=t.parentNode;t&&t.style&&(T.nQ.Sq(),this.sq=t,this._outlineStyle=t.style.outline,t.style.outline="none",T.Oq.on(window,"keydown",T.nQ.Sq,this))},T.nQ.Sq=function(){this.sq&&(this.sq.style.outline=this._outlineStyle,delete this.sq,delete this._outlineStyle,T.Oq.off(window,"keydown",T.nQ.Sq,this))}}(),T.Dq=function(t,i,n){isNaN(t)||isNaN(i),this.lat=+parseFloat(t).toFixed(5),this.lng=+parseFloat(i).toFixed(5),void 0!==n&&(this.dq=+n)},T.Dq.prototype={equals:function(t,i){if(!t)return!1;t=T.Fq(t);var n=Math.max(Math.abs(this.lat-t.lat),Math.abs(this.lng-t.lng));return n<=(void 0===i?1e-9:i)},LQ:function(t){return"LngLat("+T.a.H(this.lng,t)+", "+T.a.H(this.lat,t)+")"},distanceTo:function(t){return T.Gq.fq.distance(this,T.Fq(t))},gq:function(){return T.Gq.fq.Hq(this)},hq:function(t){var i=180*t/40075017,n=i/Math.cos(Math.PI/180*this.lat);return T.Jq([this.lat-i,this.lng-n],[this.lat+i,this.lng+n])},PQ:function(){return new T.Dq(this.lat,this.lng,this.dq)},getLng:function(){return this.lng},getLat:function(){return this.lat}},T.Fq=function(t,i,n){return t instanceof T.Dq?t:T.a.L(t)&&"object"!=typeof t[0]?3===t.length?new T.Dq(t[0],t[1],t[2]):2===t.length?new T.Dq(t[0],t[1]):null:void 0===t||null===t?t:"object"==typeof t&&"lat"in t?new T.Dq(t.lat,"lng"in t?t.lng:t.lon,t.dq):void 0===i?null:new T.Dq(t,i,n)},T.LngLat=function(t,i,n){return new T.Dq(i,t,n)},T.jq=function(t,i){if(t)for(var n=i?[t,i]:t,e=0,s=n.length;e<s;e++)this.extend(n[e])},T.jq.prototype={extend:function(t){var i,n,e=this.Kq,s=this.kq;if(t instanceof T.Dq)i=t,n=t;else{if(!(t instanceof T.jq))return t?this.extend(T.Fq(t)||T.Jq(t)):this;if(i=t.Kq,n=t.kq,!i||!n)return this}return e||s?(e.lat=Math.min(i.lat,e.lat),e.lng=Math.min(i.lng,e.lng),s.lat=Math.max(n.lat,s.lat),s.lng=Math.max(n.lng,s.lng)):(this.Kq=new T.Dq(i.lat,i.lng),this.kq=new T.Dq(n.lat,n.lng)),this},Lq:function(t){var i=this.Kq,n=this.kq,e=Math.abs(i.lat-n.lat)*t,s=Math.abs(i.lng-n.lng)*t;return new T.jq(new T.Dq(i.lat-e,i.lng-s),new T.Dq(n.lat+e,n.lng+s))},getCenter:function(){return new T.Dq((this.Kq.lat+this.kq.lat)/2,(this.Kq.lng+this.kq.lng)/2)},getSouthWest:function(){return this.Kq},getNorthEast:function(){return this.kq},lq:function(){return new T.Dq(this.Zq(),this.Cq())},Vq:function(){return new T.Dq(this.cq(),this.Bq())},Cq:function(){return this.Kq.lng},cq:function(){return this.Kq.lat},Bq:function(){return this.kq.lng},Zq:function(){return this.kq.lat},contains:function(t){t="number"==typeof t[0]||t instanceof T.Dq?T.Fq(t):T.Jq(t);var i,n,e=this.Kq,s=this.kq;return t instanceof T.jq?(i=t.getSouthWest(),n=t.getNorthEast()):i=n=t,i.lat>=e.lat&&n.lat<=s.lat&&i.lng>=e.lng&&n.lng<=s.lng},intersects:function(t){t=T.Jq(t);var i=this.Kq,n=this.kq,e=t.getSouthWest(),s=t.getNorthEast(),o=s.lat>=i.lat&&e.lat<=n.lat,h=s.lng>=i.lng&&e.lng<=n.lng;return o&&h},cQ:function(t){t=T.Jq(t);var i=this.Kq,n=this.kq,e=t.getSouthWest(),s=t.getNorthEast(),o=s.lat>i.lat&&e.lat<n.lat,h=s.lng>i.lng&&e.lng<n.lng;return o&&h},vq:function(){return[this.Cq(),this.cq(),this.Bq(),this.Zq()].join(",")},equals:function(t){return!!t&&(t=T.Jq(t),this.Kq.equals(t.getSouthWest())&&this.kq.equals(t.getNorthEast()))},BQ:function(){return!(!this.Kq||!this.kq)}},T.Jq=function(t,i){return t instanceof T.jq?t:new T.jq(t,i)},T.LngLatBounds=function(t,i){return t instanceof T.jq?t:new T.jq(t,i)},T.Nq={},T.Nq.bq={Mq:function(t){return new T.Point(t.lng,t.lat)},nq:function(t){return new T.Dq(t.y,t.x)},bounds:T.VQ([-180,-90],[180,90])},T.Nq._q={R:6378137,mq:85.0511287798,Mq:function(t){var i=Math.PI/180,n=this.mq,e=Math.max(Math.min(n,t.lat),-n),s=Math.sin(e*i);return new T.Point(this.R*t.lng*i,this.R*Math.log((1+s)/(1-s))/2)},nq:function(t){var i=180/Math.PI;return new T.Dq((2*Math.atan(Math.exp(t.y/this.R))-Math.PI/2)*i,t.x*i/this.R)},bounds:function(){var t=6378137*Math.PI;return T.VQ([-t,-t],[t,t])}()},T.Gq={QW:function(t,i){var n=this.projection.Mq(t),e=this.scale(i);return this.qW.bQ(n,e)},WW:function(t,i){var n=this.scale(i),e=this.qW.MQ(t,n);return this.projection.nq(e)},Mq:function(t){return this.projection.Mq(t)},nq:function(t){return this.projection.nq(t)},scale:function(t){return 256*Math.pow(2,t-T.Gq.wW)},wW:0,zoom:function(t){return Math.log(t/256)/Math.LN2},EW:function(t){if(this.eW)return null;var i=this.projection.bounds,n=this.scale(t),e=this.qW.NQ(i.min,n),s=this.qW.NQ(i.max,n);return T.VQ(e,s)},eW:!1,Hq:function(t){var i=this.RW?T.a.G(t.lng,this.RW,!0):t.lng,n=this.wrapLat?T.a.G(t.lat,this.wrapLat,!0):t.lat,e=t.dq;return T.Fq(n,i,e)}},T.Gq.rW=T.extend({},T.Gq,{projection:T.Nq.bq,qW:new T.vQ(1,0,-1,0),scale:function(t){return Math.pow(2,t)},zoom:function(t){return Math.log(t)/Math.LN2},distance:function(t,i){var n=i.lng-t.lng,e=i.lat-t.lat;return Math.sqrt(n*n+e*e)},eW:!0}),T.Gq.fq=T.extend({},T.Gq,{RW:[-180,180],R:6371e3,distance:function(t,i){var n=Math.PI/180,e=t.lat*n,s=i.lat*n,o=Math.sin(e)*Math.sin(s)+Math.cos(e)*Math.cos(s)*Math.cos((i.lng-t.lng)*n);return this.R*Math.acos(Math.min(o,1))}}),T.Gq.TW=T.extend({},T.Gq.fq,{code:"tW",projection:T.Nq._q,qW:function(){var t=.5/(Math.PI*T.Nq._q.R);return new T.vQ(t,.5,-t,.5)}()}),T.Gq.YW=T.extend({},T.Gq.TW,{code:"EPSG:900913"}),T.Gq.UW=T.extend({},T.Gq.fq,{code:"EPSG:4326",projection:T.Nq.bq,qW:new T.vQ(1/180,1,-1/180,.5)}),T.Map=T._.extend({options:{uW:T.Gq.YW,center:void 0,zoom:void 0,minZoom:void 0,maxZoom:void 0,layers:[],maxBounds:void 0,IW:void 0,iW:!0,OW:!0,oW:!0,PW:8388608,pW:1,AW:1},initialize:function(t,i){i=T.setOptions(this,i),this.aW="EPSG:900913",i.projection?"EPSG:4326"==i.projection?(i.uW=T.Gq.UW,this.aW="EPSG:4326"):(i.uW=T.Gq.YW,this.aW="EPSG:900913",i.projection=this.aW):i.projection=this.aW,this.SW(t),this.sW(),this.DW=T.s(this.DW,this),this.dW(),i.maxBounds&&this.setMaxBounds(i.maxBounds),void 0!==i.zoom&&(this.FW=this.fW(i.zoom)),i.center&&void 0!==i.zoom&&this.GW(T.Fq(i.center),i.zoom,{reset:!0}),this.gW=[],this.HW={},this.hW=[],this.JW=[],this.jW={},this.KW=!0,this.initLayers=[],this.c(),this.kW(this.options.layers)},getCode:function(){return this.aW},GW:function(t,i){return i=void 0===i?this.getZoom():i,this.LW(T.Fq(t),i),this},setZoom:function(t,i){return this.lW?this.GW(this.getCenter(),t,{zoom:i}):(this.FW=t,this)},zoomIn:function(t,i){return t=t||(T.OQ.any3d?this.options.AW:1),this.setZoom(this.FW+t,i)},zoomOut:function(t,i){return t=t||(T.OQ.any3d?this.options.AW:1),this.setZoom(this.FW-t,i)},ZW:function(t,i,n){var e=this.CW(i),s=this.getSize().DQ(2),o=t instanceof T.Point?t:this.VW(t),h=o.SQ(s).FQ(1-1/e),r=this.cW(s.pQ(h));return this.GW(r,i,{zoom:n})},BW:function(t,i){i=i||{},t=t.getBounds?t.getBounds():T.Jq(t);var n=T.aQ(i.vW||i.NW||[0,0]),e=T.aQ(i.paddingBottomRight||i.NW||[0,0]),s=this.bW(t,!1,n.pQ(e));s="number"==typeof i.maxZoom?Math.min(i.maxZoom,s):s;var o=e.SQ(n).DQ(2),h=this.Mq(t.getSouthWest(),s),r=this.Mq(t.getNorthEast(),s),a=this.nq(h.pQ(r).DQ(2).pQ(o),s);return{center:a,zoom:s}},MW:function(t,i){if(t=T.Jq(t),!t.BQ())throw new Error("Bounds are not valid.");var n=this.BW(t,i);return this.GW(n.center,n.zoom,i)},nW:function(t){return this.MW([[-90,-180],[90,180]],t)},getViewport:function(t){if(T.a.L(t)&&0!=t.length){var i=this._W(t);return{center:i.getCenter(),zoom:this.bW(i,!1)}}},setViewport:function(t){if(T.a.L(t)&&0!=t.length){var i=this._W(t);this.panTo(i.getCenter(),this.bW(i,!1))}},_W:function(t){for(var i=new T.LngLatBounds(new T.LngLat(0,0)),n=0,e=t.length;n<e;n++){var s=T.Fq(t[n]);i.extend(s)}return i},panTo:function(t,i,n){return i&&(this.FW=i),this.centerAndZoom(t,this.FW,{mW:n})},panBy:function(t){return this.WQ("movestart"),this.Qw(T.aQ(t)),this.WQ("move"),this.WQ("moveend")},setMaxBounds:function(t){return t=T.Jq(t),t.BQ()?(this.options.maxBounds&&this.off("moveend",this.qw),this.options.maxBounds=t,this.lW&&this.qw(),this.on("moveend",this.qw)):(this.options.maxBounds=null,this.off("moveend",this.qw))},setMinZoom:function(t){return this.options.minZoom=t,this.lW&&this.getZoom()<this.options.minZoom?this.setZoom(t):this},setMaxZoom:function(t){return this.options.maxZoom=t,this.lW&&this.getZoom()>this.options.maxZoom?this.setZoom(t):this},Ww:function(t,i){this.ww=!0;var n=this.getCenter(),e=this.Ew(n,this.FW,T.Jq(t));return n.equals(e)||this.panTo(e,i),this.ww=!1,this},ew:function(t){if(!this.lW)return this;t=T.extend({Rw:!1,mW:!0},t===!0?{Rw:!0}:t);var i=this.getSize();this.KW=!0,this.rw=null;var n=this.getSize(),e=i.DQ(2).HQ(),s=n.DQ(2).HQ(),o=e.SQ(s);return o.x||o.y?(t.Rw&&t.mW?this.panBy(o):(t.mW&&this.Qw(o),this.WQ("move"),t.Tw?(clearTimeout(this.tw),this.tw=setTimeout(T.s(this.WQ,this,"moveend"),200)):this.WQ("moveend")),this.WQ("resize",{oldSize:i,newSize:n})):this},checkResize:function(){this.ew()},Yw:function(){return this.setZoom(this.fW(this.FW)),this.options.pW||this.WQ("viewreset"),this.Uw()},uw:function(t,i){if(!i)return this;var n=this[t]=new i(this);return this.gW.push(n),this.options[t]&&n.enable(),this},mQ:function(){this.dW(!0);try{delete this.Iw._tdt}catch(oO){this.Iw._tdt=void 0}T.nQ.mQ(this.iw),this.Ow&&this.Ow(),this.ow(),this.lW&&this.WQ("unload");for(var t in this.HW)this.HW[t].mQ();return this},Pw:function(t,i){var n="tdt-pane"+(t?" tdt-"+t.replace("Pane","")+"-pane":""),e=T.nQ.S("div",n,i||this.iw);return t&&(this.pw[t]=e),e},getCenter:function(){return this.Aw(),this.rw&&!this.aw()?this.rw:this.Sw(this.sw())},getZoom:function(){return this.FW},getBounds:function(){var t=this.Dw(),i=this.nq(t.ZQ()),n=this.nq(t.CQ());return new T.jq(i,n)},getMinZoom:function(){return void 0===this.options.minZoom?this.dw||0:this.options.minZoom},getMaxZoom:function(){return void 0===this.options.maxZoom?void 0===this.Fw?1/0:this.Fw:this.options.maxZoom},bW:function(t,i,n){t=T.Jq(t),n=T.aQ(n||[0,0]);var e=this.getZoom()||0,s=this.getMinZoom(),o=this.getMaxZoom(),h=t.lq(),r=t.Vq(),a=this.getSize().SQ(n),u=this.Mq(r,e).SQ(this.Mq(h,e)),c=T.OQ.any3d?this.options.pW:1,l=Math.min(a.x/u.x,a.y/u.y);return e=this.fw(l,e),c&&(e=Math.round(e/(c/100))*(c/100),e=i?Math.ceil(e/c)*c:Math.floor(e/c)*c),Math.max(s,Math.min(o,e))},getSize:function(){return this.Gw&&!this.KW||(this.Gw=new T.Point(this.Iw.clientWidth,this.Iw.clientHeight),this.KW=!1),this.Gw.PQ()},Dw:function(t,i){var n=this.gw(t,i);return new T.lQ(n,n.pQ(this.getSize()))},Hw:function(){return this.Aw(),this.hw},Jw:function(t){return this.options.uW.EW(void 0===t?this.getZoom():t)},jw:function(t){return"string"==typeof t?this.pw[t]:t},getPanes:function(){return this.pw},getContainer:function(){return this.Iw},CW:function(t,i){var n=this.options.uW;return i=void 0===i?this.FW:i,n.scale(t)/n.scale(i)},fw:function(t,i){var n=this.options.uW;return i=void 0===i?this.FW:i,n.zoom(t*n.scale(i+T.Gq.wW))},Mq:function(t,i){return i=void 0===i?this.FW:i,this.options.uW.QW(T.Fq(t),i)},nq:function(t,i){return i=void 0===i?this.FW:i,this.options.uW.WW(T.aQ(t),i)},Sw:function(t){var i=T.aQ(t).pQ(this.Hw());return this.nq(i)},Kw:function(t){var i=this.Mq(T.Fq(t)).hQ();return i.sQ(this.Hw())},layerPointToLngLat:function(t){return this.Sw(t)},lngLatToLayerPoint:function(t){return this.Kw(t)},Hq:function(t){return this.options.uW.Hq(T.Fq(t))},distance:function(t,i){return this.options.uW.distance(T.Fq(t),T.Fq(i))},getDistance:function(t,i){return this.distance(t,i)},kw:function(t){return T.aQ(t).SQ(this.Lw())},lw:function(t){return T.aQ(t).pQ(this.Lw())},cW:function(t){var i=this.kw(T.aQ(t));return this.Sw(i)},VW:function(t){return this.lw(this.Kw(T.Fq(t)))},containerPointToLngLat:function(t){return this.cW(t)},lngLatToContainerPoint:function(t){return this.VW(t)},Zw:function(t){return T.Oq.Cw(t,this.Iw)},Vw:function(t){return this.kw(this.Zw(t))},cw:function(t){return this.Sw(this.Vw(t))},SW:function(t){var i=this.Iw=T.nQ._Q(t);i&&i._tdt,T.Oq.addListener(i,"scroll",this.Bw,this),i._tdt=!0},sW:function(){var t=this.Iw;this.vw=this.options.iW&&T.OQ.any3d,T.nQ.eq(t,"tdt-container"+(T.OQ.touch?" tdt-touch":"")+(T.OQ.retina?" tdt-retina":"")+(T.OQ.ielt9?" tdt-oldie":"")+(T.OQ.safari?" tdt-safari":"")+(this.vw?" tdt-fade-anim":""));var i=T.nQ.getStyle(t,"position");"absolute"!==i&&"relative"!==i&&"fixed"!==i&&(t.style.position="relative"),this.Nw(),this.bw&&this.bw()},Nw:function(){var t=this.pw={};this.Mw={},this.iw=this.Pw("mapPane",this.Iw),T.nQ.setPosition(this.iw,new T.Point(0,0)),this.Pw("tilePane"),this.Pw("nw"),this.Pw("overlayPane"),this.Pw("markerPane"),this.Pw("infoWindowPane"),this.options.oW||(T.nQ.eq(t.markerPane,"tdt-zoom-hide"),T.nQ.eq(t.nw,"tdt-zoom-hide"))},LW:function(t,i){T.nQ.setPosition(this.iw,new T.Point(0,0));var n=!this.lW;this.lW=!0,i=this.fW(i),this.WQ("viewprereset");var e=this.FW!==i;this.QE(e).mw(t,i)._w(e),this.WQ("viewreset"),n&&this.WQ("load")},QE:function(t){return t&&this.WQ("zoomstart"),this.WQ("movestart")},mw:function(t,i,n){void 0===i&&(i=this.FW);var e=this.FW!==i;return this.FW=i,this.rw=t,this.hw=this.qE(t),(e||n&&n.pinch)&&this.WQ("zoom",n),this.WQ("move",n)},_w:function(t){return t&&this.WQ("zoomend"),this.WQ("moveend")},Uw:function(){return T.a.C(this.WE),this.wE&&this.wE.Yw(),this},Qw:function(t){T.nQ.setPosition(this.iw,this.Lw().SQ(t))},EE:function(){return this.getMaxZoom()-this.getMinZoom()},qw:function(){this.ww||this.Ww(this.options.maxBounds)},Aw:function(){!this.lW},dW:function(t){if(T.Oq){this.eE={},this.eE[T.D(this.Iw)]=this;var i=t?"off":"on";T.Oq[i](this.Iw,"click dblclick mousedown mouseup mouseover mouseout mousemove contextmenu keypress",this.RE,this),this.options.OW&&T.Oq[i](window,"resize",this.DW,this),T.OQ.any3d&&this.options.PW&&this[i]("moveend",this.rE)}},DW:function(){T.a.C(this.TE),this.TE=T.a.Z(function(){this.ew({Tw:!0})},this)},Bw:function(){this.Iw.scrollTop=0,this.Iw.scrollLeft=0},rE:function(){var t=this.Lw();Math.max(Math.abs(t.x),Math.abs(t.y))>=this.options.PW&&this.LW(this.getCenter(),this.getZoom())},tE:function(t,i){for(var n,e=[],s="mouseout"===i||"mouseover"===i,o=t.target||t.srcElement,h=!1;o;){if(n=this.eE[T.D(o)],n&&("click"===i||"YE"===i)&&!t.UE&&this.uE(n)){h=!0;break}if(n&&n.wQ(i,!0)){if(s&&!T.Oq.IE(o,t))break;if(e.push(n),s)break}if(o===this.Iw)break;o=o.parentNode}return e.length||h||s||!T.Oq.IE(o,t)||(e=[this]),e},RE:function(t){if(this.lW&&!T.Oq.iE(t)){var i="keypress"===t.type&&13===t.keyCode?"click":t.type;"mousedown"===i&&T.nQ.aq(t.target||t.srcElement),this.OE(t,i)}},OE:function(t,i,n){if("click"===t.type){var e=T.a.extend({},t);e.type="YE",this.OE(e,e.type,n)}if(!t._stopped&&(n=(n||[]).concat(this.tE(t,i)),n.length)){var s=n[0];"contextmenu"===i&&s.wQ(i,!0)&&T.Oq.preventDefault(t);var o={originalEvent:t};if("keypress"!==t.type){var h=s instanceof T.Marker;o.containerPoint=h?this.VW(s.oE()):this.Zw(t),o.layerPoint=this.kw(o.containerPoint),o.lnglat=h?s.oE():this.Sw(o.layerPoint)}for(var r=0;r<n.length;r++)if(n[r].WQ(i,o,!0),o.originalEvent._stopped||n[r].options.PE&&T.a.indexOf(n[r].options.PE,i)!==-1)return}},uE:function(t){return t=t.pE&&t.pE.AE()?t:this,t.pE&&t.pE.moved()||this.aE&&this.aE.moved()},ow:function(){for(var t=0,i=this.gW.length;t<i;t++)this.gW[t].disable()},SE:function(t,i){return this.lW?t.call(i||this,{target:this}):this.on("load",t,i),this},Lw:function(){return T.nQ.getPosition(this.iw)||new T.Point(0,0)},aw:function(){var t=this.Lw();return t&&!t.equals([0,0])},gw:function(t,i){var n=t&&void 0!==i?this.qE(t,i):this.Hw();return n.SQ(this.Lw())},qE:function(t,i){var n=this.getSize().dQ(2);return this.Mq(t,i).sQ(n).AQ(this.Lw()).hQ()},sE:function(t,i,n){var e=this.qE(n,i);return this.Mq(t,i).sQ(e)},sw:function(){return this.kw(this.getSize().dQ(2))},DE:function(t){return this.Kw(t).SQ(this.sw())},Ew:function(t,i,n){if(!n)return t;var e=this.Mq(t,i),s=this.getSize().DQ(2),o=new T.lQ(e.SQ(s),e.pQ(s)),h=this.dE(o,n,i);return h.HQ().equals([0,0])?t:this.nq(e.pQ(h),i)},FE:function(t,i){if(!i)return t;var n=this.Dw(),e=new T.lQ(n.min.pQ(t),n.max.pQ(t));return t.pQ(this.dE(e,i))},dE:function(t,i,n){var e=T.VQ(this.Mq(i.getNorthEast(),n),this.Mq(i.getSouthWest(),n)),s=e.min.SQ(t.min),o=e.max.SQ(t.max),h=this.fE(s.x,-o.x),r=this.fE(s.y,-o.y);return new T.Point(h,r)},fE:function(t,i){return t+i>0?Math.round(t-i)/2:Math.max(0,Math.ceil(t))-Math.max(0,Math.floor(i))},fW:function(t){var i=this.getMinZoom(),n=this.getMaxZoom(),e=T.OQ.any3d?this.options.pW:1;return e&&(t=Math.round(t/e)*e),Math.max(i,Math.min(n,t))},enableAutoResize:function(){this.options.OW=!0,T.Oq.on(window,"resize",this.DW,this)},disableAutoResize:function(){this.options.OW=!1,T.Oq.off(window,"resize",this.DW,this)},getOverlays:function(){var t=[];for(var i in this.HW)"undefined"!=typeof this.HW[i].options.type&&t.push(this.HW[i]);return t}}),T.GE=function(t,i){return new T.Map(t,i)},T.gE=T._.extend({options:{HE:"overlayPane",PE:[]},addTo:function(t){return t.addLayer(this),this},mQ:function(){return this.hE(this.JE||this.jE)},hE:function(t){return t&&t.removeLayer(this),this},jw:function(t){return this.JE.jw(t?this.options[t]||t:this.options.HE)},KE:function(t){return this.JE.eE[T.D(t)]=this,this},kE:function(t){return delete this.JE.eE[T.D(t)],this},LE:function(t){var i=t.target;if(i.hasLayer(this)){if(this.JE=i,this.lE=i.lE,this.ZE){var n=this.ZE();i.on(n,this),this.RQ("remove",function(){i.off(n,this)},this)}this.onAdd(i),this.CE&&this.JE.VE&&this.JE.VE.cE(this.CE()),this.WQ("pQ"),i.WQ("layeradd",{layer:this})}}}),T.Map.b({addLayer:function(t){"undefined"!=typeof t.options.HE&&"tilePane"==t.options.HE&&(this.JW.push(t),"undefined"!=typeof t.wW?1==t.wW&&(T.Gq.wW=t.wW):this.JW[0]?1==this.JW[0].wW&&(T.Gq.wW=this.JW[0].wW):T.Gq.wW=0);var i=T.D(t);return this.HW[i]?this:(this.HW[i]=t,"undefined"!=typeof this.HW[i].options.type&&this.hW.push(this.HW[i]),t.jE=this,t.BE&&t.BE(this),this.SE(t.LE,t),this)},removeLayer:function(t){var i=T.D(t);return this.HW[i]?(this.lW&&t.onRemove(this),t.CE&&this.VE&&this.VE.vE(t.CE()),delete this.HW[i],this.lW&&(this.WQ("layerremove",{layer:t}),t.WQ("remove")),t.JE=t.jE=null,this):this},getLayers:function(){return this.JW},clearLayers:function(){for(var t=0;t<this.JW.length;t++)this.removeOverLay(this.JW[t]);for(var t=this.JW.length-1;t>=0;t--)this.JW.splice(t,1);return this},addOverLay:function(t){this.addLayer(t),this.WQ("addoverlay",{addoverlay:t})},removeOverLay:function(t){this.removeLayer(t),this.WQ("removeoverlay",{removeoverlay:t})},clearOverLays:function(){for(var t=0;t<this.hW.length;t++)this.removeOverLay(this.hW[t]);return this.WQ("clearoverlays"),this},hasLayer:function(t){return!!t&&T.D(t)in this.HW},NE:function(t,i){for(var n in this.HW)t.call(i,this.HW[n]);return this},kW:function(t){t=t?T.a.L(t)?t:[t]:[],0==t.length&&0==this.initLayers.length&&(t=this.bE(t));for(var i=0,n=t.length;i<n;i++)this.addLayer(t[i])},bE:function(t){if(0==this.initLayers.length){var i=null,n=null;return"EPSG:4326"==this.options.uW.code&&(i=new T.TileLayer.TDT(T.w.T,{minZoom:1,maxZoom:18}),n=new T.TileLayer.TDT(T.w.TILE_VECTOR_WGS84_URLS_POI,{minZoom:1,maxZoom:18})),"EPSG:900913"!=this.options.uW.code&&"tW"!=this.options.uW.code||(i=new T.TileLayer(T.w.t,{minZoom:1,maxZoom:18}),n=new T.TileLayer(T.w.TILE_VECTOR_Mercator_URLS_POI,{minZoom:1,maxZoom:18})),null!=i&&(this.initLayers.push(i),this.initLayers.push(n)),this.initLayers}return this.initLayers},ME:function(t){!isNaN(t.options.maxZoom)&&isNaN(t.options.minZoom)||(this.jW[T.D(t)]=t,this.nE())},_E:function(t){var i=T.D(t);this.jW[i]&&(delete this.jW[i],this.nE())},nE:function(){var t=1/0,i=-(1/0),n=this.EE();for(var e in this.jW){var s=this.jW[e].options;t=void 0===s.minZoom?t:Math.min(t,s.minZoom),i=void 0===s.maxZoom?i:Math.max(i,s.maxZoom)}this.Fw=i===-(1/0)?void 0:i,this.dw=t===1/0?void 0:t,n!==this.EE()&&this.WQ("zoomlevelschange")}}),T.Overlay=T.gE.extend({options:{type:0},show:function(){this.getElement().style.display="block"},hide:function(){this.getElement().style.display="none"},isHidden:function(){return"none"==this.getElement().style.display},ZE:function(){var t={zoom:this.update,viewreset:this.update};return t},update:function(){},jw:function(t){return this.JE.jw(t?this.options[t]||t:this.options.HE)},setOptions:function(t){T.a.extend(this.options,t)}}),T.Nq.mE={R:6378137,Qe:6356752.314245179,bounds:T.VQ([-20037508.34279,-15496570.73972],[20037508.34279,18764656.23138]),Mq:function(t){var i=Math.PI/180,n=this.R,e=t.lat*i,s=this.Qe/n,o=Math.sqrt(1-s*s),h=o*Math.sin(e),r=Math.tan(Math.PI/4-e/2)/Math.pow((1-h)/(1+h),o/2);return e=-n*Math.log(Math.max(r,1e-10)),new T.Point(t.lng*i*n,e)},nq:function(t){for(var i,n=180/Math.PI,e=this.R,s=this.Qe/e,o=Math.sqrt(1-s*s),h=Math.exp(-t.y/e),r=Math.PI/2-2*Math.atan(h),a=0,u=.1;a<15&&Math.abs(u)>1e-7;a++)i=o*Math.sin(r),i=Math.pow((1-i)/(1+i),o/2),u=Math.PI/2-2*Math.atan(h*i)-r,r+=u;return new T.Dq(r*n,t.x*n/e)}},T.Gq.qe=T.extend({},T.Gq.fq,{code:"We",projection:T.Nq.mE,qW:function(){var t=.5/(Math.PI*T.Nq.mE.R);return new T.vQ(t,.5,-t,.5)}()}),T.we=T.gE.extend({options:{HE:"tilePane",Ee:256,opacity:1,zIndex:1,ee:T.OQ.mobile,updateWhenZooming:!0,Re:200,re:null,bounds:null,minZoom:0,maxZoom:void 0,Te:!1,className:"",keepBuffer:2},initialize:function(t){t=T.setOptions(this,t)},onAdd:function(){this.SW(),this.te={},this.Ye={},this.LW(),this.Ue()},BE:function(t){t.ME(this)},onRemove:function(t){this.ue(),T.nQ.mQ(this.Iw),t._E(this),this.Iw=null,this.Ie=null},ie:function(){return this.JE&&(T.nQ.qq(this.Iw),this.Oe(Math.max)),this},oe:function(){return this.JE&&(T.nQ.Wq(this.Iw),this.Oe(Math.min)),this},CE:function(){return this.options.re},getContainer:function(){return this.Iw},setOpacity:function(t){return this.options.opacity=t,this.Pe(),this},setZIndex:function(t){return this.options.zIndex=t,this.pe(),this},Ae:function(){return this.ae},redraw:function(){return this.JE&&(this.ue(),this.Ue()),this},refresh:function(){this.redraw()},ZE:function(){var t={viewprereset:this.Se,viewreset:this.LW,zoom:this.LW,moveend:this.rE};return this.options.ee||(this.se||(this.se=T.a.f(this.rE,this.options.Re,this)),t.move=this.se),this.lE&&(t.De=this.de),t},Fe:function(){return document.createElement("div")},fe:function(){var t=this.options.Ee;return t instanceof T.Point?t:new T.Point(t,t)},pe:function(){this.Iw&&void 0!==this.options.zIndex&&null!==this.options.zIndex&&(this.Iw.style.zIndex=this.options.zIndex)},Oe:function(t){for(var i,n=this.jw().children,e=-t(-(1/0),1/0),s=0,o=n.length;s<o;s++)i=n[s].style.zIndex,n[s]!==this.Iw&&i&&(e=t(e,+i));isFinite(e)&&(this.options.zIndex=e+t(-1,1),this.pe())},Pe:function(){if(this.JE&&!T.OQ.ielt9){T.nQ.setOpacity(this.Iw,this.options.opacity);var t=+new Date,i=!1,n=!1;for(var e in this.Ye){var s=this.Ye[e];if(s.Ge&&s.loaded){var o=Math.min(1,(t-s.loaded)/200);T.nQ.setOpacity(s.el,o),o<1?i=!0:(s.active&&(n=!0),s.active=!0)}}n&&!this.ge&&this.He(),i&&(T.a.C(this.he),this.he=T.a.Z(this.Pe,this))}},SW:function(){this.Iw||(this.Iw=T.nQ.S("div","tdt-layer "+(this.options.className||"")),this.pe(),this.options.opacity<1&&this.Pe(),this.jw().appendChild(this.Iw))},Je:function(){var t=this.Ie,i=this.options.maxZoom;if(void 0!==t){for(var n in this.te)this.te[n].el.children.length||n===t?this.te[n].el.style.zIndex=i-Math.abs(t-n):(T.nQ.mQ(this.te[n].el),this.je(n),delete this.te[n]);var e=this.te[t],s=this.JE;return e||(e=this.te[t]={},e.el=T.nQ.S("div","tdt-tile-container tdt-zoom-animated",this.Iw),e.el.style.zIndex=i,e.origin=s.Mq(s.nq(s.Hw()),t).HQ(),e.zoom=t,this.Ke(e,s.getCenter(),s.getZoom()),T.a.g(e.el.offsetWidth)),this.ke=e,e}},He:function(){if(this.JE){var t,i,n=this.JE.getZoom();if(n>this.options.maxZoom||n<this.options.minZoom)return void this.ue();for(t in this.Ye)i=this.Ye[t],i.retain=i.Ge;for(t in this.Ye)if(i=this.Ye[t],i.Ge&&!i.active){var e=i.coords;this.Le(e.x,e.y,e.z,e.z-5)||this.le(e.x,e.y,e.z,e.z+2)}for(t in this.Ye)this.Ye[t].retain||this.Ze(t)}},je:function(t){for(var i in this.Ye)this.Ye[i].coords.z===t&&this.Ze(i)},ue:function(){for(var t in this.Ye)this.Ze(t)},Se:function(){for(var t in this.te)T.nQ.mQ(this.te[t].el),delete this.te[t];this.ue(),this.Ie=null},Le:function(t,i,n,e){var s=Math.floor(t/2),o=Math.floor(i/2),h=n-1,r=new T.Point(+s,+o);r.z=+h;var a=this.Ce(r),u=this.Ye[a];return u&&u.active?(u.retain=!0,!0):(u&&u.loaded&&(u.retain=!0),h>e&&this.Le(s,o,h,e))},le:function(t,i,n,e){for(var s=2*t;s<2*t+2;s++)for(var o=2*i;o<2*i+2;o++){var h=new T.Point(s,o);h.z=n+1;var r=this.Ce(h),a=this.Ye[r];a&&a.active?a.retain=!0:(a&&a.loaded&&(a.retain=!0),n+1<e&&this.le(s,o,n+1,e))}},LW:function(t){var i=t&&(t.pinch||t.Ve);this.ce(this.JE.getCenter(),this.JE.getZoom(),i,i)},de:function(t){this.ce(t.center,t.zoom,!0,t.noUpdate)},ce:function(t,i,n,e){var s=Math.round(i);(void 0!==this.options.maxZoom&&s>this.options.maxZoom||void 0!==this.options.minZoom&&s<this.options.minZoom)&&(s=void 0);var o=this.options.updateWhenZooming&&s!==this.Ie;e&&!o||(this.Ie=s,this.Be&&this.Be(),this.Je(),this.ve(),void 0!==s&&this.Ue(t),n||this.He(),this.ge=!!n),this.Ne(t,i)},Ne:function(t,i){for(var n in this.te)this.Ke(this.te[n],t,i)},Ke:function(t,i,n){var e=this.JE.CW(n,t.zoom),s=t.origin.FQ(e).SQ(this.JE.qE(i,n)).HQ();T.OQ.any3d?T.nQ.Yq(t.el,s,e):T.nQ.setPosition(t.el,s)},ve:function(){var t=this.JE,i=t.options.uW,n=this.be=this.fe(),e=this.Ie,s=this.JE.Jw(this.Ie);s&&(this.Me=this.ne(s)),this._e=i.RW&&!this.options.Te&&[Math.floor(t.Mq([0,i.RW[0]],e).x/n.x),Math.ceil(t.Mq([0,i.RW[1]],e).x/n.y)],this.me=i.wrapLat&&!this.options.Te&&[Math.floor(t.Mq([i.wrapLat[0],0],e).y/n.x),Math.ceil(t.Mq([i.wrapLat[1],0],e).y/n.y)]},rE:function(){this.JE&&!this.JE.QR&&this.Ue()},qR:function(t){var i=this.JE,n=i.QR?Math.max(i.WR,i.getZoom()):i.getZoom(),e=i.CW(n,this.Ie),s=i.Mq(t,this.Ie).JQ(),o=i.getSize().DQ(2*e);return new T.lQ(s.SQ(o),s.pQ(o))},Ue:function(t){var i=this.JE;if(i){var n=i.getZoom();if(void 0===t&&(t=i.getCenter()),void 0!==this.Ie){var e=this.qR(t),s=this.ne(e),o=s.getCenter(),h=[],r=this.options.keepBuffer,a=new T.lQ(s.ZQ().SQ([r,-r]),s.CQ().pQ([r,-r]));for(var u in this.Ye){var c=this.Ye[u].coords;c.z===this.Ie&&a.contains(T.aQ(c.x,c.y))||(this.Ye[u].Ge=!1)}if(Math.abs(n-this.Ie)>1)return void this.ce(t,n);for(var l=s.min.y;l<=s.max.y;l++)for(var f=s.min.x;f<=s.max.x;f++){var d=new T.Point(f,l);if(d.z=this.Ie,this.wR(d)){var p=this.Ye[this.Ce(d)];p?p.Ge=!0:h.push(d)}}if(h.sort(function(t,i){return t.distanceTo(o)-i.distanceTo(o)}),0!==h.length){this.ae||(this.ae=!0,this.WQ("loading"));var m=document.createDocumentFragment();for(f=0;f<h.length;f++)this.ER(h[f],m);this.ke.el.appendChild(m)}}}},wR:function(t){var i=this.JE.options.uW;if(!i.eW){var n=this.Me;if(!i.RW&&(t.x<n.min.x||t.x>n.max.x)||!i.wrapLat&&(t.y<n.min.y||t.y>n.max.y))return!1}if(!this.options.bounds)return!0;var e=this.eR(t);return T.Jq(this.options.bounds).cQ(e)},RR:function(t){return this.eR(this.rR(t))},eR:function(t){var i=this.JE,n=this.fe(),e=t.GQ(n),s=e.pQ(n),o=i.Hq(i.nq(e,t.z)),h=i.Hq(i.nq(s,t.z));return new T.jq(o,h)},Ce:function(t){return t.x+":"+t.y+":"+t.z},rR:function(t){var i=t.split(":"),n=new T.Point(+i[0],+i[1]);return n.z=+i[2],n},Ze:function(t){var i=this.Ye[t];i&&(T.nQ.mQ(i.el),delete this.Ye[t],this.WQ("tileunload",{tile:i.el,coords:this.rR(t)}))},TR:function(t){T.nQ.eq(t,"tdt-tile");var i=this.fe();t.style.width=i.x+"px",t.style.height=i.y+"px",t.onselectstart=T.a.g,t.onmousemove=T.a.g,T.OQ.ielt9&&this.options.opacity<1&&T.nQ.setOpacity(t,this.options.opacity),T.OQ.android&&!T.OQ.android23&&(t.style.WebkitBackfaceVisibility="hidden")},ER:function(t,i){var n=this.tR(t),e=this.Ce(t),s=this.Fe(this.YR(t),T.s(this.UR,this,t));this.TR(s),this.Fe.length<2&&T.a.Z(T.s(this.UR,this,t,null,s)),T.nQ.setPosition(s,n),this.Ye[e]={el:s,coords:t,Ge:!0},i.appendChild(s),this.WQ("tileloadstart",{tile:s,coords:t})},UR:function(t,i,n){if(this.JE){i&&this.WQ("tileerror",{error:i,tile:n,coords:t});var e=this.Ce(t);n=this.Ye[e],n&&(n.loaded=+new Date,this.JE.vw?(T.nQ.setOpacity(n.el,0),T.a.C(this.he),this.he=T.a.Z(this.Pe,this)):(n.active=!0,this.He()),T.nQ.eq(n.el,"tdt-tile-loaded"),this.WQ("tileload",{tile:n.el,coords:t}),this.uR()&&(this.ae=!1,this.WQ("load"),T.OQ.ielt9||!this.JE.vw?T.a.Z(this.He,this):setTimeout(T.s(this.He,this),250)))}},tR:function(t){return t.GQ(this.fe()).SQ(this.ke.origin)},YR:function(t){var i=new T.Point(this._e?T.a.G(t.x,this._e):t.x,this.me?T.a.G(t.y,this.me):t.y);return i.z=t.z,i},ne:function(t){var i=this.fe();return new T.lQ(t.min.gQ(i).JQ(),t.max.gQ(i).KQ().SQ([1,1]))},uR:function(){for(var t in this.Ye)if(!this.Ye[t].loaded)return!1;return!0}}),T.IR=function(t){return new T.we(t)},T.TileLayer=T.we.extend({options:{minZoom:0,maxZoom:18,iR:"abc",errorTileUrl:"",OR:0,oR:null,PR:!1,pR:!1,AR:!1,aR:!1},initialize:function(t,i){this.SR=t,i=T.setOptions(this,i),i.AR&&T.OQ.retina&&i.maxZoom>0&&(i.Ee=Math.floor(i.Ee/2),i.pR?(i.OR--,i.minZoom++):(i.OR++,i.maxZoom--),i.minZoom=Math.max(0,i.minZoom)),"string"==typeof i.iR&&(i.iR=i.iR.split("")),T.OQ.android||this.on("tileunload",this.sR)},setUrl:function(t,i){return this.SR=t,i||this.redraw(),this},Fe:function(t,i){var n=document.createElement("img");return T.Oq.on(n,"load",T.s(this.DR,this,i,n)),T.Oq.on(n,"error",T.s(this.dR,this,i,n)),this.options.aR&&(n.aR=""),n.dq="",n.src=this.FR(t),n},FR:function(t){var i={r:T.OQ.retina?"@2x":"",s:this.fR(t),x:t.x,y:t.y,z:this.GR()};if(this.JE&&!this.JE.options.uW.eW){var n=this.Me.max.y-t.y;this.options.PR&&(i.y=n),i["-y"]=n}return"function"==typeof this.SR?this._url_temp=this.SR()+"x={x}&y={y}&l={z}":this._url_temp=this.SR,T.a.K(this._url_temp,T.extend(i,this.options))},DR:function(t,i){T.OQ.ielt9?setTimeout(T.s(t,this,null,i),0):t(null,i)},dR:function(t,i,n){var e=this.options.errorTileUrl;e&&(i.src=e),t(n,i)},fe:function(){var t=this.JE,i=T.we.prototype.fe.call(this),n=this.Ie+this.options.OR,e=this.options.oR;return null!==e&&n>e?i.DQ(t.CW(e,n)).HQ():i},sR:function(t){t.tile.onload=null},GR:function(){var t=this.options,i=this.Ie;return t.pR&&(i=t.maxZoom-i),i+=t.OR,null!==t.oR?Math.min(i,t.oR):i},fR:function(t){var i=Math.abs(t.x+t.y)%this.options.iR.length;return this.options.iR[i]},Be:function(){var t,i;for(t in this.Ye)this.Ye[t].coords.z!==this.Ie&&(i=this.Ye[t].el,i.onload=T.a.g,i.onerror=T.a.g,i.complete||(i.src=T.a.l,T.nQ.mQ(i)))}}),T.gR=function(t,i){return new T.TileLayer(t,i)},T.TileLayer.WMS=T.TileLayer.extend({defaultWmsParams:{service:"WMS",request:"GetMap",version:"1.1.1",layers:"",styles:"",format:"image/jpeg",transparent:!1},options:{uW:null,srs:null,HR:!1},initialize:function(t,i){this.SR=t;var n=T.extend({},this.defaultWmsParams);for(var e in i)e in this.options||(n[e]=i[e]);i=T.setOptions(this,i),this.wmsSrs="EPSG:900913",i.srs?"EPSG:4326"==i.srs?(i.uW=T.Gq.UW,this.wmsSrs="EPSG:4326"):(i.uW=T.Gq.YW,i.srs="EPSG:900913",this.wmsSrs="EPSG:900913"):i.srs=this.wmsSrs,n.width=n.height=i.Ee*(i.AR&&T.OQ.retina?2:1),this.hR=n},onAdd:function(t){this.JR=this.options.uW||t.options.uW,this.jR=parseFloat(this.hR.version);var i=this.jR>=1.3?"uW":"srs";this.hR[i]=this.JR.code,T.TileLayer.prototype.onAdd.call(this,t)},FR:function(t){var i=this.eR(t),n=this.JR.Mq(i.lq()),e=this.JR.Mq(i.Vq()),s=(this.jR>=1.3&&this.JR===T.Gq.UW?[e.y,n.x,n.y,e.x]:[n.x,e.y,e.x,n.y]).join(","),o=T.TileLayer.prototype.FR.call(this,t);return o+T.a.j(this.hR,o,this.options.HR)+(this.options.HR?"&BBOX=":"&bbox=")+s},setParams:function(t,i){return T.extend(this.hR,t),i||this.redraw(),this}}),T.gR.wms=function(t,i){return new T.TileLayer.WMS(t,i)},T.TileLayer.TDT=T.TileLayer.extend({wW:1}),T.gR.tdt=function(t,i){return new T.TileLayer.tdt(t,i)},T.KR=T.gE.extend({options:{opacity:1,dq:"",kR:!1,re:null,aR:!1},initialize:function(t,i,n){this.SR=t,this.LR=T.Jq(i),T.setOptions(this,n)},onAdd:function(){this.lR||(this.ZR(),this.options.opacity<1&&this.Pe()),this.options.kR&&(T.nQ.eq(this.lR,"tdt-interactive"),this.KE(this.lR)),this.jw().appendChild(this.lR),this.CR()},onRemove:function(){T.nQ.mQ(this.lR),this.options.kR&&this.kE(this.lR)},setOpacity:function(t){return this.options.opacity=t,this.lR&&this.Pe(),this},VR:function(t){return t.opacity&&this.setOpacity(t.opacity),this},ie:function(){return this.JE&&T.nQ.qq(this.lR),this},oe:function(){return this.JE&&T.nQ.Wq(this.lR),this},setUrl:function(t){return this.SR=t,this.lR&&(this.lR.src=t),this},setBounds:function(t){return this.LR=t,this.JE&&this.CR(),this},CE:function(){return this.options.re},ZE:function(){var t={zoom:this.CR,viewreset:this.CR};return this.lE&&(t.De=this.de),t},getBounds:function(){return this.LR},getElement:function(){return this.lR},ZR:function(){var t=this.lR=T.nQ.S("img","tdt-image-layer "+(this.lE?"tdt-zoom-animated":""));t.onselectstart=T.a.g,t.onmousemove=T.a.g,t.onload=T.s(this.WQ,this,"load"),this.options.aR&&(t.aR=""),t.src=this.SR,t.dq=this.options.dq},de:function(t){var i=this.JE.CW(t.zoom),n=this.JE.sE(this.LR.lq(),t.zoom,t.center);T.nQ.Yq(this.lR,n,i)},CR:function(){var t=this.lR,i=new T.lQ(this.JE.Kw(this.LR.lq()),this.JE.Kw(this.LR.Vq())),n=i.getSize();T.nQ.setPosition(t,i.min),t.style.width=n.x+"px",t.style.height=n.y+"px"},Pe:function(){T.nQ.setOpacity(this.lR,this.options.opacity)}}),T.cR=function(t,i,n){return new T.KR(t,i,n)},T.Icon=T.V.extend({initialize:function(t){T.setOptions(this,t)},setIconUrl:function(t){this.options.iconUrl=t,this.img&&(this.img.src=t)},getIconUrl:function(t){if(this.img)return this.img.src},setIconSize:function(t){this.options.iconSize=t,this.img&&(this.img.style.width=t.x+"px",this.img.style.height=t.y+"px")},getIconSize:function(){return this.options.iconSize},setIconAnchor:function(t){this.options.iconAnchor=t,this.BR(this.img,"icon")},getIconAnchor:function(t){return this.options.iconAnchor},vR:function(t){return this.NR("icon",t)},bR:function(t){return this.NR("shadow",t)},NR:function(t,i){var n=this.MR(t);return n?(this.img=this.nR(n,i&&"IMG"===i.tagName?i:null),this.BR(this.img,t),this.img):null},BR:function(t,i){var n=this.options,e=n[i+"Size"];T.a.L(e)||e instanceof T.Point||(e=[e,e]);var s=T.aQ(e),o=T.aQ("shadow"===i&&n._R||n.iconAnchor||s&&s.DQ(2,!0));t.className="tdt-marker-"+i+" "+(n.className||""),o&&(t.style.marginLeft=-o.x+"px",t.style.marginTop=-o.y+"px"),s&&(t.style.width=s.x+"px",t.style.height=s.y+"px")},nR:function(t,i){return i=i||document.createElement("img"),i.src=t,i},MR:function(t){return T.OQ.retina&&this.options[t+"RetinaUrl"]||this.options[t+"Url"]}}),T.mR=function(t){return new T.Icon(t)},T.Icon.Default=T.Icon.extend({options:{iconSize:[25,41],iconAnchor:[12,41],popupAnchor:[1,-41],shadowSize:[41,41]},MR:function(t){var i=t+"Url";if(this.options[i])return this.options[i];var n=T.Icon.Default.imagePath;return n+"/marker-"+t+(T.OQ.retina&&"icon"===t?"-2x":"")+".png"}}),T.Icon.Default.imagePath=function(){var t,i,n,e,s=document.getElementsByTagName("script"),o=/[\/^]tdt[\-\._]?([\w\-\._]*)\.js\??/;for(t=0,i=s.length;t<i;t++)if(n=s[t].src||"",n.match(o))return e=n.split(o)[0],(e?e+"/":"")+"image"}(),T.Icon.Default.imagePath=T.w.e,T.Marker=T.Overlay.extend({options:{icon:new T.Icon.Default,kR:!0,draggable:!1,Qr:!0,title:"",zIndexOffset:0,opacity:1,qr:!0,Wr:250,type:2,HE:"markerPane",PE:["click","dblclick","mouseover","mouseout","contextmenu"]},initialize:function(t,i){T.setOptions(this,i),this.wr=T.Fq(t),this.Er=null},onAdd:function(t){this.lE=this.lE&&t.options.oW,this.lE&&t.on("De",this.de,this),this.er(),this.update()},onRemove:function(t){this.pE&&this.pE.AE()&&(this.options.draggable=!0,this.pE.Rr()),this.lE&&t.off("De",this.de,this),this.rr(),this.Tr(),this.Er=null},ZE:function(){return{zoom:this.update,viewreset:this.update}},getType:function(){return this.options.type},getMap:function(){return this.JE},getLngLat:function(){return this.oE()},oE:function(){return this.wr},setLngLat:function(t){this.tr(t)},tr:function(t){var i=this.wr;return this.wr=T.Fq(t),this.update(),this.WQ("move",{oldLngLat:i,lnglat:this.wr})},setZIndexOffset:function(t){return this.options.zIndexOffset=t,this.update()},Yr:function(t){return this.options.icon=t,this.JE&&(this.er(),this.update()),this.Ur&&this.ur(this.Ur,this.Ur.options),this},getIcon:function(){return this.options.icon},enableDragging:function(){this.pE.enable()},disableDragging:function(){this.pE.disable()},getElement:function(){return this.Ir},update:function(){if(this.Ir){var t=this.JE.Kw(this.wr).HQ();this.ir(t)}return this},er:function(){var t=this.options,i="tdt-zoom-"+(this.lE?"animated":"hide"),n=t.icon.vR(this.Ir),e=!1;n!==this.Ir&&(this.Ir&&this.rr(),e=!0,t.title&&(n.title=t.title),t.dq&&(n.dq=t.dq)),T.nQ.eq(n,i),t.Qr&&(n.tabIndex="0"),this.Ir=n,t.qr&&this.on({mouseover:this.Or,mouseout:this.or});var s=t.icon.bR(this.Pr),o=!1;s!==this.Pr&&(this.Tr(),o=!0),s&&T.nQ.eq(s,i),this.Pr=s,t.opacity<1&&this.Pe(),e&&this.jw().appendChild(this.Ir),this.pr(),s&&o&&this.jw("nw").appendChild(this.Pr)},rr:function(){this.options.qr&&this.off({mouseover:this.Or,mouseout:this.or}),T.nQ.mQ(this.Ir),this.kE(this.Ir),this.Ir=null},Tr:function(){this.Pr&&T.nQ.mQ(this.Pr),this.Pr=null},ir:function(t){T.nQ.setPosition(this.Ir,t),this.Pr&&T.nQ.setPosition(this.Pr,t),this.Ar=t.y+this.options.zIndexOffset,this.or()},pe:function(t){this.Ir.style.zIndex=this.Ar+t},de:function(t){var i=this.JE.sE(this.wr,t.zoom,t.center).HQ();this.ir(i)},pr:function(){if(this.options.kR&&(T.nQ.eq(this.Ir,"tdt-interactive"),this.KE(this.Ir),T.Sr.ar)){var t=this.options.draggable;this.pE&&(t=this.pE.AE(),this.pE.disable()),this.pE=new T.Sr.ar(this),t&&this.pE.enable()}},setOpacity:function(t){return this.options.opacity=t,this.JE&&this.Pe(),this},Pe:function(){var t=this.options.opacity;T.nQ.setOpacity(this.Ir,t),this.Pr&&T.nQ.setOpacity(this.Pr,t)},Or:function(){this.pe(this.options.Wr)},or:function(){this.pe(0)}}),T.sr=function(t,i){return new T.Marker(t,i)},T.DivIcon=T.Icon.extend({options:{iconSize:[12,12],Dr:!1,dr:null,className:"tdt-div-icon"},vR:function(t){var i=t&&"DIV"===t.tagName?t:document.createElement("div"),n=this.options;if(i.innerHTML=n.Dr!==!1?n.Dr:"",n.dr){var e=T.aQ(n.dr);i.style.backgroundPosition=-e.x+"px "+-e.y+"px"}return this.BR(i,"icon"),i},bR:function(){return null}}),T.Fr=function(t){return new T.DivIcon(t)},T.Map.M({fr:!1}),T.Gr=T.gE.extend({options:{HE:"infoWindowPane",minWidth:50,gr:300,maxHeight:null,offset:[0,7],autoPan:!1,autoPanPadding:[5,5],Hr:null,hr:null,closeButton:!0,Jr:!0,jr:!1,Kr:!0},initialize:function(t,i){T.setOptions(this,t),this.kr=i},onAdd:function(t){this.lE=this.lE&&this.options.Kr,this.Iw||this.sW(),t.vw&&T.nQ.setOpacity(this.Iw,0),clearTimeout(this.Lr),this.jw().appendChild(this.Iw),this.update(),t.vw&&T.nQ.setOpacity(this.Iw,1),t.WQ("lr",{Zr:this}),this.WQ("open",{lnglat:this.wr}),this.kr&&(this.kr.WQ("lr",{Zr:this},!0),this.kr.on("YE",T.Oq.stopPropagation))},Cr:function(t){return t.Vr(this),this},onRemove:function(t){t.vw?(T.nQ.setOpacity(this.Iw,0),this.Lr=setTimeout(T.s(T.nQ.mQ,T.nQ,this.Iw),200)):T.nQ.mQ(this.Iw),t.WQ("cr",{Zr:this}),this.WQ("close",{lnglat:this.wr,infowindow:this}),this.kr&&(this.kr.WQ("cr",{Zr:this},!0),this.kr.off("YE",T.Oq.stopPropagation))},oE:function(){return this.wr},tr:function(t){return this.wr=T.Fq(t),this.JE&&(this.Br(),this.vr()),this},getContent:function(){return this.Nr},setContent:function(t){return this.Nr=t,this.update(),this},getElement:function(){return this.Iw},update:function(){this.JE&&(this.Iw.style.visibility="hidden",this.br(),this.Mr(),this.Br(),this.Iw.style.visibility="",this.vr())},ZE:function(){var t={zoom:this.Br,viewreset:this.Br};return this.lE&&(t.De=this.de),("nr"in this.options?this.options.nr:this.JE.options.fr)&&(t.YE=this._r),this.options.jr&&(t.moveend=this.vr),t},isOpen:function(){return!!this.JE&&this.JE.hasLayer(this)},ie:function(){return this.JE&&T.nQ.qq(this.Iw),this},oe:function(){return this.JE&&T.nQ.Wq(this.Iw),this},_r:function(){this.JE&&(this.WQ("clickclose",{}),this.JE.mr(this))},sW:function(){var t="tdt-infowindow",i=this.Iw=T.nQ.S("div",t+" "+(this.options.className||"")+" tdt-zoom-"+(this.lE?"animated":"hide"));if(this.options.closeButton){var n=this.QT=T.nQ.S("a",t+"-close-button",i);n.href="#close",n.innerHTML="&#215;",T.Oq.on(n,"click",this.qT,this)}var e=this.WT=T.nQ.S("div",t+"-content-wrapper",i);this.wT=T.nQ.S("div",t+"-content",e),T.Oq.eT(e).ET(this.wT).on(e,"contextmenu",T.Oq.stopPropagation),this.RT=T.nQ.S("div",t+"-tip-container",i),this.rT=T.nQ.S("div",t+"-tip",this.RT)},br:function(){if(this.Nr){var t=this.wT,i="function"==typeof this.Nr?this.Nr(this.kr||this):this.Nr;if("string"==typeof i)t.innerHTML=i;else{for(;t.hasChildNodes();)t.removeChild(t.firstChild);t.appendChild(i)}this.WQ("contentupdate")}},Mr:function(){var t=this.wT,i=t.style;i.width="",i.whiteSpace="nowrap";var n=t.offsetWidth;n=Math.min(n,this.options.gr),n=Math.max(n,this.options.minWidth),i.width=n+1+"px",i.whiteSpace="",i.height="";var e=t.offsetHeight,s=this.options.maxHeight,o="tdt-infowindow-scrolled";s&&e>s?(i.height=s+"px",T.nQ.eq(t,o)):T.nQ.rq(t,o),this.TT=this.Iw.offsetWidth},Br:function(){if(this.JE){var t=this.JE.Kw(this.wr),i=T.aQ(this.options.offset),n=this._getAnchor();this.lE?T.nQ.setPosition(this.Iw,t.pQ(n)):i=i.pQ(t).pQ(n);var e=this.tT=-i.y,s=this.YT=-Math.round(this.TT/2)+i.x;this.Iw.style.bottom=e+"px",this.Iw.style.left=s+"px"}},de:function(t){var i=this.JE.sE(this.wr,t.zoom,t.center),n=this._getAnchor();T.nQ.setPosition(this.Iw,i.pQ(n))},vr:function(){if(!(!this.options.autoPan||this.JE.wE&&this.JE.wE.UT)){var t=this.JE,i=this.Iw.offsetHeight,n=this.TT,e=new T.Point(this.YT,-i-this.tT);this.lE&&e.AQ(T.nQ.getPosition(this.Iw));var s=t.lw(e),o=T.aQ(this.options.autoPanPadding),h=T.aQ(this.options.Hr||o),r=T.aQ(this.options.hr||o),a=t.getSize(),u=0,c=0;s.x+n+r.x>a.x&&(u=s.x+n-a.x+r.x),s.x-u-h.x<0&&(u=s.x-h.x),s.y+i+r.y>a.y&&(c=s.y+i-a.y+r.y),s.y-c-h.y<0&&(c=s.y-h.y),(u||c)&&t.WQ("uT").panBy([u,c])}},qT:function(t){this._r(),T.Oq.Yw(t)},_getAnchor:function(){return T.aQ(this.kr&&this.kr.IT?this.kr.IT():[0,0])}}),T.Zr=function(t,i){return new T.Gr(t,i)},T.Map.b({Vr:function(t,i,n){return t instanceof T.Gr||(t=new T.Gr(n).setContent(t)),i&&t.tr(i),this.hasLayer(t)?this:(this.Ur&&this.Ur.options.Jr&&this.mr(),this.Ur=t,this.addLayer(t))},openInfoWindow:function(t,i,n){this.Vr(t,i,n)},closeInfoWindow:function(t){this.mr(t)},mr:function(t){return t&&t!==this.Ur||(t=this.Ur,this.Ur=null),t&&this.removeLayer(t),this},closeInfoWindow:function(t){this.mr(t)}}),T.gE.b({ur:function(t,i){return t instanceof T.Gr?(T.setOptions(t,i),this.Ur=t,t.kr=this):(this.Ur&&!i||(this.Ur=new T.Gr(i,this)),this.Ur.setContent(t)),this.iT||(this.on({mQ:this.mr,move:this.OT}),this.iT=!0),this},oT:function(){return this.Ur&&(this.off({mQ:this.mr,move:this.OT}),this.iT=!1,this.Ur=null),this},openInfoWindow:function(t,i){this.Vr(),this.Er||(this.Er=this.ur(t,i),this.Vr())},closeInfoWindow:function(){this.mr()},Vr:function(t,i){if(t instanceof T.gE||(i=t,t=this),t instanceof T.PT)for(var n in this.HW){t=this.HW[n];break}return i||(i=t.getCenter?t.getCenter():t.oE()),this.Ur&&this.JE&&(this.Ur.kr=t,this.Ur.update(),this.JE.Vr(this.Ur,i)),this},mr:function(){return this.Ur&&this.Ur._r(),this},pT:function(t){return this.Ur&&(this.Ur.JE?this.mr():this.Vr(t)),this},AT:function(){return this.Ur.isOpen()},isOpen:function(){this.AT()},aT:function(t){return this.Ur&&this.Ur.setContent(t),this},ST:function(){return this.Ur},sT:function(t){var i=t.layer||t.target;if(this.Ur&&this.JE)return T.Oq.Yw(t),i instanceof T.DT?void this.Vr(t.layer||t.target,t.dT):void(this.JE.hasLayer(this.Ur)&&this.Ur.kr===i?this.mr():this.Vr(i,t.dT))},OT:function(t){this.Ur.tr(t.dT)}}),T.Marker.b({IT:function(){return this.options.icon.options.popupAnchor||(this.options.icon.options.iconAnchor?T.a.L(this.options.icon.options.iconAnchor)?this.options.icon.options.popupAnchor=[0,-this.options.icon.options.iconAnchor[1]]:this.options.icon.options.popupAnchor=[0,-this.options.icon.options.iconAnchor.y]:this.options.icon.options.popupAnchor=[0,0]),this.options.icon.options.popupAnchor}}),T.InfoWindow=T.Gr.extend({options:{type:3},initialize:function(t,i,n){this.Nr=t,T.setOptions(this,i),this.kr=n},getType:function(){return this.options.type},setMinWidth:function(t){this.options.minWidth=t,this.update()},setMaxWidth:function(t){this.options.gr=t,this.update()},setMaxHeight:function(t){this.options.maxHeight=t,this.update()},setLngLat:function(t){this.tr(t)},setOffset:function(t){this.options.offset=t,this.update()},getOffset:function(){return this.options.offset},closeInfoWindow:function(){this._r()}}),T.LayerGroup=T.gE.extend({initialize:function(t){this.HW={};var i,n;if(t)for(i=0,n=t.length;i<n;i++)this.addLayer(t[i])},addLayer:function(t){var i=this.getLayerId(t);return this.HW[i]=t,this.JE&&this.JE.addLayer(t),this},removeLayer:function(t){var i=t in this.HW?t:this.getLayerId(t);return this.JE&&this.HW[i]&&this.JE.removeLayer(this.HW[i]),delete this.HW[i],this},hasLayer:function(t){return!!t&&(t in this.HW||this.getLayerId(t)in this.HW)},clearLayers:function(){for(var t in this.HW)this.removeLayer(this.HW[t]);return this},FT:function(t){var i,n,e=Array.prototype.slice.call(arguments,1);for(i in this.HW)n=this.HW[i],n[t]&&n[t].apply(n,e);return this},onAdd:function(t){for(var i in this.HW)t.addLayer(this.HW[i])},onRemove:function(t){for(var i in this.HW)t.removeLayer(this.HW[i])},NE:function(t,i){for(var n in this.HW)t.call(i,this.HW[n]);return this},getLayer:function(t){return this.HW[t]},getLayers:function(){var t=[];for(var i in this.HW)t.push(this.HW[i]);return t},setZIndex:function(t){return this.FT("setZIndex",t)},getLayerId:function(t){return T.D(t)}}),T.fT=function(t){return new T.LayerGroup(t)},T.PT=T.LayerGroup.extend({addLayer:function(t){return this.hasLayer(t)?this:(t.rQ(this),T.LayerGroup.prototype.addLayer.call(this,t),this.WQ("layeradd",{layer:t}))},removeLayer:function(t){return this.hasLayer(t)?(t in this.HW&&(t=this.HW[t]),t.TQ(this),T.LayerGroup.prototype.removeLayer.call(this,t),this.WQ("layerremove",{layer:t})):this},VR:function(t){return this.FT("VR",t)},ie:function(){return this.FT("ie")},oe:function(){return this.FT("oe")},getBounds:function(){var t=new T.jq;for(var i in this.HW){var n=this.HW[i];t.extend(n.getBounds?n.getBounds():n.oE())}return t}}),T.GT=function(t){return new T.PT(t)},T.gT=T.gE.extend({options:{NW:.1},initialize:function(t){T.setOptions(this,t),T.D(this)},onAdd:function(){this.Iw||(this.SW(),this.lE&&T.nQ.eq(this.Iw,"tdt-zoom-animated")),this.jw().appendChild(this.Iw),this.Ue()},onRemove:function(){T.nQ.mQ(this.Iw)},ZE:function(){var t={viewreset:this.CR,zoom:this.HT,moveend:this.Ue};return this.lE&&(t.De=this.hT),t},hT:function(t){this.JT(t.center,t.zoom)},HT:function(){this.JT(this.JE.getCenter(),this.JE.getZoom())},JT:function(t,i){var n=this.JE.CW(i,this.FW),e=T.nQ.getPosition(this.Iw),s=this.JE.getSize().FQ(.5+this.options.NW),o=this.JE.Mq(this.jT,i),h=this.JE.Mq(t,i),r=h.SQ(o),a=s.FQ(-n).pQ(e).pQ(s).SQ(r);T.OQ.any3d?T.nQ.Yq(this.Iw,a,n):T.nQ.setPosition(this.Iw,a)},CR:function(){this.Ue(),this.JT(this.jT,this.FW)},Ue:function(){var t=this.options.NW,i=this.JE.getSize(),n=this.JE.kw(i.FQ(-t)).HQ();this.LR=new T.lQ(n,n.pQ(i.FQ(1+2*t)).HQ()),this.jT=this.JE.getCenter(),this.FW=this.JE.getZoom()}}),T.Map.b({KT:function(t){var i=t.options.IW||this.kT(t.options.HE)||this.options.IW||this.LT;return i||(i=this.LT=this.options.CT&&T.ZT()||T.lT()),this.hasLayer(i)||this.addLayer(i),i},kT:function(t){if("overlayPane"===t||void 0===t)return!1;var i=this.Mw[t];return void 0===i&&(i=T.SVG&&T.lT({HE:t})||T.VT&&T.ZT({HE:t}),this.Mw[t]=i),i}}),T.DT=T.gE.extend({options:{stroke:!0,color:"#0000FF",weight:3,opacity:.5,cT:"round",BT:"round",dashArray:null,dashOffset:null,fill:!1,fillColor:null,fillOpacity:.2,vT:"evenodd",kR:!0},BE:function(t){this.LT=t.KT(this)},onAdd:function(){this.LT.NT(this),this.CR(),this.LT.bT(this)},onRemove:function(){this.LT.MT(this)},ZE:function(){return{zoomend:this.nT,moveend:this.Ue,viewreset:this.CR}},redraw:function(){return this.JE&&this.LT._T(this),this},VR:function(t){return T.setOptions(this,t),this.LT&&this.LT.mT(this),this},ie:function(){return this.LT&&this.LT.Or(this),this},oe:function(){return this.LT&&this.LT.Qt(this),this},getElement:function(){return this.qt},CR:function(){this.nT(),this.Ue()},Wt:function(){return(this.options.stroke?this.options.weight/2:0)+(T.OQ.touch?10:0)}}),T.wt={Et:function(t,i){if(!i||!t.length)return t.slice();var n=i*i;return t=this.et(t,n),t=this.Rt(t,n)},rt:function(t,i,n){return Math.sqrt(this.Tt(t,i,n,!0))},tt:function(t,i,n){return this.Tt(t,i,n)},Rt:function(t,i){var n=t.length,e=typeof Uint8Array!=void 0+""?Uint8Array:Array,s=new e(n);s[0]=s[n-1]=1,this.Yt(t,s,i,0,n-1);var o,h=[];for(o=0;o<n;o++)s[o]&&h.push(t[o]);return h},Yt:function(t,i,n,e,s){var o,h,r,a=0;for(h=e+1;h<=s-1;h++)r=this.Tt(t[h],t[e],t[s],!0),r>a&&(o=h,a=r);a>n&&(i[o]=1,this.Yt(t,i,n,e,o),this.Yt(t,i,n,o,s))},et:function(t,i){for(var n=[t[0]],e=1,s=0,o=t.length;e<o;e++)this.Ut(t[e],t[s])>i&&(n.push(t[e]),s=e);return s<o-1&&n.push(t[o-1]),n},ut:function(t,i,n,e,s){var o,h,r,a=e?this.It:this.it(t,n),u=this.it(i,n);for(this.It=u;;){if(!(a|u))return[t,i];if(a&u)return!1;o=a||u,h=this.Ot(t,i,o,n,s),r=this.it(h,n),o===a?(t=h,a=r):(i=h,u=r)}},Ot:function(t,i,n,e,s){var o,h,r=i.x-t.x,a=i.y-t.y,u=e.min,c=e.max;return 8&n?(o=t.x+r*(c.y-t.y)/a,h=c.y):4&n?(o=t.x+r*(u.y-t.y)/a,h=u.y):2&n?(o=c.x,h=t.y+a*(c.x-t.x)/r):1&n&&(o=u.x,h=t.y+a*(u.x-t.x)/r),new T.Point(o,h,s)},it:function(t,i){var n=0;return t.x<i.min.x?n|=1:t.x>i.max.x&&(n|=2),t.y<i.min.y?n|=4:t.y>i.max.y&&(n|=8),n},Ut:function(t,i){var n=i.x-t.x,e=i.y-t.y;return n*n+e*e},Tt:function(t,i,n,e){var s,o=i.x,h=i.y,r=n.x-o,a=n.y-h,u=r*r+a*a;return u>0&&(s=((t.x-o)*r+(t.y-h)*a)/u,s>1?(o=n.x,h=n.y):s>0&&(o+=r*s,h+=a*s)),r=t.x-o,a=t.y-h,e?r*r+a*a:new T.Point(o,h)}},T.Polyline=T.DT.extend({options:{ot:1,type:4,Pt:!1},initialize:function(t,i){T.setOptions(this,i),this.pt(t),this.At="solid",this.options.lineStyle&&this.setLineStyle(this.options.lineStyle)},getType:function(){return this.options.type},at:function(){return this.St},getLngLats:function(){return this.at()},st:function(t){return this.pt(t),this.redraw()},setLngLats:function(t){this.st(t)},setColor:function(t){this.VR({color:t})},getColor:function(){return this.options.color},setWeight:function(t){this.VR({weight:t})},getWeight:function(){return this.options.weight},setOpacity:function(t){this.VR({opacity:t})},getOpacity:function(){return this.options.opacity},setLineStyle:function(t){"dashed"==t?(this.At="dashed",T.OQ.ie8||T.OQ.ie7?this.VR({dashArray:"2,2"}):this.VR({dashArray:"4"})):(this.At="solid",this.VR({dashArray:""}))},getLineStyle:function(){return this.At},getMap:function(){return this.JE},enableEdit:function(){this.Dt&&this.Dt.enable()},disableEdit:function(){this.Dt&&this.Dt.disable()},isEditable:function(){return this.Dt.AE()},dt:function(){return!this.St.length},Ft:function(t){for(var i,n,e=1/0,s=null,o=T.wt.Tt,h=0,r=this.ft.length;h<r;h++)for(var a=this.ft[h],u=1,c=a.length;u<c;u++){i=a[u-1],n=a[u];var l=o(t,i,n,!0);l<e&&(e=l,s=o(t,i,n))}return s&&(s.distance=Math.sqrt(e)),s},getCenter:function(){var t,i,n,e,s,o,h,r=this.Gt[0],a=r.length;if(!a)return null;for(t=0,i=0;t<a-1;t++)i+=r[t].distanceTo(r[t+1])/2;if(0===i)return this.JE.Sw(r[0]);for(t=0,e=0;t<a-1;t++)if(s=r[t],o=r[t+1],n=s.distanceTo(o),e+=n,e>i)return h=(e-i)/n,this.JE.Sw([o.x-h*(o.x-s.x),o.y-h*(o.y-s.y)])},getBounds:function(){return this.LR},gt:function(t,i){return i=i||this.Ht(),t=T.Fq(t),i.push(t),this.LR.extend(t),this.redraw()},pt:function(t){this.LR=new T.jq,this.St=this.ht(t)},Ht:function(){return T.Polyline.Jt(this.St)?this.St:this.St[0]},ht:function(t){for(var i=[],n=T.Polyline.Jt(t),e=0,s=t.length;e<s;e++)n?(i[e]=T.Fq(t[e]),this.LR.extend(i[e])):i[e]=this.ht(t[e]);return i},nT:function(){var t=new T.lQ;this.Gt=[],this.jt(this.St,this.Gt,t);var i=this.Wt(),n=new T.Point(i,i);this.LR.BQ()&&t.BQ()&&(t.min.sQ(n),t.max.AQ(n),this.Kt=t)},jt:function(t,i,n){var e,s,o=t[0]instanceof T.Dq,h=t.length;if(o){for(s=[],e=0;e<h;e++)s[e]=this.JE.Kw(t[e]),n.extend(s[e]);i.push(s)}else for(e=0;e<h;e++)this.jt(t[e],i,n)},kt:function(){var t=this.LT.LR;if(this.ft=[],this.Kt&&this.Kt.intersects(t)){if(this.options.Pt)return void(this.ft=this.Gt);var i,n,e,s,o,h,r,a=this.ft;for(i=0,e=0,s=this.Gt.length;i<s;i++)for(r=this.Gt[i],n=0,o=r.length;n<o-1;n++)h=T.wt.ut(r[n],r[n+1],t,n,!0),h&&(a[e]=a[e]||[],a[e].push(h[0]),h[1]===r[n+1]&&n!==o-2||(a[e].push(h[1]),e++))}},Lt:function(){for(var t=this.ft,i=this.options.ot,n=0,e=t.length;n<e;n++)t[n]=T.wt.Et(t[n],i)},Ue:function(){this.JE&&(this.kt(),this.Lt(),this._T())},_T:function(){this.LT.lt(this)}}),T.Zt=function(t,i){return new T.Polyline(t,i)},T.Polyline.Jt=function(t){return!T.a.L(t[0])||"object"!=typeof t[0][0]&&"undefined"!=typeof t[0][0]},T.Ct={},T.Ct.Vt=function(t,i,n){var e,s,o,h,r,a,u,c,l,f=[1,4,2,8],d=T.wt;for(s=0,u=t.length;s<u;s++)t[s]._code=d.it(t[s],i);for(h=0;h<4;h++){for(c=f[h],e=[],s=0,u=t.length,o=u-1;s<u;o=s++)r=t[s],a=t[o],r._code&c?a._code&c||(l=d.Ot(a,r,c,i,n),l._code=d.it(l,i),e.push(l)):(a._code&c&&(l=d.Ot(a,r,c,i,n),l._code=d.it(l,i),e.push(l)),e.push(r));t=e}return t},T.Polygon=T.Polyline.extend({options:{fill:!0,type:5},setFillColor:function(t){this.VR({fillColor:t})},getFillColor:function(){return this.options.fillColor},setFillOpacity:function(t){this.VR({fillOpacity:t})},getFillOpacity:function(){return this.options.fillOpacity},dt:function(){return!this.St.length||!this.St[0].length},getCenter:function(){var t,i,n,e,s,o,h,r,a,u=this.Gt[0],c=u.length;if(!c)return null;for(o=h=r=0,t=0,i=c-1;t<c;i=t++)n=u[t],e=u[i],s=n.y*e.x-e.y*n.x,h+=(n.x+e.x)*s,r+=(n.y+e.y)*s,o+=3*s;return a=0===o?u[0]:[h/o,r/o],this.JE.Sw(a)},ht:function(t){var i=T.Polyline.prototype.ht.call(this,t),n=i.length;return n>=2&&i[0]instanceof T.Dq&&i[0].equals(i[n-1])&&i.pop(),i},pt:function(t){T.Polyline.prototype.pt.call(this,t),T.Polyline.Jt(this.St)&&(this.St=[this.St])},Ht:function(){return T.Polyline.Jt(this.St[0])?this.St[0]:this.St[0][0]},kt:function(){var t=this.LT.LR,i=this.options.weight,n=new T.Point(i,i);if(t=new T.lQ(t.min.SQ(n),t.max.pQ(n)),this.ft=[],this.Kt&&this.Kt.intersects(t)){if(this.options.Pt)return void(this.ft=this.Gt);for(var e,s=0,o=this.Gt.length;s<o;s++)e=T.Ct.Vt(this.Gt[s],t,!0),e.length&&this.ft.push(e)}},_T:function(){this.LT.lt(this,!0)}}),T.ct=function(t,i){return new T.Polygon(t,i)},T.Rectangle=T.Polygon.extend({options:{type:6},initialize:function(t,i){T.Polygon.prototype.initialize.call(this,this.Bt(t),i)},setBounds:function(t){return this.st(this.Bt(t))},Bt:function(t){return t=T.Jq(t),[t.getSouthWest(),t.lq(),t.getNorthEast(),t.Vq()]}}),T.vt=function(t,i){return new T.Rectangle(t,i)},T.Nt=T.DT.extend({options:{fill:!0,radius:10,type:8},initialize:function(t,i){T.setOptions(this,i),this.wr=T.Fq(t),this.bt=this.options.radius},tr:function(t){return this.wr=T.Fq(t),this.redraw(),this.WQ("move",{dT:this.wr})},oE:function(){return this.wr},setRadius:function(t){return this.options.radius=this.bt=t,this.redraw()},getRadius:function(){return this.bt},VR:function(t){var i=t&&t.radius||this.bt;return T.DT.prototype.VR.call(this,t),this.setRadius(i),this},nT:function(){this.Mt=this.JE.Kw(this.wr),this.nt()},nt:function(){var t=this.bt,i=this._t||t,n=this.Wt(),e=[t+n,i+n];this.Kt=new T.lQ(this.Mt.SQ(e),this.Mt.pQ(e))},Ue:function(){this.JE&&this._T()},_T:function(){this.LT.mt(this)},QY:function(){return this.bt&&!this.LT.LR.intersects(this.Kt)}}),T.qY=function(t,i){return new T.Nt(t,i)},T.Circle=T.Nt.extend({initialize:function(t,i,n){"number"==typeof i&&(i=T.extend({},n,{radius:i})),T.setOptions(this,i),this.wr=T.Fq(t),isNaN(this.options.radius),this.WY=this.options.radius,this.At="solid",this.options.lineStyle&&this.setLineStyle(this.options.lineStyle)},getType:function(){return this.options.type},setCenter:function(t){this.tr(t)},getCenter:function(){return this.oE()},setColor:function(t){this.VR({color:t})},getColor:function(){return this.options.color},setWeight:function(t){this.VR({weight:t})},getWeight:function(){return this.options.weight},setOpacity:function(t){this.VR({opacity:t})},getOpacity:function(){return this.options.opacity},setFillColor:function(t){this.VR({fillColor:t})},getFillColor:function(){return this.options.fillColor},setFillOpacity:function(t){this.VR({fillOpacity:t})},getFillOpacity:function(){return this.options.fillOpacity},setLineStyle:function(t){"dashed"==t?(this.At="dashed",T.OQ.ie8||T.OQ.ie7?this.VR({dashArray:"2,2"}):this.VR({dashArray:"4"})):(this.At="solid",this.VR({dashArray:""}))},getLineStyle:function(){return this.At},enableEdit:function(){this.Dt&&this.Dt.enable()},isEditable:function(){return this.Dt.AE()},disableEdit:function(){this.Dt&&this.Dt.disable()},getMap:function(){return this.JE},setRadius:function(t){return this.WY=t,this.redraw()},getRadius:function(){return this.WY},getBounds:function(){var t=[this.bt,this._t||this.bt];return new T.jq(this.JE.Sw(this.Mt.SQ(t)),this.JE.Sw(this.Mt.pQ(t)))},VR:T.DT.prototype.VR,nT:function(){var t=this.wr.lng,i=this.wr.lat,n=this.JE,e=n.options.uW;if(e.distance===T.Gq.fq.distance){var s=Math.PI/180,o=this.WY/T.Gq.fq.R/s,h=n.Mq([i+o,t]),r=n.Mq([i-o,t]),a=h.pQ(r).DQ(2),u=n.nq(a).lat,c=Math.acos((Math.cos(o*s)-Math.sin(i*s)*Math.sin(u*s))/(Math.cos(i*s)*Math.cos(u*s)))/s;(isNaN(c)||0===c)&&(c=o/Math.cos(Math.PI/180*i)),this.Mt=a.SQ(n.Hw()),this.bt=isNaN(c)?0:Math.max(Math.round(a.x-n.Mq([u,t-c]).x),1),this._t=Math.max(Math.round(a.y-h.y),1)}else{var l=e.nq(e.Mq(this.wr).SQ([this.WY,0]));this.Mt=n.Kw(this.wr),this.bt=this.Mt.x-n.Kw(l).x}this.nt()}}),T.wY=function(t,i,n){return new T.Circle(t,i,n)},T.SVG=T.gT.extend({ZE:function(){var t=T.gT.prototype.ZE.call(this);return t.zoomstart=this.EY,t},SW:function(){this.Iw=T.SVG.S("svg"),this.Iw.setAttribute("pointer-events","none"),this._rootGroup=T.SVG.S("g"),this.Iw.appendChild(this._rootGroup)},EY:function(){this.Ue()},Ue:function(){if(!this.JE.QR||!this.LR){T.gT.prototype.Ue.call(this);var t=this.LR,i=t.getSize(),n=this.Iw;this._svgSize&&this._svgSize.equals(i)||(this._svgSize=i,n.setAttribute("width",i.x),n.setAttribute("height",i.y)),T.nQ.setPosition(n,t.min),n.setAttribute("viewBox",[t.min.x,t.min.y,i.x,i.y].join(" "))}},NT:function(t){var i=t.qt=T.SVG.S("path");t.options.className&&T.nQ.eq(i,t.options.className),t.options.kR&&T.nQ.eq(i,"tdt-interactive"),this.mT(t)},bT:function(t){this._rootGroup.appendChild(t.qt),t.KE(t.qt)},MT:function(t){T.nQ.mQ(t.qt),t.kE(t.qt)},_T:function(t){t.nT(),t.Ue()},mT:function(t){var i=t.qt,n=t.options;i&&(n.stroke?(i.setAttribute("stroke",n.color),i.setAttribute("stroke-opacity",n.opacity),i.setAttribute("stroke-width",n.weight),i.setAttribute("stroke-linecap",n.cT),i.setAttribute("stroke-linejoin",n.BT),n.dashArray?i.setAttribute("stroke-dasharray",n.dashArray):i.removeAttribute("stroke-dasharray"),n.dashOffset?i.setAttribute("stroke-dashoffset",n.dashOffset):i.removeAttribute("stroke-dashoffset")):i.setAttribute("stroke","none"),n.fill?(i.setAttribute("fill",n.fillColor||n.color),i.setAttribute("fill-opacity",n.fillOpacity),i.setAttribute("fill-rule",n.vT||"evenodd")):i.setAttribute("fill","none"))},lt:function(t,i){this.eY(t,T.SVG.RY(t.ft,i))},mt:function(t){var i=t.Mt,n=t.bt,e=t._t||n,s="a"+n+","+e+" 0 1,0 ",o=t.QY()?"M0 0":"M"+(i.x-n)+","+i.y+s+2*n+",0 "+s+2*-n+",0 ";this.eY(t,o)},eY:function(t,i){t.qt.setAttribute("d",i)},Or:function(t){T.nQ.qq(t.qt)},Qt:function(t){T.nQ.Wq(t.qt)}}),T.extend(T.SVG,{S:function(t){return document.createElementNS("http://www.w3.org/2000/svg",t)},RY:function(t,i){var n,e,s,o,h,r,a="";for(n=0,s=t.length;n<s;n++){for(h=t[n],e=0,o=h.length;e<o;e++)r=h[e],a+=(e?"L":"M")+r.x+" "+r.y;a+=i?T.OQ.lT?"z":"x":""}return a||"M0 0"}}),T.OQ.lT=!(!document.createElementNS||!T.SVG.S("svg").createSVGRect),T.lT=function(t){return T.OQ.lT||T.OQ.vml?new T.SVG(t):null},T.OQ.vml=!T.OQ.lT&&function(){try{var t=document.createElement("div");t.innerHTML='<v:shape adj="1"/>';var i=t.firstChild;return i.style.behavior="url(#default#VML)",i&&"object"==typeof i.adj}catch(oO){return!1}}(),T.SVG.b(T.OQ.vml?{SW:function(){this.Iw=T.nQ.S("div","tdt-vml-container")},Ue:function(){this.JE.QR||T.gT.prototype.Ue.call(this)},NT:function(t){var i=t.Iw=T.SVG.S("shape");T.nQ.eq(i,"tdt-vml-shape "+(this.options.className||"")),i.coordsize="1 1",t.qt=T.SVG.S("path"),i.appendChild(t.qt),this.mT(t)},bT:function(t){var i=t.Iw;this.Iw.appendChild(i),t.options.kR&&t.KE(i)},MT:function(t){var i=t.Iw;T.nQ.mQ(i),t.kE(i)},mT:function(t){var i=t._stroke,n=t._fill,e=t.options,s=t.Iw;s.stroked=!!e.stroke,s.filled=!!e.fill,e.stroke?(i||(i=t._stroke=T.SVG.S("stroke")),s.appendChild(i),i.weight=e.weight+"px",i.color=e.color,i.opacity=e.opacity,e.dashArray?i.dashStyle=T.a.L(e.dashArray)?e.dashArray.join(" "):e.dashArray.replace(/( *, *)/g," "):i.dashStyle="",i.endcap=e.cT.replace("butt","flat"),i.joinstyle=e.BT):i&&(s.removeChild(i),t._stroke=null),e.fill?(n||(n=t._fill=T.SVG.S("fill")),s.appendChild(n),n.color=e.fillColor||e.color,n.opacity=e.fillOpacity):n&&(s.removeChild(n),t._fill=null)},mt:function(t){var i=t.Mt.HQ(),n=Math.round(t.bt),e=Math.round(t._t||n);this.eY(t,t.QY()?"M0 0":"AL "+i.x+","+i.y+" "+n+","+e+" 0,23592600")},eY:function(t,i){t.qt.v=i},Or:function(t){T.nQ.qq(t.Iw)},Qt:function(t){T.nQ.Wq(t.Iw)}}:{}),T.OQ.vml&&(T.SVG.S=function(){try{return document.namespaces.pQ("lvml","urn:schemas-microsoft-com:vml"),function(t){return document.createElement("<lvml:"+t+' class="lvml">')}}catch(oO){return function(t){return document.createElement("<"+t+' xmlns="urn:schemas-microsoft.com:vml" class="lvml">')}}}()),T.VT=T.gT.extend({onAdd:function(){T.gT.prototype.onAdd.call(this),this.HW=this.HW||{},this.rY()},SW:function(){var t=this.Iw=document.createElement("canvas");T.Oq.on(t,"mousemove",T.a.f(this.TY,32,this),this).on(t,"click dblclick mousedown mouseup contextmenu",this.tY,this).on(t,"mouseout",this.YY,this),this.UY=t.getContext("2d")},Ue:function(){if(!this.JE.QR||!this.LR){this.uY={},T.gT.prototype.Ue.call(this);var t=this.LR,i=this.Iw,n=t.getSize(),e=T.OQ.retina?2:1;T.nQ.setPosition(i,t.min),i.width=e*n.x,i.height=e*n.y,i.style.width=n.x+"px",i.style.height=n.y+"px",T.OQ.retina&&this.UY.scale(2,2),this.UY.translate(-t.min.x,-t.min.y)}},NT:function(t){this._updateDashArray(t),this.HW[T.D(t)]=t},bT:T.a.g,MT:function(t){t.IY=!0,this.iY(t)},_T:function(t){this.OY=t.Kt,this.rY(!0),t.nT(),t.Ue(),this.rY(),this.OY=null},mT:function(t){this._updateDashArray(t),this.iY(t)},_updateDashArray:function(t){if(t.options.dashArray){var i,n=t.options.dashArray.split(","),e=[];for(i=0;i<n.length;i++)e.push(Number(n[i]));t.options._dashArray=e}},iY:function(t){if(this.JE){var i=(t.options.weight||0)+1;this.OY=this.OY||new T.lQ,this.OY.extend(t.Kt.min.SQ([i,i])),this.OY.extend(t.Kt.max.pQ([i,i])),this.oY=this.oY||T.a.Z(this.PY,this)}},PY:function(){this.oY=null,this.rY(!0),this.rY(),this.OY=null},rY:function(t){this.pY=t;var i,n=this.OY;this.UY.save(),n&&(this.UY.beginPath(),this.UY.rect(n.min.x,n.min.y,n.max.x-n.min.x,n.max.y-n.min.y),this.UY.clip());for(var e in this.HW)i=this.HW[e],(!n||i.Kt&&i.Kt.intersects(n))&&i._T(),t&&i.IY&&(delete i.IY,delete this.HW[e]);this.UY.restore()},lt:function(t,i){var n,e,s,o,h=t.ft,r=h.length,a=this.UY;if(r){for(this.uY[t.d]=t,a.beginPath(),a.setLineDash&&a.setLineDash(t.options&&t.options._dashArray||[]),n=0;n<r;n++){for(e=0,s=h[n].length;e<s;e++)o=h[n][e],a[e?"lineTo":"moveTo"](o.x,o.y);i&&a.closePath()}this.AY(a,t)}},mt:function(t){if(!t.QY()){var i=t.Mt,n=this.UY,e=t.bt,s=(t._t||e)/e;this.uY[t.d]=t,1!==s&&(n.save(),n.scale(1,s)),n.beginPath(),n.arc(i.x,i.y/s,e,0,2*Math.PI,!1),1!==s&&n.restore(),this.AY(n,t)}},AY:function(t,i){var n=this.pY,e=i.options;t.globalCompositeOperation=n?"destination-out":"source-over",e.fill&&(t.globalAlpha=n?1:e.fillOpacity,t.fillStyle=e.fillColor||e.color,t.fill(e.vT||"evenodd")),e.stroke&&0!==e.weight&&(t.globalAlpha=n?1:e.opacity,i._prevWeight=t.lineWidth=n?i._prevWeight+1:e.weight,t.strokeStyle=e.color,t.cT=e.cT,t.BT=e.BT,t.stroke())},tY:function(t){var i,n=this.JE.Vw(t),e=[];for(var s in this.HW)i=this.HW[s],i.options.kR&&i.aY(n)&&!this.JE.uE(i)&&(T.Oq.SY(t),e.push(i));e.length&&this.sY(e,t)},TY:function(t){if(this.JE&&!this.JE.pE.moving()&&!this.JE.QR){var i=this.JE.Vw(t);this.YY(t,i),this.DY(t,i)}},YY:function(t,i){var n=this.dY;!n||"mouseout"!==t.type&&n.aY(i)||(T.nQ.rq(this.Iw,"tdt-interactive"),this.sY([n],t,"mouseout"),this.dY=null)},DY:function(t,i){var n,e;for(n in this.uY)e=this.uY[n],e.options.kR&&e.aY(i)&&(T.nQ.eq(this.Iw,"tdt-interactive"),this.sY([e],t,"mouseover"),this.dY=e);this.dY&&this.sY([this.dY],t)},sY:function(t,i,n){this.JE.OE(i,n||i.type,t)},Or:T.a.g,Qt:T.a.g}),T.OQ.ZT=function(){return!!document.createElement("canvas").getContext}(),T.ZT=function(t){return T.OQ.ZT?new T.VT(t):null},T.Polyline.prototype.aY=function(t,i){var n,e,s,o,h,r,a=this.Wt();if(!this.Kt.contains(t))return!1;for(n=0,o=this.ft.length;n<o;n++)for(r=this.ft[n],e=0,h=r.length,s=h-1;e<h;s=e++)if((i||0!==e)&&T.wt.rt(t,r[s],r[e])<=a)return!0;return!1},T.Polygon.prototype.aY=function(t){var i,n,e,s,o,h,r,a,u=!1;if(!this.Kt.contains(t))return!1;for(s=0,r=this.ft.length;s<r;s++)for(i=this.ft[s],o=0,a=i.length,h=a-1;o<a;h=o++)n=i[o],e=i[h],n.y>t.y!=e.y>t.y&&t.x<(e.x-n.x)*(t.y-n.y)/(e.y-n.y)+n.x&&(u=!u);return u||T.Polyline.prototype.aY.call(this,t,!0)},T.Nt.prototype.aY=function(t){return t.distanceTo(this.Mt)<=this.bt+this.Wt()},T.FY=T.PT.extend({initialize:function(t,i){T.setOptions(this,i),this.HW={},t&&this.fY(t)},fY:function(t){var i,n,e,s=T.a.L(t)?t:t.features;if(s){for(i=0,n=s.length;i<n;i++)e=s[i],(e.geometries||e.geometry||e.features||e.coordinates)&&this.fY(e);return this}var o=this.options;if(o.filter&&!o.filter(t))return this;var h=T.FY.GY(t,o);return h?(h.feature=T.FY.gY(t),h.defaultOptions=h.options,this.HY(h),o.onEachFeature&&o.onEachFeature(t,h),this.addLayer(h)):this},HY:function(t){return t.options=T.a.extend({},t.defaultOptions),this.hY(t,this.options.style),this},VR:function(t){return this.NE(function(i){this.hY(i,t)},this)},hY:function(t,i){"function"==typeof i&&(i=i(t.feature)),t.VR&&t.VR(i)}}),T.extend(T.FY,{GY:function(t,i){var n,e,s,o,h="Feature"===t.type?t.geometry:t,r=h?h.coordinates:null,a=[],u=i&&i.pointToLayer,c=i&&i.JY||this.JY;if(!r&&!h)return null;switch(h.type){case"Point":return n=c(r),u?u(t,n):new T.Marker(n);case"MultiPoint":for(s=0,o=r.length;s<o;s++)n=c(r[s]),a.push(u?u(t,n):new T.Marker(n));return new T.PT(a);case"LineString":case"MultiLineString":return e=this.jY(r,"LineString"===h.type?0:1,c),new T.Polyline(e,i);case"Polygon":case"MultiPolygon":return e=this.jY(r,"Polygon"===h.type?1:2,c),new T.Polygon(e,i);case"GeometryCollection":for(s=0,o=h.geometries.length;s<o;s++){var l=this.GY({geometry:h.geometries[s],type:"Feature",properties:t.properties},i);l&&a.push(l)}return new T.PT(a)}},JY:function(t){return new T.Dq(t[1],t[0],t[2])},jY:function(t,i,n){for(var e,s=[],o=0,h=t.length;o<h;o++)e=i?this.jY(t[o],i-1,n):(n||this.JY)(t[o]),s.push(e);return s},KY:function(t){return void 0!==t.dq?[t.lng,t.lat,t.dq]:[t.lng,t.lat]},kY:function(t,i,n){for(var e=[],s=0,o=t.length;s<o;s++)e.push(i?T.FY.kY(t[s],i-1,n):T.FY.KY(t[s]));return!i&&n&&e.push(e[0]),e},LY:function(t,i){return t.feature?T.extend({},t.feature,{geometry:i}):T.FY.gY(i)},gY:function(t){return"Feature"===t.type?t:{type:"Feature",properties:{},geometry:t}}});var PointToGeoJSON={toGeoJSON:function(){return T.FY.LY(this,{type:"Point",coordinates:T.FY.KY(this.oE())})}};T.Marker.b(PointToGeoJSON),T.Circle.b(PointToGeoJSON),T.Nt.b(PointToGeoJSON),T.Polyline.prototype.toGeoJSON=function(){var t=!T.Polyline.Jt(this.St),i=T.FY.kY(this.St,t?1:0);return T.FY.LY(this,{type:(t?"Multi":"")+"LineString",coordinates:i})},T.Polygon.prototype.toGeoJSON=function(){var t=!T.Polyline.Jt(this.St),i=t&&!T.Polyline.Jt(this.St[0]),n=T.FY.kY(this.St,i?2:t?1:0,!0);return t||(n=[n]),T.FY.LY(this,{type:(i?"Multi":"")+"Polygon",coordinates:n})},T.LayerGroup.b({lY:function(){var t=[];return this.NE(function(i){t.push(i.toGeoJSON().geometry.coordinates)}),T.FY.LY(this,{type:"MultiPoint",coordinates:t})},toGeoJSON:function(){var t=this.feature&&this.feature.geometry&&this.feature.geometry.type;if("MultiPoint"===t)return this.lY();var i="GeometryCollection"===t,n=[];return this.NE(function(t){if(t.toGeoJSON){var e=t.toGeoJSON();n.push(i?e.geometry:T.FY.gY(e))}}),i?T.FY.LY(this,{geometries:n,type:"GeometryCollection"}):{type:"FeatureCollection",features:n}}}),T.ZY=function(t,i){return new T.FY(t,i)},T.CY=T.ZY;var eventsKey="_tdt_events";T.Oq={on:function(t,i,n,e){if("object"==typeof i)for(var s in i)this.m(t,s,i[s],n);else{i=T.a.J(i);for(var o=0,h=i.length;o<h;o++)this.m(t,i[o],n,e)}return this},off:function(t,i,n,e){if("object"==typeof i)for(var s in i)this.qQ(t,s,i[s],n);else{i=T.a.J(i);for(var o=0,h=i.length;o<h;o++)this.qQ(t,i[o],n,e)}return this},m:function(t,i,n,e){var s=i+T.D(n)+(e?"_"+T.D(e):"");if(t[eventsKey]&&t[eventsKey][s])return this;var o=function(i){return n.call(e||t,i||window.event)},h=o;return T.OQ.pointer&&0===i.indexOf("touch")?this.VY(t,i,o,s):T.OQ.touch&&"dblclick"===i&&this.cY?this.cY(t,o,s):"addEventListener"in t?"mousewheel"===i?t.addEventListener("onwheel"in t?"wheel":"mousewheel",o,!1):"mouseenter"===i||"mouseleave"===i?(o=function(i){i=i||window.event,T.Oq.IE(t,i)&&h(i)},t.addEventListener("mouseenter"===i?"mouseover":"mouseout",o,!1)):("click"===i&&T.OQ.android&&(o=function(t){return T.Oq.BY(t,h)}),t.addEventListener(i,o,!1)):"attachEvent"in t&&t.attachEvent("on"+i,o),t[eventsKey]=t[eventsKey]||{},t[eventsKey][s]=o,this},qQ:function(t,i,n,e){var s=i+T.D(n)+(e?"_"+T.D(e):""),o=t[eventsKey]&&t[eventsKey][s];return o?(T.OQ.pointer&&0===i.indexOf("touch")?this.removePointerListener(t,i,s):T.OQ.touch&&"dblclick"===i&&this.vY?this.vY(t,s):"removeEventListener"in t?"mousewheel"===i?t.removeEventListener("onwheel"in t?"wheel":"mousewheel",o,!1):t.removeEventListener("mouseenter"===i?"mouseover":"mouseleave"===i?"mouseout":i,o,!1):"detachEvent"in t&&t.detachEvent("on"+i,o),t[eventsKey][s]=null,this):this},stopPropagation:function(t){return t.stopPropagation?t.stopPropagation():t.originalEvent?t.originalEvent._stopped=!0:t.cancelBubble=!0,T.Oq.iE(t),this},ET:function(t){return T.Oq.on(t,"mousewheel",T.Oq.stopPropagation)},eT:function(t){var i=T.Oq.stopPropagation;return T.Oq.on(t,T.NY.START.join(" "),i),T.Oq.on(t,{click:T.Oq.SY,dblclick:i})},preventDefault:function(t){return t.preventDefault?t.preventDefault():t.returnValue=!1,this},Yw:function(t){return T.Oq.preventDefault(t).stopPropagation(t)},Cw:function(t,i){if(!i)return new T.Point(t.clientX,t.clientY);var n=i.getBoundingClientRect();return new T.Point(t.clientX-n.left-i.clientLeft,t.clientY-n.top-i.clientTop)},_wheelPxFactor:T.OQ.win&&T.OQ.chrome?2:T.OQ.gecko?window.oQ:1,bY:function(t){return T.OQ.edge?t.wheelDeltaY/2:t.deltaY&&0===t.deltaMode?-t.deltaY/T.Oq._wheelPxFactor:t.deltaY&&1===t.deltaMode?20*-t.deltaY:t.deltaY&&2===t.deltaMode?60*-t.deltaY:t.deltaX||t.deltaZ?0:t.wheelDelta?(t.wheelDeltaY||t.wheelDelta)/2:t.detail&&Math.abs(t.detail)<32765?20*-t.detail:t.detail?t.detail/-32765*60:0},MY:{},SY:function(t){T.Oq.MY[t.type]=!0},iE:function(t){var i=this.MY[t.type];return this.MY[t.type]=!1,i},IE:function(t,i){var n=i.relatedTarget;if(!n)return!0;try{for(;n&&n!==t;)n=n.parentNode}catch(oO){return!1}return n!==t},BY:function(t,i){var n=t.timeStamp||t.originalEvent&&t.originalEvent.timeStamp,e=T.Oq.nY&&n-T.Oq.nY;return e&&e>100&&e<500||t.target._Y&&!t.UE?void T.Oq.Yw(t):(T.Oq.nY=n,void i(t))}},T.Oq.addListener=T.Oq.on,T.Oq.removeListener=T.Oq.off,T.NY=T._.extend({options:{clickTolerance:3},B:{START:T.OQ.touch?["touchstart","mousedown"]:["mousedown"],END:{mousedown:"mouseup",touchstart:"touchend",pointerdown:"touchend",MSPointerDown:"touchend"},MOVE:{mousedown:"mousemove",touchstart:"touchmove",pointerdown:"touchmove",MSPointerDown:"touchmove"}},initialize:function(t,i,n){this.mY=t,this.QU=i||t,this.qU=n},enable:function(){this.WU||(T.Oq.on(this.QU,T.NY.START.join(" "),this.wU,this),this.WU=!0)},disable:function(){this.WU&&(T.Oq.off(this.QU,T.NY.START.join(" "),this.wU,this),this.WU=!1,this.aw=!1)},wU:function(t){if(!t.UE&&this.WU&&(this.aw=!1,!T.nQ.wq(this.mY,"tdt-zoom-anim")&&!(T.NY._dragging||t.shiftKey||1!==t.which&&1!==t.button&&!t.touches)&&this.WU&&(T.NY._dragging=!0,this.qU&&T.nQ.aq(this.mY),T.nQ.pq(),T.nQ.iq(),!this.EU))){this.WQ("down");var i=t.touches?t.touches[0]:t;this.eU=new T.Point(i.clientX,i.clientY),T.Oq.on(document,T.NY.MOVE[t.type],this.se,this).on(document,T.NY.END[t.type],this.RU,this)}},se:function(t){if(!t.UE&&this.WU){if(t.touches&&t.touches.length>1)return void(this.aw=!0);var i=t.touches&&1===t.touches.length?t.touches[0]:t,n=new T.Point(i.clientX,i.clientY),e=n.SQ(this.eU);(e.x||e.y)&&(Math.abs(e.x)+Math.abs(e.y)<this.options.clickTolerance||(T.Oq.preventDefault(t),this.aw||(this.WQ("dragstart"),this.aw=!0,this.rU=T.nQ.getPosition(this.mY).SQ(e),T.nQ.eq(document.body,"tdt-dragging"),this.TU=t.target||t.srcElement,window.SVGElementInstance&&this.TU instanceof SVGElementInstance&&(this.TU=this.TU.correspondingUseElement),T.nQ.eq(this.TU,"tdt-drag-target")),this.tU=this.rU.pQ(e),this.EU=!0,T.a.C(this.YU),this.UU=t,this.YU=T.a.Z(this.Br,this,!0)))}},Br:function(){var t={originalEvent:this.UU};this.WQ("uU",t),T.nQ.setPosition(this.mY,this.tU),this.WQ("drag",t)},RU:function(t){if(!t.UE&&this.WU){T.nQ.rq(document.body,"tdt-dragging"),this.TU&&(T.nQ.rq(this.TU,"tdt-drag-target"),this.TU=null);for(var i in T.NY.MOVE)T.Oq.off(document,T.NY.MOVE[i],this.se,this).off(document,T.NY.END[i],this.RU,this);T.nQ.Aq(),T.nQ.oq(),this.aw&&this.EU&&(T.a.C(this.YU),this.WQ("dragend",{})),this.EU=!1,T.NY._dragging=!1}}}),T.Sr=T.V.extend({initialize:function(t){this.JE=t},enable:function(){return this.WU?this:(this.WU=!0,this.IU(),this)},disable:function(){return this.WU?(this.WU=!1,this.Rr(),this):this},AE:function(){return!!this.WU}}),T.Map.M({pE:!0,iU:!T.OQ.android23,OU:3400,oU:1/0,PU:.2,pU:!0,AU:0}),T.Map.aU=T.Sr.extend({IU:function(){if(!this.SU){var t=this.JE;this.SU=new T.NY(t.iw,t.Iw),this.SU.on({down:this.wU,dragstart:this.sU,drag:this.DU,dragend:this.dU},this),this.SU.on("uU",this.FU,this),t.options.pU&&(this.SU.on("uU",this.fU,this),t.on("zoomend",this.GU,this),t.SE(this.GU,this))}T.nQ.eq(this.JE.Iw,"tdt-grab tdt-touch-drag"),this.SU.enable(),this.gU=[],this.HU=[]},Rr:function(){T.nQ.rq(this.JE.Iw,"tdt-grab"),T.nQ.rq(this.JE.Iw,"tdt-touch-drag"),this.SU.disable()},moved:function(){return this.SU&&this.SU.aw},moving:function(){return this.SU&&this.SU.EU},wU:function(){this.JE.Uw()},sU:function(){var t=this.JE;if(this.JE.options.maxBounds&&this.JE.options.AU){var i=T.Jq(this.JE.options.maxBounds);this.hU=T.VQ(this.JE.VW(i.lq()).FQ(-1),this.JE.VW(i.Vq()).FQ(-1).pQ(this.JE.getSize())),this.JU=Math.min(1,Math.max(0,this.JE.options.AU))}else this.hU=null;t.WQ("movestart").WQ("dragstart"),t.options.iU&&(this.gU=[],this.HU=[])},DU:function(t){if(this.JE.options.iU){var i=this.jU=+new Date,n=this.KU=this.SU.kU||this.SU.tU;this.gU.push(n),this.HU.push(i),i-this.HU[0]>50&&(this.gU.shift(),this.HU.shift())}this.JE.WQ("move",t).WQ("drag",t)},GU:function(){var t=this.JE.getSize().DQ(2),i=this.JE.Kw([0,0]);this.LU=i.SQ(t).x,this.lU=this.JE.Jw().getSize().x},ZU:function(t,i){return t-(t-i)*this.JU},FU:function(){if(this.JU&&this.hU){var t=this.SU.tU.SQ(this.SU.rU),i=this.hU;t.x<i.min.x&&(t.x=this.ZU(t.x,i.min.x)),t.y<i.min.y&&(t.y=this.ZU(t.y,i.min.y)),t.x>i.max.x&&(t.x=this.ZU(t.x,i.max.x)),t.y>i.max.y&&(t.y=this.ZU(t.y,i.max.y)),this.SU.tU=this.SU.rU.pQ(t)}},fU:function(){var t=this.lU,i=Math.round(t/2),n=this.LU,e=this.SU.tU.x,s=(e-i+n)%t+i-n,o=(e+i+n)%t-i-n,h=Math.abs(s+n)<Math.abs(o+n)?s:o;this.SU.kU=this.SU.tU.PQ(),this.SU.tU.x=h},dU:function(t){var i=this.JE,n=i.options,e=!n.iU||this.HU.length<2;if(i.WQ("dragend",t),e)i.WQ("moveend");else{var s=this.KU.SQ(this.gU[0]),o=(this.jU-this.HU[0])/1e3,h=n.PU,r=s.FQ(h/o),a=r.distanceTo([0,0]),u=Math.min(n.oU,a),c=r.FQ(u/a),l=u/(n.OU*h),f=c.FQ(-l/2).HQ();f.x||f.y?(f=i.FE(f,i.options.maxBounds),T.a.Z(function(){i.panBy(f,{duration:l,PU:h,CU:!0,Rw:!0})})):i.WQ("moveend")}}}),T.Map.b({enableDrag:function(){this.pE.enable()},disableDrag:function(){this.pE.disable()},isDrag:function(){return this.pE.WU},enableInertia:function(){this.options.iU=!0},disableInertia:function(){this.options.iU=!1},isInertia:function(){return this.options.iU}}),T.Map.n("uw","pE",T.Map.aU),T.Map.M({VU:!0}),T.Map.cU=T.Sr.extend({initialize:function(t){this.JE=t,this.Iw=t.Iw,this.overlayPane=t.pw.overlayPane,this.nw=t.pw.nw,this.markerPane=t.pw.markerPane,this.infoWindowPane=t.pw.infoWindowPane},IU:function(){T.Oq.on(this.JE,"zoomstart",this.EY,this),T.Oq.on(this.JE,"zoomend",this.GU,this)},Rr:function(){T.Oq.off(this.JE,"zoomstart",this.EY),T.Oq.off(this.JE,"zoomend",this.GU)},EY:function(t){this.JE.lW&&(this.overlayPane.style.visibility="hidden",this.nw.style.visibility="hidden",this.markerPane.style.visibility="hidden",this.infoWindowPane.style.visibility="hidden")},GU:function(t){this.JE.lW&&(this.overlayPane.style.visibility="inherit",this.nw.style.visibility="inherit",this.markerPane.style.visibility="inherit",this.infoWindowPane.style.visibility="inherit")}}),T.Map.n("uw","VU",T.Map.cU),T.Map.M({BU:!0}),T.Map.vU=T.Sr.extend({IU:function(){this.JE.on("dblclick",this.NU,this)},Rr:function(){this.JE.off("dblclick",this.NU,this)},NU:function(t){var i=this.JE,n=i.getZoom(),e=i.options.AW,s=t.originalEvent.shiftKey?n-e:n+e;return!(s>i.getMaxZoom())&&void("center"===i.options.BU?i.setZoom(s):i.ZW(t.containerPoint,s))}}),T.Map.b({enableDoubleClickZoom:function(){this.BU.enable()},disableDoubleClickZoom:function(){this.BU.disable()},isDoubleClickZoom:function(){return this.BU.WU}}),T.Map.n("uw","BU",T.Map.vU),T.Map.M({bU:!0,MU:40,nU:50}),T.Map._U=T.Sr.extend({IU:function(){T.Oq.on(this.JE.Iw,"mousewheel",this.mU,this),this.Qu=0},Rr:function(){T.Oq.off(this.JE.Iw,"mousewheel",this.mU,this)},mU:function(t){var i=T.Oq.bY(t),n=this.JE.options.MU;this.Qu+=i,this.qu=this.JE.Zw(t),this.Wu||(this.Wu=+new Date);var e=Math.max(n-(+new Date-this.Wu),0);clearTimeout(this.wu),this.wu=setTimeout(T.s(this.Eu,this),e),T.Oq.Yw(t)},Eu:function(){var t=this.JE,i=t.getZoom(),n=this.JE.options.pW||0;t.Uw();var e=this.Qu/(4*this.JE.options.nU),s=4*Math.log(2/(1+Math.exp(-Math.abs(e))))/Math.LN2,o=n?Math.ceil(s/n)*n:s,h=t.fW(i+(this.Qu>0?o:-o))-i;this.Qu=0,this.Wu=null,h&&("center"===t.options.bU?t.setZoom(i+h):t.ZW(this.qu,i+h))}}),T.Map.b({enableScrollWheelZoom:function(){this.bU.enable()},disableScrollWheelZoom:function(){this.bU.disable()},isScrollWheelZoom:function(){return this.bU.WU}}),T.Map.n("uw","bU",T.Map._U),T.extend(T.Oq,{eu:T.OQ.msPointer?"MSPointerDown":T.OQ.pointer?"pointerdown":"touchstart",Ru:T.OQ.msPointer?"MSPointerUp":T.OQ.pointer?"pointerup":"touchend",cY:function(t,i,n){function e(t){var i;if(i=T.OQ.pointer?T.Oq.ru:t.touches.length,!(i>1)){var n=Date.now(),e=n-(o||n);h=t.touches?t.touches[0]:t,r=e>0&&e<=a,o=n}}function s(){if(r&&!h.cancelBubble){if(T.OQ.pointer){var t,n,e={};for(n in h)t=h[n],e[n]=t&&t.s?t.s(h):t;h=e}h.type="dblclick",i(h),o=null}}var o,h,r=!1,a=250,u="_tdt_",c=this.eu,l=this.Ru;return t[u+c+n]=e,t[u+l+n]=s,t[u+"dblclick"+n]=i,t.addEventListener(c,e,!1),t.addEventListener(l,s,!1),T.OQ.edge||t.addEventListener("dblclick",i,!1),this},vY:function(t,i){var n="_tdt_",e=t[n+this.eu+i],s=t[n+this.Ru+i],o=t[n+"dblclick"+i];return t.removeEventListener(this.eu,e,!1),t.removeEventListener(this.Ru,s,!1),T.OQ.edge||t.removeEventListener("dblclick",o,!1),this}}),T.extend(T.Oq,{Tu:T.OQ.msPointer?"MSPointerDown":"pointerdown",tu:T.OQ.msPointer?"MSPointerMove":"pointermove",Yu:T.OQ.msPointer?"MSPointerUp":"pointerup",Uu:T.OQ.msPointer?"MSPointerCancel":"pointercancel",TAG_WHITE_LIST:["INPUT","SELECT","OPTION"],uu:{},ru:0,VY:function(t,i,n,e){return"touchstart"===i?this.Iu(t,n,e):"touchmove"===i?this.iu(t,n,e):"touchend"===i&&this.Ou(t,n,e),this},removePointerListener:function(t,i,n){var e=t["_tdt_"+i+n];return"touchstart"===i?t.removeEventListener(this.Tu,e,!1):"touchmove"===i?t.removeEventListener(this.tu,e,!1):"touchend"===i&&(t.removeEventListener(this.Yu,e,!1),t.removeEventListener(this.Uu,e,!1)),this},Iu:function(t,i,n){var e=T.s(function(t){if("mouse"!==t.pointerType&&t.pointerType!==t.MSPOINTER_TYPE_MOUSE){if(!(this.TAG_WHITE_LIST.indexOf(t.target.tagName)<0))return;T.Oq.preventDefault(t)}this.ou(t,i)},this);if(t["_tdt_touchstart"+n]=e,t.addEventListener(this.Tu,e,!1),!this.Pu){var s=T.s(this.pu,this);document.documentElement.addEventListener(this.Tu,T.s(this.Au,this),!0),document.documentElement.addEventListener(this.tu,T.s(this.au,this),!0),document.documentElement.addEventListener(this.Yu,s,!0),document.documentElement.addEventListener(this.Uu,s,!0),this.Pu=!0}},Au:function(t){this.uu[t.pointerId]=t,this.ru++},au:function(t){this.uu[t.pointerId]&&(this.uu[t.pointerId]=t)},pu:function(t){delete this.uu[t.pointerId],this.ru--},ou:function(t,i){t.touches=[];for(var n in this.uu)t.touches.push(this.uu[n]);t.changedTouches=[t],i(t)},iu:function(t,i,n){var e=T.s(function(t){(t.pointerType!==t.MSPOINTER_TYPE_MOUSE&&"mouse"!==t.pointerType||0!==t.buttons)&&this.ou(t,i)},this);t["_tdt_touchmove"+n]=e,t.addEventListener(this.tu,e,!1)},Ou:function(t,i,n){var e=T.s(function(t){this.ou(t,i)},this);t["_tdt_touchend"+n]=e,t.addEventListener(this.Yu,e,!1),t.addEventListener(this.Uu,e,!1)}}),T.Map.M({Su:!0}),T.Map.su=T.Sr.extend({initialize:function(t){this.JE=t,this.Iw=t.Iw,this.Du=t.pw.overlayPane},IU:function(){T.Oq.on(this.Iw,"touchstart",this.du,this),T.Oq.on(this.Iw,"touchmove",this.Fu,this),T.Oq.on(this.Iw,"touchend",this.fu,this)},Rr:function(){T.Oq.off(this.Iw,"touchstart",this.du),T.Oq.off(this.Iw,"touchmove",this.Fu),T.Oq.off(this.Iw,"touchend",this.fu)},du:function(t){if(this.JE.lW){var i="touchstart";this.JE.WQ(i,this.Gu(t));var n=this;return this.timer=setTimeout(function(){n.JE.WQ("longpress",n.Gu(t))},600),!1}},Fu:function(t){if(this.JE.lW){var i="touchmove";this.JE.WQ(i,this.Gu(t))}},fu:function(t){if(this.JE.lW){var i="touchend";return this.JE.WQ(i,this.Gu(t)),clearTimeout(this.timer),!1}},Gu:function(t){if(t.touches&&0!=t.changedTouches.length){var i=this.JE.Zw(t.changedTouches[0]),n=this.JE.kw(i),e=this.JE.Sw(n),s={lnglat:e,layerPoint:n,containerPoint:i,originalEvent:t};return s}}}),T.Map.n("uw","Su",T.Map.su),T.Map.M({gu:T.OQ.touch&&!T.OQ.android23,Hu:!1}),T.Map.hu=T.Sr.extend({IU:function(){T.nQ.eq(this.JE.Iw,"tdt-touch-zoom"),T.Oq.on(this.JE.Iw,"touchstart",this.du,this)},Rr:function(){T.nQ.rq(this.JE.Iw,"tdt-touch-zoom"),T.Oq.off(this.JE.Iw,"touchstart",this.du,this)},du:function(t){var i=this.JE;if(t.touches&&2===t.touches.length&&!i.QR&&!this.Ju){var n=i.Zw(t.touches[0]),e=i.Zw(t.touches[1]);this.ju=i.getSize().dQ(2),this.Ku=i.cW(this.ju),"center"!==i.options.gu&&(this._pinchStartLatLng=i.cW(n.pQ(e).dQ(2))),this._startDist=n.distanceTo(e),this.ku=i.getZoom(),this.aw=!1,this.Ju=!0,i.Uw(),T.Oq.on(document,"touchmove",this.Fu,this).on(document,"touchend",this.fu,this),T.Oq.preventDefault(t)}},Fu:function(t){if(t.touches&&2===t.touches.length&&this.Ju){var i=this.JE,n=i.Zw(t.touches[0]),e=i.Zw(t.touches[1]),s=n.distanceTo(e)/this._startDist;if(this.FW=i.fw(s,this.ku),!i.options.Hu&&(this.FW<i.getMinZoom()&&s<1||this.FW>i.getMaxZoom()&&s>1)&&(this.FW=i.fW(this.FW)),"center"===i.options.gu){if(this.jT=this.Ku,1===s)return}else{var o=n.AQ(e).dQ(2).sQ(this.ju);if(1===s&&0===o.x&&0===o.y)return;this.jT=i.nq(i.Mq(this._pinchStartLatLng,this.FW).SQ(o),this.FW)}this.aw||(i.QE(!0),this.aw=!0),T.a.C(this.YU);var h=T.s(i.mw,i,this.jT,this.FW,{pinch:!0,HQ:!1});this.YU=T.a.Z(h,this,!0),T.Oq.preventDefault(t)}},fu:function(){return this.aw&&this.Ju?(this.Ju=!1,T.a.C(this.YU),T.Oq.off(document,"touchmove",this.Fu).off(document,"touchend",this.fu),void(this.JE.options.Kr?this.JE.de(this.jT,this.JE.fW(this.FW),!0,this.JE.options.snapZoom):this.JE.LW(this.jT,this.JE.fW(this.FW)))):void(this.Ju=!1)}}),T.Map.n("uw","gu",T.Map.hu),T.Map.M({Lu:!0,lu:15}),T.Map.Zu=T.Sr.extend({IU:function(){T.Oq.on(this.JE.Iw,"touchstart",this.wU,this)},Rr:function(){T.Oq.off(this.JE.Iw,"touchstart",this.wU,this)},wU:function(t){if(t.touches){if(T.Oq.preventDefault(t),this.Cu=!0,t.touches.length>1)return this.Cu=!1,void clearTimeout(this.Vu);var i=t.touches[0],n=i.target;this.rU=this.tU=new T.Point(i.clientX,i.clientY),n.tagName&&"a"===n.tagName.toLowerCase()&&T.nQ.eq(n,"tdt-active"),this.Vu=setTimeout(T.s(function(){this.cu()&&(this.Cu=!1,this.RU(),this.Bu("contextmenu",i))},this),1e3),this.Bu("mousedown",i),T.Oq.on(document,{touchmove:this.se,touchend:this.RU},this)}},RU:function(t){if(clearTimeout(this.Vu),T.Oq.off(document,{touchmove:this.se,touchend:this.RU},this),this.Cu&&t&&t.changedTouches){var i=t.changedTouches[0],n=i.target;n&&n.tagName&&"a"===n.tagName.toLowerCase()&&T.nQ.rq(n,"tdt-active"),this.Bu("mouseup",i),this.cu()&&this.Bu("click",i)}},cu:function(){return this.tU.distanceTo(this.rU)<=this.JE.options.lu},se:function(t){var i=t.touches[0];this.tU=new T.Point(i.clientX,i.clientY),this.Bu("mousemove",i)},Bu:function(t,i){var n=document.createEvent("MouseEvents");n.UE=!0,i.target._Y=!0,n.initMouseEvent(t,!0,!0,window,1,i.screenX,i.screenY,i.clientX,i.clientY,!1,!1,!1,!1,0,null),i.target.dispatchEvent(n)}}),T.OQ.touch&&!T.OQ.pointer&&T.Map.n("uw","Lu",T.Map.Zu),T.Map.M({aE:!0}),T.Map.vu=T.Sr.extend({initialize:function(t){this.JE=t,this.Iw=t.Iw,this.Du=t.pw.overlayPane},IU:function(){T.Oq.on(this.Iw,"mousedown",this.Nu,this)},Rr:function(){T.Oq.off(this.Iw,"mousedown",this.Nu,this)},moved:function(){return this.aw},bu:function(){this.aw=!1},Nu:function(t){return!(!t.shiftKey||1!==t.which&&1!==t.button)&&(this.bu(),T.nQ.iq(),T.nQ.pq(),this.eU=this.JE.Zw(t),void T.Oq.on(document,{contextmenu:T.Oq.Yw,mousemove:this.TY,mouseup:this.Mu,keydown:this.nu},this))},TY:function(t){this.aw||(this.aw=!0,this._u=T.nQ.S("div","tdt-zoom-box",this.Iw),T.nQ.eq(this.Iw,"tdt-crosshair"),this.JE.WQ("boxzoomstart")),this.Mt=this.JE.Zw(t);var i=new T.lQ(this.Mt,this.eU),n=i.getSize();T.nQ.setPosition(this._u,i.min),this._u.style.width=n.x+"px",this._u.style.height=n.y+"px"},mu:function(){this.aw&&(T.nQ.mQ(this._u),T.nQ.rq(this.Iw,"tdt-crosshair")),T.nQ.oq(),T.nQ.Aq(),T.Oq.off(document,{contextmenu:T.Oq.Yw,mousemove:this.TY,mouseup:this.Mu,keydown:this.nu},this)},Mu:function(t){if((1===t.which||1===t.button)&&(this.mu(),this.aw)){setTimeout(T.s(this.bu,this),0);var i=new T.jq(this.JE.cW(this.eU),this.JE.cW(this.Mt));this.JE.MW(i).WQ("boxzoomend",{boxZoomBounds:i})}},nu:function(t){27===t.keyCode&&this.mu()}}),T.Map.n("uw","aE",T.Map.vu),T.Map.M({Qr:!0,QI:80}),T.Map.qI=T.Sr.extend({keyCodes:{left:[37],right:[39],down:[40],up:[38],zoomIn:[187,107,61,171],zoomOut:[189,109,54,173]},initialize:function(t){this.JE=t,this.WI(t.options.QI),this.wI(t.options.AW)},IU:function(){var t=this.JE.Iw;t.tabIndex<=0&&(t.tabIndex="0"),T.Oq.on(t,{focus:this.EI,blur:this.eI,mousedown:this.Nu},this),this.JE.on({focus:this.RI,blur:this.rI},this)},Rr:function(){this.rI(),T.Oq.off(this.JE.Iw,{focus:this.EI,blur:this.eI,mousedown:this.Nu},this),this.JE.off({focus:this.RI,blur:this.rI},this)},Nu:function(){if(!this.TI){var t=document.body,i=document.documentElement,n=t.scrollTop||i.scrollTop,e=t.scrollLeft||i.scrollLeft;this.JE.Iw.focus(),window.scrollTo(e,n)}},EI:function(){this.TI=!0,this.JE.WQ("focus")},eI:function(){this.TI=!1,this.JE.WQ("blur")},WI:function(t){var i,n,e=this._panKeys={},s=this.keyCodes;for(i=0,n=s.left.length;i<n;i++)e[s.left[i]]=[-1*t,0];for(i=0,n=s.right.length;i<n;i++)e[s.right[i]]=[t,0];for(i=0,n=s.down.length;i<n;i++)e[s.down[i]]=[0,t];for(i=0,n=s.up.length;i<n;i++)e[s.up[i]]=[0,-1*t]},wI:function(t){var i,n,e=this.tI={},s=this.keyCodes;for(i=0,n=s.zoomIn.length;i<n;i++)e[s.zoomIn[i]]=t;for(i=0,n=s.zoomOut.length;i<n;i++)e[s.zoomOut[i]]=-t},RI:function(){T.Oq.on(document,"keydown",this.nu,this)},rI:function(){T.Oq.off(document,"keydown",this.nu,this)},nu:function(t){if(!(t.altKey||t.ctrlKey||t.metaKey)){var i,n=t.keyCode,e=this.JE;if(n in this._panKeys){if(e.wE&&e.wE.UT)return;i=this._panKeys[n],t.shiftKey&&(i=T.aQ(i).FQ(3)),e.panBy(i),e.options.maxBounds&&e.Ww(e.options.maxBounds)}else if(n in this.tI)e.setZoom(e.getZoom()+(t.shiftKey?3:1)*this.tI[n]);else{if(27!==n)return;e.mr()}T.Oq.Yw(t)}}}),T.Map.b({enableKeyboard:function(){this.Qr.enable()},disableKeyboard:function(){this.Qr.disable()},isKeyboard:function(){return this.Qr.WU}}),T.Map.n("uw","Qr",T.Map.qI),T.Sr.ar=T.Sr.extend({initialize:function(t){this.YI=t},IU:function(){var t=this.YI.Ir;this.SU||(this.SU=new T.NY(t,t,!0)),this.SU.on({dragstart:this.sU,drag:this.DU,dragend:this.dU},this).enable(),T.nQ.eq(t,"tdt-marker-draggable")},Rr:function(){this.SU.off({dragstart:this.sU,drag:this.DU,dragend:this.dU},this).disable(),this.YI.Ir&&T.nQ.rq(this.YI.Ir,"tdt-marker-draggable")},moved:function(){return this.SU&&this.SU.aw},sU:function(){this.YI.mr().WQ("movestart").WQ("dragstart")},DU:function(t){var i=this.YI,n=i.Pr,e=T.nQ.getPosition(i.Ir),s=i.JE.Sw(e);n&&T.nQ.setPosition(n,e),i.wr=s,t.lnglat=s,i.WQ("move",t).WQ("drag",t)},dU:function(t){var i=(this.YI.Pr,T.nQ.getPosition(this.YI.Ir)),n=this.YI.JE.Sw(i);this.YI.wr=n,t.lnglat=n,this.YI.WQ("moveend").WQ("dragend",t)}}),T.Control=T.V.extend({options:{position:T_ANCHOR_TOP_RIGHT},initialize:function(t){T.setOptions(this,t)},getPosition:function(){return this.options.position},setPosition:function(t){var i=this.JE;return i&&i.removeControl(this),this.options.position=t,i&&i.addControl(this),this},getContainer:function(){return this.Iw},show:function(){this.Iw.style.display="block"},hide:function(){this.Iw.style.display="none"},isHidden:function(){return"none"==this.Iw.style.display},setOptions:function(t){T.a.extend(this.options,t)},setOffset:function(t){this.point=t,this.Iw.style.left=t.x+"px",this.Iw.style.top=t.y+"px"},getOffset:function(){return this.point},addTo:function(t){this.mQ(),this.JE=t;var i=this.Iw=this.onAdd(t),n=this.getPosition(),e=t.UI[n];return T.nQ.eq(i,"tdt-control"),n.indexOf("bottom")!==-1?e.insertBefore(i,e.firstChild):e.appendChild(i),this},mQ:function(){return this.JE?(T.nQ.mQ(this.Iw),this.onRemove&&this.onRemove(this.JE),this.JE=null,this):this},uI:function(t){this.JE&&t&&t.screenX>0&&t.screenY>0&&this.JE.getContainer().focus()}}),T.II=function(t){return new T.Control(t)},T.Map.b({addControl:function(t){return t.addTo(this),this.WQ("addcontrol",{addcontrol:t}),this},removeControl:function(t){return t.mQ(),this.WQ("removecontrol",{removecontrol:t}),this},bw:function(){function t(t,s){var o=n+t+" "+n+s;i[t+s]=T.nQ.S("div",o,e)}var i=this.UI={},n="tdt-",e=this.iI=T.nQ.S("div",n+"control-container",this.Iw);t("top","left"),t("top","right"),t("bottom","left"),t("bottom","right")},Ow:function(){T.nQ.mQ(this.iI)}}),T.Control.Zoom=T.Control.extend({options:{position:T_ANCHOR_TOP_LEFT,zoomInText:"+",zoomInTitle:"放大",zoomOutText:"-",zoomOutTitle:"缩小"},onAdd:function(t){var i="tdt-control-zoom",n=T.nQ.S("div",i+" tdt-bar"),e=this.options;return this.OI=this.oI(e.zoomInText,e.zoomInTitle,i+"-in",n,this.PI),this.pI=this.oI(e.zoomOutText,e.zoomOutTitle,i+"-out",n,this.AI),this.aI(),t.on("zoomend zoomlevelschange",this.aI,this),n},onRemove:function(t){t.off("zoomend zoomlevelschange",this.aI,this)},disable:function(){return this.SI=!0,this.aI(),this},enable:function(){return this.SI=!1,this.aI(),this},PI:function(t){this.SI||this.JE.zoomIn(this.JE.options.AW*(t.shiftKey?3:1))},AI:function(t){this.SI||this.JE.zoomOut(this.JE.options.AW*(t.shiftKey?3:1))},oI:function(t,i,n,e,s){var o=T.nQ.S("a",n,e);return o.innerHTML=t,o.href="#",o.title=i,T.Oq.on(o,"mousedown dblclick",T.Oq.stopPropagation).on(o,"click",T.Oq.Yw).on(o,"click",s,this).on(o,"click",this.uI,this),o},aI:function(){var t=this.JE,i="tdt-disabled";T.nQ.rq(this.OI,i),T.nQ.rq(this.pI,i),(this.SI||t.FW===t.getMinZoom())&&T.nQ.eq(this.pI,i),(this.SI||t.FW===t.getMaxZoom())&&T.nQ.eq(this.OI,i)}}),T.Map.M({sI:!1}),T.Map.n(function(){this.options.sI&&(this.sI=new T.Control.Zoom,this.addControl(this.sI))}),T.II.zoom=function(t){return new T.Control.Zoom(t)},T.Control.DI=T.Control.extend({options:{position:T_ANCHOR_BOTTOM_LEFT,dI:'<div style="height:24px"><img style="background-color:transparent;background-image:url('+T.w.e+"/logo.png);filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(sizingMethod=image,src="+T.w.e+'/logo.png);MozOpacity:1;opacity:1;" src="'+T.w.e+'/logo.png" width="53px" height="22px" opacity="0"/><div style="display:inline;position:relative;bottom:4px;white-space:nowrap;padding:0 0 0 3px;">GS(2017)508号</div></div>'},initialize:function(t){T.setOptions(this,t),this.FI={}},onAdd:function(t){t.VE=this,this.Iw=T.nQ.S("div","tdt-control-copyright"),T.Oq&&T.Oq.eT(this.Iw);for(var i in t.HW)t.HW[i].CE&&this.cE(t.HW[i].CE());return this.Ue(),this.Iw},fI:function(t){return this.options.dI=t,this.Ue(),this},cE:function(t){return t?(this.FI[t]||(this.FI[t]=0),this.FI[t]++,this.Ue(),this):this},vE:function(t){return t?(this.FI[t]&&(this.FI[t]--,this.Ue()),this):this},Ue:function(){if(this.JE){var t=[];for(var i in this.FI)this.FI[i]&&t.push(i);var n=[];this.options.dI&&n.push(this.options.dI),t.length&&n.push(t.join(", ")),this.Iw.innerHTML=n.join(" | ")}}}),T.Map.M({VE:!0}),T.Map.n(function(){this.options.VE&&(new T.Control.DI).addTo(this)}),T.II.re=function(t){return new T.Control.DI(t)},T.Control.Copyright=T.Control.DI.extend({options:{position:T_ANCHOR_BOTTOM_RIGHT,dI:""},initialize:function(t){T.setOptions(this,t),this.GI=[]},addCopyright:function(t){if(this.GI["str"+t.id])return void alert("copyright id 重复");this.GI.push(t),this.GI["str"+t.id]=t;var i=T.nQ.S("div","tdt-control-copyright");T.Oq&&T.Oq.eT(i),i.innerHTML=t.content,t._span=i,this.Iw.appendChild(i);var n=this.JE.getCenter();this.gI(n)},removeCopyright:function(t){this.Iw.removeChild(this.GI["str"+t.id]._span),this.GI["str"+t.id]=null;for(var i=0;i<this.GI.length;i++)if(this.GI[i].id==t.id){this.GI.splice(i,1);break}},gI:function(t){if(this.JE){if(t instanceof T.Dq)var i=t;else var i=t.target.getCenter();for(var n=0;n<this.GI.length;n++)this.GI[n].bounds&&(this.GI[n].bounds.contains(i)?"none"==this.GI[n]._span.style.display&&(this.GI[n]._span.style.display=""):this.GI[n]._span.style.display="none")}},getCopyright:function(t){return this.GI["str"+t]},getCopyrightCollection:function(){return this.GI},onAdd:function(t){return this.JE=t,t.VE=this,this.Iw=T.nQ.S("div","tdt-control-copyright"),T.Oq&&T.Oq.eT(this.Iw),this.Ue(),this.HI=t.on("move",this.gI,this),this.Iw},onRemove:function(t){T.nQ.mQ(this.Iw),this.Iw=null,t.off("move"),this.HI=null}}),T.Control.Scale=T.Control.extend({options:{position:T_ANCHOR_BOTTOM_LEFT,gr:100,hI:!0,JI:!0,type:1},onAdd:function(t){var i="tdt-control-scale",n=T.nQ.S("div",i),e=this.options;return this.jI(e,i+"-line",n),t.on(e.ee?"moveend":"move",this.Ue,this),t.SE(this.Ue,this),n},onRemove:function(t){t.off(this.options.ee?"moveend":"move",this.Ue,this)},setColor:function(t){this.KI&&(this.KI.style.borderColor=t,this.kI.style.color=t),this.LI&&1==this.type&&(this.LI.style.borderColor=t,this.lI.style.color=t)},jI:function(t,i,n){this.type=t.type,t.hI&&(this.KI=T.nQ.S("div",i,n),this.kI=T.nQ.S("div","tdt-control-scale-m",this.KI)),t.JI&&1==t.type&&(this.LI=T.nQ.S("div","tdt-control-scale-linebottom",n),this.lI=T.nQ.S("div","tdt-control-scale-i",this.LI))},Ue:function(){var t=this.JE,i=t.getSize().y/2,n=t.distance(t.cW([0,i]),t.cW([this.options.gr,i]));this.ZI(n)},ZI:function(t){this.options.hI&&t&&this.CI(t),this.options.JI&&t&&1==this.type&&this.VI(t)},CI:function(t){var i=this.cI(t),n=i<1e3?i+" 米":i/1e3+" 公里";this.BI(this.kI,n,i/t,this.KI)},VI:function(t){var i,n,e,s=3.2808399*t;s>5280?(i=s/5280,n=this.cI(i),this.BI(this.lI,n+" 英里",n/i,this.LI)):(e=this.cI(s),this.BI(this.lI,e+" 英尺",e/s,this.LI))},BI:function(t,i,n,e){e.style.width=Math.round(this.options.gr*n)+"px",t.innerHTML=i},cI:function(t){var i=Math.pow(10,(Math.floor(t)+"").length-1),n=t/i;return n=n>=10?10:n>=5?5:n>=3?3:n>=2?2:1,i*n}}),T.II.scale=function(t){return new T.Control.Scale(t)},T.Control.vI=T.Control.extend({options:{NI:!0,position:T_ANCHOR_TOP_RIGHT,bI:!0,MI:!1},initialize:function(t,i,n){T.setOptions(this,n),this.HW=[],this.nI=0,this._I=!1;for(var e in t)this.mI(t[e],e);for(e in i)this.mI(i[e],e,!0)},onAdd:function(t){return this.sW(),this.Ue(),this.JE=t,t.on("zoomend",this.Qi,this),this.Iw},onRemove:function(){this.JE.off("zoomend",this.Qi,this);for(var t=0;t<this.HW.length;t++)this.HW[t].layer.off("add remove",this.qi,this)},addBaseLayer:function(t,i){return this.mI(t,i),this.JE?this.Ue():this},addOverlay:function(t,i){return this.mI(t,i,!0),this.JE?this.Ue():this},removeLayer:function(t){t.off("add remove",this.qi,this);var i=this._getLayer(T.D(t));return i&&this.HW.splice(this.HW.indexOf(i),1),this.JE?this.Ue():this},expand:function(){T.nQ.eq(this.Iw,"tdt-control-layers-expanded"),this.Wi.style.height=null;var t=this.JE.getSize().y-(this.Iw.offsetTop+50);return t<this.Wi.clientHeight?(T.nQ.eq(this.Wi,"tdt-control-layers-scrollbar"),this.Wi.style.height=t+"px"):T.nQ.rq(this.Wi,"tdt-control-layers-scrollbar"),this.Qi(),this},collapse:function(){return L.DomUtil.rq(this.Iw,"tdt-control-layers-expanded"),this},sW:function(){var t="tdt-control-layers",i=this.Iw=T.nQ.S("div",t);i.setAttribute("aria-haspopup",!0),T.Oq.eT(i),T.OQ.touch||T.Oq.ET(i);var n=this.Wi=T.nQ.S("form",t+"-list");if(this.options.NI){T.OQ.android||T.Oq.on(i,{mouseenter:this.expand,mouseleave:this.collapse},this);var e=this.wi=T.nQ.S("a",t+"-toggle",i);e.href="#",e.title="vI",T.OQ.touch?T.Oq.on(e,"click",T.Oq.Yw).on(e,"click",this.expand,this):T.Oq.on(e,"focus",this.expand,this),T.Oq.on(n,"click",function(){setTimeout(T.s(this.Ei,this),0)},this),this.JE.on("click",this.collapse,this)}else this.expand();this.ei=T.nQ.S("div",t+"-base",n),this.Ri=T.nQ.S("div",t+"-separator",n),this.ri=T.nQ.S("div",t+"-overlays",n),i.appendChild(n)},_getLayer:function(t){for(var i=0;i<this.HW.length;i++)if(this.HW[i]&&T.D(this.HW[i].layer)===t)return this.HW[i]},mI:function(t,i,n){t.on("add remove",this.qi,this),this.HW.push({layer:t,name:i,overlay:n}),this.options.bI&&t.setZIndex&&(this.nI++,t.setZIndex(this.nI))},Ue:function(){if(!this.Iw)return this;T.nQ.Qq(this.ei),T.nQ.Qq(this.ri);var t,i,n,e,s=0;for(n=0;n<this.HW.length;n++)e=this.HW[n],this.Ti(e),i=i||e.overlay,t=t||!e.overlay,s+=e.overlay?0:1;return this.options.MI&&(t=t&&s>1,this.ei.style.display=t?"":"none"),this.Ri.style.display=i&&t?"":"none",this},qi:function(t){this._I||this.Ue();var i=this._getLayer(T.D(t.target)),n=i.overlay?"pQ"===t.type?"overlayadd":"overlayremove":"pQ"===t.type?"baselayerchange":null;n&&this.JE.WQ(n,i)},ti:function(t,i){var n='<input type="radio" class="tdt-control-layers-selector" name="'+t+'"'+(i?' checked="checked"':"")+"/>",e=document.createElement("div");return e.innerHTML=n,e.firstChild},Ti:function(t){var i,n=document.createElement("label"),e=this.JE.hasLayer(t.layer);t.overlay?(i=document.createElement("input"),i.type="checkbox",i.className="tdt-control-layers-selector",i.defaultChecked=e):i=this.ti("tdt-base-layers",e),i.layerId=T.D(t.layer),T.Oq.on(i,"click",this.Ei,this);var s=document.createElement("span");s.innerHTML=" "+t.name;var o=document.createElement("div");n.appendChild(o),o.appendChild(i),o.appendChild(s);var h=t.overlay?this.ri:this.ei;return h.appendChild(n),this.Qi(),n},Ei:function(){var t,i,n,e=this.Wi.getElementsByTagName("input"),s=[],o=[];this._I=!0;for(var h=e.length-1;h>=0;h--)t=e[h],i=this._getLayer(t.layerId).layer,n=this.JE.hasLayer(i),t.checked&&!n?s.push(i):!t.checked&&n&&o.push(i);for(h=0;h<o.length;h++)this.JE.removeLayer(o[h]);for(h=0;h<s.length;h++)this.JE.addLayer(s[h]);this._I=!1,this.uI()},Qi:function(){for(var t,i,n=this.Wi.getElementsByTagName("input"),e=this.JE.getZoom(),s=n.length-1;s>=0;s--)t=n[s],i=this._getLayer(t.layerId).layer,t.disabled=void 0!==i.options.minZoom&&e<i.options.minZoom||void 0!==i.options.maxZoom&&e>i.options.maxZoom},Yi:function(){return this.expand()},Ui:function(){return this.collapse()}}),T.II.layers=function(t,i,n){return new T.Control.vI(t,i,n)},T.ui=T._.extend({run:function(t,i,n,e){this.Yw(),this.Ii=t,this.UT=!0,this.ii=n||.25,this.Oi=1/Math.max(e||.5,.2),this.rU=T.nQ.getPosition(t),this.oi=i.SQ(this.rU),this.Wu=+new Date,this.WQ("start"),this.Pi()},Yw:function(){this.UT&&(this.pi(!0),this.Ai())},Pi:function(){this.ai=T.a.Z(this.Pi,this),this.pi()},pi:function(t){var i=+new Date-this.Wu,n=1e3*this.ii;i<n?this.Si(this.si(i/n),t):(this.Si(1),this.Ai())},Si:function(t,i){var n=this.rU.pQ(this.oi.FQ(t));i&&n.hQ(),T.nQ.setPosition(this.Ii,n),this.WQ("step")},Ai:function(){T.a.C(this.ai),this.UT=!1,this.WQ("end")},si:function(t){return 1-Math.pow(1-t,this.Oi)}}),T.Map.b({GW:function(t,i,n){if(i=void 0===i?this.FW:this.fW(i),t=this.Ew(T.Fq(t),i,this.options.maxBounds),n=n||{},this.Uw(),this.lW&&!n.reset&&n!==!0){void 0!==n.Rw&&(n.zoom=T.extend({Rw:n.Rw},n.zoom),n.mW=T.extend({Rw:n.Rw,duration:n.duration},n.mW));var e=this.FW!==i?this.Di&&this.Di(t,i,n.zoom):this.di(t,n.mW);if(e)return clearTimeout(this.tw),this}return this.LW(t,i),this},centerAndZoom:function(t,i,n){this.GW(t,i,n)},panBy:function(t,i){if(t=T.aQ(t).HQ(),i=i||{},!t.x&&!t.y)return this.WQ("moveend");if(i.Rw!==!0&&!this.getSize().contains(t))return this.LW(this.nq(this.Mq(this.getCenter()).pQ(t)),this.getZoom()),this;if(this.wE||(this.wE=new T.ui,this.wE.on({step:this.Fi,end:this.fi},this)),i.CU||this.WQ("movestart"),i.Rw!==!1){T.nQ.eq(this.iw,"tdt-pan-anim");var n=this.Lw().SQ(t).HQ();this.wE.run(this.iw,n,i.duration||.25,i.PU)}else this.Qw(t),this.WQ("move").WQ("moveend");return this},Fi:function(){this.WQ("move")},fi:function(){T.nQ.rq(this.iw,"tdt-pan-anim"),this.WQ("moveend")},di:function(t,i){var n=this.DE(t).jQ();return!((i&&i.Rw)!==!0&&!this.getSize().contains(n))&&(this.panBy(n,i),!0)}}),T.Map.M({Kr:!0,Gi:4});var zoomAnimated=T.nQ.uq&&T.OQ.any3d&&!T.OQ.mobileOpera;zoomAnimated&&T.Map.n(function(){this.lE=this.options.Kr,this.lE&&(this.gi(),T.Oq.on(this.Hi,T.nQ.Iq,this.hi,this))}),T.Map.b(zoomAnimated?{gi:function(){var t=this.Hi=T.nQ.S("div","tdt-proxy tdt-zoom-animated");this.pw.mapPane.appendChild(t),this.on("De",function(i){var n=T.nQ.Uq,e=t.style[n];T.nQ.Yq(t,this.Mq(i.center,i.zoom),this.CW(i.zoom,1)),e===t.style[n]&&this.QR&&this.Ji()},this),this.on("load moveend",function(){var i=this.getCenter(),n=this.getZoom();T.nQ.Yq(t,this.Mq(i,n),this.CW(n,1))},this)},hi:function(t){this.QR&&t.propertyName.indexOf("NQ")>=0&&this.Ji()},ji:function(){return!this.Iw.getElementsByClassName("tdt-zoom-animated").length},Di:function(t,i,n){if(this.QR)return!0;if(n=n||{},!this.lE||n.Rw===!1||this.ji()||Math.abs(i-this.FW)>this.options.Gi)return!1;var e=this.CW(i),s=this.DE(t).dQ(1-1/e);return!(n.Rw!==!0&&!this.getSize().contains(s))&&(T.a.Z(function(){this.QE(!0).de(t,i,!0)},this),!0)},de:function(t,i,n,e){n&&(this.QR=!0,this.Ki=t,this.WR=i,T.nQ.eq(this.iw,"tdt-zoom-anim")),this.WQ("De",{center:t,zoom:i,noUpdate:e}),setTimeout(T.s(this.Ji,this),250)},Ji:function(){this.QR&&(T.nQ.rq(this.iw,"tdt-zoom-anim"),this.QR=!1,this.mw(this.Ki,this.WR),T.a.Z(function(){this._w(!0)},this))}}:{}),T.Map.b({enableContinuousZoom:function(){this.options.Gi=4},disableContinuousZoom:function(){this.options.Gi=0},isContinuousZoom:function(){return 4==this.options.Gi}}),T.Map.b({Ve:function(t,i,n){function e(t){var i=t?-1:1,n=t?v:m,e=v*v-m*m+i*g*g*w*w,s=2*n*g*w,o=e/s,h=Math.sqrt(o*o+1)-o,r=h<1e-9?-18:Math.log(h);return r}function s(t){return(Math.exp(t)-Math.exp(-t))/2}function o(t){return(Math.exp(t)+Math.exp(-t))/2}function h(t){return s(t)/o(t)}function r(t){return m*(o(Q)/o(Q+y*t))}function a(t){return m*(o(Q)*h(Q+y*t)-s(Q))/g}function u(t){return 1-Math.pow(1-t,1.5)}function c(){var n=(Date.now()-E)/W,e=u(n)*q;n<=1?(this.WE=T.a.Z(c,this),this.mw(this.nq(l.pQ(f.SQ(l).FQ(a(e)/w)),p),this.fw(m/r(e),p),{Ve:!0})):this.mw(t,i)._w(!0)}if(n=n||{},n.Rw===!1||!T.OQ.any3d)return this.GW(t,i,n);this.Uw();var l=this.Mq(this.getCenter()),f=this.Mq(t),d=this.getSize(),p=this.FW;t=T.Fq(t),i=void 0===i?p:i;var m=Math.max(d.x,d.y),v=m*this.CW(p,i),w=f.distanceTo(l)||1,y=1.42,g=y*y,Q=e(0),E=Date.now(),q=(e(1)-Q)/y,W=n.duration?10*n.duration:10*q*.8;return this.QE(!0),c.call(this),this},ki:function(t,i){var n=this.BW(t,i);return this.Ve(n.center,n.zoom,i)}}),T.Map.b({Li:{li:1e4,watch:!1},Zi:function(t){if(t=this.Ci=T.extend({},this.Li,t),!("geolocation"in navigator))return this.Vi({code:0,message:"ci"}),this;var i=T.s(this.Bi,this),n=T.s(this.Vi,this);return t.watch?this.vi=navigator.geolocation.watchPosition(i,n,t):navigator.geolocation.getCurrentPosition(i,n,t),this},Ni:function(){return navigator.geolocation&&navigator.geolocation.clearWatch&&navigator.geolocation.clearWatch(this.vi),this.Ci&&(this.Ci.GW=!1),this},Vi:function(t){var i=t.code,n=t.message||(1===i?"bi":2===i?"Mi":"li");this.Ci.GW&&!this.lW&&this.nW(),this.WQ("ni",{code:i,message:"_i"+n+"."})},Bi:function(t){var i=t.coords.latitude,n=t.coords.longitude,e=new T.Dq(i,n),s=e.hq(t.coords.accuracy),o=this.Ci;if(o.GW){var h=this.bW(s);this.GW(e,o.maxZoom?Math.min(h,o.maxZoom):h)}var r={dT:e,bounds:s,mi:t.mi};for(var a in t.coords)"number"==typeof t.coords[a]&&(r[a]=t.coords[a]);this.WQ("QO",r)}}),T.qO={WO:"201703071639",wO:function(t,i,n){if(window.localStorage){var e,s=localStorage.getItem(t);null==s||0==s.length||this.WO!=localStorage.getItem("TDT_version")?(document.write('<script type="text/javascript" src="'+i+'"></script>'),window.ActiveXObject?e=new ActiveXObject("Microsoft.XMLHTTP"):window.XMLHttpRequest&&(e=new XMLHttpRequest),null!=e&&(e.open("GET",i),e.send(null),e.onreadystatechange=function(){4==e.readyState&&200==e.status&&(s=e.responseText,localStorage.setItem(t,s),localStorage.setItem("TDT_version",T.qO.WO),null!=n&&n())})):(T.qO.EO(s),null!=n&&n())}else T.qO.eO(i)},RO:function(t,i){if(T.OQ.ie8)return T.qO.rO(i),!1;if(window.localStorage){var n,e=localStorage.getItem(t);null==e||0==e.length||this.WO!=localStorage.getItem("TDT_version")?(window.ActiveXObject?n=new ActiveXObject("Microsoft.XMLHTTP"):window.XMLHttpRequest&&(n=new XMLHttpRequest),null!=n&&(n.open("GET",i),n.send(null),n.onreadystatechange=function(){4==n.readyState&&200==n.status&&(e=n.responseText,localStorage.setItem(t,e),localStorage.setItem("TDT_version",T.qO.WO),e=null==e?"":e,T.qO.TO(e))})):T.qO.TO(e)}else T.qO.rO(i)},EO:function(t){var i=document.getElementsByTagName("HEAD").item(0),n=document.createElement("script");n.type="text/javascript",n.text=t,i.appendChild(n)},TO:function(t){var i=document.getElementsByTagName("HEAD").item(0),n=document.createElement("style");n.type="text/css",n.styleSheet?n.styleSheet.cssText=t:n.innerHTML=t,i.appendChild(n)},eO:function(t){var i=document.getElementsByTagName("HEAD").item(0),n=document.createElement("script");n.type="text/javascript",n.src=t,i.appendChild(n)},rO:function(t){var i=document.getElementsByTagName("HEAD").item(0),n=document.createElement("link");n.type="text/css",n.rel="stylesheet",n.rev="stylesheet",n.media="screen",n.href=t,i.appendChild(n)},tO:function(t,i){var n=document.createElement("script");i&&(n.onload=n.onreadystatechange=function(){this.readyState&&"loaded"!=this.readyState&&"complete"!==this.readyState||(n.onload=n.onreadystatechange=null,i())});var e=document.getElementsByTagName("head")[0];n.type="text/javascript",n.src=t,e.appendChild(n)},YO:function(t,i){if(T.OQ.ie)return T.qO.rO(i),!1;if(window.localStorage){var n=localStorage.getItem(t);null==n||0==n.length||this.WO!=localStorage.getItem("TDT_version")?(T.qO.rO(i),i.indexOf("tianditu4.0")!=-1&&(i=T.w.E+"/api?v=4.0&name=tianditu4.0"),T.qO.tO(i,function(){T.ObjectData&&(n=T.ObjectData),localStorage.setItem(t,n),localStorage.setItem("TDT_version",T.qO.WO),T.ObjectData=null})):T.qO.TO(n)}},UO:function(t,i){if(T.OQ.ie)return document.write('<script type="text/javascript" src="'+i+'"></script>'),!1;if(window.localStorage){var n=localStorage.getItem(t);null==n||0==n.length||this.WO!=localStorage.getItem("TDT_version")?(document.write('<script type="text/javascript" src="'+i+'"></script>'),i.indexOf("components")!=-1&&(i=T.w.E+"/api?v=4.0&name=components"),i.indexOf("service")!=-1&&(i=T.w.E+"/api?v=4.0&name=service"),i.indexOf("military")!=-1&&(i=T.w.E+"/api?v=4.0&name=military"),T.qO.tO(i,function(){T.ObjectData&&(n=T.ObjectData),localStorage.setItem(t,n),localStorage.setItem("TDT_version",T.qO.WO),T.ObjectData=null})):T.qO.EO(n)}}};for(var n=0;n<T.w.A.length;n++)T.qO.YO("TDT_style"+n,T.w.E+T.w.A[n]);for(var m=0;m<T.w.p.length;m++)T.qO.UO("TDT_components"+m,T.w.E+T.w.p[m]);T.ScriptLoader=function(){},T.ScriptLoader.prototype={load:function(t,i,n,e){if(this.objName="tdt_loadResult",this.win=window,this.charset=i?i:"utf-8",this.src=t?t:null,null!=this.src){this.callback=e?T.ScriptLoader.uO(n,e):null;var s=this.win;s[this.objName]=null,this.oScript=document.createElement("script"),this.oScript.type="text/javascript",this.oScript.async=!0,this.oScript.charset=this.charset,this.oScript.src=this.src,this.running=!0;var n=this;this.oScript.onload=this.oScript.onreadystatechange=function(){this.readyState&&"loaded"!=this.readyState&&"complete"!==this.readyState||(n.oScript.onload=n.oScript.onreadystatechange=null,n.IO())},s.document.body.insertBefore(this.oScript,s.document.body.firstChild)}},IO:function(t){var i=this.win;if(i[this.objName]){var n=i[this.objName];i[this.objName]=null,this.callback&&this.callback(n)}else this.callback&&this.callback("");!document.all&&this.oScript&&this.oScript.parentNode==i.document.body&&(this.oScript.removeAttribute("src"),i.document.body.removeChild(this.oScript),delete this.oScript),this.running=!1}},T.ScriptLoader.getObject=function(){var t,i=i?i:window;i.scriptLoader_obj||(i.scriptLoader_obj=[]);for(var n=0;n<i.scriptLoader_obj.length;n++)if(0==i.scriptLoader_obj[n].running){t=i.scriptLoader_obj[n],delete t;break}return t?(t.running=!0,t):t=new T.ScriptLoader},T.ScriptLoader.iO=function(t){return t&&t.ownerDocument&&t.ownerDocument.parentWindow?t.ownerDocument.parentWindow:window},T.ScriptLoader.OO=function(t){return t||(t=[]),t[0]||(t[0]=T.ScriptLoader.iO().event),t[0]&&!t[0].target&&t[0].srcElement&&(t[0].target=t[0].srcElement),t},T.ScriptLoader.uO=function(t,i){return function(){i.apply(t,T.ScriptLoader.OO(arguments))}};})();
               var paint = {
                touch: ("ontouchstart" in document),
                init: function(canvas) {
                  if(canvas.inited){
                    return;
                  }
                  this.load(canvas);
                  this.bind();
                  canvas.inited = true;
                },
                load: function(canvas) {
                  var _this = this;
                  _this.x = []; //记录鼠标移动是的X坐标
                  _this.y = []; //记录鼠标移动是的Y坐标
                  _this.clickDrag = [];
                  _this.lock = false;
                  _this.isEraser = false;
                  _this.storageColor = "#FF0000";
                  _this.eraserRadius = 15;
                  // _this.color = ["#FF0000", "#80FF00", "#00FFFF", "#808080", "#FF8000", "#408080", "#8000FF", "#CCCC00", "#000000"];
                  _this.fontWeight = [5];
                  _this.$ = function(id) {
                    return typeof id == "string" ? document.getElementById(id) : id;
                  };
                  _this.canvas = canvas;
                  _this.cxt = _this.canvas.getContext('2d');
                  _this.cxt.lineJoin = "round";
                  _this.cxt.strokeStyle = _this.storageColor;
                  _this.cxt.lineWidth = 4;
                  _this.w = _this.canvas.width;
                  _this.h = _this.canvas.height;
                  _this.StartEvent = _this.touch ? "touchstart" : "mousedown";
                  _this.MoveEvent = _this.touch ? "touchmove" : "mousemove";
                  _this.EndEvent = _this.touch ? "touchend" : "mouseup";
                },
                bind: function() {
                  var t = this;
                  var $canvas = $(t.canvas);
                  $canvas.bind(t.StartEvent, function(e) {
                    t.cxt.strokeStyle = t.storageColor; //强制重置颜色
                    if(e.originalEvent){
                      e = e.originalEvent;
                    }
                    var touch = t.touch ? e.touches[0] : e;
                    t.preventDefault(e);
                    var _x = touch.clientX - touch.target.offsetLeft;
                    var _y = touch.clientY - touch.target.offsetTop;
                    if (t.isEraser) {
                      t.resetEraser(_x, _y, touch);
                    } else {
                      t.movePoint(_x, _y);
                      t.drawPoint();
                    }
                    t.lock = true;
                  });
                  $canvas.bind(t.MoveEvent, function(e) {
                    if(e.originalEvent){
                      e = e.originalEvent;
                    }
                    var touch = t.touch ? e.touches[0] : e;
                    if (t.lock) {
                      var _x = touch.clientX - touch.target.offsetLeft;
                      var _y = touch.clientY - touch.target.offsetTop;
                      if (t.isEraser) {
                        t.resetEraser(_x, _y, touch);
                      } else {
                        t.movePoint(_x, _y, true);
                        t.drawPoint();
                      }
                    }
                  });
                  $canvas.bind(t.EndEvent, function(e) {
                    t.lock = false;
                    t.x = [];
                    t.y = [];
                    t.clickDrag = [];
                    clearInterval(t.Timer);
                    t.Timer = null;
                  });
                },
                movePoint: function(x, y, dragging) {
                  this.x.push(x);
                  this.y.push(y);
                  this.clickDrag.push(y);
                },
                drawPoint: function(x, y, radius) {
                  for (var i = 0; i < this.x.length; i++) {
                    this.cxt.beginPath();
                    this.cxt.lineWidth = 4;
                    if (this.clickDrag[i] && i) {
                      this.cxt.moveTo(this.x[i - 1], this.y[i - 1]);
                    } else {
                      this.cxt.moveTo(this.x[i] - 1, this.y[i]);
                    }
                    this.cxt.lineTo(this.x[i], this.y[i]);
                    this.cxt.closePath();
                    this.cxt.stroke();
                  }
                },
                clear: function() {
                  this.cxt && this.cxt.clearRect(0, 0, this.w, this.h);
                },
                redraw: function() {
                  this.cxt.restore();
                },
                preventDefault: function(e) {
                  if(e.preventDefault){
                    e.preventDefault();
                  }else{
                    window.event.returnValue = false;
                  }
                  // var touch = this.touch ? e.touches[0] : e;
                  // if (this.touch) e.preventDefault();
                  // else window.event.returnValue = false;
                },
                getUrl: function() {
                  this.$("html").innerHTML = this.canvas.toDataURL();
                },
                resetEraser: function(_x, _y, touch) {
                  var t = this;
                  t.cxt.globalCompositeOperation = "destination-out";
                  t.cxt.beginPath();
                  t.cxt.lineWidth = 4;
                  t.cxt.arc(_x, _y, t.eraserRadius, 0, Math.PI * 2);
                  t.cxt.strokeStyle = "rgba(250,250,250,0)";
                  t.cxt.fill();
                  t.cxt.globalCompositeOperation = "source-over"
                }
              };

              window.Paint = paint;
              $(function() {  
                  FastClick.attach(document.body);  
              });
              var touch = ("ontouchstart" in document);
              var clickEvent = touch?"touchend":"click";
              var mDownEvent = touch?"touchstart" : "mousedown";
              var mMoveEvent = touch?"touchmove" : "mousemove";
              var mUpEvent = touch?"touchend" : "mouseup";
              //html根字体大小
              var sourceSize = parseFloat($('html').css('fontSize'));
              //画笔功能
              $('.set-btn').on(clickEvent,function(){
                $('#paintCanvas').attr({'width':$(window).width(),'height':$(window).height()}).css('marginTop','50px')
                var $Paint = $('.paint');
                if($(this).hasClass('act')){
                  Paint.clear();
                  $(this).removeClass('act');
                  $Paint.hide();
                }else{
                  $Paint.show();
                  $(this).addClass('act');
                  Paint.init( $('#paintCanvas').get(0) );
                }

                return false;
              })
              $('body').css({
                "width":$(window).width(),
                "height":$(window).height()
              })
              //解锁功能
              $('.lock-btn').on(clickEvent,function(){
                if($(this).hasClass('act')){
                  $(this).removeClass('act');
                  $('.shade-layer').hide();
                  $(this).siblings().show();
                }else{
                  $(this).addClass('act');
                  $('.shade-layer').show();
                  $(this).siblings().hide();
                }

                return false;
              })

              //关闭台风信息
              $('.close').on(clickEvent,function(){
                $(this).parent().hide()
              })

              //跳转首页
              $('#home').on(clickEvent,function(){
                location.href="index.html";
              })
              //跳转首页
              $('.home').on(clickEvent,function(){
                location.href="index.html";
              })
              //左侧菜单 初始化
              $('.menu>ul>li').each(function(){
                if($(this).hasClass('menuAct')){
                  if($(this).index() == 0){
                    $(this).css({"top":"-5px"});
                  }else{
                    $(this).animate({
                      "top":($(this).height()-4)*$(this).index()+"px"
                    })
                  }
                }else{
                  $(this).animate({
                    "top":($(this).height()+8)*$(this).index()+"px"
                  })
                }
                
              })
              /***
               * 图片覆盖物类，用于添加一个只有一张图片的图层，图片会随缩放级别而自适应缩放。
               *@author juyang
               * **/

              T.ImageOverlay = T.Overlay.extend({

                  options: {
                      opacity: 1,//透明度
                      alt: ''
                  },


                  /**
                   *
                   * @param url  图片的url。
                   * @param bounds 图片的坐标范围。
                   * @param options \

                   */
                  initialize: function (url, bounds, options) {
                      this._url = url;
                      this._bounds = bounds;
                      T.setOptions(this, options);
                  },
                  /**
                   *增加图片容器
                   * @param map 地图对象
                   */
                  onAdd: function (map) {
                      this._map = map;
                      if (!this._image) {
                          this._initImage();
                          this._update();
                          if (this.options.opacity < 1) {
                              this._updateOpacity();
                          }
                      }
                      this._map.on("zoomend", this._update, this)
                      this._map.getPanes().overlayPane.appendChild(this._image);

                  },
                  onRemove: function () {
                      this._map.off("zoomend", this._update, this)
                      this._map.getPanes().overlayPane.removeChild(this._image);
                      this.map = null;
                      this._image = null;
                  },
                  /**
                   * 设置透明度
                   * @param opacity
                   * @returns {T.ImageOverlay}
                   */

                  setOpacity: function (opacity) {
                      this.options.opacity = opacity;

                      if (this._image) {
                          this._updateOpacity();
                      }
                      return this;
                  },
                  getOpacity: function () {
                      return this.options.opacity ;
                  },
                  /**
                   * 设置图片的url
                   * @param url
                   * @returns {T.ImageOverlay}
                   */

                  setImageUrl: function (url) {
                      this._url = url;
                      if (this._image) {
                          this._image.src = url;
                      }
                      return this;

                  },
                  /**
                   * 获取图片的url
                   * @returns {*}
                   */
                  getImageUrl :function () {
                      return this._url;

                  },
                  /**
                   * 设置图片的覆盖范围
                   * @param bounds
                   */
                  setBounds: function (bounds) {
                      this._bounds = bounds;
                      if (this._bounds) {
                          this._update();
                      }
                  },
                  /**
                   * 获取图片的覆盖范围
                   * @param bounds
                   */
                  getBounds: function () {
                      return this._bounds;
                  },

                  getElement: function () {
                      return this._image;
                  },

                  /**
                   * 构建图片的容器
                   * @private
                   */

                  _initImage: function () {
                      var img = this._image = this.create('img',
                          'tdt-image-layer ' + (this._zoomAnimated ? 'tdt-zoom-animated' : ''));
                      img.src = this._url;
                      img.alt = this.options.alt;

                  },

                  /**
                   * 更新透明度
                   * @private
                   */
                  _updateOpacity: function () {

                      var el = this._image;
                      if ('opacity' in el.style) {
                          el.style.opacity = this.options.opacity;
                      }
                      else if ('filter' in el.style) {
                          this._setOpacityIE(el, this.options.opacity);
                      }


                  },


                  _setOpacityIE: function (el, value) {
                      var filter = false,
                          filterName = 'DXImageTransform.Microsoft.Alpha';
                      try {
                          filter = el.filters.item(filterName);
                      } catch (e) {
                          if (value === 1) {
                              return;
                          }
                      }
                      value = Math.round(value * 100);
                      if (filter) {
                          filter.Enabled = (value !== 100);
                          filter.Opacity = value;
                      } else {
                          el.style.filter += ' progid:' + filterName + '(opacity=' + value + ')';
                      }
                  },

                  /**
                   *
                   * @param tagName 元素名称
                   * @param className css样式名称
                   * @param container 容器
                   * @returns {Element}
                   */
                  create: function (tagName, className, container) {
                      var el = document.createElement(tagName);
                      el.className = className || '';
                      if (container) {
                          container.appendChild(el);
                      }
                      return el;
                  },

                  //更新图片容器像素位置
                  _update: function () {
                      var image = this._image;
                      var p1 = this._map.lngLatToLayerPoint(this._bounds.getNorthEast());
                      var p2 = this._map.lngLatToLayerPoint(this._bounds.getSouthWest());
                      var xt = Math.abs(p1.x - p2.x)
                      var yt = Math.abs(p1.y - p2.y)
                      image.style.left = p2.x + "px";
                      image.style.top = p1.y + "px";
                      image.style.width = xt + 'px';
                      image.style.height = yt + 'px';

                  },


                  /**
                   * 图片移动到最顶层
                   * @returns {T.ImageOverlay}
                   */
                  bringToFront: function () {
                      if (this._image) {
                          this._image.parentNode.appendChild(this._image);
                      }
                      return this;

                  },

                  /**
                   * 图片移动到最底层
                   * @returns {T.ImageOverlay}
                   */
                  bringToBack: function () {
                      if (this._image) {
                          var parent = this._image.parentNode;
                          parent.insertBefore(this._image, parent.firstChild);

                      }
                      return this;

                  }

              })
              function MinuteLevelRain() {
                this.map = null;
                this.zoom = 8;
                this.img = null;
                this.inLabel =null;
                this.point = [];
                this.radar_label = [];
                this.isRadar = false;
                this.crypto = require('crypto');
                this.onLoad();
                this.bindEvents();
              };
              MinuteLevelRain.prototype={
                constructor : MinuteLevelRain,
                 //初始化加载地图
                onLoad :function () {
                  var _this = this;
                  this.map = new T.Map('mapDiv');
                  this.map.centerAndZoom(new T.LngLat(109.2, 18.9), this.zoom);
                  this.map.setMinZoom(4);
                  this.map.setMaxZoom(10);
                  var imageURL = "https://wprd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&style=7&x={x}&y={y}&z={z}"; 
                  //创建自定义图层对象 
                  var lay = new T.TileLayer(imageURL,{minZoom:4,maxZoom:12}); 
                  //创建自定义图层对象 
                  var lay = new T.TileLayer(imageURL,{minZoom:3,maxZoom:8}); 
                  //将图层增加到地图上 
                  this.map.addLayer(lay);
                  var bd = new T.LngLatBounds(
                    new T.LngLat(71.9282,57.9079),
                    new T.LngLat(134.8656,3.9079));
                  this.img = new T.ImageOverlay("", bd);
                  var img = this.img;
                  $("img").css("border","0 none");
                  
                  var l_img = new T.Icon({
                    iconUrl: "./img/minuteRain/定位点.png",
                    iconSize: new T.Point(30, 32),
                    iconAnchor: new T.Point(12,30),

                  });
                  this.m_img = new T.Marker(new T.LngLat(0, 0), {icon: l_img,opacity:0,zIndexOffset:10000});
                  this.map.addOverLay(this.m_img);

                  //雷达显示添加；
                  this.radarBtn();
                  //地图点击
                  this.addMapClick();
                  this.map.on("moveend",this.radarLabel.bind(this) );
                },
                radarLabel:function(){

                  if( this.radar_label && this.isRadar ){
                    var zoom = this.map.getZoom();
                    for (var i = 0; i < this.radar_label.length; i++) {
                        this.map.addOverLay( this.radar_label[i] );
                      }
                    if( zoom>=6 ){
                      $('.radar_city').show();
                      $('.show_city').removeClass('initLable');
                      $('.radar_icon .radar_city').each(function(i,e){
                          var n = $(this).attr('data_text');
                          var width;
                          if( n == '2' ){
                            width = 45;
                          }else if( n == '3' ){
                            width = 57;
                          }else if( n == '4' ){
                            width = 69;
                          }
                          $(this).parent().css({
                            "width": width+'px'
                          })
                      })
                    }else{
                      $('.radar_city').hide();
                      $('.show_city').addClass('initLable');
                      $('.radar_icon').css("width","")
                    }

                  }
                },
                radarBtn:function(){
                  var _this=this;
                  $('#radarStand').on(clickEvent,function(){
                    $('#middleMask').hide();
                    _this.m_img.setOpacity(0);
                    if( $(this).hasClass('act') ){
                      _this.isRadar = false;
                      $(this).removeClass('act');
                      for (var i = 0; i < _this.radar_label.length; i++) {
                        _this.map.removeOverLay( _this.radar_label[i] );
                      }

                      if( _this.inLabel )
                      {
                        _this.map.removeOverLay( _this.inLabel );
                      }
                      $('.tdt-overlay-pane').css('zIndex',400)
                    }else{
                      $('.tdt-overlay-pane').css('zIndex',700)
                      
                      if( _this.point.length ){
                        var zoom = _this.map.getZoom();
                        for (var i = 0; i < _this.radar_label.length; i++) {
                          _this.map.addOverLay( _this.radar_label[i] );
                        }
                      }else{
                        $.getJSON("./data/radar.json",function (data) {
                          _this.eachData(data);
                        })
                      }

                      $(this).addClass('act');
                      _this.isRadar = true;
                    }

                    return false;
                  })
                  
                },
                eachData:function(arr){
                  var _this = this;
                  $.each (arr, function (i, item)  
                    {  
                      var latlng = new T.LngLat(item.lon, item.lat);
                      //添加雷达图
                      var width = item.name.length;
                      var label = new T.Label({
                              text: '<div class="radar_icon"><i class="fl"></i><span class="fl radar_city" data_text="'+ width +'">'+item.name+'</span></div>',
                              position: latlng ,
                              offset: new T.Point(-20,10)
                            });
                    label.setBorderColor( "#cbcbcb" );
                    $(label.Iw).addClass('initLable show_city');
                      //注册事件
                      label.on('click', function(){
                        _this.radaer_image.bind(_this)(item)

                        return false;
                      });

                      _this.radar_label.push( label );
                      _this.map.addOverLay(label)
                    });
                },
                radaer_image:function(e){
                  var _this = this;
                  if (this.inLabel) {
                     this.map.removeOverLay(this.inLabel);
                     this.inLabel = null;
                 }
                 var lnglat = new T.LngLat( e.lon , e.lat );
                  //创建信息窗口对象
                  this.inLabel = new T.Label();
                  this.inLabel.setLngLat(lnglat);
                  this.inLabel.setOffset(new T.Point(-12,-512));
                  var url = 'http://hfapi.tianqi.cn/data/';
                  $.getJSON(encryURL(url,'leid_data', 'fec60dca880595d7',e.id),function(data){
                    var sContent;
                    if(data.msg){
                      sContent = '暂无雷达信息';
                    }else{
                      // sContent = data.r2+data.r5+data.r6[0][0]+'.PNG';
                      // sContent = '<img src="'+ (data.r2+data.r5+data.r6[0][0]+'.PNG') +'"/><span class="close"></span>';
                      sContent = '<div class="radar_img">'
                                  +'<img src="'+ (data.r2+data.r5+data.r6[0][0]+'.PNG') +'" id="radar_img" alt="该地区暂无雷达图信息，请稍后尝试">'
                                  +'<span class="close"></span>'
                                +'</div>';
                    }
                    //设置图片
                    _this.inLabel.setContent(sContent);

                    //向地图上添加信息窗口
                    _this.map.addOverLay(_this.inLabel);

                    $('.radar_img').parent().css('zIndex',10000)
                    _this.map.centerAndZoom( tansLngLat() , _this.map.getZoom());
                    $('.close').on('click',function(){
                      $('.radar_img').parent().hide();
                    })
                  })
                  //转换中心点经纬度
                  function tansLngLat(){
                    var zoom = _this.map.getZoom();
                    var lnglat;
                    if( zoom <7 ){
                      lnglat = new T.LngLat( parseFloat(e.lon)+8 , parseFloat(e.lat)+4 );
                    }else if( zoom == 7 ){
                      lnglat = new T.LngLat( parseFloat(e.lon)+4 , parseFloat(e.lat)+2 );
                    }else if( zoom == 8 ){
                      lnglat = new T.LngLat( parseFloat(e.lon)+2 , parseFloat(e.lat)+1 );
                    }else{
                      lnglat = new T.LngLat( parseFloat(e.lon)+0.2 , parseFloat(e.lat)+0.4 );
                    }

                    return lnglat
                  }
                  function addZero(n){return n>=10?n+'':'0'+n;}
                  //时间函数
                  function timeObj(){
                    var oDate = new Date();
                    return {
                      "year":oDate.getFullYear(),
                      "month":addZero(oDate.getMonth()+1),
                      "date":addZero(oDate.getDate()),
                      "hours":addZero(oDate.getHours()),
                      "minutes":addZero(oDate.getMinutes())
                    }
                  }
                  //url处理
                  function encryURL(url, private_key, appid,areaid) {
                    var myDate = timeObj();
                    var date = myDate.year+myDate.month+myDate.date+myDate.hours+myDate.minutes;
                    url += (~url.indexOf('?')?'&':'?')+'areaid='+areaid +'&type=product'+'&date='+date+'&appid='+appid;
                    var hmac = _this.crypto.createHmac('sha1', private_key);
                    hmac.write(url);
                    hmac.end();
                    var key = hmac.read().toString('base64');
                    key = encodeURIComponent(key);

                    return url.replace(/appid=.*/,'appid='+appid.substr(0,6)) + '&key=' + key;
                  }
                },
                // 加载覆盖图层
                reLoad : function (url,parm1,parm2,parm3,parm4) {
                  this.map.removeOverLay(this.img)
                  var bd = new T.LngLatBounds(
                          new T.LngLat(parm2,parm3),
                          new T.LngLat(parm4,parm1));
                  this.img = new T.ImageOverlay(url, bd);
                  this.map.addOverLay(this.img);
                },
                // 封装获取分钟和秒数的函数
                bindEvents : function () {
                  // 初始化数据
                  var _this=this;
                  var i=0;
                  var dataLength;
                  $('#close').on('click' , function () {
                    $('#middleMask').hide();
                  });
                  var newimages=[];
                  var dataArr;
                  //获取请求数据
                  $.ajax({  
                        type:'get',  
                        url : 'http://api.tianqi.cn:8070/v1/img.py',
                        success  : function(data) {  
                          dataArr=data.radar_img;
                          dataLength=dataArr.length;
                          for (var j=0; j<dataLength; j++){
                              newimages[j]=new Image()
                              newimages[j].src=dataArr[j][0]
                          }
                          var last = dataArr.length-1;
                          _this.reLoad(dataArr[ last ][0], dataArr[last][2][0], dataArr[last][2][1], dataArr[last][2][2], dataArr[last][2][3]);
                          var currentTime=_this.getMinutesAndSeconds(dataArr[last][1]);
                          $("#currentTime").text(currentTime.t1);
                          $(".titleTip").html(currentTime.t2).show();
                          $("#jindu").css('width',(dataLength/dataLength)*$(".allTime").width());
                          $("#moveRoll").css('left',(dataLength/dataLength)*$(".allTime").width());
                        }
                  })

                  // 播放暂停的切换
                  $("#togglePlay").on('click',function () {
                    $('.rainLevel').show();
                    $('#middleMask').hide();
                    if ($(this).hasClass("play")) {
                        $(this).removeClass("play").addClass("pause")
                        clearInterval(setId)
                    }else{
                      $(this).removeClass("pause").addClass("play")
                        setId = setInterval(function () {
                          if ($('#togglePlay').hasClass("pause")) {
                                clearInterval(setId)
                          }else{
                            if (i == dataLength) {
                              clearInterval(setId)
                              $("#togglePlay").removeClass("play").addClass("pause")
                              i=0
                            }else{
                              _this.reLoad(dataArr[i][0], dataArr[i][2][0], dataArr[i][2][1], dataArr[i][2][2], dataArr[i][2][3]);
                              
                              var currentTime=_this.getMinutesAndSeconds(dataArr[i][1]).t1;
                              $("#currentTime").text(currentTime);
                              i++;
                              $("#jindu").css('width',(i/dataLength)*$(".allTime").width());
                              $("#moveRoll").css('left',(i/dataLength)*$(".allTime").width());
                            }
                          }
                        },200)
                    }
                  });
                  // 进度条点击事件
                  // $("#allTime").on('click' , function (e) {
                  //   var mouseX=e.offsetX;
                  //   var movePercent=mouseX/$(this).width();
                  //    $("#jindu").css('width',mouseX);
                  //    $("#moveRoll").css('left',mouseX);
                  //    i = Math.ceil(movePercent*dataLength);
                  // })
                },
                // 获取分秒的方法
                getMinutesAndSeconds : function (time) {
                  //补零
                  function addZero(n){return n<10?'0'+n:n;}
                  var oDate = new Date(time*1000);
                  var h = addZero( oDate.getHours() );//时
                  var m = addZero( oDate.getMinutes() ); //分
                  var s = addZero( oDate.getSeconds() ); //秒
                  return {
                    "t1":h+":"+m,
                    "t2":oDate.getFullYear()+'-'+oDate.getMonth()+'-'+oDate.getDate()+' '+h+':'+m+' 更新'
                  };
                },
                // 注册地图点击事件
                addMapClick : function () { 
                  this.map.off("click",this.MapClick.bind(this));
                  this.map.on("click",this.MapClick.bind(this)); 
                },
                MapClick : function (e) {
                	$('#map_container').hide()
                  if( $('.pen').hasClass('act') || $('#radarStand').hasClass('act') ){return};
                  $('.rainLevel').hide();
                  var clickLocation=e.lnglat.getLng()+","+e.lnglat.getLat(); 
                  this.m_img.setLngLat (new T.LngLat(e.lnglat.getLng(), e.lnglat.getLat()))
                  this.m_img.setOpacity(1);
                  var clickUrl="http://api.caiyunapp.com/v2/HyTVV5YAkoxlQ3Zd/"+clickLocation+"/forecast";
                  $.ajax({  
                    type:'get',  
                    url : clickUrl,
                    dataType : 'jsonp',
                    success : function(data) {
                      var time=function () {
                        var oDate = new Date();
                        var minute=oDate.getMinutes(); //分
                        minute=minute>=10?minute:"0"+minute;
                        var hours=oDate.getHours(); //时
                        hours=hours>=10?hours:"0"+hours;
                        return hours+":"+minute;
                      }();
                      $("#infoTime").text(time + ' 更新');
                      var result=data.result;
                      $("#futrueWeatherInfo").text(result.hourly.description);
                      $("#chartTitle").text(result.minutely.description.replace('小彩云',''));
                      $('.chartTxt p').each(function(i,item){
                        var n = result.minutely.description.indexOf('雨');
                        var txt ;
                        if( n == -1 ){
                          txt = '雪';
                        }else{
                          txt = '雨';
                        }
                        if(i == 0){
                          $(this).html('大'+txt);
                        }else if(i ==1 ){
                          $(this).html('中'+txt);
                        }else{
                          $(this).html('小'+txt);
                        }
                        $('.chartIcon div').eq(i).css({
                          'background':'url("img/minuteRain/'+ $(this).text() +'.png") no-repeat center center',
                          'backgroundSize':'100%'
                        })
                        
                      })
                    
                      var arr = result.minutely.precipitation_2h;
                      var rainData = [];
                      rainData.push(arr[0]);
                      for (var i = 0; i < arr.length; i++) {
                        if( i%10 == 0 ){
                          rainData.push( arr[i] );
                        }
                      }
                      initChart( rainData );

                      //展示弹出层
                      $('#middleMask').show();
                      $('.content').show();
                    },  
                    error : function() {  
                        alert('fail');  
                    }
                  }); 
                  var geocode = new T.Geocoder();
                  geocode.getLocation(e.lnglat,searchResult);
                  function searchResult(result){
                    var name = '获取地理名字失败';
                    if(result.addressComponent && result.addressComponent.city){
                      name = result.addressComponent.city;
                    }
                    $('.infoNational').html( name );
                  }
                  function initChart(data){

                    var myChart = echarts.init(document.getElementById('main'));
                    var option = {
                        backgroundColor: 'transparent',
                        title: {
                            textStyle: {
                                fontWeight: 'normal',
                                fontSize: 16,
                                color: '#F1F1F3'
                            },
                            left: '6%'
                        },
                        // tooltip: {
                        //     trigger: 'axis',
                        //     axisPointer: {
                        //         lineStyle: {
                        //             color: '#57617B'
                        //         }
                        //     }
                        // },
                        legend: {
                            icon: 'rect',
                            itemWidth: 14,
                            itemHeight: 5,
                            itemGap: 13,
                            right: '4%',
                            textStyle: {
                                fontSize: 12,
                                color: '#F1F1F3'
                            }
                        },
                        grid: {
                            left: '3%',
                            right: '10%',
                            bottom: '3%',
                            containLabel: true
                        },
                        xAxis: [{
                            name:'(分钟)',
                            type: 'category',
                            boundaryGap: false,
                            splitLine:false,
                            axisLine: {
                                lineStyle: {
                                    color: '#C1C2C2'
                                }
                            },
                            axisTick: {
                                show: false
                            },
                            data: ['', '10', '20', '30', '40', '50', '60', '10', '20', '30', '40', '50','120']
                        }],
                        yAxis: [{
                            type: 'value',
                            name: '',
                            min:0.05,
                            max:0.35,
                            axisTick: {
                                show: false
                            },
                            axisLine: {
                                lineStyle: {
                                    color: '#fff'
                                }
                            },
                            axisLabel: {
                                show:false,
                                margin: 10,
                                textStyle: {
                                    fontSize: 14
                                }
                            },
                            silent:true,
                            splitNumber : 2,
                            splitLine: {
                                lineStyle: {
                                    color: ['transparent','#252F39','#252F39']
                                }
                            }
                        }],
                        series: [{
                            name: '',
                            type: 'line',
                            smooth: true,
                            symbol: 'circle',
                            symbolSize: 5,
                            showSymbol: false,
                            lineStyle: {
                                normal: {
                                    width: 1
                                }
                            },
                            areaStyle: {
                                normal: {
                                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                                        offset: 0,
                                        color: 'rgba(0,255,255, 1)'
                                    }, {
                                        offset: 0.8,
                                        color: 'rgba(0,0,0, 0)'
                                    }], false),
                                    shadowColor: 'rgba(0, 0, 0, 0.1)',
                                    shadowBlur: 5
                                }
                            },
                            itemStyle: {
                                normal: {
                                    color: 'rgb(14,162,164)',
                                    borderColor: 'rgba(14,162,164,0.27)',
                                    borderWidth: 12

                                }
                            },
                            data:data
                        }]
                      };

                     myChart.setOption( option ); 
                  }      
                  return false;
                },
              } 

              var minuteLevelRain=new MinuteLevelRain();
            }()
            return false;

})
$(function () {
	// 隐藏雷达
	$('#radarStand').hide()
	// 图例样式调整
	$('.rainLevel').css({
		'width':'393px',
		'height': '44px'
	})
	$('[data-sid="656"]').click(function(){
		$('.content.nav_animate').hide()
		$('.minute_rain').show()
		$('.nav_title h1').html('分钟级降水')
	})
	if ($('[data-sid="656"]').hasClass('on')) {
		$('.content.nav_animate').hide()
		$('.minute_rain').show()
		$('.nav_title h1').html('分钟级降水')
	}else{
		$('.content.nav_animate').show()
		$('.minute_rain').hide()
		$('.nav_title h1').html('市县预报')
	}
	$('[data-sid="655"]').click(function(){
		$('.content.nav_animate').show()
		$('.minute_rain').hide()
        $('#map_container').show()
		$('.nav_title h1').html('市县预报')
	})
	$('.loading').remove()
})
