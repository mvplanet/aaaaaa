const qcScene = {
	currentScene: 'launch',

	init() {
		const self = this;
		qcLog.log('Scene Init', 0);

		$(qcEvent.camControl).on('show', () => {
			let relaunchFlag = false;
			if(qcConfig.system.autoReload && qcConfig.system.autoReloadShootCounter > 0 
				&& qcCam.getShootCounter() >= qcConfig.system.autoReloadShootCounter) {
				qcFramework.relaunch();
				relaunchFlag = true;
			} else if(qcConfig.ar.enabledAR && qcConfig.ar.arFilter 
				&& qcFramework.startupTime <= (Date.now() - qcConfig.ar.fullMemTime)) {
				relaunchFlag = true;
			}
			if(relaunchFlag) {
				qcFramework.waitRelaunch(10000);
			}
		});

		$(qcCam.camEnded).on('hide', () => {
			$(qcCam.camEnded).find('a[data-action="retakePreview"]').unbind('click');
			$(qcCam.camEnded).find('a[data-action="skipPreview"]').unbind('click');
			if(self.seed.camEnded) {
				window.clearTimeout(self.seed.camEnded);
				self.seed.camEnded = null;
			}
		});

		if(qcConfig.ar.enabledAR && qcConfig.ar.arFilter) {
			window.setTimeout(() => {
				qcFramework.waitRelaunch(10000);
			}, qcConfig.ar.fullMemTime);
		}

		return new Promise((resolve, reject) => {
			$(qcCam.camFlash).data('backgroundImage', $(qcCam.camFlash).css('backgroundImage'));

			qcNetwork.ajaxReq('POST', 'device/register', {
				mac_address: qcConfig.macAddress,
				device_name: qcConfig.system.computerName,
				passwd: qcConfig.api.registerPasswd
			}, true).then((data) => {
				if(data.meta.code != 200) {
					reject({
						code: data.meta.code,
						error: data.meta.error
					});
				}
				return qcNetwork.ajaxReq('GET', 'device/info');
			}).then((data) => {
				$.extend(qcConfig.deviceInfo, data);
				if(data.status !== 'ACTIVE') {
					qcNotification.warning('Device Inactive, cannot upload Media.');
				}

				if(data.app_autoupdate == 'YES') {
					qcConfig.autoUpdater.enabledAutoUpdate = true;
					qcAutoUpdater.checkUpdate();
					qcFramework.appTitle();
				}
				
				if(qcConfig.deviceInfo.plugins.pre_html.id && !qcConfig.preImage.extPage) {
					qcConfig.preImage.extPage = `${qcConfig.deviceInfo.plugins.pre_html.package_name}/index.html`;
				}
				if(qcConfig.deviceInfo.plugins.post_html.id && !qcConfig.postImage.extPage) {
					qcConfig.postImage.extPage = `${qcConfig.deviceInfo.plugins.post_html.package_name}/index.html`;
				}

				if(qcConfig.ar.enabledAR && $.inArray(qcConfig.deviceInfo.ar_type, qcConfig.ar.filterPacks) > -1) {
					qcConfig.ar.arFilter = `Filter-${qcConfig.deviceInfo.ar_type}`;
				} else {
					qcConfig.ar.enabledAR = false;
				}
				return self.getSponsor();
			}).then(() => {
				qcLog.log('Scene Sponsor Loaded', 1);
				self.sponsorResourceLoaded();

				if(qcConfig.ar.enabledAR) {
					let fileUrl = `${qcConfig.api.protocol}://${qcConfig.api.host}/${qcConfig.api.version}/device/ar/${qcConfig.deviceInfo.virtual_device_id}.json`;
					let localName = self._sponsorResLocalName('ar', 'ar', 'ar.json');
					if(qcFile.getFileStat(localName, 'size') != qcConfig.deviceInfo.ar_size) {
						qcNetwork.downloadFile(fileUrl, localName).then(() => {
							qcLog.log('Scene Download AR JSON', 2);
							resolve();
						});
					} else {
						resolve();
					}
				} else {
					resolve();
				}
			}).catch(reject);
		});
	},

	getScene() {
		return this.currentScene;
	},

	switch(sceneName) {
		const self = this;

		$('div.scene').each((idx, item) => {
			if($(item).data('pageName') == sceneName) {
				$(item).show();
			}else{
				$(item).hide();
			}
		});
	},

	showCamPosTip() {
		const self = this;

		return new Promise((resolve, reject) => {
			qcLog.log('Scene Pos Tip Show', 5);
			self.currentScene = 'posTip'; 
			$(qcCam.camPosTip).show();

			window.setTimeout(() => {
				qcLog.log('Scene Pos Tip Close', 5);
				$(qcCam.camPosTip).hide();
				resolve();
			}, qcConfig.capture.cameraPositionTipTime);
		});
	},

	showCamEnded() {
		const self = this;

		return new Promise((resolve, reject) => {
			qcLog.log('Scene Cam Ended Show', 5);
			qcCam.videoPause();
			qcCam.shootCounter();
			self.currentScene = 'camEnded';
			qcFramework.cancelRelaunch();

			if(qcConfig.camEnded.waitTime > 0) {
				self.seed.camEnded = window.setTimeout(() => {
					qcLog.log('Scene Cam Ended Timeout', 5);
					$(qcCam.camEnded).hide();
					reject({err: 'ended timeout', removeFile: true});
				}, qcConfig.camEnded.waitTime);
			}

			$(qcCam.camEnded).fadeIn('slow');
			$(qcCam.camEnded).find('a[data-action="retakePreview"]').one('click', (e) => {
				e.preventDefault();
				qcLog.log('Scene Cam Ended Click Retake', 5);
				$(qcCam.camEnded).hide();
				reject({err: 'ended retake', removeFile: true});
			});
			$(qcCam.camEnded).find('a[data-action="skipPreview"]').one('click', (e) => {
				e.preventDefault();
				qcLog.log('Scene Cam Ended Click Skip', 5);
				$(qcBrfv4.canvasGroup).addClass('pause');
				$(qcCam.camEnded).hide();
				resolve();
			});
		});
	},

	clear2Initial(continuousShotting = false) {
		const self = this;
		const accessCode = qcSession.get('shootingAccessCode');

		$(qcCam.camPreview).find('.preview').removeClass('preview');

		$(qcKeyboard.keyboardLayer).hide();
		$(qcCam.camEnded).hide();
		$(qcCam.camPreview).hide();
		$(qcCam.camTimer).hide();
		if(!continuousShotting) {
			$(qcEvent.camControl).show();
			qcGallery.show();
		}
		qcCam.videoResume();
		self.currentScene = 'init';
	},

	_sponsorResLocalName(localPath, id, fileUrl) {
		return fileUrl ? `${qcConfig.resourcesBasePath}/${localPath}/${id}${fspath.extname(fileUrl)}` : '';
	},

	_findWaterMarkIndex(id) {
		const self = this;
		let wmIdx = 0;
		$.each(self.waterMarks, (idx, item) => {
			if(item.id == id) {
				wmIdx = idx;
			}
		});
		return wmIdx;
	}
};
