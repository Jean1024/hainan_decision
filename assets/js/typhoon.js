var win = nwDispatcher.requireNwGui().Window.get();
// win.showDevTools();
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
$(function(){
	//地图
	var map; 
    var zoom = 8; 
    //初始化地图对象 
	map = new T.Map("map"); 
	//设置显示地图的中心点和级别 
	map.centerAndZoom(new T.LngLat(109.2, 18.9), zoom); 
	//允许鼠标滚轮缩放地图 
	map.enableScrollWheelZoom();


	//监听缩放拖拽状态
	map.addEventListener("movestart",hideTip);

	map.setMinZoom(4);
    map.setMaxZoom(12);
    var imageURL = "https://wprd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&style=7&x={x}&y={y}&z={z}";
    // var imageURL = "http://t0.tianditu.cn/img_w/wmts?lang=zh_cn&size=1&style=7&x={x}&y={y}&z={z}" +
    // "SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles" +
    // "&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}";

    //创建自定义图层对象
	var lay = new T.TileLayer(imageURL,{minZoom:4,maxZoom:12}); 
	//将图层增加到地图上 
	map.addLayer(lay); 
	$('.loading_tip').fadeOut();

	var endYear = ( new Date() ).getFullYear() + 1;
	for (var i = 2000 ; i < endYear; i++) {// i 开始的年份
		var bClassName = false;
		if( i == (endYear-1) ){
			bClassName = true;
		}
		$('#wrapper ul').prepend('<li class="'+ (bClassName?'menuAct':'') +'">'+ i +'</li>');
	}
	getTypgoonName( $('#wrapper ul li.menuAct').text() );
	//年份滚动条
	var myScroll = new IScroll('#wrapper', {
		scrollX: false,
		scrollY:true,
		scrollbars: false,
		mouseWheel: true,
		interactiveScrollbars: true,
		shrinkScrollbars: 'scale',
		fadeScrollbars: true
	});
	// new iScroll("picFlip2",{"onScrollMove":function(){},"onScrollEnd":function(){return false;}});
	//台风滚动条
	var myScroll2 = new IScroll('#wrapper2', {
		scrollX: false,
		scrollY:true,
		scrollbars: true,
		mouseWheel: true,
		interactiveScrollbars: true,
		shrinkScrollbars: 'scale',
		fadeScrollbars: false,
		checkDOMChanges: true
	});
	function tranTime (str){
		return str.substring(4,6) + '月' + str.substring(6,8)+'日'+str.substring(8,10)+'时';
	}
	//时间处理: 2016020311500 > return 2016-02-03 || 2016年02月03日05时
	function _tranDate (data){
		var obj ;
		if(typeof data === 'string'){
			obj = data.substring(0,4) + '年' + data.substring(4,6) + '月' + data.substring(6,8)+'日'+data.substring(8,10)+'时';
		}else if( typeof data === 'object' ){
			var time = data[8][0][1];
			var obj = {};
			obj.sDay = time.substring(0,4) + '-' + time.substring(4,6) + '-' + time.substring(6,8);
			obj.time = time.substring(4,6) + '月' + time.substring(6,8) + '日' + time.substring(8,10) + '时';
			obj.name = data[2] + ' ' + data[1];
		}
		return obj;
	}
	//判断台风类型
	function _typhoonType(type){
		var obj = {};
		obj.photoSrc = 'img/tflj/tf_';
		obj.lineStyle = 'solid';
		obj.isTrue = false ;
		switch(type){
			case 'TD' :
				obj.photoSrc += 'rddy.png';
				break;
			case 'TS' :
				obj.photoSrc += 'rdfb.png';
				break;
			case 'STS' :
				obj.photoSrc += 'qrdfb.png';
				break;
			case 'TY' :
				obj.photoSrc += 'tf.png';
				break;
			case 'STY' :
				obj.photoSrc += 'qtf.png';
				break;
			case 'SuperTY' :
				obj.photoSrc += 'cqtf.png';
				break;
			default :
				obj.photoSrc += 'default.png';
				obj.lineStyle = 'dashed';
				obj.isTrue = true ;
				break;
		}
		return obj;
	}
	//24h  48h警戒线
	function _drawWarningLines(){
		var cssOption = {
				    		'border':'none',
				    		'backgroundColor':'none',
				    		'boxShadow':'none',
				    		'width':'0.6rem',
				    		'whiteSpace':'normal'
				    	};
		var pion24 = [];
		pion24.push( new T.LngLat(126.993568,34.005024) );
		pion24.push( new T.LngLat(126.993568,21.971252) );
		pion24.push( new T.LngLat(118.995521,17.965860) );
		pion24.push( new T.LngLat(118.995521,10.971050) );
		pion24.push( new T.LngLat(113.018959,4.486270) );
		pion24.push( new T.LngLat(104.998939,-0.035506) );
    	var line24 = new T.Polyline( pion24 , {
						            		color: 'red',
						            		weight: 2,
						            		lineStyle: 'solid'
							               });
    	var label24 = new T.Label({
								text: '24小时警戒线',
								position: pion24[0] ,
								offset: new T.Point(0, 0)
							});
    	label24.setBackgroundColor('rgba(0,0,0,0)');
    	label24.setFontColor('red');
    	label24.setBorderLine( 0 );
    	$(label24.Iw).css(cssOption);

		map.addOverLay( line24 );
		map.addOverLay( label24 );

		var pion48 = [];
		pion48.push( new T.LngLat(131.981361,33.959474) );
		pion48.push( new T.LngLat(131.981361,14.968860) );
		pion48.push( new T.LngLat(119.962318,-0.035506) );
		pion48.push( new T.LngLat(104.998939,-0.035506) );
		var line48 = new T.Polyline( pion48 , {
						            		color: 'green',
						            		weight: 2,
						            		lineStyle: 'dashed'
							               });
		var label48 = new T.Label({
								text: '48小时警戒线',
								position: pion48[0] ,
								offset: new T.Point(0, 0)
							});
    	label48.setBackgroundColor('rgba(0,0,0,0)');
    	label48.setFontColor('green');
    	label48.setBorderLine( 0 );
    	$(label48.Iw).css(cssOption);
		map.addOverLay( line48 );
		map.addOverLay( label48 );
	}
	//判断台风未来移向；
	function testWind(string){
		if( string == 'no' || !string){return '无信息'};

		var aDirection = string.split('');
		var sDirection = '';

		for (var i = 0; i < aDirection.length; i++) {
			_transDirection( aDirection[i] )
		}

		function _transDirection( s ){
			switch(s){
				case 'N':
					sDirection += '北';
					break;
				case 'S':
					sDirection += '南';
					break;
				case 'W':
					sDirection += '西';
					break;
				case 'E':
					sDirection += '东';
					break;
				default:
					sDirection += '';
					break;
			}
		}

		return sDirection

	}
	var oTime = {};
	var oMarkers = {};
	var oLine = {};
	var aLunar = [];//风圈；
	var oMaxWindSpeed = {}; //风速
	function getTypgoonName(year){
		if( !year )return;
		$('.loading_tip').show();
		if( oTime ){
			for( var key in oTime ){
				clearInterval( oTime[ key ] );
			}
		}
		var url = 'http://scapi.weather.com.cn/weather/typhoon?';
		url += 'year=list_' + year + '&test=ncg';
		$.get( url , function(result){
			
			$('.loading_tip').fadeOut();
			$('#wrapper2 ul').html('');
			map.clearOverLays();
			//警戒线
			_drawWarningLines();
			if( result !== '' ){
				var aData = JSON.parse( result.substring( result.indexOf('(')+1 , result.lastIndexOf(')') ) ).typhoonList;

				var LEN = aData.length;
				for (var i = 0; i < LEN; i++) {
					// if( aData[i][2] ) {
						var bStop = false;
						if( aData[i][7] === "start" ){
							bStop = true;
						}
						var tf_number = tfNumber( aData[i][4] );
						var tf_N = tf_number?'('+tf_number+')':'';
						$('#wrapper2 ul').append(
							'<li typhoon_id="'+ aData[i][0] +'">'
				            +'<span class="fl '+ (bStop?'menuAct':'') +'"></span>'
				            +'<b class="fl">'+ (aData[i][2]?aData[i][2]:'') + ' ' + transName(aData[i][1]) + ' ' + tf_N +'</b>'
				          +'</li>'
						)
						if(bStop){
							addTyphoon(aData[i][0]);
							// $('.content>h2').html( '当前受'+ aData[i][2] +'台风影响' ).show();
						}else{
							if( (endYear-1) == year){
								$('.content>h2').html( '当前无台风影响' ).show();
							}
						}
					// };
				}
				$('#wrapper2 ul').stop().animate({'width':'14rem'});
				
				
				$('#wrapper2 ul li').on(clickEvent,function(){
					var num = $(this).attr('typhoon_id');
					var ID = 'id_' + num;
					
					if( $(this).children('span').hasClass('menuAct') ){ //取消该台风
						$(this).children('span').removeClass('menuAct')

						var marklength = oMarkers[ID].length;
						for (var i = 0; i < marklength; i++) {

							map.removeOverLay( oMarkers[ID][i] );

							if(typeof oLine[ID][i] !== 'undefined'){
								map.removeOverLay( oLine[ID][i] );
							}
						}

						hideTip();
						clearInterval( oTime[ID] );

						if( aLunar.length ){
							for (var i = 0; i < aLunar.length; i++) {
								map.removeOverLay( aLunar[i] );
							}
							aLunar = [];
						}
						toggle_menu()
					}else{//添加台风
						$('.loading_tip').show();
						$(this).children('span').addClass('menuAct')
						addTyphoon(num);
						console.log(111)
						toggle_menu()
						console.log(222)
					}
					return false;
				})
				function addTyphoon(num){
					var ID = 'id_' + num;
					var url2 = 'http://scapi.weather.com.cn/weather/typhoon?';
					url2 += 'view=view_' + num + '&test=ncg';
					$.get( url2 , function(result){

						$('.loading_tip').hide();
						var aData = JSON.parse( result.substring( result.indexOf('(')+1 , result.lastIndexOf(')') ) ).typhoon;
						var oDay = _tranDate( aData );//台风开始时间
						var allPionts = aData[8];
							
						var forecastPiont = [];//预测点
						for (var i = 0; i < allPionts.length; i++) {
							if( allPionts[i][11] ){
								forecastPiont = allPionts[i][11].BABJ;
							}
						}

						var aMarker = [], //所有标记点
		            	    aLine = [],//两点划线用 
		            		aLinePionts = [], //所有线的点
		            		aMaxWindSpeed = [], //所有点的风速
		            		aLastPiont = [], //定旋转团点
		            		aLastTime = [];//台风最后时间

						$('.content>h2').html( oDay.name + '（第' + aData[3] +'号台风）' ).show();

						var latlng = new T.LngLat( allPionts[0][4] , allPionts[0][5]);
			            var infoWin = new T.InfoWindow();
				            infoWin.setLngLat(latlng);
				            //设置信息窗口要显示的内容
				            infoWin.setContent( aData[2] + ' ' + aData[1] );
				            //向地图上添加信息窗口
				            aLinePionts.push(infoWin);
				            map.addOverLay(infoWin);


						var aPionts = []; //点的经纬度
						var LENG = allPionts.length;
						for (var i = 0; i < LENG; i++) {
							var obj = {};
							obj.lng = allPionts[i][4];
							obj.lat = allPionts[i][5];
							aPionts.push(obj);
							aMaxWindSpeed.push( [ allPionts[i][9], allPionts[i][1] ] );

						}
						oMaxWindSpeed[ID] = aMaxWindSpeed;
						//设置地图中心点
						map.centerAndZoom(new T.LngLat( aPionts[ parseInt(LENG/2) ].lng , aPionts[ parseInt(LENG/2) ].lat ), zoom);

		            	var iNow = 0 , index = null;
		            	var timer = setInterval(function(){
		            					var pion = new T.LngLat( aPionts[ iNow ].lng , aPionts[ iNow ].lat );
					            		var iconObj = _typhoonType( allPionts[ iNow ][3] );
					            		var icon = new T.Icon({
							                iconUrl: iconObj.photoSrc,
							                iconSize: new T.Point(10, 10)
							            });

					            		if( iconObj.isTrue ){
					            			aLastPiont.push( new T.LngLat( aPionts[ iNow-1 ].lng , aPionts[ iNow-1 ].lat ) )
					            			aLastTime.push( _tranDate( allPionts[ iNow-1 ][1] ) );
					            			iconObj.isTrue = false;
					            		}

						            	var marker = new T.Marker( pion , {icon: icon});

						            	!function(index){
						            		
						            		marker.addEventListener('click', function(){
						            			var aPiont = allPionts[ index ];

						            			var _thisPiont = new T.LngLat( aPiont[4] , aPiont[5] );
												$('.masg-text').html('');
												$('.masg-text').append('<p>'+ aData[2] + ' ' + aData[1] +'</p>')
														  	   .append('<p class="color">'+ _tranDate( aPiont[1] ) +'</p>')
														       .append('<p>中心气压：'+ aPiont[6] +'百帕</p>')
														  	   .append('<p>最大风速：'+ aPiont[7] +'米/秒</p>')
														  	   .append('<p>未来移向：'+ testWind( aPiont[8] ) +'</p>');

												if( aPiont[10].length ){//有风圈信息

													if( aLunar.length ){
														for (var i = 0; i < aLunar.length; i++) {
															map.removeOverLay( aLunar[i] );
														}
														aLunar = [];
													}
													$('.masg-text').append('<p>7级风圈半径：'+ aPiont[10][0][1] +'</p>')
													var icon7 = new T.Icon({
											                iconUrl: 'img/tflj/fq_7j.png',
											                iconSize: new T.Point(40, 40)
											            });
													var marker7 = new T.Marker( _thisPiont , { icon: icon7 });
													aLunar.push(marker7);
													map.addOverLay(marker7);

													if( aPiont[10][1] ){
														$('.masg-text').append('<p>10级风圈半径：'+ aPiont[10][1][1] +'</p>')
														var icon10 = new T.Icon({
											                iconUrl: 'img/tflj/fq_10j.png',
											                iconSize: new T.Point(60, 60)
											            });
											            var marker10 = new T.Marker( _thisPiont , { icon: icon10 });
											            aLunar.push(marker10);
											            map.addOverLay(marker10);
													}
												}
												var oPixelPoint = map.lngLatToContainerPoint( { lng:aPiont[4],lat:aPiont[5]} );
												$('.masg').css({
													"left": oPixelPoint.x + 'px',
													"top": oPixelPoint.y + 'px'
												}).show()

												return false
						            		});
						            	}(iNow)
						            	
						            	aMarker.push(marker);
						            	map.addOverLay(marker);
						            	oMarkers[ID] = aMarker;

						            	if(aLine.length >= 2){aLine.shift()}
					            		aLine.push( pion );
						            	var line = new T.Polyline( aLine , {
														            		color: 'red',
														            		weight: 2,
														            		lineStyle: iconObj.lineStyle
															               });
										map.addOverLay(line);
										aLinePionts.push(line)
										oLine[ID] = aLinePionts;

										iNow ++ ;
										if( iNow == aPionts.length ){
											clearInterval(timer)
											var label = new T.Label({
                														// text: aData[2] + '（' + ( aLastTime[0] ? aLastTime[0] : _tranDate(allPionts[ iNow-1 ][1]) ) +'）',
                														text: '最新位置：' + ( aLastTime[0] ? aLastTime[0] : tranTime(allPionts[ iNow-1 ][1]) )+'<div class="trigon"></div>',
                														position: aLastPiont[0]?aLastPiont[0]:pion ,
                														offset: new T.Point(-sourceSize*10, 0)
    																});
											label.addEventListener('click',function(){
												$('#curve').stop().show().animate({
													'right':'18.5rem'
												})
												initEcharts( oMaxWindSpeed[ID] , oDay );

												return false;
											})
											
	            							//创建地图文本对象
	            							map.addOverLay(label);
	            							aMarker.push(label);

											var icon = new T.Icon({
												                iconUrl: 'img/tflj/台风.png',
												                iconSize: new T.Point(26, 30)
												            });
							            	var marker = new T.Marker( aLastPiont[0]?aLastPiont[0]:pion , {icon: icon , zIndexOffset:-500});
							            	aMarker.push(marker);
							            	oMarkers[ID] = aMarker;
							            	map.addOverLay(marker);

											$('img[src="img/tflj/台风.png"]').css({
												"transformOrigin": '13px 15px 0',
											})

											// 旋转点
											var n = 0;
							            	setTimeout(function() {
												var timer2 = setInterval(function(){
							            			var transfrom = $(marker.Ir).get(0).style.transform;
													n -= 2 ;
													if( n <= -20 ){ n = -30 };
													$(marker.Ir).css('transform','');
													$(marker.Ir).css('transform',transfrom + ' rotate('+ n +'deg)');
												},60)
												oTime[ID] = timer2;
											},200);

											//预测点
							            	
								            var for_aline = [];
								            for_aline.push(aLastPiont[0]?aLastPiont[0]:pion);

								            var for_iNow = 0;
							            	var forecastTimer = setInterval(function(){
							            		var for_pion = new T.LngLat( forecastPiont[ for_iNow ][2] , forecastPiont[ for_iNow ][3] );
							            		var iconObj = _typhoonType( forecastPiont[ for_iNow ][7] );
							            		var forecast_icon = new T.Icon({
									                iconUrl: iconObj.photoSrc,
									                iconSize: new T.Point(10, 10)
									            });
							            		var for_marker = new T.Marker( for_pion , {icon: forecast_icon});
							            		
							            		!function(arr){
							            			for_marker.addEventListener('click',function(){
														$('.masg-text').html('');
														$('.masg-text').append('<p>'+ aData[2] + ' ' + aData[1] +'</p>')
																  	   .append('<p class="color">'+ _tranDate( arr[1] ) +'</p>')
																       .append('<p>中心气压：'+ arr[4] +'百帕</p>')
																  	   .append('<p>最大风速：'+ arr[5] +'米/秒</p>')
																  	   .append('<p>未来移向：'+ testWind( arr[7] ) +'</p>');

							            				var oPixelPoint = map.lngLatToContainerPoint( { lng:arr[2],lat:arr[3]} );
														$('.masg').css({
															"left": oPixelPoint.x + 'px',
															"top": oPixelPoint.y + 'px'
														}).show()

														return false;
							            			})
							            		}(forecastPiont[ for_iNow ])

							            		var for_lable = new T.Label({
                														text: '<div>'+tranTime( forecastPiont[ for_iNow ][1] )+'</div>' ,
                														position: for_pion ,
                														offset: new T.Point(-5, 0)
    																});
							            		// for_lable.setBackgroundColor('rgba(0,0,0,0)');
										    	// for_lable.setFontColor('green');
										    	// for_lable.setBorderLine( 0 );
										    	// $(for_lable.Iw).css({
										    		// 'boxShadow':'none',
										    	// });

							            		map.addOverLay(for_lable);
							            		map.addOverLay(for_marker);
							            		
							            		aMarker.push(for_lable);
							            		aMarker.push(for_marker);
							            		oMarkers[ID] = aMarker;
						            			

						            			for_aline.push( for_pion );
								            	var for_line = new T.Polyline( for_aline , {
																            		color: 'red',
																            		weight:2,
																            		lineStyle: 'dashed'
																	               });
												map.addOverLay(for_line);
												aLinePionts.push(for_line)
												oLine[ID] = aLinePionts;
												for_aline.shift();

							            		for_iNow ++ ;
							            		if( for_iNow == forecastPiont.length ){
							            			clearInterval(forecastTimer);
							            		}

							            	},300 / forecastPiont)
										}
					            	}, ( 300 / aPionts.length ) )
									
					})
				}
				myScroll2.refresh()
				myScroll2.scrollTo(0,0);
			}
		})
		//台风站号筛选
		function tfNumber(str){
			var station = str?str:'';
			var n;
			if( station && parseInt(station)<100000 ){
				return station;
			}
			return ''
		}
		//台风名字替换
		function transName(str){
			if( str.indexOf('nameless') != -1){
				return 'nameless'
			}
			return str;
		}
	}
	//菜单效果
	$('.menu').on(clickEvent,function(){
		if( $(this).hasClass('act') ){
			//菜单收回
			$('#wrapper2 ul').stop().animate({'width':'0'},function(){
				$('#wrapper ul').stop().animate({'width':'0'});
			});
			$(this).removeClass('act');
		}else{
			//菜单展开
			$('#wrapper ul').stop().animate({'width':'5rem'},function(){
				// getTypgoonName( $('#wrapper ul li.menuAct').text() );
				$('#wrapper2 ul').stop().animate({'width':'14rem'});
			});

			if( !$('#wrapper ul li').hasClass('menuAct') ){
				$('#wrapper ul li').eq(0).addClass('menuAct');
				hideTip()
				getTypgoonName( $('#wrapper ul li').eq(0).text() );
			}

			$(this).addClass('act');
		}

		return false;
	})

	//选择年份
	$('#wrapper ul li').on(clickEvent,function(){
		$('#wrapper ul li').removeClass('menuAct');
		$(this).addClass('menuAct');
		$('.content>h2').hide();
		hideTip();
		getTypgoonName( $(this).text() );
	})
    //隐藏弹出框
    function hideTip(){
    	$('.masg').hide();
		$('#curve').hide().css({
								'right':'-61rem'
							})
    }
	//初始化列表
	function initEcharts(arr,oDay){
		var len = arr.length;
		var xData = [];
		var yData = [];
		for (var i = 0; i < len; i++) {
			yData.push(arr[i][0]);
			xData.push( tranTime(arr[i][1]) );
		}
		var option = {
			    title: {
			        text: oDay.name,
			        left:'center',
			        textStyle: {
			        	color: '#fff'
			        }
			    },
			    grid: {
			        left: '3%',
			        right: '4%',
			        bottom: '3%',
			        containLabel: true
			    },
			    xAxis :[{
			            type : 'category',
			            boundaryGap : false,
			            data : xData,
			            axisLine:{
				    		lineStyle:{//x轴颜色
				    			color:'#fff'
				    		}
				    	},
			        }],
			    yAxis :[{
			    		name: '(m/s)',
			            type : 'value',
			            axisLine:{
				    		lineStyle:{//x轴颜色
				    			color:'#fff'
				    		}
				    	},
				    	axisLabel:{
				    		formatter: function (value, index) {
				    			var arr = ['热带低压 11','热带风暴 25','强热带风暴 33','台风 42','强台风 51','超强台风 >51'];
				    			return arr[index]
							}
				    	}
			        }],
			    series : [
			        {
			            name:'',
			            type:'line',
			            stack: '',
			            smooth:true,
			            areaStyle: {normal: {
			            	color : new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
							  offset: 0, color: 'rgba(215,15,93,1)' // 0% 处的颜色
							}, {
							  offset: 1, color: 'rgba(215,214,48,1)' // 100% 处的颜色
							}], false)
			            }},
			            itemStyle: {normal : {
			            	borderColor: '#fff'
			            }},
			            lineStyle: {normal:{
			            	opacity : 0
			            }},
			            data:yData
			        }
			    ]
			};
		var myChart = echarts.init( $('#curveCont').get(0) );
		myChart.setOption(option);
	}
})

function toggle_menu() {
		
		if( $('.menu').hasClass('act') ){
			//菜单收回
			$('#wrapper2 ul').stop().animate({'width':'0'},function(){
				$('#wrapper ul').stop().animate({'width':'0'});
			});
			$('.menu').removeClass('act');
		}else{
			//菜单展开
			$('#wrapper ul').stop().animate({'width':'5rem'},function(){
				// getTypgoonName( $('#wrapper ul li.menuAct').text() );
				$('#wrapper2 ul').stop().animate({'width':'14rem'});
			});

			if( !$('#wrapper ul li').hasClass('menuAct') ){
				$('#wrapper ul li').eq(0).addClass('menuAct');
				hideTip()
				getTypgoonName( $('#wrapper ul li').eq(0).text() );
			}

			$('.menu').addClass('act');
		}

		return false;
}
