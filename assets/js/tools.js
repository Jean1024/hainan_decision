function getJSON(url,method,dataType,callback){
  $.ajax({
    url: url,
    type: method,
    dataType: dataType,
    success: function (data) {
      callback(data)
    }
  });
}
function initMap(idName,baseUrl){
  // 百度地图API功能
  var map = new BMap.Map(idName,{minZoom:7,maxZoom:11});    // 创建Map实例
   // 添加底层图
  var pStart = new BMap.Point(-179,-89);
  var pEnd = new BMap.Point(180,90);
  var rectangle = new BMap.Polygon([
    new BMap.Point(pStart.lng,pStart.lat),
    new BMap.Point(pEnd.lng,pStart.lat),
    new BMap.Point(pEnd.lng,pEnd.lat),
    new BMap.Point(pStart.lng,pEnd.lat)
    ], {fillColor:"white", fillOpacity:1}); 
  map.addOverlay(rectangle);   
  map.centerAndZoom(new BMap.Point(109.88, 19.31), 9);  // 初始化地图,设置中心点坐标和地图级别
  map.enableScrollWheelZoom();   //启用滚轮放大缩小，默认禁用
  map.enableContinuousZoom();    //启用地图惯性拖拽，默认禁用
  map.setCurrentCity("海南");          // 设置地图显示的城市 此项是必须设置的
  map.enableScrollWheelZoom(true);     //开启鼠标滚轮缩放
  // 拖拽事件
  map.addEventListener("dragend", function(evt){　　
    var cp = map.getCenter();   
    if (cp.lat > 22 || cp.lat < 16 || cp.lng < 106 || cp.lng > 112  ) {
      map.panTo(new BMap.Point(109.88, 19.31));
    }
  });
  // map.addEventListener("dragging", function(evt){
  //    var offsetPoint = new BMap.Pixel(evt.offsetX, evt.offsetY);   //记录鼠标当前点坐标<br>   alert(offsetPoint.x+","+offsetPointY);
  // });

  // map.addEventListener("dragend", function showInfo(){
  //    var cp = map.getCenter();
  //    // alert(cp.lng + "," + cp.lat);
  // });
  $.ajax({
    url:baseUrl,
    type: "GET",
    dataType: 'json',
    success: function (data) {
      var imgSrc = data.cutlineUrl
      // 定义一个控件类,即function
      function ZoomControl(){
        // 默认停靠位置和偏移量
        this.defaultAnchor = BMAP_ANCHOR_BOTTOM_RIGHT;
        this.defaultOffset = new BMap.Size(10, 10);
      }
      // 通过JavaScript的prototype属性继承于BMap.Control
      ZoomControl.prototype = new BMap.Control();
      // 在本方法中创建个div元素作为控件的容器,并将其添加到地图容器中
      ZoomControl.prototype.initialize = function(map){
        // 创建一个DOM元素
        var div = document.createElement("img");
        // 添加文字说明
        div.src = imgSrc
        div.height = '200'
        // 添加DOM元素到地图中
        map.getContainer().appendChild(div);
        // 将DOM元素返回
        return div;
      }
      // 创建控件
      var myZoomCtrl = new ZoomControl();
      // 添加到地图当中
      map.addControl(myZoomCtrl);
      getJSON(data.dataUrl,'GET','json',function(datas){
        var data = datas.l
        for (var i = 0; i < data.length; i++) {
          // 区域填充色
          var color = 'rgba('+ data[i].c[0] +','+data[i].c[1] +','+ data[i].c[2] +','+data[i].c[3] +')'
          // 等值线的值
          var value = data[i].v
          // 获取区域坐标数组，画出区域
          var dataArr =  data[i].p.split(';')
          var len = dataArr.length
          for (var j = 0; j < len; j++) {
            dataArr[j] = dataArr[j].split(',')
            dataArr[j] = new BMap.Point(dataArr[j][0],dataArr[j][1])
          }
          // 绘制等值线
          var polygon = new BMap.Polygon(dataArr, {fillColor:color,strokeColor:'gray', strokeWeight:1, strokeOpacity:1});  //创建多边形
          map.addOverlay(polygon);
          // 绘制等值线的值
          var opts = {
            position : new BMap.Point(dataArr[parseInt(len/2)]['lng'],dataArr[parseInt(len/2)]['lat']),    // 指定文本标注所在的地理位置
            offset   : new BMap.Size(-10, -10)    //设置文本偏移量
          }
          var label = new BMap.Label(value, opts);  // 创建文本标注对象
            label.setStyle({
              border: "0 none",
              background: "transparent",
              color : "#000",
              fontSize : "12px",
              height : "20px",
              lineHeight : "20px",
              fontFamily:"微软雅黑"
             });
          map.addOverlay(label);
        }
        getJSON('../json/hnGeo.json','GET','json',function(datas){
          console.log(datas)
          var data = datas.districts
          var len =data.length
          var polyline = datas.polyline
          polyline =  polyline.split('|')
          for (var i = 0; i < len; i++) {
            var name = data[i].name
            // 设置城市名称格式
            if (name === '五指山市') {
              name = '五指山'
            }else{
              name = name.substr(0,2)
            }
            var dataArr = data[i].center.split(",")
            var lon =dataArr[0]
            var lat =dataArr[1]
            var opts = {
              position : new BMap.Point(lon,lat),    // 指定文本标注所在的地理位置
              offset   : new BMap.Size(5, 0)    //设置文本偏移量
            }
            var opts1 = {
              position : new BMap.Point(lon,lat),    // 指定文本标注所在的地理位置
              offset   : new BMap.Size(0, 0)    //设置文本偏移量
            }
            var label = new BMap.Label(name, opts);  // 创建文本标注对象
              label.setStyle({
                border: "0 none",
                background: "transparent",
                color : "#000",
                fontSize : "12px",
                height : "20px",
                lineHeight : "20px",
                fontFamily:"微软雅黑",
                transform:"translate(-50%,-50%)"
               });
            var label1 = new BMap.Label('·', opts1);  // 创建文本标注对象
              label1.setStyle({
                border: "0 none",
                background: "transparent",
                color : "#000",
                fontSize : "20px",
                height : "20px",
                lineHeight : "20px",
               });
            map.addOverlay(label);
            map.addOverlay(label1);
          }
          for (var i = 0; i < polyline.length; i++) {
            var polylineArr = polyline[i].split(';')
            for (var j = 0; j < polylineArr.length; j++) {
              polylineArr[j] =polylineArr[j].split(',')
              polylineArr[j] = new BMap.Point(polylineArr[j][0],polylineArr[j][1])
            }
            var polygon2 = new BMap.Polygon(polylineArr, {fillColor:"transparent",strokeColor:'#6ec2e8', strokeWeight:1, strokeOpacity:1});  //创建多边形
            map.addOverlay(polygon2);
          }
        }) 
      })
    }
  }); 
}
