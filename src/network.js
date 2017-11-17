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

	downloadFile(fileUrl, targetFile) {
		const self = this;

		return new Promise((resolve, reject) => {
			let downloadCounterSeed = window.setInterval(() => {
				const distFileName = qcMisc.hash(`${targetFile}/${Date.now()}`);
				if(typeof self.downloadList[distFileName] === 'undefined' && Object.keys(self.downloadList).length < qcConfig.launch.downloadSupervene) {
					const distFile = `${qcConfig.resourcesBasePath}/dist/${distFileName}`;
					let downloadSeed = null;
					let file = fs.createWriteStream(distFile);
					let fileSize = -1;
					qcNetwork.downloadList[distFileName] = true;

					let req = http.get(fileUrl, (response) => {
						fileSize = parseInt(response.headers['content-length']);
						qcLog.log(`Network Download: ${fileUrl}`, 5);
						window.clearTimeout(downloadSeed);
						response.pipe(file);
					}).on('close', () => {
						// file close to resolve
						//resolve();
					}).on('error', (e) => {
						// TODO: download error
						window.clearTimeout(downloadSeed);
						file.close();
					}).on('abort', () => {
						window.clearTimeout(downloadSeed);
						file.close();
					});

					file.on('close', () => {
						delete qcNetwork.downloadList[distFileName];
						window.clearInterval(downloadCounterSeed);
						downloadCounterSeed = null;

						if(file.bytesWritten != fileSize) {
							// download file breakdown
							qcLog.log(`Network Download breakdown ${file.bytesWritten}/${fileSize}`, 3);
							qcFile.remove(distFile);
							downloadFile.downloadFile(fileUrl, targetFile).then(() => {
								resolve();
							});
						} else {
							qcFile.move(distFile, targetFile);
							resolve();
						}
					});

					downloadSeed = window.setTimeout(() => {
						qcLog.log(`Network Download: ${fileUrl} abort`, 5);
						req.abort();
					}, qcConfig.network.downloadTimeout);
				}
			}, 500);
		});
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
	},

	getMacAddress(saveDB = true) {
		const nifs = os.networkInterfaces();
		const rule = new RegExp(`^(${qcConfig.networkConnectionName.join('|')})`, 'iu');
		let macAddress = '';
		let backupAddress = '';
		$.each(nifs, (key, item) => {
			if(!backupAddress) {
				backupAddress = typeof item[0].mac !== 'undefined' ? item[0].mac : '';
			}
			if(rule.test(key)) {
				macAddress = item[0].mac;
			}
		});
		if(!macAddress && backupAddress) {
			macAddress = backupAddress;
		}
		if(macAddress && saveDB) {
			qcDatabase.setDeviceInfo({
				key: 'location/macAddress',
				response: macAddress
			});
		}
		return macAddress;
	}
};
