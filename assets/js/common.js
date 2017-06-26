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
	$('#paintCanvas').attr({'width':$(window).width(),'height':$(window).height()})
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