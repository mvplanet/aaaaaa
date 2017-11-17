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

		$(qcCam.camWMChoice).on('hide', () => {
			$(qcCam.camWMChoice).find('a.watermarkList').unbind('click');
			if(self.seed.watermarkChoice) {
				window.clearTimeout(self.seed.watermarkChoice);
				self.seed.watermarkChoice = null;
			}
		});

		$(qcCam.camARChoice).on('hide', () => {
			$(qcCam.camARChoice).find('a.ar').unbind('click');
			if(self.seed.arChoice) {
				window.clearTimeout(self.seed.arChoice);
				self.seed.arChoice = null;
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

		$(qcCam.camPre).on('hide', () => {
			$(qcCam.camPre).unbind('click');
			if(self.seed.camPre) {
				window.clearTimeout(self.seed.camPre);
				self.seed.camPre = null;
			}
		});

		$(qcCam.camPost).on('hide', () => {
			$(qcCam.camPost).unbind('click');
			if(self.seed.postImage) {
				window.clearTimeout(self.seed.postImage);
				self.seed.postImage = null;
			}
		});

		window.setInterval(() => {
			if(!qcCam.shooting() && !self.waterMarksUpdateFlag) {
				qcLog.log('Scene WaterMark Check', 3);
				self.getSponsor('waterMarksUpdate').then(() => {
					// watermark updated
				});
			}
		}, qcConfig.sponsor.interval);

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

	videoBanner() {
		const self = this;
		const fileFilter = new RegExp(`.(${qcConfig.viodeBannerSupport.join('|').toLowerCase()})$`, 'i');
		
		qcFile.getFilesWithPath(`${qcConfig.resourcesBasePath}/video_banner`, fileFilter).then((fileList) => {
			qcLog.log(`Scene Video Banner List: ${JSON.stringify(fileList)}`, 3);
			let passFileList = [];
			if(fileList.length > 0) {
				$.each(fileList, (idx, file) => {
					let sfile = fspath.basename(file);
					if(/\s/.test(sfile)) {
						qcNotification.warning(`Invalid video filename [${sfile}]!`);
					} else {
						passFileList.push(file);
					}
				});
			}

			if(passFileList.length > 0) {
				let currentVideo = 0;
				$(qcCam.topVideoBanner).show();
				self.currentBannerType = 'VIDEO';

				$(qcCam.topVideoBanner).on('ended', () => {
					currentVideo++;
					if(currentVideo >= passFileList.length) {
						currentVideo = 0;
					}
					$(qcCam.topVideoBanner).prop('src', passFileList[currentVideo]);
				});
				$(qcCam.topVideoBanner).prop('src', passFileList[currentVideo]);
				
			}else{
				// no video file, change image banner
				qcNotification.warning('Miss video file, check video_banner dir please!');
				$(qcCam.topBanner).show();
			}
		});

	},

	videoBannerPause(pauseFlag = true) {
		const self = this;

		if(self.currentBannerType == 'VIDEO') {
			if(pauseFlag) {
				$(qcCam.topVideoBanner).get(0).pause();
			}else{
				$(qcCam.topVideoBanner).get(0).play();
			}
		}
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

	disabledWatermarkArrow(flag = true) {
		const self = this;
		if(flag) {
			$(qcEvent.camControl).find('a[data-action="prevWaterMark"]').hide();
			$(qcEvent.camControl).find('a[data-action="nextWaterMark"]').hide();
		} else {
			$(qcEvent.camControl).find('a[data-action="prevWaterMark"]').show();
			$(qcEvent.camControl).find('a[data-action="nextWaterMark"]').show();
		}
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

	getSponsor(varTarget = 'waterMarks') {
		const self = this;

		return new Promise((resolve, reject) => {
			let reqData = [];
			qcNetwork.ajaxReq('GET', 'device/sponsor').then((data) => {
				if(typeof data === 'undefined') {
					$.confirm({
						title: 'Alert!',
						icon: 'fa fa-warning',
						content: 'No Sponsor Found. Please assign at least one sponsor.',
						theme: 'modern',
						buttons: {   
							close: {
								text: "Close App",
								btnClass: 'btn-warning',
								action: () => {
									ipcRenderer.sendSync('app-quit');
								}
							}
						}
					});
					self.waterMarksUpdateFlag = true;
					reject('noSponsor');
					return false;
				};
				const reqHash = qcMisc.hash(JSON.stringify(data));
				if(self.waterMarksHash !== reqHash) {
					self.waterMarksUpdateFlag = true;
					qcLog.log('Scene WaterMark has Updated', 3);
				}
				let wmData = [];
				let queueTasks = [];
				let downloadTotal = 0;
				reqData = data;
				$.each(data, (idx, item) => {
					$.each(item.watermark, (idx2, item2) => {
						wmData.push({
							id: item2.id,
							sponsor_id: item.sponsor_id,
							subdomain: item.subdomain,
							feature: {
								sms: item.flag.sms,
								email: item.flag.email
							},
							reverse_mirror: item2.reverse_mirror,
							display_secs: item2.display_secs,
							image: {
								top_banner: self._sponsorResLocalName('top_banner', item2.id, item2.image.top_banner),
								watermark: self._sponsorResLocalName('watermark', item2.id, item2.image.watermark),
								pre_image: self._sponsorResLocalName('pre_image', item2.id, item2.image.pre_image),
								post_image: self._sponsorResLocalName('post_image', item2.id, item2.image.post_image),
								flash_image: self._sponsorResLocalName('flash_image', item2.id, item2.image.flash_image)
							}
						});

						queueTasks.push(self.waterMarkPreLoad('top_banner', item2.id, item2.version, item2.image.top_banner));
						queueTasks.push(self.waterMarkPreLoad('watermark', item2.id, item2.version, item2.image.watermark));
						queueTasks.push(self.waterMarkPreLoad('pre_image', item2.id, item2.version, item2.image.pre_image));
						queueTasks.push(self.waterMarkPreLoad('post_image', item2.id, item2.version, item2.image.post_image));
						queueTasks.push(self.waterMarkPreLoad('flash_image', item2.id, item2.version, item2.image.flash_image));

						downloadTotal+= item2.image.top_banner ? 1 : 0;
						downloadTotal+= item2.image.watermark ? 1 : 0;
						downloadTotal+= item2.image.pre_image ? 1 : 0;
						downloadTotal+= item2.image.post_image ? 1 : 0;
						downloadTotal+= item2.image.flash_image ? 1 : 0;
					});
				});
				self[varTarget] = wmData;
				self.waterMarksHash = reqHash;
				if(self.currentScene == 'launch') {
					initialPercent(45, `Loading Image <em id="initialLoadingImageCounter">0</em> / ${downloadTotal}`);
				}

				return Promise.all(queueTasks);
			}).then(() => {
				if(self.waterMarksUpdateFlag) {
					if(self.waterMarksUpdate) {
						self.waterMarks = self.waterMarksUpdate;
						qcLog.log('Scene WaterMark Updated', 3);
					}

					if(qcConfig.watermark.disabledArrowChoiceOption) {
						if(self.waterMarks.length > 1) {
							$(qcCam.camWMChoice).empty();
							$('#wmcTemplate').tmpl({data: reqData}).appendTo(qcCam.camWMChoice);
						} else {
							qcConfig.watermark.disabledArrowChoiceOption = false;
						}
					}
					self.waterMarksUpdate = null;
					self.waterMarksUpdateFlag = false;
				}
				resolve();
			});
		});
	},

	sponsorResourceLoaded() {
		const self = this;
		qcLog.log('Scene Sponsor Resource Loaded', 2);

		self.refreshWaterMark();
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

	prevWaterMark() {
		const self = this;

		if(!qcCam.shooting()) {
			qcLog.log(`Scene Prev WaterMark: ${self.waterMarks[self.currentWaterMarkIdx].image.watermark}`, 5);
			window.clearTimeout(self.seed.waterMark);
			self.currentWaterMarkIdx--;
			if(self.currentWaterMarkIdx < 0) {
				self.currentWaterMarkIdx = self.waterMarks.length - 1;
			}
			$(qcCam.videoWaterMark).prop('src', self.waterMarks[self.currentWaterMarkIdx].image.watermark);
			$(qcCam.topBanner).prop('src', self.waterMarks[self.currentWaterMarkIdx].image.top_banner);
			self.seed.waterMark = window.setTimeout(() => {
				self.currentWaterMarkIdx++;
				self.refreshWaterMark();
			}, parseInt(self.waterMarks[self.currentWaterMarkIdx].display_secs) * 1000);

		}
	},

	nextWaterMark() {
		const self = this;

		if(!qcCam.shooting()) {
			qcLog.log(`Scene Next WaterMark: ${self.waterMarks[self.currentWaterMarkIdx].image.watermark}`, 5);
			window.clearTimeout(self.seed.waterMark);
			self.currentWaterMarkIdx++;
			if(self.currentWaterMarkIdx >= self.waterMarks.length) {
				self.currentWaterMarkIdx = 0;
			}
			$(qcCam.videoWaterMark).prop('src', self.waterMarks[self.currentWaterMarkIdx].image.watermark);
			$(qcCam.topBanner).prop('src', self.waterMarks[self.currentWaterMarkIdx].image.top_banner);
			self.seed.waterMark = window.setTimeout(() => {
				self.currentWaterMarkIdx++;
				self.refreshWaterMark();
			}, parseInt(self.waterMarks[self.currentWaterMarkIdx].display_secs) * 1000);
		}
	},

	refreshWaterMark() {
		const self = this;

		if(!qcCam.shooting()) {
			if(self.currentWaterMarkIdx >= self.waterMarks.length) {
				self.currentWaterMarkIdx = 0;
			}
			qcLog.log(`Scene Refresh WaterMark: ${self.waterMarks[self.currentWaterMarkIdx].image.watermark}`, 5);
			$(qcCam.videoWaterMark).prop('src', self.waterMarks[self.currentWaterMarkIdx].image.watermark);
			$(qcCam.topBanner).prop('src', self.waterMarks[self.currentWaterMarkIdx].image.top_banner);
		}else{
			self.currentWaterMarkIdx = self.currentWaterMarkIdx > 0 ? self.currentWaterMarkIdx - 1 : 0;
		}
		if(self.waterMarks.length > 1) {
			self.seed.waterMark = window.setTimeout(() => {
				self.currentWaterMarkIdx++;
				self.refreshWaterMark();
			}, parseInt(self.waterMarks[self.currentWaterMarkIdx].display_secs) * 1000);
		}
	},

	passNextPreImage() {
		this.passPreImage = true;
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

	showWatermarkChoice() {
		const self = this;

		return new Promise((resolve, reject) => {
			if(!self.passPreImage && qcConfig.watermark.disabledArrowChoiceOption && qcConfig.deviceInfo.multi_watermark_flag == 'YES') {
				$(qcCam.camWMChoice).show();
				$(qcCam.camWMChoice).one('click', 'a.watermark', (e) => {
					e.preventDefault();
					const wmID = $(e.target).data('watermarkId');
					self.currentWaterMarkIdx = self._findWaterMarkIndex(wmID);
					//self.currentWaterMarkIdx = $(e.target).data('watermarkIdx');
					$(qcCam.videoWaterMark).prop('src', self.waterMarks[self.currentWaterMarkIdx].image.watermark);
					$(qcCam.topBanner).prop('src', self.waterMarks[self.currentWaterMarkIdx].image.top_banner);
					$(qcCam.camWMChoice).hide();

					window.clearTimeout(self.seed.waterMark);
					self.seed.waterMark = window.setTimeout(() => {
						self.currentWaterMarkIdx++;
						self.refreshWaterMark();
					}, parseInt(self.waterMarks[self.currentWaterMarkIdx].display_secs) * 1000);
					resolve();
				});

				if(qcConfig.watermark.waitTime > 0) {
					self.seed.watermarkChoice = window.setTimeout(() => {
						qcLog.log('Scene Choice Watermark Timeout', 5);
						$(qcCam.camWMChoice).hide();
						reject({err: 'wmchoice timeout'});
					}, qcConfig.watermark.waitTime);
				}
			} else {
				resolve();
			}
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

	showPreImage() {
		const self = this;

		return new Promise((resolve, reject) => {
			const wmObj = qcSession.get('shootingWaterMarkInfo');
			const accessCode = qcSession.get('shootingAccessCode');
			if(qcConfig.preImage.extPage) {
				wmObj.image.pre_image = qcConfig.preImage.extPage;
			}

			if(!self.passPreImage && wmObj.image.pre_image != '') {
				self.currentScene = 'preImage';
				qcFramework.cancelRelaunch();

				switch(qcFile.getExtendName(wmObj.image.pre_image)) {
					case 'html':
						qcLog.log('Scene Pre HTML Page Show', 5);
						let preUrl = `${qcConfig.localApi.protocol}://${qcConfig.localApi.host}:${qcConfig.localApi.port}/plugins/${wmObj.image.pre_image}?` + $.param({
							accessCode: accessCode,
							devMode: qcConfig.debug.devMode,
							zoomSize: qcConfig.debug.zoomSize,
							type: qcConfig.deviceInfo.plugins.pre_html.type || '',
							unId: qcConfig.deviceInfo.plugins.pre_html.unid || '',
							timeout: qcConfig.preImage.waitTime
						});

						/*
						if(qcConfig.preImage.waitTime > 0) {
							self.seed.camPre = window.setTimeout(() => {
								qcLog.log('Scene Pre HTML Timeout', 5);
								$(qcCam.camHtmlPre).hide();
								reject({err: 'pre timeout'});
							}, qcConfig.preImage.waitTime);
						}
						*/

						$(qcCam.camHtmlPre).show();
						$(qcCam.camHtmlPre).find('iframe').prop('src', preUrl);
						/*
						if(qcConfig.debug.webviewDebug) {
							const webview = document.getElementById('camHtmlPreView');
							webview.addEventListener('dom-ready', () => {
								webview.openDevTools();
							});
						}
						*/
						qcRestify.callback({
							pageLoaded: () => {
								qcLog.log('Scene Pre HTML Page Loaded', 5);
							},
							finish: () => {
								qcLog.log('Scene Pre HTML Page Close', 5);
								$(qcCam.camHtmlPre).hide();
								$(qcCam.camHtmlPre).find('iframe').prop('src', 'about:blank');
								resolve();
							},
							timeout: () => {
								qcLog.log('Scene Pre HTML Timeout', 5);
								$(qcCam.camHtmlPre).hide();
								reject({err: 'pre timeout'});
							}
						});
						break;

					default:
						qcLog.log('Scene Pre Image Show', 5);

						if(qcConfig.preImage.waitTime > 0) {
							self.seed.camPre = window.setTimeout(() => {
								qcLog.log('Scene Pre Image Timeout', 5);
								$(qcCam.camPre).hide();
								reject({err: 'pre timeout'});
							}, qcConfig.preImage.waitTime);
						}

						$(qcCam.camPre).show();
						$(qcCam.camPre).one('click', (e) => {
							e.preventDefault();
							qcLog.log('Scene Pre Image Click Next', 5);
							$(qcCam.camPre).hide();
							resolve();
						});
						break;
				}

			}else{
				self.passPreImage = false;
				resolve();
			}
		});
	},

	showPostImage() {
		const self = this;

		return new Promise((resolve, reject) => {
			const wmObj = qcSession.get('shootingWaterMarkInfo');
			const accessCode = qcSession.get('shootingAccessCode');
			if(qcConfig.postImage.extPage) {
				wmObj.image.post_image = qcConfig.postImage.extPage;
			}

			if(wmObj.image.post_image != '') {
				self.currentScene = 'postImage';
				qcFramework.cancelRelaunch();

				switch(qcFile.getExtendName(wmObj.image.post_image)) {
					case 'html':
						qcLog.log('Scene Post HTML Page Show', 5);
						let postUrl = `${qcConfig.localApi.protocol}://${qcConfig.localApi.host}:${qcConfig.localApi.port}/plugins/${wmObj.image.post_image}?` + $.param({
							accessCode: accessCode,
							devMode: qcConfig.debug.devMode,
							zoomSize: qcConfig.debug.zoomSize,
							type: qcConfig.deviceInfo.plugins.post_html.type || '',
							unId: qcConfig.deviceInfo.plugins.post_html.unid || '',
							timeout: qcConfig.postImage.waitTime
						});

						/*
						if(qcConfig.postImage.waitTime > 0) {
							self.seed.postImage = window.setTimeout(() => {
								qcLog.log('Scene Post HTML Timeout', 5);
								$(qcCam.camHtmlPost).hide();
								resolve();
							}, qcConfig.postImage.waitTime);
						}
						*/

						$(qcCam.camHtmlPost).show();
						$(qcCam.camHtmlPost).find('iframe').prop('src', postUrl);
						/*
						if(qcConfig.debug.webviewDebug) {
							const webview = document.getElementById('camHtmlPostView');
							webview.addEventListener('dom-ready', () => {
								webview.openDevTools();
							});
						}
						*/
						qcRestify.callback({
							pageLoaded: () => {
								qcLog.log('Scene Post HTML Page Loaded', 5);
							},
							finish: () => {
								qcLog.log('Scene Post HTML Page Close', 5);
								$(qcCam.camHtmlPost).hide();
								$(qcCam.camHtmlPost).find('iframe').prop('src', 'about:blank');
								resolve();
							},
							timeout: () => {
								qcLog.log('Scene Post HTML Timeout', 5);
								$(qcCam.camHtmlPost).hide();
								reject({err: 'Post timeout'});
							}
						});
						break;

					default:
						qcLog.log('Scene Post Image Show', 5);
						if(qcConfig.postImage.waitTime > 0) {
							self.seed.postImage = window.setTimeout(() => {
								qcLog.log('Scene Post Image Timeout', 5);
								$(qcCam.camPost).hide();
								resolve();
							}, qcConfig.postImage.waitTime);
						}

						$(qcCam.camPost).show();
						$(qcCam.camPost).one('click', (e) => {
							e.preventDefault();
							qcLog.log('Scene Post Image Click Next', 5);
							$(qcCam.camPost).hide();
							resolve();
						});
						break;
				}

			}else{
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

	showKeyboard() {
		const self = this;

		return new Promise((resolve, reject) => {
			const wmObj = qcSession.get('shootingWaterMarkInfo');
			const accessCode = qcSession.get('shootingAccessCode');
			const detailPageUrl = `${qcConfig.webUrl.protocol}://${wmObj.subdomain}.${qcConfig.webUrl.domain}/${qcConfig.webUrl.detailPage}${accessCode}.html`;
			qcKeyboard.show(accessCode, detailPageUrl);
			self.currentScene = 'keyboard';
			qcFramework.cancelRelaunch();
			resolve();
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
