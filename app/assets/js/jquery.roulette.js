const Roulette = {
	preImages: '#rouletteImages',
	wheelCanvas: '#wheelCanvas',
	fontStyle: '14px Microsoft YaHei',
	boldFontStyle: 'bold 20px Microsoft YaHei',
	rotateTime: 8000,
	gifts: [
		{title: '50M', subtitle: '免费流量包', color: '#FFF4D6'},
		{subtitle: '10闪币', color: '#FFFFFF', icon: 'flash'},
		{subtitle: '谢谢参与', color: '#FFF4D6', icon: 'thanks'},
		{subtitle: '5闪币', color: '#FFFFFF', icon: 'flash'},
		{title: '10M', subtitle: '免费流量包', color: '#FFF4D6'},
		{title: '20M', subtitle: '免费流量包', color: '#FFFFFF'},
		{subtitle: '20闪币', color: '#FFF4D6', icon: 'flash'},
		{title: '30M', subtitle: '免费流量包', color: '#FFFFFF'},
		{title: '100M', subtitle: '免费流量包', color: '#FFF4D6'},
		{subtitle: '2闪币', color: '#FFFFFF', icon: 'flash'}
	],
	outsideRadius: 192, //大转盘外圆的半径
	textRadius: 155, //大转盘奖品位置距离圆心的距离
	insideRadius: 68, //大转盘内圆的半径
	lineHeight: 18,
	startAngle: 0, //开始角度
	bRotate: false, //false:停止;ture:旋转
	turnplateSeed: null,
	stopCallbackFn: null,

	init(gifts = [], rotateTime = 8000) {
		const self = this;
		$.extend(self.gifts, gifts);
		self.rotateTime = rotateTime;
		self.drawRouletteWheel();
	},

	drawRouletteWheel() {
		const self = this;
		let ctx = $(self.wheelCanvas).get(0).getContext('2d');
		//根据奖品个数计算圆周角度
		let arc = Math.PI / (self.gifts.length / 2);

		//在给定矩形内清空一个矩形
		ctx.clearRect(0, 0, 422, 422);
		//strokeStyle 属性设置或返回用于笔触的颜色、渐变或模式  
		ctx.strokeStyle = '#FFBE04';
		//font 属性设置或返回画布上文本内容的当前字体属性
		ctx.font = self.fontStyle;

		self.gifts.map((gift, idx) => {
			let {title, subtitle, color, icon} = gift;
			let angle = self.startAngle + idx * arc;
			ctx.fillStyle = color;

			ctx.beginPath();
			//arc(x,y,r,起始角,结束角,绘制方向) 方法创建弧/曲线（用于创建圆或部分圆）
			ctx.arc(211, 211, self.outsideRadius, angle, angle + arc, false);
			ctx.arc(211, 211, self.insideRadius, angle + arc, angle, true);
			ctx.stroke();
			ctx.fill();
			//锁画布(为了保存之前的画布状态)
			ctx.save();

			//----绘制奖品开始----
			ctx.fillStyle = '#E5302F';
			//translate方法重新映射画布上的 (0,0) 位置
			ctx.translate(211 + Math.cos(angle + arc / 2) * self.textRadius, 211 + Math.sin(angle + arc / 2) * self.textRadius);

			//rotate方法旋转当前的绘图
			ctx.rotate(angle + arc / 2 + Math.PI / 2);
			
			/** 下面代码根据奖品类型、奖品名称长度渲染不同效果，如字体、颜色、图片效果。(具体根据实际情况改变) **/
			if(title) {
				ctx.font = self.boldFontStyle;
				ctx.fillText(title, -ctx.measureText(title).width / 2, 0);
			}
			if(subtitle) {
				ctx.font = self.fontStyle;
				ctx.fillText(subtitle, -ctx.measureText(subtitle).width / 2, self.lineHeight);
			}
			//添加对应图标
			if(icon) {
				let iconImg = $(self.preImages).find(`img[data-icon="${icon}"]`).get(0);
				ctx.drawImage(iconImg, -15, 28);
			}
			//把当前画布返回（调整）到上一个save()状态之前 
			ctx.restore();
		});
	},

	rotating() {
		return this.bRotate;
	},

	stopCallback(fn) {
		this.stopCallbackFn = fn;
	},

	rotateStart(itemID) {
		const self = this;
		let angles = itemID * (360 / self.gifts.length);
		angles-= (360 / (self.gifts.length * 2)); 
		angles = angles < 270 ? 270 - angles : 360 - angles + 270;
		self.bRotate = true;

		$(self.wheelCanvas).stopRotate();
		$(self.wheelCanvas).rotate({
			angle: 0,
			animateTo: angles + 1800,
			duration: self.rotateTime,
			callback: () => {
				self.bRotate = !self.bRotate;
				if(typeof self.stopCallbackFn === 'function') {
					self.stopCallbackFn();
				}
			}
		});
	}
};
