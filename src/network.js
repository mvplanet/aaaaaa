const qcNetwork = {
	onlineFlag: true,
	downloadList: {},

	init() {
		const self = this;
		qcLog.log('Network Init', 0);
		window.addEventListener('online', this.onlineStatus);
		window.addEventListener('offline', this.onlineStatus);
	},

	onlineStatus() {
		qcLog.log('Network status: ' + (navigator.onLine ? 'online' : 'offline'), 2);
		this.onlineFlag = navigator.onLine;
	},

	online() {
		return qcSocket.onlineFlag;
	},

	offline() {
		return !qcSocket.onlineFlag;
	},

	ajaxReq(tp, uri, data = {}, respSource = false, ajaxTimeout = 30000) {
		const self = this;

		return new Promise((resolve, reject) => {
			if(self.offline() && $.inArray(uri, qcConfig.apiCache) > -1) {
				qcDatabase.getDeviceInfo(uri).then((resp) => {
					resolve(resp.response);
				});
			}else{
				// http request
				const httpOptions = {
					url: `${qcConfig.api.protocol}://${qcConfig.api.host}/${qcConfig.api.version}/${uri}`,
					method: tp,
					timeout: ajaxTimeout,
					headers: {
						MacAddress: qcConfig.macAddress,
						AppVersion: qcConfig.autoUpdater.currentVersion
					},
					formData: data
				};
				request(httpOptions, (err, resp, body) => {
					if(!err && resp.statusCode == 200) {
						// qcLog.log(`Network resp: ${body}`, 5);
						const respJSON = qcMisc.parseJSON(body);
						if(respJSON.meta.stat=='ok') {
							if($.inArray(respJSON.meta.method, qcConfig.apiCache) > -1) {
								qcDatabase.setDeviceInfo({
									key: respJSON.meta.method,
									response: (respSource ? respJSON : respJSON.response)
								});
							}
							resolve((respSource ? respJSON : respJSON.response));
						}else{
							reject(respJSON.meta);
						}
					} else {
						qcLog.log(`Network request error: ${JSON.stringify(err)}`, 2);
						reject({
							err: `Network request error: ${JSON.stringify(err)}`,
							uri: uri,
							resp: resp,
							mac: qcConfig.macAddress,
							version: qcConfig.autoUpdater.currentVersion
						});
					}
				});
			}
		});
	},

	localJSON(dataUrl) {
		return new Promise((resolve, reject) => {
			$.getJSON(dataUrl, (data) => {
				resolve(data);
			});
		});
	}
};
