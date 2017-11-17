const qcUploader = {
	uploadSeed: null,
	uploadFlag: false,
	uploadMessageFlag: false,
	uploadExtendDataFlag: false,

	init() {
		const self = this;
		qcLog.log('Uploader Init', 0);

		if(!qcConfig.debug.disabledUploadFile) {
			self.uploadSeed = window.setInterval(() => {
				if(!self.uploadFlag && !self.uploadMessageFlag && !self.uploadExtendDataFlag && qcNetwork.online()) {
					if(qcConfig.uploader.uploadFile) {
						self.uploadTask();
					}
					if(qcConfig.uploader.uploadContact) {
						self.messageTask();
					}
					if(qcConfig.uploader.uploadExtendData) {
						self.extendData();
					}
				}
			}, qcConfig.uploader.interval);
		}
	},

	extendData() {
		const self = this;
		self.uploadExtendDataFlag = true;

		qcDatabase.getExtendData().then((results) => {
			$.each(results, (idx, item) => {
				$.each(item.data, (idx2, item2) => {
					item2.accessCode = item.access_code;
					item2.createTime = item.create_time;
					item2.deviceId = qcConfig.deviceInfo.id;
					item2.contact = item.contact;
					qcNetwork.ajaxReq('POST', 'extend/record', {jsonBody: JSON.stringify(item2)}, true).then((data) => {
						qcLog.log(`Uploader extend: ${JSON.stringify(data)}`, 4);
						if(data.meta.stat == 'ok') {
							qcDatabase.deleteExtendData(item.access_code);
						}
					});
				});
			});
			self.uploadExtendDataFlag = false;
		});
	},

	uploadTask() {
		const self = this;

		qcDatabase.getTask().then((result) => {
			if(result) {
				if(result.discard == 'YES') {
					qcLog.log(`Uploader task ${result.access_code} Discard`, 4);
					return Promise.reject({
						removeTask: true,
						accessCode: result.access_code
					});
				}else{
					qcLog.log(`Uploader task ${result.access_code} Start`, 4);
					return self._uploadFile(result);
				}
			} else {
				return Promise.reject();
			}
		}).then((req) => {
			qcLog.log(`Uploader task ${JSON.stringify(req)} Done`, 4);
			self.uploadFlag = false;
			if(req.removeTask) {
				qcLog.log(`Uploader clear task ${req.accessCode}`, 4);
				return qcDatabase.deleteTask(req.accessCode);
			}
		}).catch((e) => {
			if(typeof e !== 'undefined') {
				if(typeof e.accessCode !== 'undefined' && e.removeTask) {
					qcDatabase.deleteTask(e.accessCode);
					qcDatabase.deleteSent(e.accessCode);
				}
				if(typeof e.err !== 'undefined') {
					qcLog.log(`Uploader Error: ${JSON.stringify(e.err)}`, 4);
				}
			}
			self.uploadFlag = false;
		});
	},

	_uploadFile(result, removeFileWithDone = true) {
		const self = this;
		self.uploadFlag = true;

		const contentTypes = {
			'.jpg': 'image/jpeg',
			'.gif': 'image/gif',
			'.mp4': 'video/mp4'
		};

		return new Promise((resolve, reject) => {
			let postFile = [{
				fieldName: 'upload_file',
				fileName: fspath.basename(result.source_file),
				filePath: result.source_file,
				fileType: contentTypes[fspath.extname(result.source_file)]
			}];

			if(result.type == 'GIF' || result.type == 'VIDEO') {
				let fpath = qcFile._uploadFileName(result.access_code, 'jpg');
				postFile.push({
					fieldName: 'thumbnail_file',
					fileName: fspath.basename(fpath),
					filePath: fpath,
					fileType: contentTypes['.jpg']
				});
			}

			postFile.map((item) => {
				if(!qcFile.existsSync(item.filePath)) {
					qcLog.log(`Uploader ${result.access_code} file not find`, 4);
					reject({
						err: 'file not find',
						removeTask: true,
						accessCode: result.access_code
					});
				}
			});

			// http request
			let httpOptions = {
				url: `${qcConfig.api.protocol}://${qcConfig.api.host}/${qcConfig.api.version}/uploader/upload`,
				method: 'POST',
				timeout: 30000,
				headers: {
					MacAddress: qcConfig.macAddress
				},
				formData: {
					sponsor_id: result.sponsor_id,
					access_code: result.access_code,	
					type: result.type,	
					privacy: (result.privacy || 'NO')
				}
			};
			postFile.map((item, idx) => {
				httpOptions.formData[item.fieldName] = {
					value: fs.createReadStream(item.filePath),
					options: {
						filename: item.fileName,
						contentType: item.fileType
					}
				};
				httpOptions.formData[`${item.fieldName}_asc`] = qcMisc.md5File(item.filePath);
			});

			request(httpOptions, (err, resp, body) => {
				if(!err && resp.statusCode == 200) {
					qcLog.log(`Uploader resp: ${body}`, 2);
					const respJSON = qcMisc.parseJSON(body);
					const uploadSccuessFlag = [200, 320].indexOf(respJSON.meta.code) > -1;

					if(removeFileWithDone && uploadSccuessFlag) {
						$.each(postFile, (idx, item) => {
							qcFile.remove(item.filePath);
						});
						qcLog.log('Uploader remove files', 2);
					}

					resolve({
						removeTask: uploadSccuessFlag,
						accessCode: result.access_code
					});
				} else {
					qcLog.log(`Uploader error: ${JSON.stringify(err)}`, 2);
					reject({
						removeTask: false,
						err: err
					});
				}
			});
		});
	}
};
