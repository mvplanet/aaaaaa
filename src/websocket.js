const qcSocket = {
	onlineFlag: false,
	status: 'DISCONNECT',
	socket: null,
	firstTimeCallback: true,
	networkChangeCbFn: null,
	
	init() {
		const self = this;
		qcLog.log('WebSocket Init', 0);

		return new Promise((resolve, reject) => {
			self.connect().then(() => {
				if(!qcConfig.debug.offlineLaunchMode) {
					resolve();
				}
			});
			if(qcConfig.debug.offlineLaunchMode) {
				qcLog.log('Socket Offline Launch Mode', 0);
				resolve();
			}
		});
	},

	setChangeBack(fn) {
		this.networkChangeCbFn = fn;
	},

	connect() {
		const self = this;

		return new Promise((resolve, reject) => {
			self.socket = socket.connect(`${qcConfig.socket.host}:${qcConfig.socket.port}`, {
				secure: true,
				rejectUnauthorized: false,
				forceNew: true,
				autoConnect: true,
				reconnection: true,
				reconnectionDelay: 10000,
				timeout: qcConfig.socket.timeout,
				transports: ['websocket', 'polling']
			});

			self.socket.on('connect', () => {
				self.status = 'CONNECT';
				self.onlineFlag = true;
				qcLog.log(`WebSocket Connect ${qcConfig.macAddress}`, 2);
				self.socket.emit('iDevice', qcConfig.macAddress);
				if(typeof self.networkChangeCbFn === 'function') {
					self.networkChangeCbFn(true);
				}
				if(self.firstTimeCallback) {
					self.firstTimeCallback = false;
					resolve();
				}
			});

			self.socket.on('connect_timeout', () => {
				self.status = 'DISCONNECT';
				self.onlineFlag = false;
				qcLog.log('WebSocket Connect Timeout', 2);
				if(typeof self.networkChangeCbFn === 'function') {
					self.networkChangeCbFn(false);
				}
				if(self.firstTimeCallback) {
					self.firstTimeCallback = false;
					resolve();
				}
			});

			self.socket.on('disconnect', () => {
				self.status = 'DISCONNECT';
				self.onlineFlag = false;
				qcLog.log('WebSocket Disconnect', 2);
				if(typeof self.networkChangeCbFn === 'function') {
					self.networkChangeCbFn(false);
				}
				if(self.firstTimeCallback) {
					self.firstTimeCallback = false;
					resolve();
				}
			});

			self.socket.on('connect_error', (err) => {
				self.status = 'DISCONNECT';
				self.onlineFlag = false;
				qcLog.log(`WebSocket Error: ${JSON.stringify(err)}`, 3);
				if(typeof self.networkChangeCbFn === 'function') {
					self.networkChangeCbFn(false);
				}
				if(self.firstTimeCallback) {
					self.firstTimeCallback = false;
					resolve();
				}
			});

			self.socket.on('message', (req) => {
				qcLog.log(`WebSocket Message: ${JSON.stringify(req)}`, 3);
			});

			self.socket.on('command', (req) => {
				qcLog.log(`WebSocket Command: ${JSON.stringify(req)}`, 3);
			});
		});
	},

	online() {
		return this.onlineFlag;
	}
};