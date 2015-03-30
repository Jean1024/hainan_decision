$(function(){
	var U = Util;
	var Nav = U.Nav;
	var getJson = U.getJson;
	var Loading = U.Loading;

	var REG_URL = /(_(\d{1,2}))?(\.\w+$)/;
	var _temp_list_url;//暂时存储内容所属的分类列表地址
	var _temp_content_url;//暂时存储内容地址
	/*得到调用内部访问的代码*/
	function _getInvokeUrl(){
		var args = '"'+[].join.call(arguments,'","')+'"';
		args = args.replace(/\\/g,'\\\\');//防止字符串中出现类似"[\d]"的情况
		args = args.replace(/"true"/g,true).replace(/"false"/g,false);
		return 'javascript:Util.invoke('+args+')';
	}
	/*得到分页按钮的页码*/
	function _getPage(oldUrl,nextNum){
		var m = REG_URL.exec(oldUrl);
		var toUrl='';
		if(m){
			toUrl = oldUrl.replace(m[0],'_'+nextNum+m[3]);
		}
		return toUrl.replace('_0','');
	}
	/*得到图片点击时查看大图的链接*/
	function _getBigImgUrl(img_src){
		return 'wisp://pImg.wi?url='+img_src+'&';
	}
	var _getAlarmInfo = (function(){
        var yjlb = ['台风', '暴雨', '暴雪', '寒潮', '大风', '沙尘暴', '高温', '干旱', '雷电', '冰雹', '霜冻', '大雾', '霾', '道路结冰'];
        var gdlb = ['寒冷', '灰霾', '雷雨大风', '森林火险', '降温', '道路冰雪','干热风','低温','冰冻'];
        var yjyc = ['蓝色', '黄色', '橙色', '红色'];
        var gdyc = ['白色'];
        //得到预警描述及等级
        var REG = /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})-(\d{2})(\d{2})\.html/;
        return function(data){
            var m = REG.exec(data[1]);
            var result = {};
            if(m){
                var textIndex = parseInt(m[7],10);
                var text = '';
                if(textIndex > 90){
                    text = gdlb[textIndex-91];
                }else{
                    text = yjlb[textIndex - 1];
                }

                var level = '';
                var levelIndex = parseInt(m[8],10);
                if(levelIndex > 90){
                    level = gdyc[levelIndex - 91];
                }else{
                    level = yjyc[levelIndex - 1];
                }

                // var val = data[0]+m[1]+'年'+m[2]+'月'+m[3]+'日'+m[4]+'时'+m[5]+'分发布'+text+level+'预警';
                var img = '';
                if(level > 90 ||textIndex > 90){
                    img = '0000';
                }else{
                    img = m[7]+m[8];
                }
                result.title = data[0]+'气象台发布'+text+level+'预警';
                result.time = m[1]+'-'+m[2]+'-'+m[3]+' '+m[4]+':'+m[5]+':'+m[6];
                result.img = './img/waring/icon_warning_'+img+'.png';
                result.url = 'http://www.weather.com.cn/data/alarm/'+data[1];
            }
            return result
        }
    })();
    function clearContent(){
    	$('.c_list,.c_content').remove();
    }
    var $content = $('.content');
    /*防止误点击*/
    $content.delegate('a','click',function(){
    	if(parseFloat($('.nav_left').css('left'))){
			return false;
		}
		return true;
    });
	function initList(list_url,no_cache){
		U.canBack(false);
		var isHavePageNum = function(pageNumber){
			/*这里应该用强制比较，('' == 0) = true;但是('' === 0) = false */
			return pageNumber !== '' && !isNaN(pageNumber);
		}
		_temp_list_url = list_url;
		Loading.show();
		getJson(list_url,function(data){
			// data.prev = 1;
			// data.next = 3;

			clearContent();
			var type = data.type;
			var desc = data.desc;
			var html = '<div class="c_list">'+
						(desc? '<p class="desc">'+desc+'</p>':'')+
						'<ul>';
			if(data && data.l.length > 0){
				$.each(data.l,function(i,v){
					var src = v.url;
					var img = v.img;
					var title = v.title;
					var time = v.time;
					var fontColor = v.fontColor;
					html += '<li>'+(img?'<img class="c_list_img" src="'+img+'"/>':'')+'<a '+(fontColor?'style="color:'+fontColor+'"':'')+' href=\''+(type == 'pdf'?('wisp://pPdf.wi?title='+encodeURIComponent(title)+'&injectedObjectSrc='+src) : _getInvokeUrl('initContent',src,true))+'\'>'+title+'</a><span>'+time+'</span></li>';
				});
			}else{
				html += '<li>暂无'+(type == 'alarm'?'预警':'数据')+'</li>';
			}
			
				html += '</ul>';

			var prev = data.prev;
			var next = data.next;
			var isHavePrev =  isHavePageNum(prev);
			var isHaveNext = isHavePageNum(next);
			if(isHavePrev || isHaveNext){
				html += '<div class="pager">';
				html += '<div class="btn_pager">';
				if(isHavePrev){
					html += '<a class="btn btn_prev" href=\''+_getInvokeUrl('initList',_getPage(list_url,prev))+'\'>上一页</a>';
				}
				html += '</div><div class="btn_pager">';
				if(isHaveNext){
					html += '<a class="btn btn_next" href=\''+_getInvokeUrl('initList',_getPage(list_url,next))+'\'>下一页</a>';
				}
				html += '</div></div>';
			}
			html += '</div>';
			$(html).appendTo($content);
			Loading.hide();
		},{
			format: function(data){
				if(data){
					if('count' in data && 'data' in data){//预警列表
						var alarmData = {'type': 'alarm'};
						var dataList = [];
						$.each(data.data,function(i,v){
							v = _getAlarmInfo(v);
							dataList.push(v);
						});
						alarmData.l = dataList;
						data = alarmData;
					}else{
						$.each(data.l,function(i,v){
							data.l[i] = {
								url: v.l2,
								img: v.l4,
								title: v.l1,
								time: v.l3,
								fontColor: v.l6
							}
						});
					}
				}
				return data;
			},
			no_cache: no_cache
		});
	}
	function initContentFormat(data){
		var type = data.type;
		if('jcbw' == type){
			var $temp_div = $('<div>').html(data.c7);
			$temp_div.find('img').wrap(function(){
				var $this = $(this);
				var $p = $this.parent();
				//处理图片居中显示
				if($p.is('p[style="text-indent:2em;"]') && $this.next().is('br')){
					$p.css('text-indent',0);
				}
				return $('<a class="img">').attr('href',_getBigImgUrl($(this).attr('src')));
			});
			data.c7 = $temp_div.html();
			data.c1 || (data.c1 = '');
			data = {'type':'jcbw','org': data.c3,'title': data.c1,'time': data.c4,'content': data.c7};
		}else if('tw' == type){
			// var $temp_div = $('<div>').html(data.c2);
			// $temp_div.find('img').wrap(function(){
			// 	return $('<a class="img">').attr('href',_getBigImgUrl($(this).attr('src')));
			// });
			// data.c2 = $temp_div.html();
		}else{
			if('ALERTID' in data){
				var alarmData = {'type': 'alarm'};
				var org = alarmData.org = data['PROVINCE']+data['CITY']+'气象台';
				alarmData.title = org+'发布'+data['SIGNALTYPE']+data['SIGNALLEVEL']+'预警';
				alarmData.time = data['RELIEVETIME'];
				alarmData.content = '<p>'+data['ISSUECONTENT']+'</p>';
				data = alarmData;
			}
		}
		
		return data;
	}
	function initContent(data_url,is_use_temp_list_url,is_use_temp_content_url){
		var no_cache = this.no_cache;
		Loading.show();
		if(typeof data_url == 'string'){
			getJson(data_url,function(data){
				initContent(data,is_use_temp_list_url,is_use_temp_content_url);
				
				_temp_content_url = data_url;
			},{
				/*格式化内容数据*/
				format: initContentFormat,
				no_cache: no_cache
			});
		}else{
			var data = data_url;
			clearContent();
			var type = data.type;
			if('tw' == type){//图文资讯
				var c_title = data.c1;
				var html = '<div class="c_content '+type+'">';
				if(c_title){
					var time = data.c3;
						html += '<div class="c_title">'+
									'<h2>'+data.c1+'</h2>'+
									(time?'<span class="fr">'+time+'</span>':'')+
								'</div>';
				}
								
						html += '<div class="c_text">'+data.c2+'</div>'+
								'<span class="c_copyright">'+data.c5+'</span>'
							'</div>';
			}else if('multipleimg' == type){//多图
				var html = '<div class="c_content '+type+'">'+
								'<div class="c_text">'+
									'<ul class="c_img_list">';

					$.each(data.imgs,function(i,v){
						html += 		'<li><a class="img" href="'+_getBigImgUrl(v.i)+'"><img src="'+v.i+'"/><span class="img_desc">'+v.n+'</span></a></li>';
					});
					html +=			'</ul>'+
								'</div>'+
							'</div>';
			}else if('jcbw' == type || 'alarm' == type){
				var html = '<div class="c_content '+type+'">'+
								'<div class="c_title c_f_red">'+
									'<h2>'+data.title+'</h2>'+
									'<div class="c_postil">'+
										'<span class="fl">'+data.org+'</span>'+
										'<span class="fr">'+data.time+'</span>'+
									'</div>'+
								'</div>'+
								'<div class="c_text">'+data.content+'</div>'+
							'</div>';
			}else if('table' == type){
				var title = data.title;
				var rows = data.rows;
				if($.isArray(rows) && $.isArray(title)){
					var widths = data.width;
					if(!widths){
						widths = [];
						var cols = data.title.length;
						var width = 100/cols+'%';
						for(var i = 0;i<cols;i++){
							widths[i] = width;
						}
					}
					var time = data.time;
					var html_time = '';
					if(time){
						html_time = '<div class="data_time">'+time+'</div>';
					}
					var html = '<div class="c_content '+type+'">'+html_time+'<table>';
					var arr = [title].concat(rows);
					$.each(arr,function(i,v){
						html += '<tr>';
						$.each(v,function(i1,v1){
							html += '<td width="'+widths[i1]+'">'+v1+'</td>';
						})
						html += '</tr>';
					});
					html += '</table></div>';
				}
			}
			if(html){
				var $html = $(html);
				var back_href;
				var _fn,_data_url;
				if(is_use_temp_list_url && _temp_list_url){
					back_href = _getInvokeUrl('initList',_temp_list_url);
					_fn = 'initList';
					_data_url = _temp_list_url;
				}
				if(is_use_temp_content_url && _temp_content_url){
					back_href = _getInvokeUrl('initContent',_temp_content_url);
					_fn = 'initContent';
					_data_url = _temp_content_url;
				}
				if(back_href){
					U.canBack(true);
					$html.append('<a class="btn_back_list btn" href=\''+back_href+'\' data-fn="'+_fn+'" data-url="'+_data_url+'">返回</a>');
				}else{
					U.canBack(false);
				}
				$html.appendTo($content);
			}
			Loading.hide();
		}
	}

	
	U.invoke.reg('initList',initList);
	U.invoke.reg('initContent',initContent);
	var isUrl = function(url){
		return /^http:\/\/.+/.test(url);
	};
	!function(){
		var _temp_data;
		var lastRequestTime = 0;
		var fn = function(data,no_cache){
			var list_url = data.l_url;
			var data_url = data.d_url;
			lastRequestTime = new Date().getTime();
			if(list_url && isUrl(list_url)){
				initList(list_url,no_cache);
			}else if(data_url && isUrl(data_url)){
				initContent.call({no_cache: no_cache},data_url);
			}else{
				clearContent();
				$('<div class="c_content">暂无内容</div>').appendTo($('.content'));
			}
		}
		// initContent('');
		/*绑定头部导航点击触发事件*/
		$(document).on('init_data',function(e,data){
			_temp_data = data;
			fn(data);
		}).on('back',function(){
			if(Nav.isShow()){
				Nav.toggle(true);
			}else{
				// initList(_temp_list_url);
				var $btn_back_list = $('.btn_back_list');
				var _fn = $btn_back_list.data('fn'),
					_data_url = $btn_back_list.data('url');
				U.invoke(_fn,_data_url);
			}
		}).on('restart',function(){
			console.log('item restart:'+JSON.stringify(_temp_data));
			if(_temp_data && new Date().getTime() - lastRequestTime > 1000 * 60 * 5){
				fn(_temp_data,true);
			}
		});
	}();
	
	/*初始化头部及左侧导航*/
	Nav.Top.init(function($html){
		$('.container').prepend($html);
		//处理从其它页面跳转过来的预警（现在只有在海南首页用）
		var c_warning = U.Store.get('c_warning');
		if(c_warning){
			U.Store.rm('c_warning');
			Nav.Top.title(c_warning.title);
			var data = initContentFormat(c_warning.info);
			initContent(data);
		}
	},function(){
		var $content = $('.content');
		var height_nav_top = $('.nav_top').height() + 10;
		
		$content.css('margin-top',height_nav_top).height($(window).height() - height_nav_top);
	});


	// initList('http://product.weather.com.cn/alarm/grepalarmBox.php?areaid=[\\d]{5,9}&type=[0-9]{2}&count=-1&_=1400568544074');
	// initContent('http://10.14.85.116/android/ChinaWeatherDecision_assets/test/data/alarm_list.html',false,true);
})