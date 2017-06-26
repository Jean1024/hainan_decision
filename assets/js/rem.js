/******设置根元素字体大小*******/
!function(win,doc){
    var d=doc.documentElement;
    function change(){
        d.style.fontSize= d.clientWidth/96+'px';
    }
    win.addEventListener('resize',change,false);
    change();
}(window,document);
