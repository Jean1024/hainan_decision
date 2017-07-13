  var leafletMap
$(function () {
  var zoom = 5
  leafletMap = L.map('map',{
      worldCopyJump: true,
      center: [36, 114],
      zoom: 5,
      minZoom: 3,
      maxZoom: 17
  });

  var yy = L.tileLayer('https://api.mapbox.com/styles/v1/tonnyzhang/ciswmqjmc00392wo0b8aqhenz/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoidG9ubnl6aGFuZyIsImEiOiI2NmJhMzA0NmFlNmQ4ODZhNjU4MGI1NjRlYWVlZTMyMyJ9.cPEAjBxm7y0auxAuINcPLw').addTo(leafletMap);
  $('.loading_tip').fadeOut();
  var endYear = (new Date()).getFullYear() + 1;
  for (var i = 2000; i < endYear; i++) { // i 开始的年份
    var bClassName = false;
    if (i == (endYear - 1)) {
      bClassName = true;
    }
    $('#wrapper ul').prepend('<li class="' + (bClassName ? 'menuAct' : '') + '">' + i + '</li>');
  }
  getTypgoonName($('#wrapper ul li.menuAct').text());
  //年份滚动条
  var myScroll = new IScroll('#wrapper', {
    scrollX: false,
    scrollY: true,
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
    scrollY: true,
    scrollbars: true,
    mouseWheel: true,
    interactiveScrollbars: true,
    shrinkScrollbars: 'scale',
    fadeScrollbars: false,
    checkDOMChanges: true
  });

  function tranTime(str) {
    return str.substring(4, 6) + '月' + str.substring(6, 8) + '日' + str.substring(8, 10) + '时';
  }
  //时间处理: 2016020311500 > return 2016-02-03 || 2016年02月03日05时
  function _tranDate(data) {
    var obj;
    if (typeof data === 'string') {
      obj = data.substring(0, 4) + '年' + data.substring(4, 6) + '月' + data.substring(6, 8) + '日' + data.substring(8, 10) + '时';
    } else if (typeof data === 'object') {
      var time = data[8][0][1];
      var obj = {};
      obj.sDay = time.substring(0, 4) + '-' + time.substring(4, 6) + '-' + time.substring(6, 8);
      obj.time = time.substring(4, 6) + '月' + time.substring(6, 8) + '日' + time.substring(8, 10) + '时';
      obj.name = data[2] + ' ' + data[1];
    }
    return obj;
  }
  //判断台风类型
  function _typhoonType(type) {
    var obj = {};
    obj.photoSrc = 'img/tflj/tf_';
    obj.lineStyle = 'solid';
    obj.isTrue = false;
    switch (type) {
      case 'TD':
        obj.photoSrc += 'rddy.png';
        break;
      case 'TS':
        obj.photoSrc += 'rdfb.png';
        break;
      case 'STS':
        obj.photoSrc += 'qrdfb.png';
        break;
      case 'TY':
        obj.photoSrc += 'tf.png';
        break;
      case 'STY':
        obj.photoSrc += 'qtf.png';
        break;
      case 'SuperTY':
        obj.photoSrc += 'cqtf.png';
        break;
      default:
        obj.photoSrc += 'default.png';
        obj.lineStyle = 'dashed';
        obj.isTrue = true;
        break;
    }
    return obj;
  }
  //24h  48h警戒线
  function _drawWarningLines() {
    var cssOption = {
      'border': 'none',
      'backgroundColor': 'none',
      'boxShadow': 'none',
      'width': '0.6rem',
      'whiteSpace': 'normal'
    };
    var pion24 = [];
    pion24.push([34.005024, 126.993568]);
    pion24.push([21.971252, 126.993568]);
    pion24.push([17.965860, 118.995521]);
    pion24.push([10.971050, 118.995521]);
    pion24.push([4.486270, 113.018959]);
    pion24.push([-0.035506, 104.998939]);
    L.polyline(pion24, {
      color: 'red',
      weight: 2,
      lineStyle: 'solid'
    }).addTo(leafletMap);
    L.marker([34.005024, 126.993568], {
        // icon:myIcon
        opacity: 0
      }).addTo(leafletMap)
      // 设置label
      .bindTooltip("24小时警戒线", {
        permanent: true,
        offset: [-20, 68], // 偏移
        direction: "right", // 放置位置
        // sticky:true,//是否标记在点上面
        className: 'anim-tooltip24', // CSS控制
      }).openTooltip();

    var pion48 = [];
    pion48.push([33.959474, 131.981361]);
    pion48.push([14.968860, 131.981361]);
    pion48.push([-0.035506, 119.962318]);
    pion48.push([-0.035506, 104.998939]);
    L.polyline(pion48, {
      color: 'green',
      weight: 2,
      lineStyle: 'dashed'
    }).addTo(leafletMap);
    L.marker([33.959474, 131.981361], {
        // icon:myIcon
        opacity: 0
      }).addTo(leafletMap)
      // 设置label
      .bindTooltip("48小时警戒线", {
        permanent: true,
        offset: [-20, 68], // 偏移
        direction: "right", // 放置位置
        // sticky:true,//是否标记在点上面
        className: 'anim-tooltip48', // CSS控制
      }).openTooltip();
  }
  //判断台风未来移向；
  function testWind(string) {
    if (string == 'no' || !string) {
      return '无信息' };

    var aDirection = string.split('');
    var sDirection = '';

    for (var i = 0; i < aDirection.length; i++) {
      _transDirection(aDirection[i])
    }

    function _transDirection(s) {
      switch (s) {
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
  var aLunar = []; //风圈；
  var oMaxWindSpeed = {}; //风速
  function getTypgoonName(year) {
    if (!year) return;
    $('.loading_tip').show();
    if (oTime) {
      for (var key in oTime) {
        clearInterval(oTime[key]);
      }
    }
    var url = 'http://scapi.weather.com.cn/weather/typhoon?';
    url += 'year=list_' + year + '&test=ncg';
    $.get(url, function (result) {

        $('.loading_tip').fadeOut();
        $('#wrapper2 ul').html('');
        leafletMap.eachLayer(function (layer) {
            if (layer._leaflet_id == 26 || layer._canvas ) {

            } else { leafletMap.removeLayer(layer); }
          })
          //警戒线
        _drawWarningLines();
        if (result !== '') {
          var aData = JSON.parse(result.substring(result.indexOf('(') + 1, result.lastIndexOf(')'))).typhoonList;

          var LEN = aData.length;
          for (var i = 0; i < LEN; i++) {
            // if( aData[i][2] ) {
            var bStop = false;
            if (aData[i][7] === "start") {
              bStop = true;
            }
            var tf_number = tfNumber(aData[i][4]);
            var tf_N = tf_number ? '(' + tf_number + ')' : '';
            $('#wrapper2 ul').append(
              '<li typhoon_id="' + aData[i][0] + '">' + '<span class="fl ' + (bStop ? 'menuAct' : '') + '"></span>' + '<b class="fl">' + (aData[i][2] ? aData[i][2] : '') + ' ' + transName(aData[i][1]) + ' ' + tf_N + '</b>' + '</li>'
            )
            if (bStop) {
              addTyphoon(aData[i][0]);
              // $('.content>h2').html( '当前受'+ aData[i][2] +'台风影响' ).show();
            } else {
              if ((endYear - 1) == year) {
                $('.content>h2').html('当前无台风影响').show();
              }
            }
            // };
          }
          $('#wrapper2 ul').stop().animate({ 'width': '14rem' });


          $('#wrapper2 ul li').on(clickEvent, function () {
            var num = $(this).attr('typhoon_id');
            var ID = 'id_' + num;

            if ($(this).children('span').hasClass('menuAct')) { //取消该台风
              $(this).children('span').removeClass('menuAct')

              var marklength = oMarkers[ID].length;
              for (var i = 0; i < marklength; i++) {

                leafletMap.removeLayer(oMarkers[ID][i]);

                if (typeof oLine[ID][i] !== 'undefined') {
                  leafletMap.removeLayer(oLine[ID][i]);
                }
              }

              hideTip();
              clearInterval(oTime[ID]);

              if (aLunar.length) {
                for (var i = 0; i < aLunar.length; i++) {
                  leafletMap.removeLayer(aLunar[i]);
                }
                aLunar = [];
              }
            } else { //添加台风
              $('.loading_tip').show();
              $(this).children('span').addClass('menuAct')
              addTyphoon(num);
            }
            return false;
          })

          function addTyphoon(num) {
            var ID = 'id_' + num;
            var url2 = 'http://scapi.weather.com.cn/weather/typhoon?';
            url2 += 'view=view_' + num + '&test=ncg';
            $.get(url2, function (result) {

              $('.loading_tip').hide();
              var aData = JSON.parse(result.substring(result.indexOf('(') + 1, result.lastIndexOf(')'))).typhoon;
              var oDay = _tranDate(aData); //台风开始时间
              var allPionts = aData[8];

              var forecastPiont = []; //预测点
              for (var i = 0; i < allPionts.length; i++) {
                if (allPionts[i][11]) {
                  forecastPiont = allPionts[i][11].BABJ;
                }
              }

              var aMarker = [], //所有标记点
                aLine = [], //两点划线用 
                aLinePionts = [], //所有线的点
                aMaxWindSpeed = [], //所有点的风速
                aLastPiont = [], //定旋转团点
                aLastTime = []; //台风最后时间

              $('.content>h2').html(oDay.name + '（第' + aData[3] + '号台风）').show();

              // var latlng = new T.LngLat( allPionts[0][4] , allPionts[0][5]);
              //          var infoWin = new T.InfoWindow();
              //           infoWin.setLngLat(latlng);
              //           //设置信息窗口要显示的内容
              //           infoWin.setContent( aData[2] + ' ' + aData[1] );
              //           //向地图上添加信息窗口
              //           aLinePionts.push(infoWin);
              //           map.addLayer(infoWin);
              var infoWin = L.marker([allPionts[0][5], allPionts[0][4]], {
                  // icon:myIcon
                  opacity: 0
                }).addTo(leafletMap)
                // 设置label
                .bindTooltip(aData[2] + ' ' + aData[1], {
                  permanent: true,
                  offset: [-15, 30], // 偏移
                  direction: "right", // 放置位置
                  // sticky:true,//是否标记在点上面
                  className: 'anim-tooltip', // CSS控制
                }).openTooltip();
              aLinePionts.push(infoWin);

              var aPionts = []; //点的经纬度
              var LENG = allPionts.length;
              for (var i = 0; i < LENG; i++) {
                var obj = {};
                obj.lng = allPionts[i][4];
                obj.lat = allPionts[i][5];
                aPionts.push(obj);
                aMaxWindSpeed.push([allPionts[i][9], allPionts[i][1]]);

              }
              oMaxWindSpeed[ID] = aMaxWindSpeed;
              //设置地图中心点
              leafletMap.setView([aPionts[parseInt(LENG / 2)].lat, aPionts[parseInt(LENG / 2)].lng], zoom);

              var iNow = 0,
                index = null;
              var timer = setInterval(function () {
                var pion = L.latLng(aPionts[iNow].lat, aPionts[iNow].lng);
                var iconObj = _typhoonType(allPionts[iNow][3]);
                var icon = L.icon({
                  iconUrl: iconObj.photoSrc,
                  iconSize: [10, 10]
                });
                if (iconObj.isTrue) {
                  aLastPiont.push([aPionts[iNow - 1].lat, aPionts[iNow - 1].lng])
                  aLastTime.push(_tranDate(allPionts[iNow - 1][1]));
                  iconObj.isTrue = false;
                }
                var marker = L.marker(pion, { icon: icon });

                ! function (index) {

                  marker.on('click', function () {
                    var aPiont = allPionts[index];

                    var _thisPiont = L.latLng(aPiont[5], aPiont[4]);
                    $('.masg-text').html('');
                    $('.masg-text').append('<p>' + aData[2] + ' ' + aData[1] + '</p>')
                      .append('<p class="color">' + _tranDate(aPiont[1]) + '</p>')
                      .append('<p>中心气压：' + aPiont[6] + '百帕</p>')
                      .append('<p>最大风速：' + aPiont[7] + '米/秒</p>')
                      .append('<p>未来移向：' + testWind(aPiont[8]) + '</p>');

                    if (aPiont[10].length) { //有风圈信息

                      if (aLunar.length) {
                        for (var i = 0; i < aLunar.length; i++) {
                          leafletMap.removeLayer(aLunar[i]);
                        }
                        aLunar = [];
                      }
                      $('.masg-text').append('<p>7级风圈半径：' + aPiont[10][0][1] + '</p>')
                      var icon7 = L.icon({
                        iconUrl: 'img/tflj/fq_7j.png',
                        iconSize: [40, 40]
                      });
                      var marker7 = L.marker(_thisPiont, { icon: icon7 });
                      aLunar.push(marker7);
                      leafletMap.addLayer(marker7);

                      if (aPiont[10][1]) {
                        $('.masg-text').append('<p>10级风圈半径：' + aPiont[10][1][1] + '</p>')
                        var icon10 = L.icon({
                          iconUrl: 'img/tflj/fq_10j.png',
                          iconSize: [60, 60]
                        });
                        var marker10 = L.marker(_thisPiont, { icon: icon10 });
                        aLunar.push(marker10);
                        leafletMap.addLayer(marker10);
                      }
                    }
                    var oPixelPoint = leafletMap.latLngToContainerPoint({ lng:aPiont[4],lat:aPiont[5]})
                    $('.masg').css({
                    	"left": oPixelPoint.x + 'px',
                    	"top": oPixelPoint.y + 'px'
                    }).show()

                    return false
                  });
                }(iNow)

                aMarker.push(marker);
                leafletMap.addLayer(marker);
                oMarkers[ID] = aMarker;

                if (aLine.length >= 2) { aLine.shift() }
                aLine.push(pion);
                var line = L.polyline(aLine, {
                  color: 'red',
                  weight: 2,
                  lineStyle: iconObj.lineStyle
                });
                leafletMap.addLayer(line);
                aLinePionts.push(line)
                oLine[ID] = aLinePionts;

                iNow++;
                if (iNow == aPionts.length) {
                  clearInterval(timer)
                  var point_test = aLastPiont[0] ? aLastPiont[0] : pion;
                  var label = L.marker(point_test,{
                    opacity:0
                  }).addTo(leafletMap).bindTooltip('最新位置：' + (aLastTime[0] ? aLastTime[0] : tranTime(allPionts[iNow - 1][1])) + '<div class="trigon"></div>',{
                    // offset: [-sourceSize * 10, 0]
                    permanent: true,
                    offset: [0, 25]
                  }).openTooltip();
                  // label.on('click', function () {
                  //   $('#curve').stop().show().animate({
                  //     'right': '18.5rem'
                  //   })
                  //   // initEcharts(oMaxWindSpeed[ID], oDay);

                  //   return false;
                  // })

                  //创建地图文本对象
                  leafletMap.addLayer(label);
                  aMarker.push(label);

                  var icon = L.icon({
                    iconUrl: 'img/tflj/台风.png',
                    iconSize: [26, 30]
                  });
                  console.log(aLastPiont[0])
                  console.log(pion)
                  var point_test = aLastPiont[0] ? aLastPiont[0] : pion
                  // var hh = L.latlngToLayerPoint(point_test)
                  // console.log(hh)
                  var marker = L.marker(point_test , { icon: icon, zIndexOffset: -500 });
                  aMarker.push(marker);
                  oMarkers[ID] = aMarker;
                  leafletMap.addLayer(marker);

                  $('img[src="img/tflj/台风.png"]').css({
											"transformOrigin": '13px 15px 0',
										})

                  // $.each($('[src="img/tflj/台风.png"]'),function (index,value) {
                  // 	if ($(value).hasClass('Rotation')) {

                  // 	}else{
                  // 		console.log(456)
                  // 		$(this).addClass('Rotation')
                  // 	}
                  // })
                  // 旋转点
                  var n = 0;
                  setTimeout(function () {
                  	var oMar_img = marker._icon;
                    var timer2 = setInterval(function () {
                      // var transfrom = $('[src="img/tflj/台风.png"]').get(0).style.transform;
                      var transfrom = oMar_img.style.transform;
                      n -= 2;
                      if (n <= -20) { n = -30 };
                      $(oMar_img).css('transform','');
											$(oMar_img).css('transform',transfrom + ' rotate('+ n +'deg)');
                    }, 60)
                    oTime[ID] = timer2;
                  }, 200);

                  //预测点

                  var for_aline = [];
                  for_aline.push(aLastPiont[0] ? aLastPiont[0] : pion);

                  var for_iNow = 0;
                  // var forecastTimer = setInterval(function () {
                  //   console.log(forecastPiont)
                  //   if (!forecastPiont.length) {
                  //     return
                  //   }
                  //   var for_pion = L.latLng(forecastPiont[for_iNow][3], forecastPiont[for_iNow][2]);
                  //   var iconObj = _typhoonType(forecastPiont[for_iNow][7]);
                  //   var forecast_icon = L.icon({
                  //     iconUrl: iconObj.photoSrc,
                  //     iconSize: [10, 10]
                  //   });
                  //   var for_marker = L.marker(for_pion, { icon: forecast_icon });

                  //   ! function (arr) {
                  //     for_marker.addEventListener('click', function () {
                  //       $('.masg-text').html('');
                  //       $('.masg-text').append('<p>' + aData[2] + ' ' + aData[1] + '</p>')
                  //         .append('<p class="color">' + _tranDate(arr[1]) + '</p>')
                  //         .append('<p>中心气压：' + arr[4] + '百帕</p>')
                  //         .append('<p>最大风速：' + arr[5] + '米/秒</p>')
                  //         .append('<p>未来移向：' + testWind(arr[7]) + '</p>');
                          
                  //       var oPixelPoint = leafletMap.latLngToContainerPoint( { lng:arr[2],lat:arr[3]} );
                  //       $('.masg').css({
                  //         "left": oPixelPoint.x + 'px',
                  //         "top": oPixelPoint.y + 'px'
                  //       }).show()

                  //       return false;
                  //     })
                  //   }(forecastPiont[for_iNow])

                  //   var for_lable = L.marker(for_pion, {
                  //     opacity: 0
                  //   }).addTo(leafletMap).bindTooltip('<div >' + tranTime(forecastPiont[for_iNow][1]) + '</div>', {
                  //     permanent: true,
                  //     offset: [10, 20],
                  //   });

                  //   // for_lable.setBackgroundColor('rgba(0,0,0,0)');
                  //   // for_lable.setFontColor('green');
                  //   // for_lable.setBorderLine( 0 );
                  //   // $(for_lable.Iw).css({
                  //   // 'boxShadow':'none',
                  //   // });

                  //   leafletMap.addLayer(for_lable);
                  //   leafletMap.addLayer(for_marker);

                  //   aMarker.push(for_lable);
                  //   aMarker.push(for_marker);
                  //   oMarkers[ID] = aMarker;


                  //   for_aline.push(for_pion);
                  //   var for_line = L.polyline(for_aline, {
                  //     color: 'red',
                  //     weight: 2,
                  //     dashArray: '5 5',
                  //   });
                  //   leafletMap.addLayer(for_line);
                  //   aLinePionts.push(for_line)
                  //   oLine[ID] = aLinePionts;
                  //   for_aline.shift();

                  //   for_iNow++;
                  //   if (for_iNow == forecastPiont.length) {
                  //     clearInterval(forecastTimer);
                  //   }

                  // }, 300 / forecastPiont)
                }
              }, (300 / aPionts.length))

            })
          }
          myScroll2.refresh()
          myScroll2.scrollTo(0, 0);
        }
      })
      //台风站号筛选
    function tfNumber(str) {
      var station = str ? str : '';
      var n;
      if (station && parseInt(station) < 100000) {
        return station;
      }
      return ''
    }
    //台风名字替换
    function transName(str) {
      if (str.indexOf('nameless') != -1) {
        return 'nameless'
      }
      return str;
    }
  }
  //菜单效果
  $('.menu').on(clickEvent, function () {
    if ($(this).hasClass('act')) {
      //菜单收回
      $('#wrapper2 ul').stop().animate({ 'width': '0' }, function () {
        $('#wrapper ul').stop().animate({ 'width': '0' });
      });
      $(this).removeClass('act');
    } else {
      //菜单展开
      $('#wrapper ul').stop().animate({ 'width': '5rem' }, function () {
        // getTypgoonName( $('#wrapper ul li.menuAct').text() );
        $('#wrapper2 ul').stop().animate({ 'width': '14rem' });
      });

      if (!$('#wrapper ul li').hasClass('menuAct')) {
        $('#wrapper ul li').eq(0).addClass('menuAct');
        hideTip()
        getTypgoonName($('#wrapper ul li').eq(0).text());
      }

      $(this).addClass('act');
    }

    return false;
  })

  //选择年份
  $('#wrapper ul li').on(clickEvent, function () {
      $('#wrapper ul li').removeClass('menuAct');
      $(this).addClass('menuAct');
      $('.content>h2').hide();
      hideTip();
      getTypgoonName($(this).text());
    })
    //隐藏弹出框
  function hideTip() {
    $('.masg').hide();
    $('#curve').hide().css({
      'right': '-61rem'
    })
  }
  //初始化列表
  function initEcharts(arr, oDay) {
    var len = arr.length;
    var xData = [];
    var yData = [];
    for (var i = 0; i < len; i++) {
      yData.push(arr[i][0]);
      xData.push(tranTime(arr[i][1]));
    }
    var option = {
      title: {
        text: oDay.name,
        left: 'center',
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
      xAxis: [{
        type: 'category',
        boundaryGap: false,
        data: xData,
        axisLine: {
          lineStyle: { //x轴颜色
            color: '#fff'
          }
        },
      }],
      yAxis: [{
        name: '(m/s)',
        type: 'value',
        axisLine: {
          lineStyle: { //x轴颜色
            color: '#fff'
          }
        },
        axisLabel: {
          formatter: function (value, index) {
            var arr = ['热带低压 11', '热带风暴 25', '强热带风暴 33', '台风 42', '强台风 51', '超强台风 >51'];
            return arr[index]
          }
        }
      }],
      series: [{
        name: '',
        type: 'line',
        stack: '',
        smooth: true,
        areaStyle: {
          normal: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
              offset: 0,
              color: 'rgba(215,15,93,1)' // 0% 处的颜色
            }, {
              offset: 1,
              color: 'rgba(215,214,48,1)' // 100% 处的颜色
            }], false)
          }
        },
        itemStyle: {
          normal: {
            borderColor: '#fff'
          }
        },
        lineStyle: {
          normal: {
            opacity: 0
          }
        },
        data: yData
      }]
    };
    var myChart = echarts.init($('#curveCont').get(0));
    myChart.setOption(option);
  }
})
