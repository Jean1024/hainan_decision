$(function() {
	var U = Util;
	var getJson = U.getJson;
	var Loading = U.Loading;
	var Parse = U.Parse;

	var $ul_city_list = $('.city_list');
	var $info = $('.info');
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

	function _getIcon() {
		var src = Parse.weatherIcon.apply(null, arguments);
		return '<img class="weather_icon" src="'+src+'"/>';
	}
	var now = new Date();
	function _showWeather(id, name) {
		Loading.show();
		var url = U.getEncodeUrl('http://webapi.weather.com.cn/data/?areaid='+ id + '&type=all');
		getJson(url, function(data) {
			Loading.hide();
			data = _format(data);
			// console.log(data);

			var sk = data.shikuang;
			var data_sk = sk.l;
			var l1 = data_sk.l1; //当前温度 (摄氏度 )
			var l2 = data_sk.l2; //当前湿度 (单位 %)
			var l3 = data_sk.l3; //当前风力 (单位是级 单位是级 )
			var l4 = data_sk.l4; //当前风向编号 当前风向编号
			var l5 = data_sk.l5; //当前天气现象编号 当前天气现象编号 当前天气现象编号
			var l6 = data_sk.l6; //当前降水量 当前降水量 (单位是毫米 单位是毫米 )
			var l7 = data_sk.l7; //实况发布时间

			var html = '<div class="top_title"><span class="btn_back"></span>'+name+'</div>';
			html += '<div class="clear sk">';
				html += '<div class="fl left"><div>'+_getIcon(l7,l5)+'</div><div>'+Parse.weatherText(l5)+'</div><div>'+l1+'℃</div></div>';
				html += '<div class="fl right"><div>今天'+Parse.week(new Date())+'</div><div>'+Parse.windDirec(l4)+Parse.windLevel(l3,true)+'</div><div>温度'+l2+'%</div><div>空气质量'+l2+'</div></div>';
			html += '</div>';

			var data_hoursyb = data.hoursyb;
			var html_hoursyb = '';
			var num = 0;
			for (var f = data_hoursyb.jh, i = 0, j = f.length; i<j; i++) {
				var v = f[i];
				var t = v.jf;
				var time = new Date(t.substr(0, 4)+'/'+t.substr(4, 2)+'/'+t.substr(6, 2)+' '+t.substr(8, 2)+':'+t.substr(10, 2)+':00');
				if (time > now) {
					num++;
					var ja = v.ja; //天气现象编号
					var jb = v.jb; //温度
					html_hoursyb += '<li><div>'+(time.format('hh时'))+'</div><div>'+(_getIcon(time, ja))+'</div><div>'+jb+'℃</div></li>';
				}
			}
			html += '<div class="hours_yb"><ul class="clear" style="width:'+100*num+'px">';
			html += html_hoursyb;
			html += '</ul></div>';

			var data_days_yb = data['15yb'];


			html += '<ul class="clear days_yb">';
				for (var f = data_days_yb.f.f1, i = 1, j = f.length; i<j; i++) {
					var time = new Date(now.getTime());
					time.setDate(time.getDate() + i);
					var v = f[i];
					var fa = v.fa; //白天天气现象编号
					var fb = v.fb; //晚上天气现象编号
					var fc = v.fc; //白天天气温度
					var fd = v.fd; //晚上天气温度
					html += '<li class=""><span class="fl date">'+(time.format('MM/dd'))+'</span><div class="fl _yb_info"><span>'+_getIcon('14:00',fa)+'</span><span>'+fc+'℃</span><span>'+_getIcon('20:00',fb)+'</span><span>'+fd+'℃</span></div></li>';
				}
			html += '</ul>';
			$info.html(html).show();
		});
	}
	var hotcity_list = [{"name":"海口","id":"101310101"},{"name":"三亚","id":"101310201"},{"name":"东方","id":"101310202"},{"name":"临高","id":"101310203"},{"name":"澄迈","id":"101310204"},{"name":"儋州","id":"101310205"},{"name":"昌江","id":"101310206"},{"name":"白沙","id":"101310207"},{"name":"琼中","id":"101310208"},{"name":"定安","id":"101310209"},{"name":"屯昌","id":"101310210"},{"name":"琼海","id":"101310211"},{"name":"文昌","id":"101310212"},{"name":"保亭","id":"101310214"},{"name":"万宁","id":"101310215"},{"name":"陵水","id":"101310216"},{"name":"西沙","id":"101310217"},{"name":"南沙","id":"101310220"},{"name":"乐东","id":"101310221"}];

	var $hot_city = $('.hot_city');
	var html = '';
	for (var i = 0, j = hotcity_list.length; i<j; i++) {
		var item = hotcity_list[i];
		html += '<li data-id="'+item.id+'">'+item.name+'</li>';
	}
	$hot_city.html(html);

	$('ul').delegate('li', 'click', function() {
		$btn_cancel.click();
		_showWeather($(this).data('id'), $(this).text());
	});
	var $btn_cancel = $('#btn_cancel').click(function() {
		$ul_city_list.html('').hide();
		$text_search.val('');
	});

	$info.delegate('.btn_back', 'click', function() {console.log($info);
		$info.hide();
	});
	// $hot_city.find('li:first').click();
	var $text_search = $('#text_search').on('keyup', function(){
		var keyword = $(this).val();
		(function(flag){
			require_old('http://app.weather.com.cn/area/search', {
				"condition": {
					"keyWord": keyword
				},
				"pagination": {
					"start": 0,
					"limit": 30
				}
			}, function(err, data){
				if(flag == keypress_flag){
					var html = '没有找到合适的结果！';
					if(data){
						data = data.data;
						if(data){
							var records = data.records;
							if(records && records.length > 0){
								html = '';
								$.each(records, function(i, v){
									console.log(v);
									html += '<li data-id="'+v.id+'" data-district="'+v.districtZh+'" data-city="'+v.nameZh+'" data-prov="'+v.provZh+'" data-level="'+v.level+'" data-nation="'+v.nationZh+'">'+v.nameZh+'</li>';
								});
							}
						}
					}
					$ul_city_list.html(html).show();
				}
			});
		})((keypress_flag = new Date()));
	})

	U.Nav.Top.init(function($html){
		$('.container').prepend($html);

	}, function nav_top_chage_callback(){
		var $content = $('.content');
		var height_nav_top = $('.nav_top').height() + 10;

		$content.css('margin-top',height_nav_top).height($(window).height() - height_nav_top);
		U.Nav.Top.title('切换城市');
	});
})
