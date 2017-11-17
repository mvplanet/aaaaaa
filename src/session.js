const qcSession = {
	sessions: [],

	init() {
		const self = this;
		qcLog.log('Session Init', 0);
	},

	set(key, value = '') {
		const self = this;
		self.sessions.push(key);
		window.sessionStorage.setItem(key, JSON.stringify(value));
	},

	get(key) {
		const valueString = window.sessionStorage.getItem(key);
		return JSON.parse(valueString);
	},

	remove(key) {
		window.sessionStorage.removeItem(key);
	},

	clear() {
		const self = this;
		$.each(self.sessions, (idx, item) => {
			self.remove(self.sessions[idx]);
		});
		self.sessions = [];
	}
};