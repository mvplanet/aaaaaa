const qcFramework = {
	startupTime: Date.now(),
	pageReloadSeed: null,
	pageReloadWaitKeySeed: null,
	localConfigPath: window.qcStartUpParams.configPath,

	init() {
		const self = this;
		qcLog.log('Framework Init', 0);

		return new Promise((resolve, reject) => {
			qcFile.loadConfig(self.localConfigPath).then((jsonData) => {
				qcLog.log('Framework Load Config', 1);
				self.appTitle();
				qcConfig = $.extend(true, qcConfig, jsonData);

				qcConfig.system.arch = os.arch();
				qcConfig.system.type = os.type();
				qcConfig.system.platform = os.platform();
				qcConfig.system.computerName = os.hostname();
				qcConfig.system.autoReloadShootCounter = parseInt(qcConfig.system.autoReloadShootCounter || 0);

				if(!qcConfig.resourcesBasePath) {
					qcConfig.resourcesBasePath = `${qcConfig.appBasePath}/files`;
				}

				qcConfig.debug.offlineLaunchMode = window.qcStartUpParams.quickStart;
				qcConfig.winPlatform = /^win/i.test(qcConfig.system.platform);

				if(!qcConfig.system.autoReloadShootCounter && !qcConfig.system.autoReloadLocTime) {
					qcConfig.system.autoReload = false;
				}

				const packageinfo = require('../package.json');
				qcConfig.autoUpdater.currentVersion = packageinfo.version;

				if(qcConfig.debug.devMode && qcConfig.debug.zoomSize < 1) {
					qcTheme.addStyle(`body { zoom: ${qcConfig.debug.zoomSize}; }`);
				}

				if(qcConfig.debug.cleanFilesWithLaunch) {
					qcFile.clearDir();
				}

				qcScene.disabledWatermarkArrow(qcConfig.watermark.disabledArrowChoiceOption);

				if(qcConfig.visenze.enabledExtract) {
					$(qcEvent.camControl).find('a[data-action="takeExtract"]').show();
				}

				if(qcConfig.system.autoReload && qcConfig.system.autoReloadLocTime) {
					const today = moment().format('YYYY-MM-DD');
					let reloadSec = moment().diff(`${today} ${qcConfig.system.autoReloadLocTime}`, 'seconds');
					if(reloadSec > 0) {
						const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
						reloadSec = moment().diff(`${tomorrow} ${qcConfig.system.autoReloadLocTime}`, 'seconds');
						reloadSec = Math.abs(reloadSec);
					} else {
						reloadSec = Math.abs(reloadSec);
					}
					if(reloadSec > 0) {
						qcLog.log(`App will restart after ${reloadSec} sec`, 1);
						window.setTimeout(() => {
							qcFramework.relaunch();
						}, reloadSec * 1000);
					}
				}

				$('div[data-load-page]').each((idx, item) => {
					const viewName = $(item).data('loadPage');
					const pageName = $(item).data('pageName');
					$(item).load(`./views/${viewName}`, () => {
						// disabled source webcam video rotation
					});
				});

				resolve();
			});
		});
	},

	relaunch() {
		const self = this;
		qcLog.log('Framework Page reload', 0);

		if(!qcEvent.getFFmpegRunningStatus()) {
			ipcRenderer.sendSync('app-restart', 'quick');
		} else if(qcAutoUpdater.hasUpdates) {
			self.pageReloadSeed = window.setInterval(() => {
				if(qcAutoUpdater.downloadCompleted) {
					window.clearInterval(self.pageReloadSeed);
					self.pageReloadSeed = null;
					ipcRenderer.sendSync('app-update');
				}
			}, 1000);
		} else {
			qcScene.switch('relaunch');
			self.pageReloadSeed = window.setInterval(() => {
				if(!qcEvent.getFFmpegRunningStatus()) {
					window.clearInterval(self.pageReloadSeed);
					self.pageReloadSeed = null;
					ipcRenderer.sendSync('app-restart', 'quick');
				}
			}, 500);
		}
	},

	waitRelaunch(waitTime = 30000) {
		const self = this;
		if(!self.pageReloadWaitKeySeed) {
			self.pageReloadWaitKeySeed = window.setTimeout(() => {
				self.relaunch();
			}, waitTime);
		}
	},

	cancelRelaunch() {
		const self = this;
		if(self.pageReloadWaitKeySeed) {
			window.clearTimeout(self.pageReloadWaitKeySeed);
			self.pageReloadWaitKeySeed = null;
		}
	},

	appTitle() {
		const qcPackage = require('../package.json');
		$('html').find('title').text(`${qcPackage.name} v${qcPackage.version} ${qcConfig.autoUpdater.enabledAutoUpdate ? 'AutoUpdate' : ''}`);
	}
};