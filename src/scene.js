const qcScene = {
	waterMarks: [],
	waterMarksUpdate: null,
	waterMarksUpdateFlag: false,
	waterMarksHash: '',
	currentWaterMarkIdx: 0,
	currentScene: 'launch',
	currentBannerType: 'IMAGE',
	passPreImage: false,
	seed: {
		waterMark: null,
		camEnded: null,
		preImage: null,
		postImage: null,
		preview: null,
		watermarkChoice: null,
		arChoice: null
	},

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

				qcConfig.debug.disabledVideoBanner = false;
				if(qcConfig.deviceInfo.banner_type == 'VideoBanner' && !qcConfig.debug.disabledVideoBanner) {
					self.videoBanner();
				}else{
					$(qcCam.topBanner).show();
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

	setShootingInfo() {
		const self = this;
		const wmObj = self.waterMarks[self.currentWaterMarkIdx];
		qcSession.set('shootingWaterMarkInfo', wmObj);
		$(qcCam.camFlash).css({
			backgroundImage: (wmObj.image.flash_image ? wmObj.image.flash_image : $(qcCam.camFlash).data('backgroundImage'))
		});
		if(wmObj.image.pre_image != '') {
			$(qcCam.camPre).css({backgroundImage: `url(${wmObj.image.pre_image})`});
		}
		if(wmObj.image.post_image != '') {
			$(qcCam.camPost).css({backgroundImage: `url(${wmObj.image.post_image})`});
		}
		qcCam.setReverseMirror(wmObj.reverse_mirror);
		return wmObj;
	},

	waterMarkPreLoad(localPath, id, version, fileUrl) {
		const self = this;

		return new Promise((resolve, reject) => {
			const localName = self._sponsorResLocalName(localPath, id, fileUrl);
			let downloadFlag = false;
			if(fileUrl) {
				qcDatabase.getWaterMarkVersion(id).then((souVersion) => {
					souVersion = $.extend({}, {version: -1}, souVersion);
					if(souVersion.version!= version) {
						qcDatabase.setWaterMarkVersion({
							id: id,
							version: version,
							localName: localName
						});
						downloadFlag = true;
					}
					return qcFile.exists(localName);
				}).then((fef) => {
					if(downloadFlag || !fef) {
						qcNetwork.downloadFile(fileUrl, localName).then(() => {
							if(self.currentScene == 'launch') {
								let counter = parseInt($('#initialLoadingImageCounter').text()) + 1;
								$('#initialLoadingImageCounter').text(counter);
							}
							resolve();
						});
					}else{
						if(self.currentScene == 'launch') {
							let counter = parseInt($('#initialLoadingImageCounter').text()) + 1;
							$('#initialLoadingImageCounter').text(counter);
						}
						resolve();
					}
				});
			}else{
				resolve();
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

	showARChoice() {
		const self = this;

		return new Promise((resolve, reject) => {
			if(qcConfig.ar.enabledAR) {
				$(qcCam.camARChoice).show();
				$(qcCam.camARChoice).one('click', 'a.ar', (e) => {
					e.preventDefault();
					const arIdx = $(e.target).data('arIdx');
					const arType = $(e.target).data('arType');
					$(qcCam.camARChoice).find('a.selected').removeClass('selected');
					$(e.currentTarget).addClass('selected');
					
					if(arType == 'NO') {
						qcBrfv4.cleanLayer();
					} else {
						qcBrfv4.changeModules(arIdx);
					}
					$(qcCam.camARChoice).hide();

					window.clearTimeout(self.seed.arChoice);
					self.seed.arChoice = null;
					resolve();
				});

				if(qcConfig.ar.waitTime > 0) {
					self.seed.arChoice = window.setTimeout(() => {
						qcLog.log('Scene Choice AR Timeout', 5);
						$(qcCam.camARChoice).hide();
						reject({err: 'archoice timeout'});
					}, qcConfig.ar.waitTime);
				}
			} else {
				resolve();
			}
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

	showPreview(data = {type: 'none', accessCode: ''}, waitTime = 10000) {
		const self = this;

		return new Promise((resolve, reject) => {
			qcLog.log(`Scene Preview Show: ${data.accessCode} ${data.type}`, 5);
			self.currentScene = 'preview';
			qcFramework.cancelRelaunch();

			self.seed.preview = window.setTimeout(() => {
				qcLog.log('Scene Preview Close', 5);
				$(qcCam.camPreview).find('.preview').removeClass('preview');
				$(qcCam.camPreview).hide();
				resolve();
			}, waitTime);

			$(qcCam.camPreview).find('img').removeClass('preview previewEffect');
			$(qcCam.camPreview).find('video').removeClass('preview');
			$(qcCam.camPreview).show();
			switch(data.type) {
				case 'picture':
					$(qcCam.camPreview).find('img')
						.prop('src', qcFile._uploadFileName(data.accessCode, 'jpg'))
						.addClass('previewEffect');
					break;
				case 'gif':
					$(qcCam.camPreview).find('img')
						.prop('src', qcFile._uploadFileName(data.accessCode, 'gif'))
						.addClass('preview');
					break;
				case 'video':
					const videoFile = qcFile._uploadFileName(data.accessCode, 'webm');
					$(qcCam.camPreview).find('video').prop('src', videoFile).addClass('preview');
					break;
			}
			//$(qcCam.camPreview).fadeIn('slow');
		});
	},

	clear2Initial(continuousShotting = false) {
		const self = this;
		const accessCode = qcSession.get('shootingAccessCode');

		qcDatabase.addExtendData(accessCode, null, null, 'Y').then(() => {
			// close extend data if exists
		});

		if(!continuousShotting) {
			qcCam.lockWaterMark(false);
		}

		$(qcCam.camPreview).find('.preview').removeClass('preview');

		$(qcKeyboard.keyboardLayer).hide();
		$(qcCam.camEnded).hide();
		$(qcCam.camPreview).hide();
		$(qcCam.camFlash).hide();
		$(qcCam.camPre).hide();
		$(qcCam.camHtmlPre).hide();
		$(qcCam.camPost).hide();
		$(qcCam.camHtmlPost).hide();
		$(qcCam.camGIFThumbs).hide();
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
