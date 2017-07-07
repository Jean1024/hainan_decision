/******设置根元素字体大小*******/
!function(win,doc){
    var d=doc.documentElement;
    function change(){
        var fz = d.clientWidth/48 > 20 ? 20 : d.clientWidth/48;
        d.style.fontSize= fz+'px';
    }
    win.addEventListener('resize',change,false);
    change();
}(window,document);
