const qcTimer = {
	countDownValue: 0,
	timerSeed: null,

	init(config = {}) {
		const self = this;
		qcLog.log('Timer Init');
	},

	countDown(sec, fn, interval = 1000) {
		const self = this;
		self.countDownValue = sec;

		return new Promise((resolve, reject) => {
			self.timerSeed = window.setInterval(() => {
				if(self.countDownValue <= 0) {
					window.clearInterval(self.timerSeed);
					resolve();
				}
				fn(self.countDownValue);
				self.countDownValue--;
			}, interval);
		});
	},
};