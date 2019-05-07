         
/**
 * 时间刻度尺组件
 * Created by luoxi on 2019/04/29.
 */

var picktime = '9:00';
var conflict = null;

var staticPro = {
  min: 0,
  max: 1.5,
  barWidth: 2,
  startHour: 9,
  endHour: 18,
  screenPice: 6,//一屏可显示6个小时的时间跨度
  gap: 5,// 每个大刻度间隔5小格
  gapMinute: 0.5*60,// 每个大刻度间隔半个小时
}

staticPro.start = staticPro.startHour - staticPro.screenPice / 2;// 开始区域有1/2区域绘制空白数据
staticPro.end = staticPro.endHour + staticPro.screenPice / 2;// 结束区域有1/2区域绘制空白数据
staticPro.blocks = (staticPro.end - staticPro.start) / (staticPro.screenPice / 2);// 总共分为多少小块
staticPro.minMinute = staticPro.gapMinute / staticPro.gap; // 最小刻度的时间差

initChart();
document.getElementById('pointer').innerHTML=picktime;
if (conflict) {
  document.getElementById('pointer').classList.add("conflict");
  document.getElementById('timeline').classList.add("conflict");
} else {
  document.getElementById('pointer').classList.remove("conflict");
  document.getElementById('timeline').classList.remove("conflict");
}


function translate(StatusMinute) { // 转换分 --> 时&&分
		var hour = parseInt(StatusMinute / 60);
		var min = parseInt(StatusMinute % 60);
		var tmp = {hour: 0,minute: '00'};
		if (hour > 0){
				tmp.hour = hour;
		} 
		if (min > 0){
				tmp.minute = parseFloat(min) > 10 ? parseFloat(min) : '0' + parseFloat(min);
		}
		return tmp;
	}

  function creatData() { // 构造x轴坐标和data数据
		var dateArr={first:[],second:[]};
		var xArr=[];
		for (var i=staticPro.start;i<=staticPro.end;i+=0.5) {
			var n=null;
			if (String(i).indexOf('.')>-1) {
				n=parseInt(i)+':30'
			} else {
				n = i+':00'
			}
			if (i<staticPro.startHour || i >staticPro.endHour) {
				dateArr.first.push(staticPro.min);
					dateArr.second.push(staticPro.min);
			} else {
					dateArr.first.push(staticPro.max);
					dateArr.second.push(staticPro.min);
			}
			
			xArr.push(n);
			if (i==staticPro.end) {break;}
			for (var j=1;j<staticPro.gap;j++) {
				if (i<staticPro.startHour || i >=staticPro.endHour) {
					dateArr.first.push(staticPro.min);
					dateArr.second.push(staticPro.min);
				} else {
					dateArr.first.push(staticPro.min);
					dateArr.second.push(1);
				}
				var m = null;
				if (String(i).indexOf('.')>-1) {
					xArr.push(parseInt(i)+":"+(j*staticPro.minMinute + staticPro.gapMinute));
				} else {
					m = j*staticPro.minMinute > 10 ? j*staticPro.minMinute : '0'+(j*staticPro.minMinute);
					xArr.push(i+":"+m);
				}
			}
		}

		var keyArr = Object.keys(dateArr)
		var keyLen = keyArr.length;
		var chartData = new Array(keyLen);
		for (var i = 0;i < keyLen;i++) {
			chartData[i] = {
				type: 'bar',
				barWidth:staticPro.barWidth,
				stack:'a',
				data:dateArr[keyArr[i]],
				itemStyle:{color:'#ccc'}
			}
			if(keyArr[i] === 'first'){
				chartData[i].itemStyle.color = '#999';
			}
		}
		return {
			xArr:xArr,
			data:chartData
		}
	}
	
	function throttle(method,delay,duration) { //节流函数
		var timer = null;
		var begin = new Date();    
		return function(){                
			var context = this, args = arguments;
			var current = new Date();        
			clearTimeout(timer);
			if(current - begin >= duration){
					method.apply(context,args);
					begin = current;
			}else{
					timer = setTimeout(()=>{
							method.apply(context,args);
					},delay);
			}
		}
}
	//刻度尺左右蒙层  TODO
  function initChart() { // 初始化chart
		var tmpData = creatData();
		var chart = echarts.init(document.getElementById('echart'), null, {});
		var offset = 100 / (tmpData.xArr.length - 1);

		var startZoom = 0;
		
		var endZoom = startZoom + (100 / staticPro.blocks) * 2;
		endZoom = endZoom > 100 ? 100 : endZoom;
		var option = {
			// animation:false,
			axisPointer:{
				triggerOn: 'none',
				snap: false,
			},
			grid:{
				top: '26px',
				left: '2px',
				right: '2px',
				bottom: 0
			},
			xAxis: {
				type: 'category',
				boundaryGap: false,
				nameGap: 0,
				show: false,
				position: 'top',
				data: tmpData.xArr
			},
			yAxis: {
				type: 'value',
				boundaryGap: false,
				nameGap: 0,
				show: false,
				inverse: true,
				min: staticPro.min,
				max: staticPro.max,
				splitNumber: 1
			},
			dataZoom: [{
				type: 'inside',
				show: true,
				xAxisIndex: [0],
				start: startZoom,
				filterMode: 'weekfilter',
				minValueSpan: 1,
				zoomLock: true,
				end: endZoom, //初始化滚动条
				preventDefaultMouseMove: true
			}],
			series: tmpData.data
	  };
    console.log(JSON.stringify(option))
    chart.setOption(option);
		
		var callback = throttle(function(data){
			var start = data.batch[0].start;
			var minutes=Math.round(start / offset) * this.staticPro.minMinute;
			var times = this.translate(minutes);
			var time = (this.staticPro.startHour+times.hour) + ':' + times.minute;
      document.getElementById('pointer').innerHTML=time;
	  },100,300);

    chart.on("dataZoom",(data)=>{
			callback(data);
    });
  }

