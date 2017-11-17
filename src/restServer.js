const qcRestify = {
	server: express(),
	pageLoadedCallbackFn: null,
	finishCallbackFn: null,
	timeoutCallbackFn: null,

	init() {
		const self = this;
		qcLog.log(`Restify Init ${qcConfig.localApi.port}`);

		self.server.use(bodyParser.urlencoded({
			extended: true
		}));
		// parse application/json 
		self.server.use(bodyParser.json());
		self.server.use(express.static(`${qcConfig.appBasePath}/${qcConfig.asarPack.appPack}/assets`));
		self.server.use('/plugins', express.static(`${qcConfig.appBasePath}/${qcConfig.asarPack.pluginsPack}`));

		self.server.get('/hello', (req, res) => {
			res.send(self.returnValue('hello world'));
		});

		self.server.post('/brfv4/license', (req, res) => {
			res.send(qcConfig.license.brfv4License);
		});

		self.server.post('/api/page/loaded', (req, res) => {
			if(typeof self.pageLoadedCallbackFn === 'function') {
				self.pageLoadedCallbackFn();
			}
			res.send(self.returnValue());
		});

		self.server.post('/api/score/:accessCode', (req, res) => {
			qcNetwork.ajaxReq('POST', `extend/score/${req.params.accessCode}`, req.body, false, 5000).then((data) => {
				qcLog.log(`Restify: ${req.body.type}, ${JSON.stringify(data)}`, 4);
				res.send(self.returnValue(data));
			}).catch((e) => {
				qcLog.log(`Restify Error: ${JSON.stringify(e)}`, 4);
			});
		});

		self.server.post('/api/submit/:accessCode', (req, res) => {
			qcLog.log(`Restify: ${req.params.accessCode}`, 4);
			qcDatabase.addExtendData(req.params.accessCode, req.body);
			res.send(self.returnValue());
		});

		self.server.post('/api/finish/:accessCode', (req, res) => {
			qcLog.log('Restify: finish', 4);
			res.send(self.returnValue('finish'));
			if(typeof self.finishCallbackFn === 'function') {
				self.finishCallbackFn();
			}
			self.cleanCallback();
		});

		self.server.post('/api/timeout/:accessCode', (req, res) => {
			qcLog.log('Restify: timeout', 4);
			res.send(self.returnValue('timeout'));
			if(typeof self.timeoutCallbackFn === 'function') {
				self.timeoutCallbackFn();
			}
			self.cleanCallback();
		});

		self.server.listen(qcConfig.localApi.port);
	},

	cleanCallback() {
		this.pageLoadedCallbackFn = null;
		this.finishCallbackFn = null;
		this.timeoutCallbackFn = null;
	},

	callback(fns) {
		if(typeof fns.pageLoaded === 'function') {
			this.pageLoadedCallbackFn = fns.pageLoaded;
		}
		if(typeof fns.finish === 'function') {
			this.finishCallbackFn = fns.finish;
		}
		if(typeof fns.timeout === 'function') {
			this.timeoutCallbackFn = fns.timeout;
		}
	},

	returnValue(data = null, flag = true) {
		let retVal = {
			success: flag
		};
		if(data) {
			retVal.data = data;
		}
		return retVal;
	}
};