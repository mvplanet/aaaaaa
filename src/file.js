const qcFile = {
	init() {
		const self = this;
		qcLog.log('File Init Directory', 0);

		return new Promise((resolve, reject) => {
			resolve();
		});
	},

	loadConfig(configFile = `${qcConfig.appBasePath}/${qcConfig.asarPack.appPack}/config.json`) {
		const self = this;
		qcLog.log('File Load Config', 0);

		return new Promise((resolve, reject) => {
			fs.readJson(configFile, (err, data) => {
				resolve((!err ? data : {}));
			});
		});
	},

	loadBitmap(imageURL) {
		return new Promise((resolve, reject) => {
			let _imageBitmap = new createjs.Bitmap(imageURL);
			_imageBitmap.image.onload = function() {
				resolve(_imageBitmap);
			};
		});
	},

	createResourceDir(resourcePath = qcConfig.resourcesBasePath) {
		const self = this;

		qcLog.log(`File Resource Path: ${resourcePath}`, 3);
		return new Promise((resolve, reject) => {
			qcLog.log(`File Resource Path: ${resourcePath}`, 4);
			['top_banner', 'watermark', 'pre_image', 'post_image', 'flash_image', 'upload_list', 'logs', 'video_banner', 'dist', 'updates', 'ar'].map((dir) => {
				fs.mkdirsSync(`${resourcePath}/${dir}`);
			});
			fs.emptyDirSync(`${resourcePath}/dist`);
			resolve();
		});
	},

	clearDir() {
		['top_banner', 'watermark', 'pre_image', 'post_image', 'flash_image', 'upload_list', 'dist', 'updates', 'ar'].map((dir) => {
			fs.emptyDirSync(`${qcConfig.resourcesBasePath}/${dir}`);
		});
	},

	dataURL2Blob(dataurl) {
		let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
		bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
		while(n--) {
			u8arr[n] = bstr.charCodeAt(n);
		}
		return new Blob([u8arr], {type:mime});
	},

	blob2URL(blob) {
		return window.URL.createObjectURL(blob);
	},

	URLClear(blob) {
		window.URL.revokeObjectURL(blob);
		return true;
	},

	dataURL2Base64(dataurl) {
		const base64Data = dataurl.replace(/^data:\w+\/\w+;base64,/, "");
		return new Buffer(base64Data, 'base64');
	},

	blob2DataURL(blob) {
		const self = this;

		return new Promise((resolve, reject) => {
			let reader = new FileReader();
			reader.onload = function(e) {
				resolve(e.target.result);
			};
			reader.readAsDataURL(blob);
		});
	},

	read(fileName) {
		const self = this;

		return new Promise((resolve, reject) => {
			fs.readFile(fileName, (err, data) => {
				if(err) {
					reject(err);
				}else{
					resolve(data);
				}
			});
		});
	},

	write(fileName, fileData) {
		const self = this;

		return new Promise((resolve, reject) => {
			fs.writeFile(fileName, fileData, (err) => {
				if(err) {
					reject(err);
				}else{
					resolve();
				}
			});
		});
	},

	rename(oldName, newName) {
		const self = this;

		return new Promise((resolve, reject) => {
			fs.rename(oldName, newName, (err) => {
				if(err) {
					reject(err);
				}else{
					resolve();
				}
			});
		});
	},

	exists(filePath) {
		const self = this;

		return new Promise((resolve, reject) => {
			fs.stat(filePath, (err, stats) => {
				if(err == null) {
					resolve(true);
				}else if(err.code == 'ENOENT') {
					resolve(false);
				}
			});
		});
	},

	existsSync(filePath) {
		return fs.existsSync(filePath);
	},

	appendLog(errorMsg) {
		const self = this;
		const nowDate = moment().format('YYYY-MM-DD');
		const logFile = `${qcConfig.resourcesBasePath}/logs/${nowDate}.log`;
		if(!self.existsSync(`${qcConfig.resourcesBasePath}/logs`)) {
			fs.mkdirsSync(`${qcConfig.resourcesBasePath}/logs`);
		}
		fs.appendFileSync(logFile, `${moment().format('HH:mm:ss')}\t${errorMsg}\r\n`, 'utf8');
	},

	remove(fileName) {
		if(fs.existsSync(fileName)) {
			fs.removeSync(fileName);
		}
	},

	move(fileSrc, fileDest) {
		fs.moveSync(fileSrc, fileDest, {
			overwrite: true
		});
	},

	getFilesWithPath(fullPath, filter = null) {
		const self = this;

		return new Promise((resolve, reject) => {
			fs.readdir(fullPath, (err, files) => {
				let fileList = [];
				files.sort().forEach((file) => {
					if(filter) {
						if(filter.test(file)) {
							fileList.push(`${fullPath}/${file}`);
						}
					}else{
						fileList.push(`${fullPath}/${file}`);
					}
				});
				resolve(fileList);
			});
		});
	},

	getFileStat(fileName, type = 'size') {
		// atime mtime ctime
		const self = this;
		let fst = {};
		if(self.existsSync(fileName)) {
			fst = fs.statSync(fileName);
		}
		return typeof fst[type] !== 'undefined' ? fst[type] : '';
	},

	removeUploadFiles(type, accessCode) {
		const self = this;
		self.remove(self._uploadFileName(accessCode, 'jpg'));
		switch(type) {
			case 'gif':
				self.remove(self._uploadFileName(accessCode, 'gif'));
				break;
			case 'video':
				self.remove(self._uploadFileName(accessCode, 'webm'));
				self.remove(self._uploadFileName(accessCode, 'mp4'));
				break;
		}
	},

	getExtendName(fileName) {
		return fspath.extname(fileName).substr(1).toLowerCase();
	},

	_uploadFileName(accessName, fileExt = '') {
		return `${qcConfig.resourcesBasePath}/upload_list/${accessName}.${fileExt}`; 
	},

	_converWinPath(path) {
		return path.replace(/\.\//, '').replace(/\//g, '\\');
	}
};
