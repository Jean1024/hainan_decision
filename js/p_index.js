$(function(){function t(t,e,a,n,i){var r=l.get(t),c=function(a){e=o.getEncodeUrl(e),d(e,function(e){l.set(t,e),a&&a(e)},{no_cache:n,format:i})};r&&!n?(a(r),c()):c(a)}function e(e,a,n){t("forcast","http://webapi.weather.com.cn/data/?areaid="+e+"&type=observe",function(t){if(t&&t.l){var t=t.l,e=t.l1,n=t.l2,i=t.l3,r=t.l4,c=t.l5,o=(t.l6,t.l7);$(".temp").html(e+"<sup>℃</sup>"),$(".weather_icon").attr("src",f.weatherIcon(o,c)).show(),$(".shidu").text("相对湿度："+n+"%"),$(".wind").html(f.windDirec(r)+" "+f.windLevel(i,!0)),$(".time").text(o),$(".weather_info").show(),a&&a()}},n,function(t){var e=l.get("time_forcast");try{var a=new Date,n=new Date,i=/(\d{2}):(\d{2})/.exec(t.l.l7);i&&(n.setHours(i[1]),n.setMinutes(i[2]));var r=n;if(a-n>36e5){var c=new Date(n);c.setDate(c.getDate()-1),r=c,e&&(e=new Date(e),r=e>c?e:c)}l.set("time_forcast",r);var o=r.getMonth()+1+"月"+n.getDate()+"日";t.l.l7=o+t.l.l7}catch(s){}return t})}function a(e,a,n){t("alarm","http://webapi.weather.com.cn/data/?areaid="+e+"&type=alarm",function(t){var e=!1,n=$(".warning");if(g=null,l.rm("c_warning"),t){var i=t.w;if($.isArray(i)&&i.length>0){e=!0;var r=i[0];n.show(),n.find("img").attr("src","./img/waring/icon_warning_"+r.w4+r.w6+".png");var c=r.w5+r.w7+"预警";n.find(".warning_text").html(c);var o=r.w1+"气象台";g={c1:o+c,c2:"",c3:o,c4:r.w8,c5:"",c6:"",c7:r.w9,type:"jcbw"}}}else n.hide();a&&a()},n)}function n(e,a,n){t("air","http://webapi.weather.com.cn/data/?areaid="+e+"&type=air",function(t){if(t&&t.p){var e=t.p.p2,n="";e>0&&50>=e?n="优":e>50&&100>=e?n="良":e>100&&150>=e?n="轻度污染":e>150&&200>=e?n="中度污染":e>200&&300>=e?n="重度污染":e>300&&(n="严重污染"),$(".AQI").html("AQI："+n)}a&&a()},n)}function i(e,a,n){t("forcast7d","http://webapi.weather.com.cn/data/?areaid="+e+"&type=forecast7d",a,n)}function r(){l.set(v,(new Date).getTime()+9e5)}function c(t,e){var a=f.weatherText(t),n=f.weatherText(e),i=a;return a!=n&&(i+="转"+n),i.replace(/^无?转|转无?$/,"")}var o=Util,s=o.Nav,l=o.Store,d=o.getJson,f=o.Parse,h=o.Loading,u=o.getAreaId();l.rm("columnId"),l.rm("twoId"),l.rm("threeId");var g;$(".warning").click(function(){g&&(l.set("c_warning",{title:"灾害预警",info:g}),location.href="./item.html")});var v="hainan_index_time";!function(){var t,e,a=!1,n=function(){if(!a){var i=$(this).addClass("refreshing");a=!0;var r=600,c=(new Date).getTime();w(function(){var o=r-((new Date).getTime()-c);o=0>o?0:o,setTimeout(function(){t=i.removeClass("refreshing").remove().appendTo(e),t.click(n),a=!1},o)},!0)}};t=$("#btn_refresh").click(n),e=t.parent()}(),$(".btn_nav").on("click",s.toggle),s.init(function(t){t.prependTo($("#main"))});var w=function(t,o){var s=4,l=function(){--s<=0&&(r(),t&&t())};e(u,l,o),a(u,l,o),n(u,l,o),i(u,function(t){var e=t.f.f1[0],a=e.fa,n=e.fb,i=e.fc,r=e.fd,o=r+"℃";if(i||0===i)o=i+"℃~"+o;else{var s=t.f.f1[1];a=n,n=s.fa,o+="~"+s.fc+"℃"}$(".weather").text(c(a,n)+"  "+o),l(t)},o)};!function(){var t="index_geo",e=l.get(t),a=function(t){u=t.id;var e=t.city;$(".top_nav h1").text(e),w(function(){h.hide();var t=l.get(v);(!t||t<(new Date).getTime())&&w(null,!0)})};e?a(e):h.show(),o.getGeoInfo(function(e){l.set(t,e),a(e)})}();var m=function(){return function(t,e){var a="icon_"+base64encode(str_hmac_sha1("",t)),n=l.get(a),i=$("<img>");if(n)i.attr("src",n),e(i);else{var r=new Image;r.onload=function(){var t=document.createElement("canvas");t.width=this.width,t.height=this.height;var n=t.getContext("2d");n.drawImage(this,0,0);var r=t.toDataURL("image/png");l.set(a,r),i.attr("src",r),e(i)},r.src=t}}}();o.getAppInfo(function(t){var e=$(".sort_list"),a="";$.each(t.list,function(t,e){var n=e.color;a+='<li data-id="'+e.id+'"'+("weburl"==e.module?' data-url="'+e.dataurl+'"':"")+'><img src="./img/bg_img.png" data-icon="'+e.icon+'"/><span '+(n?'style="color:'+n+'"':"")+">"+e.name+"</span></li>"}),e.html(a).find("li img").each(function(){var t=$(this);m(t.data("icon"),function(e){t.parent().addClass("loaded"),t.replaceWith(e)})}),e.find("li").click(function(){s.changeBig($(this).data("id"))})}),$(document).on("back",function(){s.isShow()?s.toggle(!0):p.click()});var p=($(".nav_top"),$(".btn_quit"));$(function(){function t(t,e){var a=new Date(t);return e>0&&a.setDate(a.getDate()+e),[a.getFullYear(),a.getMonth()+1,a.getDate()].join("-")}function e(){h.show();var e=/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/;i(u,function(i){i=i.f;var r="",o=e.exec(i.f0);if(o)var s=[o[1],o[2],o[3]].join("-");else var s=new Date;var d=s.getHours(),u=d>=18||6>=d,g=[],v=[],w=[],m=[];$.each(i.f1,function(e,a){var n=a.fa,i=a.fb,o=a.fc,l=a.fd,d=a.fe,h=a.ff,p=a.fg,_=a.fh,$=f.week(s,e),b=t(s,e);isNaN(o)||""==o||(g.push(o),v.push(l),w.push($+'<img src="'+f.weatherIcon("12:00",n)+'"/>'),m.push('<img src="'+f.weatherIcon("23:00",i)+'"/>'+b.substring(5))),r+='<li><div class="yb_top">'+b+" "+$+'</div><div class="clear yb_c"><div class="fl">'+(n?'<img class="w_img" src="'+f.weatherIcon("12:00",n)+'"/><span>'+(o?o+"℃":"")+"</span>":"")+'</div><div class="fl"><img class="w_img" src="'+f.weatherIcon("23:00",i)+'"><span>'+l+'℃</span></div><div class="fl yb_text"><div>'+c(n,i)+"</div><div>"+f.windDirec(u?h:d)+" "+f.windLevel(u?_:p)+"</div></div></div></li>"}),l.html(r),a(g,v,w,m),h.hide(),n=!0})}function a(t,e,a,n){var i=[{name:"最高温",value:t,color:"#FF7E00",line_width:2},{name:"最低温",value:e,color:"#0d8ecf",line_width:2}],r="",c=a.length;$.each(a,function(t,e){r+='<div class="fl" style="width:'+1/c*100+'%">'+e+"</div>"}),$("#chart_top").html(r),r="";var c=n.length;$.each(n,function(t,e){r+='<div class="fl" style="width:'+1/c*100+'%">'+e+"</div>"}),$("#chart_bottom").html(r);var o=new iChart.LineBasic2D({render:"chart_content",data:i,align:"center",width:$("#chart_content").width(),height:$("#chart_content").height(),border:null,sub_option:{smooth:!0,listeners:{parseText:function(t,e){return e+"℃"}}},background_color:"rgba(0,0,0,0)",coordinate:{width:"90%",height:240,striped:!0,axis:{width:0},scale2grid:!1,offsetx:-3,grid_color:"#ffffff",scale:[{position:"left",start_scale:Math.min.apply(Math,e),end_scale:Math.max.apply(Math,t),scale_enable:!1,listeners:{parseText:function(){return{text:""}}}}]}});o.draw()}var n=!1,r=$(".dialog_forcast"),s=($(".dialog_trend"),$(".yb_container")),l=$(".yb_date").height(r.height()-r.find(".nav_top").height());p.click(function(){$(this).parent().parent().removeClass("show"),o.canBack(!1,"dialog")}),$(".btn_yubao").click(function(){r.addClass("show"),o.canBack(!0,"dialog"),n||e()}),$(".btn_forecast").click(function(){s.removeClass("trend")}),$(".btn_trend").click(function(){r.addClass("show"),s.addClass("trend")})})});