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
					case 'takeVideo':
						self.eventCaptureVideo();
						break;
				}
			});
			resolve();
		});
	},

	getFFmpegRunningStatus() {
		return this.ffmpegRunning;
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
	}
};
