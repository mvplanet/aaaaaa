const qcEvent = {
	camControl: '#camControl',
	ffmpegRunning: false,

	init() {
		const self = this;
		qcLog.log('Event Init', 0);

		return new Promise((resolve, reject) => {
			$(self.camControl).on('click', 'a[data-action]', (e) => {
				e.preventDefault();
				qcFramework.cancelRelaunch();
				switch($(e.target).data('action')) {
					case 'takePhoto':
						self.eventCapturePhoto();
						break;
					case 'takeVideo':
						self.eventCaptureVideo();
						break;
					case 'takeGIF':
						self.eventCaptureGIF();
						break;
					case 'takeExtract':
						self.eventExtractPhoto();
						break;
					case 'arEffect':
						qcScene.showARChoice();
						break;
					case 'prevWaterMark':
						qcScene.prevWaterMark();
						break;
					case 'nextWaterMark':
						qcScene.nextWaterMark();
						break;
				}
			});
			resolve();
		});
	},

	getFFmpegRunningStatus() {
		return this.ffmpegRunning;
	},

	eventCapturePhoto() {
		const self = this;
		qcCam.lockWaterMark(true, 'PICTURE');
		let waterMarkInfo = null;
		let accessCode = '';
		let fileName = '';
		let dataURL = null;

		$(qcEvent.camControl).hide();
		qcGallery.hide();
		qcScene.videoBannerPause(true);

		qcScene.showWatermarkChoice().then(() => {
			waterMarkInfo = qcScene.setShootingInfo();
			accessCode = qcMisc.MD5(`com.quickeecam.jpg.${waterMarkInfo.subdomain}.${waterMarkInfo.sponsor_id}/${Date.now()}`);
			fileName = qcFile._uploadFileName(accessCode, 'jpg');
			qcSession.set('shootingAccessCode', accessCode);

			return qcScene.showPreImage();
		}).then(() => {
			return qcScene.showCamPosTip();
		}).then(() => {
			const countDownSec = Math.ceil(qcConfig.capture.prefixTime / 1000);
			return qcCam.flashCapturePhoto(countDownSec, 'dataURL');
		}).then((_dataURL) => {
			$(qcCam.camTimer).hide();
			dataURL = _dataURL;
			return qcScene.showCamEnded();
		}).then(() => {
			const dataBase64 = qcFile.dataURL2Base64(dataURL);
			self.ffmpegRunning = true;
			return qcFile.write(fileName, dataBase64);
		}).then(() => {
			qcFile.URLClear(dataURL);
			delete dataURL;
			return qcScene.showPostImage();
		}).then(() => {
			return qcScene.showPreview({
				type: 'picture',
				accessCode: accessCode
			}, qcConfig.preview.picture);
		}).then(() => {
			const bound = qcDatabase.getBound({
				access_code: accessCode,
				type: 'PICTURE',
				watermark_id: waterMarkInfo.id,
				sponsor_id: waterMarkInfo.sponsor_id,
				source_file: fileName
			});
			return qcDatabase.addTask(bound);
		}).then(() => {
			self.ffmpegRunning = false;
			qcScene.videoBannerPause(false);
			return qcScene.showKeyboard();
		}).then(() => {
			qcLog.log(`Event Capture Photo ${accessCode}`, 2);
		}).catch((e) => {
			qcScene.videoBannerPause(false);
			self.ffmpegRunning = false;

			if(e.err == 'ended retake') {
				qcScene.passNextPreImage();
				qcScene.clear2Initial(true);
				window.setTimeout(() => {
					$(self.camControl).find('a[data-action="takePhoto"]').trigger('click');
				}, 500);
			}else{
				qcScene.clear2Initial(false);
			}
			qcLog.error(e);
		});
	},

	eventCaptureGIF() {
		const self = this;
		qcCam.lockWaterMark(true, 'GIF');
		let waterMarkInfo = null;
		let accessCode = '';
		let fileName = '';
		const countDownSec = Math.ceil(qcConfig.capture.prefixTime / 1000);
		let dataURL = [];
		let currentFrame = 0;

		$(qcEvent.camControl).hide();
		qcGallery.hide();
		qcScene.videoBannerPause(true);

		$(qcCam.camGIFThumbs).find('img.thumb').each((idx, item) => {
			$(item).prop('src', qcConfig.pageImage.blank).hide();
		});

		qcScene.showWatermarkChoice().then(() => {
			waterMarkInfo = qcScene.setShootingInfo();
			accessCode = qcMisc.MD5(`com.quickeecam.gif.${waterMarkInfo.subdomain}.${waterMarkInfo.sponsor_id}/${Date.now()}`);
			fileName = qcFile._uploadFileName(accessCode, 'gif');
			qcSession.set('shootingAccessCode', accessCode);

			return qcScene.showPreImage();
		}).then(() => {
			return qcScene.showCamPosTip();
		}).then(() => {
			$(qcCam.camGIFThumbs).show();
			const imgSrc = $('#camTimerImages').find(`img[data-image-type="gif-tip"][data-image-no="${currentFrame + 1}"]`).prop('src');
			$(qcCam.camTimer).find('img.tip').prop('src', imgSrc);
			return qcCam.flashCapturePhoto(countDownSec, 'dataPNG');
		}).then((_dataURL) => {
			$(qcCam.camGIFThumbs).find(`img.thumb[data-thumb-no="${currentFrame}"]`).prop('src', _dataURL).show();
			dataURL.push(_dataURL);
			currentFrame++;
			const imgSrc = $('#camTimerImages').find(`img[data-image-type="gif-tip"][data-image-no="${currentFrame + 1}"]`).prop('src');
			$(qcCam.camTimer).find('img.tip').prop('src', imgSrc);
			return qcCam.flashCapturePhoto(countDownSec, 'dataPNG');
		}).then((_dataURL) => {
			$(qcCam.camGIFThumbs).find(`img.thumb[data-thumb-no="${currentFrame}"]`).prop('src', _dataURL).show();
			dataURL.push(_dataURL);
			currentFrame++;
			const imgSrc = $('#camTimerImages').find(`img[data-image-type="gif-tip"][data-image-no="${currentFrame + 1}"]`).prop('src');
			$(qcCam.camTimer).find('img.tip').prop('src', imgSrc);
			return qcCam.flashCapturePhoto(countDownSec, 'dataPNG');
		}).then((_dataURL) => {
			$(qcCam.camGIFThumbs).find(`img.thumb[data-thumb-no="${currentFrame}"]`).prop('src', _dataURL).show();
			dataURL.push(_dataURL);
			currentFrame++;
			return qcScene.showCamEnded();
		}).then(() => {
			let tasks = [];
			self.ffmpegRunning = true;
			$.each(dataURL, (idx, _dataURL) => {
				const _dataBase64 = qcFile.dataURL2Base64(_dataURL);
				const _fileName = qcFile._uploadFileName(`_tmp.${idx}`, 'png');
				tasks.push(qcFile.write(_fileName, _dataBase64));
			});
			return Promise.all(tasks);
		}).then(() => {
			const pngName = qcFile._uploadFileName(`_tmp.0`, 'png');
			const jpgName = qcFile._uploadFileName(accessCode, 'jpg');
			return qcFFmpeg.pngConvert2Jpg(pngName, jpgName);
		}).then(() => {
			return qcFFmpeg.pngsConvert2GIF(accessCode);
		}).then(() => {
			$.each(dataURL, (idx, _dataURL) => {
				qcFile.URLClear(_dataURL);
			});
			delete dataURL;
			$(self.camGIFThumbs).hide();
			return qcScene.showPostImage();
		}).then(() => {
			return qcScene.showPreview({
				type: 'gif',
				accessCode: accessCode
			}, qcConfig.preview.gif);
		}).then(() => {
			const bound = qcDatabase.getBound({
				access_code: accessCode,
				type: 'GIF',
				watermark_id: waterMarkInfo.id,
				sponsor_id: waterMarkInfo.sponsor_id,
				source_file: fileName
			});
			return qcDatabase.addTask(bound);
		}).then(() => {
			self.ffmpegRunning = false;
			qcScene.videoBannerPause(false);
			return qcScene.showKeyboard();
		}).then(() => {
			qcLog.log(`Event Capture GIF ${accessCode}`, 2);
		}).catch((e) => {
			qcScene.videoBannerPause(false);
			self.ffmpegRunning = false;

			if(e.err == 'ended retake') {
				qcScene.passNextPreImage();
				qcScene.clear2Initial(true);
				window.setTimeout(() => {
					$(self.camControl).find('a[data-action="takeGIF"]').trigger('click');
				}, 500);
			}else{
				qcScene.clear2Initial(false);
			}
			qcLog.error(e);
		});
	},

	eventCaptureVideo() {
		const self = this;
		qcCam.lockWaterMark(true, 'VIDEO');
		let waterMarkInfo = null;
		let accessCode = '';
		let dataURL = null;

		$(qcEvent.camControl).hide();
		qcGallery.hide();
		qcScene.videoBannerPause(true);
		$(qcCam.camTimer).show();

		qcScene.showWatermarkChoice().then(() => {
			waterMarkInfo = qcScene.setShootingInfo();
			accessCode = qcMisc.MD5(`com.quickeecam.mp4.${waterMarkInfo.subdomain}.${waterMarkInfo.sponsor_id}/${Date.now()}`);
			qcSession.set('shootingAccessCode', accessCode);

			return qcScene.showPreImage();
		}).then(() => {
			return qcScene.showCamPosTip();
		}).then(() => {
			return qcCam.captureVideoStart();
		}).then(() => {
			const imgSrc = $('#camTimerImages').find(`img[data-image-type="video-tip"]`).prop('src');
			$(qcCam.camTimer).find('img.tip').prop('src', imgSrc);
			return qcTimer.countDown(Math.floor(qcConfig.video.time / 1000), (cdSec) => {
				const imgSrc = $('#camTimerImages').find(`img[data-image-type="video"][data-image-no="${cdSec}"]`).prop('src');
				$(qcCam.camTimer).find('img.timer').prop('src', imgSrc);
			});
		}).then(() => {
			$(qcCam.camTimer).find('img.tip').prop('src', qcConfig.pageImage.blank);
			$(qcCam.camTimer).find('img.timer').prop('src', qcConfig.pageImage.blank);
			$(qcCam.camTimer).hide();
			return qcCam.captureVideoEnd();
		}).then((_dataBlob) => {
			return qcFile.blob2DataURL(_dataBlob);
		}).then((_dataURL) => {
			const fileName = qcFile._uploadFileName(accessCode, 'webm');
			const dataBase64 = qcFile.dataURL2Base64(_dataURL);
			dataURL = _dataURL;
			self.ffmpegRunning = true;
			qcLog.log(`Event write video file: ${accessCode}.webm`, 4);
			return qcFile.write(fileName, dataBase64);
		}).then(() => {
			qcFile.URLClear(dataURL);
			delete dataURL;
			return qcScene.showCamEnded();
		}).then((e) => {
			return qcScene.showPostImage();
		}).then(() => {
			return qcScene.showPreview({
				type: 'video',
				accessCode: accessCode
			}, qcConfig.preview.video);
		}).then(() => {
			qcFFmpeg.videoConvert2MP4(accessCode).then(() => {
				return qcFFmpeg.videoCaptureScreenshot(accessCode);
			}).then(() => {
				const bound = qcDatabase.getBound({
					access_code: accessCode,
					type: 'VIDEO',
					watermark_id: waterMarkInfo.id,
					sponsor_id: waterMarkInfo.sponsor_id,
					source_file: qcFile._uploadFileName(accessCode, 'mp4')
				});
				return qcDatabase.addTask(bound);
			}).then(() => {
				qcLog.log(`Event write video done`, 4);
				self.ffmpegRunning = false;
			}).catch((e) => {
				//throw e;
				self.ffmpegRunning = false;
			});

			qcScene.videoBannerPause(false);
			return qcScene.showKeyboard();
		}).then(() => {
			qcLog.log(`Event Capture Video ${accessCode}`, 2);
		}).catch((e) => {
			qcScene.videoBannerPause(false);
			self.ffmpegRunning = false;
			
			if(typeof e.removeFile ==='boolean' && e.removeFile) {
				qcFile.removeUploadFiles('video', accessCode);
			}

			if(e.err == 'ended retake') {
				qcScene.passNextPreImage();
				qcScene.clear2Initial(true);
				window.setTimeout(() => {
					$(self.camControl).find('a[data-action="takeVideo"]').trigger('click');
				}, 500);
			}else{
				qcScene.clear2Initial(false);
			}
			qcLog.error(e);
		});
	},

	eventExtractPhoto() {
		const self = this;
		qcCam.lockWaterMark(true, 'PICTURE');
		let waterMarkInfo = null;
		let accessCode = '';
		let fileName = '';
		let dataURL = null;

		$(qcEvent.camControl).hide();
		qcGallery.hide();
		qcScene.videoBannerPause(true);
		qcCam.videoPause();

		qcVisenze.showExtract().then(() => {
			waterMarkInfo = qcScene.setShootingInfo();
			accessCode = qcMisc.MD5(`com.quickeecam.jpg.visenze/${Date.now()}`);
			fileName = qcFile._uploadFileName(accessCode, 'jpg');
			qcSession.set('shootingAccessCode', accessCode);

			return qcVisenze.showResult();
		}).then((_dataURL) => {
			dataURL = _dataURL;
			const dataBase64 = qcFile.dataURL2Base64(_dataURL);
			self.ffmpegRunning = true;
			return qcFile.write(fileName, dataBase64);
		}).then(() => {
			qcFile.URLClear(dataURL);
			delete dataURL;
			return qcScene.showPostImage();
		}).then(() => {
			return qcScene.showPreview({
				type: 'picture',
				accessCode: accessCode
			}, qcConfig.preview.picture);
		}).then(() => {
			const bound = qcDatabase.getBound({
				access_code: accessCode,
				type: 'PICTURE',
				watermark_id: waterMarkInfo.id,
				sponsor_id: waterMarkInfo.sponsor_id,
				source_file: fileName,
				privacy: 'YES'
			});
			return qcDatabase.addTask(bound);
		}).then(() => {
			self.ffmpegRunning = false;
			qcScene.videoBannerPause(false);
			return qcScene.showKeyboard();
		}).then(() => {
			qcLog.log(`Event Extract Photo ${accessCode}`, 2);
		}).catch((e) => {
			self.ffmpegRunning = false;
			qcScene.videoBannerPause(false);
			qcCam.videoResume();
			qcScene.clear2Initial(false);
			qcLog.error(e);
		});
	}
};
