!function(e){var t,i,a=Util.Store;$(function(){t=$(".container"),i=t.width()-55});var n=1e3,r=a.get("play"),o=r,s=function(e,n,r){var s=this;s.cIndex=-1,s.tIndex=e;var c=i/e-5;s.pWidth=c;var d='<div class="fix_layer bottom_layer nav_animate">';r&&(d+='<div class="tuli_layer"><img src="'+r+'"/></div>'),d+='<span class="btn_player">',o||(o=!0,d+='<div class="notice" id="n_play"><i>点击这里播放</i><div><div></div></div></div>'),d+="</span>",d+='<div class="progress">',d+='<div class="handle" style="left:'+c*e+'px"><i></i></div>';for(var l=0;e>l;l++)d+="<span data-index="+l+' style="width:'+c+'px" class="on"></span>';d+="</div></div>",d=$(d).appendTo(t),s.playerTT;d.find(".btn_player").click(function(){a.set("play",!0);var e=$(this);$("#n_play").hide(),e.hasClass("pause")?(s.stop(),e.removeClass("pause")):(e.addClass("pause"),s.play(0))}),s.progressBtns=d.find(".progress span").click(function(){s.stop(),s.play($(this).data("index"),!0)}),s.handle=d.find(".progress .handle");s.playerHTML=d,s.callback=n||function(e,t){t()}},c=s.prototype;c.play=function(e,t){var i=this,a=i.callback,r=i.cIndex,o=i.tIndex,s=null!=e?e:o>r+1?r+1:-1;if(0>s)i.stop();else{var c=i.progressBtns.removeClass("on");i.playerHTML.find(".progress .time").show(),c.filter(":lt("+s+"),:eq("+s+")").addClass("on"),i.handle.css({left:i.pWidth*(s+1)+2}),i.cIndex=s,a(s,function(){t||(i.playerTT=setTimeout(function(){i.play()},n))})}},c.stop=function(){var e=this;e.cIndex=-1,e.playerHTML.find(".btn_player").removeClass("pause"),clearTimeout(this.playerTT)},c.hide=function(){this.stop(),this.playerHTML.remove()};var d;c.showText=function(e){var t=this,i=t.playerHTML,a=i.find(".progress .time");if(0==a.length&&(a=$('<div class="time"><i></i><div></div></div>').appendTo(i.find(".progress"))),e)try{a.find("i").text(e);var n=i.find("span.on").last(),r=n.width(),o=a.width(),s=n.position().left+r-o/2,c=s,l=o/2-10;if(d||(d=i.find(".progress").width()+10),c+o>d){var f=d-o;l+=c-f,c=f}else 0>c&&(l+=c,c=0);a.find("div").css({left:l}),a.css({left:c}).show()}catch(h){}else a.hide()},e.Player=s}(this),$(function(){function e(){h&&h.resize(),s.trigger("map_resize")}var t=Util,i=t.Nav,a=t.getJson,n=t.Store,r=t.Loading,o=$(window),s=$(document),c=o.width(),d=$("#map_container"),l=$("#operator"),f=(c-l.width())/2;l.css("left",f);var h,u={left:f,top:parseFloat(l.css("top")),width:l.width(),height:l.height(),"transform-origin":"50% 50%",transform:"scale(1)"},p=!1;s.on("nav_toggle",function(){p=i.isShow()});var v,g,m=!1,_=!0;!function(){var t={origin:{x:0,y:0},middle:{x:0,y:0},move:{x:0,y:0,offset:null},size:{width:0,height:0}};g=function(i){var n=u.width,r=u.height;t.size={width:n,height:r},a={left:u.left,top:u.top},l.css(u),e(),i&&i()};var i,a=l.position(),n=l.width(),r=$.browser.safari?2285:4*n,c=Math.min(o.width(),n/2),f=!1,h=!1;v=function(){var e,t,i,r,o,s,c={},f=c.china={w:2526,h:2526,l:-1094,t:-660},h=f.w,u=f.h,p=f.l,v=f.t;e=p+a.left,t=v+a.top,i=h,r=h/n,o=p/h,s=v/u;var g=!1,m={r:function(e){n=l.width(),e?(d.removeClass("map"),g=!1):(d.addClass("map"),g=!0,this.c())},c:function(a){if(g){a=a||1,i=r*n*a;var c=l.position();e=i*o+c.left,t=i*s+c.top;var f={"background-size":i+"px",backgroundPosition:e+"px "+t+"px"};d.css(f)}}};return m}();var w="ontouchstart"in window,b=function(o,s,d,u,g,b,$){if(w||(b=1),(_||2!=b)&&!p){if("start"==s&&(a=l.position()),"move"==s&&(m=!0),2==b){if(i=function(o){return function(){var s=l.width(),d=l.height(),f=s*o,h=d*o;f>r?(h=d*r/s,f=r):c>f&&(h=d*c/s,f=c);var u=a.left,p=a.top,v=t.origin,g=u-(f-s)*v.x/s,m=p-(h-d)*v.y/d;l.css({transform:"scale(1)",width:f,height:h,left:g,top:m}),t.size={width:f,height:h},n=l.width(),y(),e(),i=null}}($),"end"==s)i(),f=!0;else if("move"==s){h&&(y(),h=!1);var x=l.width()*$;if(x>r||c>x)return;l.css({transform:"scale("+$+")"}),v.c($)}}else if(1==b){var k=w?o.targetTouches[0]:o,T=t.move;if("start"==s)T.x=k.pageX,T.y=k.pageY,T.offset=l.position();else if("move"==s){i&&(i(),T.offset=l.position()),h=!0;var C=T.offset,z=k.pageX-T.x,D=k.pageY-T.y,I=C.left+z,M=C.top+D,j=t.size.width,F=t.size.height,L=t.middle.x,P=t.middle.y;if(I>L||L>I+j||M>P||P>M+F)return;l.css({left:I,top:M}),v.c()}else"end"==s&&(h=!1,y())}"end"==s&&(m=!1)}};d.swipe({pinchStatus:b,pinchThreshold:0,triggerOnTouchEnd:!0,triggerOnTouchLeave:!0,fingers:2,fallbackToMouseEvents:!0,tap:function(e,t){var i=$(t);("btn_back_china"==i.attr("id")||i.is(".layer_weather")||i.closest(".layer_weather").length>0)&&i.click()}}),t.middle={x:d.width()/2,y:d.height()/2},t.size={width:l.width(),height:l.height()};var y=function(){var e=l.position(),i=t.middle,a=t.origin={x:i.x-e.left,y:i.y-e.top};l.css({"transform-origin":a.x+"px "+a.y+"px"})};y();var x=t.origin;u["transform-origin"]=x.x+"px "+x.y+"px";/Nexus/.test(navigator.userAgent);s.on("resizePinch",function(e,t){(!f||t)&&(b(null,"start"),b(null,"end","in",null,0,2,1))})}(),!function(){var e,i,o=($(".fix_layer:first h1"),$("#table_pm")),c=$("#container"),f=!1,u=function(){f&&h&&(h.zr.clear(),h.zr.un(),f=!1,i=null),l.html(""),$("#n_back").remove(),$("#btn_back_china").remove(),t.canBack(!1)},w=function(e){return function(t,i){return r.show(),l.html($("<img>").on("load",function(){r.hide(),i&&i()}).attr("src",e[t].i)),e[t].n}},b=function(t,i,a){var n=t.length,r=function(t,a){var n=i(t,a);e&&e.showText(n||"")};n>1&&(e=new Player(n,r,a)),r(t.length-1)},y={jiangshui:function(e){return e=parseFloat(e),e>=0&&1>e?"rgba(46,173,6,1)":e>=1&&10>e?"rgba(0,0,0,1)":e>=10&&25>e?"rgba(9,1,236,1)":e>=25&&50>e?"rgba(200,4,200,1)":e>=50?"rgba(197,7,36,1)":void 0},wendu:function(e){return e=parseFloat(e),-30>e?"rgba(32,24,133,1)":e>=-30&&-20>e?"rgba(17,74,217,1)":e>=-20&&-10>e?"rgba(77,180,247,1)":e>=-10&&0>e?"rgba(209,248,243,1)":e>=0&&10>e?"rgba(249,242,187,1)":e>=10&&20>e?"rgba(249,222,69,1)":e>=20&&30>e?"rgba(255,168,0,1)":e>=30&&40>e?"rgba(255,109,0,1)":e>=40&&50>e?"rgba(230,0,0,1)":e>=50?"rgba(158 ,0,1,1)":void 0},bianwen:function(e){return e=parseFloat(e),e>0?"rgba(255,0,0,1)":0==e?"rgba(0,0,0,1)":"rgba(0,0,255,1)"},radar:function(){return"#f0f"},shidu:function(e){return e=parseFloat(e),e>=0&&10>e?"rgba(255,96,0,1)":e>=10&&30>e?"rgba(254,165,26,1)":e>=30&&50>e?"rgba(255,252,159,1)":e>=50?"#D6E6DA":void 0}},x={parseWind:function(e){var t=[];return $.each(e.features,function(e,i){var a=i.properties,n=a.speed;if(0!=n){var r="";n>=1&&2>=n?r="1_2":n>=3&&4>=n?r="3_4":n>=5&&6>=n?r="5_6":n>=7&&8>=n?r="7_8":n>8&&(r="8_"),a.rotation=-a.rotation,a.image="./img/geomap/wind_icon/"+r+".gif",a.width=11,a.height=13,t.push(i)}}),e.features=t,e},parseQYC:function(e){return $.each(e.features,function(e,t){var i=t.properties,a=i.value;i.value=1e3+parseInt(a)}),e},randarClick:function(e){var t=e.target.id;initData("http://data.weather.com.cn/cnweather/provdata/pmsc/cmadecision/radar/jc_radar_"+t.toLowerCase()+"_jb.html","单站雷达 - "+e.target.style.title)},parseRandar:function(e){var t=[];return $.each(e.features,function(e,i){var a=i.properties;a.rotation=0,a.image="./img/geomap/icon_randar.png",a.width=40,a.height=40,t.push(i),i.geometry.type="PointImage"}),e.features=t,e}},k=function(){require.config({paths:{zrender:"./js/zrender",GeoMap:"./js/GeoMap","zrender/tool/util":"./js/zrender"}});var e,o,c;return function(l,u,w,b){e=l,o=u,c=w;try{var k=e.config.weatherStyle.onclick;"string"==typeof k&&(e.config.weatherStyle.onclick=x[k])}catch(T){}var C,z=$.extend(!0,{container:"operator"},e.config),D=DEFAULT_CONFIG.geomap||{};D.is_forbid_scale&&(_=!1);var I=D.province_id,M=!1,j=function(e,r,o){i=e,v.r(i),a("./data/map/"+e+".geo.json",function(a){var c=function(){if(v.r(i),h.clear(),h.load(a,{showName:D.show_name!==!1?!0:!1}),f&&h.refreshWeather(e),f&&s.trigger("resizePinch",!0),r){var c=n.get("back"),l=$("#n_back");c?l.remove():(l=$('<div class="notice" id="n_back"><i>点击返回全国地图</i><div><div></div></div></div>').appendTo(d),l.show());var u=function(){n.set("back",!0),l.remove(),p.remove(),t.canBack(!1),F(o)},p=$('<div id="btn_back_china">返回</div>').appendTo(d).click(u);t.canBack(!0)}o&&o()};f?g(c):(h=C.init(z),c(),f=!0)})},F=function(e){a("./data/map/china.geo.json",function(t){var a=function(){h.clear(),h.load(t,{showName:!1}),i=null,h.render(),f&&h.refreshWeather(),f&&s.trigger("resizePinch",!0),v.r(i),h.zr.on("click",function(t){if(!p&&!i&&!m){var a=t.target;if(a){if(a.pshapeId&&a.pshapeId!=a.id)return;var n=a.id.replace("text","");isNaN(n)&&j(n,!0,e)}}}),e&&e()};f?g(a):(h=C.init(z),a(),f=!0)})};return function(t,n){r.show();var l=b||function(){var d=y[e.color],l=x[e.fnname];a(o[t].src,function(e){d&&$.each(e.features,function(e,t){t.properties.color=d(t.properties.value)}),$.isFunction(l)&&(e=l(e)),h.loadWeather(e,i),h.refresh(),f&&s.trigger("resizePinch",!0),M||v.r(i),M=!0,r.hide(),n&&n()},{no_cache:c})};f?(z.showName=!!i,h.updateCfg(z),i||d.addClass("map"),l()):require(["GeoMap"],function(e){C=e,I?j(I,D.is_can_back,l):F(l)});var u=o[t];return u&&u.text}}}(),T=function(){function e(e,t){var i=new Date(e);return t>0&&i.setDate(i.getDate()+t),[i.getFullYear(),i.getMonth()+1,i.getDate()].join("-")}function a(e,t){var i=f.weatherText(e),a=f.weatherText(t),n=i;return i!=a&&(n+="转"+a),n.replace(/^无?转|转无?$/,"")}function n(e,i){i&&g.add();var a=e.data("c_id");t.initData("forcast7d_"+a,"http://webapi.weather.com.cn/data/?areaid="+a+"&type=forecast7d",function(t){if(i&&g.rm(),t){var a=u.exec(t.f0);a&&(p=[a[1],a[2],a[3]].join("-"));var n=t.f.f0;if(n){var r=e.data("time");if(r){if(r>=n)return;e.find("img").remove()}e.data("time",n);var s=n.substr(0,4)+"年"+n.substr(4,2)+"月"+n.substr(6,2)+"日"+n.substr(8,2)+"时";v?s.localeCompare(v)>0&&($(".data_time").find("span:first").text(s),v=s):($('<div class="data_time"><span>'+s+'</span><span>发布</span><span class="btn_refresh"></span></div>').appendTo(d),v=s)}t=t.f.f1;var c=t[0],h=c.fa,m=c.fb,_="";if(_=h?f.weatherIcon("12:00",h):f.weatherIcon("23:00",m))var w='<img src="'+f.weatherIcon(h?"12:00":"23:00",h||m)+'"/>';e.append(w).click(function(){l=t,o()})}})}function o(){t.canBack(!0,"dialog"),_.removeClass("trend");var i=p.getHours(),n=i>=18||6>=i,r=[],o=[],s=[],d=[],h="";$.each(l,function(t,i){var c=i.fa,l=i.fb,u=i.fc,v=i.fd,g=i.fe,m=i.ff,_=i.fg,w=i.fh,b=f.week(p,t),y=e(p,t);isNaN(u)||""==u||(r.push(u),o.push(v),s.push(b+'<img src="'+f.weatherIcon("12:00",c)+'"/>'),d.push('<img src="'+f.weatherIcon("23:00",l)+'"/>'+y.substring(5))),h+='<li><div class="yb_top">'+y+" "+b+'</div><div class="clear yb_c"><div class="fl">'+(c?'<img class="w_img" src="'+f.weatherIcon("12:00",c)+'"/><span>'+(u?u+"℃":"")+"</span>":"")+'</div><div class="fl"><img class="w_img" src="'+f.weatherIcon("23:00",l)+'"><span>'+v+'℃</span></div><div class="fl yb_text"><div>'+a(c,l)+"</div><div>"+f.windDirec(n?m:g)+" "+f.windLevel(n?w:_)+"</div></div></div></li>"}),w.html(h),m.addClass("show"),"undefined"==typeof iChart?$.getScript("./js/ichart.js",function(){c(r,o,s,d)}):c(r,o,s,d)}function c(e,t,i,a){var n=[{name:"最高温",value:e,color:"#FF7E00",line_width:2},{name:"最低温",value:t,color:"#0d8ecf",line_width:2}],r="",o=i.length;$.each(i,function(e,t){r+='<div class="fl" style="width:'+1/o*100+'%">'+t+"</div>"}),$("#chart_top").html(r),r="";var o=a.length;$.each(a,function(e,t){r+='<div class="fl" style="width:'+1/o*100+'%">'+t+"</div>"}),$("#chart_bottom").html(r);var s=new iChart.LineBasic2D({render:"chart_content",data:n,align:"center",width:$("#chart_content").width(),height:$("#chart_content").height(),border:null,sub_option:{smooth:!0,listeners:{parseText:function(e,t){return t+"℃"}}},background_color:"rgba(0,0,0,0)",coordinate:{width:"90%",height:240,striped:!0,axis:{width:0},scale2grid:!1,offsetx:-3,grid_color:"#ffffff",scale:[{position:"left",start_scale:Math.min.apply(Math,t),end_scale:Math.max.apply(Math,e),scale_enable:!1,listeners:{parseText:function(){return{text:""}}}}]}});s.draw()}var l,f=t.Parse,u=/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,p=new Date;d.delegate(".data_time","click",function(){var e=$(this).find(".btn_refresh");e.hasClass("refreshing")||(e.addClass("refreshing"),$("div[data-c_id]").each(function(){n($(this),!0)}))});var v,g=function(){var e,t=0,i=1e3;return{add:function(){0==t&&(e=new Date),t++},rm:function(){setTimeout(function(){0==--t&&setTimeout(function(){$(".btn_refresh").removeClass("refreshing")},Math.max(i,new Date-e))},10)}}}();$(document).on("before_nav_click",function(){m&&b.click()});var m,_,w,b,y='<div class="dialog dialog_forcast"><div class="dialog_nav_top"><div class="btn_quit fl"></div><div class="btn_forcast_nav fl"><span class="btn_forecast">预 报</span><span class="btn_trend">趋 势</span></div></div><div class="yb_container"><ul class="yb_date fl"></ul><div class="fl" id="forcast_chart"><div id="chart_top"></div><div id="chart_content"></div><div id="chart_bottom"></div></div></div></div>';return function(e,a,o){var c,d,l=k(e,a,o,function(){h.refresh(),r.hide(),c&&c()}),f=$(".layer_weather");return s.off("map_resize"),s.on("map_resize",function(){f.hide(),clearTimeout(d),d=setTimeout(function(){f.each(function(e,t){var i=$(t),a=h.makePoint(i.data("geo"));i.css({left:a[0],top:a[1]}),setTimeout(function(){i.fadeIn()},10)})},10)}),m||(m=$(y).appendTo($(".container")),_=$(".yb_container"),w=$(".yb_date").height(m.height()-m.find(".dialog_nav_top").height())),$(".btn_forecast").click(function(){_.removeClass("trend")}),$(".btn_trend").click(function(){m.addClass("show"),_.addClass("trend")}),b=$(".btn_quit").click(function(){$(this).parent().parent().removeClass("show"),t.canBack(!1,"dialog")}),function(t,a){c=function(){h.weatherShowid=i;var t=$(h.container);$.each(e.list,function(e,i){var a=i.city_id,r=h.makePoint(i.geo),o=$('<div class="layer_weather" style="left:'+r[0]+"px;top:"+r[1]+'px"></div>');o.data("geo",i.geo);var s=$('<div data-c_id="'+a+'">'+i.name+"</div>");o.append(s),t.append(o),n(s)}),f=$(".layer_weather"),a&&a()},l(t)}}}(),C=function(e,t){u();var i=e.url;i&&(r.show(),a(i,function(e){r.hide(),renderFn=w(e),b(e,renderFn)},{format:function(e){return e},no_cache:t}))};window.initData=function(t,i){if("string"==typeof t)return void a(t,function(e){initData(e,i)},{format:function(e){var t=e.type;return"multipleimg"==t?e.imgs.reverse():e.items.reverse(),e},no_cache:i});e&&(e.hide(),e=null);var n,r=t.type,s=t.items||t.imgs;switch(d.show().removeClass("map"),c.hide(),o.hide(),_=!0,r){case"multipleimg":u(),n=w(s,i);break;case"img_json":return C(t,i);case"json":n=k(t,s,i);break;case"json_forecast":n=T(t,s,i);break;case"weburl":return void(window.location.href="wisp://pUrl.wi?url="+t.url)}n&&b(s,n)}}(),!function(){var e,t,i=0,a=401;s.on("init_data",function(n,o){r.show(),clearTimeout(t),t=setTimeout(function(){var t=o.d_url;e!=t&&(e=t,i=(new Date).getTime(),initData(o.d_url))},a)}).on("restart",function(){e&&(new Date).getTime()-i>6e4&&initData(e,!0)})}(),i.Top.init(function(e){$(".container").prepend(e)}),p=i.isShow(),s.on("back",function(){p?i.toggle(!0):$(".dialog_forcast").is(".show")?$(".btn_quit").click():$("#btn_back_china").click()})});