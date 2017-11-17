const qcCam = {
	videoPlayer: '#localVideo',
	videoWaterMark: '#videoWaterMark',
	videoPreview: '#videoPreview',
	topBanner: '#topBanner',
	topVideoBanner: '#topVideoBanner',
	camTimer: '#camTimer',
	camTimerImages: '#camTimerImages',
	camPosTip: '#camPosTip',
	camFlash: '#camImageFlash',
	camWMChoice: '#camWatermarkChoice',
	camARChoice: '#camAReffectChoice',
	camPre: '#camImagePre',
	camHtmlPre: '#camHtmlPre',
	camPost: '#camImagePost',
	camHtmlPost: '#camHtmlPost',
	camPreview: '#camPreviewPanel',
	camEnded: '#camEndedPanel',
	camGIFThumbs: '#camGIFThumbs',
	cameraStream: null,
	shootingFlag: false,
	shootingType: '',
	elVideo: null,
	elWaterMark: null,
	elCanvas: null,
	animateSeed: null,
	mediaRecorder: null,
	recordedBlobs: [],
	currentReverseMirror: 'NO',
	shootedCounter: 0,

	init(config = {}) {
		const self = this;
		qcLog.log('WebCam Init', 0);

		if(typeof config.videoPlayer !== 'undefined') {
			self.videoPlayer = config.videoPlayer;
		}
		if(typeof config.videoWaterMark !== 'undefined') {
			self.videoWaterMark = config.videoWaterMark;
		}
		if(typeof config.videoPreview !== 'undefined') {
			self.videoPreview = config.videoPreview;
		}
		if(typeof config.camTimer !== 'undefined') {
			self.camTimer = config.camTimer;
		}

		return new Promise((resolve, reject) => {
			self.elVideo = $(self.videoPlayer).get(0);
			self.elWaterMark = $(self.videoWaterMark).get(0);
			self.elCanvas = $(self.videoPreview).get(0);
			self.elCanvas.width = qcConfig.capture.width;
			self.elCanvas.height = qcConfig.capture.height;

			//qcBrfv4.startCamera();
			//self.initVideo();
			resolve();
		});
	},

	setReverseMirror(flag = 'NO') {
		this.currentReverseMirror = flag;
		//$(this.videoPlayer).css('transform', flag ? 'rotate(90deg) scaleY(1)' : 'rotate(90deg) scaleY(-1)');
	},

	initVideo() {
		const self = this;
		navigator.webkitGetUserMedia(qcConfig.cameraSetting, (stream) => {
			self.cameraStream = stream;
			$(self.videoPlayer).get(0).srcObject = stream;
			//$(self.videoPlayer).prop('src', qcFile.blob2URL(stream));
			qcLog.log(`Cam Done`, 4);
			window.setTimeout(() => {
				const video = $(qcCam.videoPlayer).get(0);
				qcLog.log(`Cam dimensions: ${video.videoWidth} x ${video.videoHeight}`, 4);
			}, 3000);
		}, (e) => {
			qcLog.error(e);
			qcLog.log(`Cam Error: ${error.name}`, 1);
			qcNotification.warning(`WebCam Error: ${error.name}`);
		});
	},

	shooting() {
		return this.shootingFlag;
	},

	shootType() {
		return this.shootingType;
	},

	getShootCounter() {
		return this.shootedCounter;
	},

	shootCounter() {
		this.shootedCounter++;
		qcLog.log(`Cam Shoot Counter: ${this.shootedCounter}`, 4);
	},

	videoPause() {
		$(this.videoPlayer).get(0).pause();
	},

	videoResume() {
		$(this.videoPlayer).get(0).play();
		$(qcBrfv4.canvasGroup).removeClass('pause');
	},

	lockWaterMark(flag = true, type = 'PICTURE') {
		this.shootingFlag = flag;
		this.shootingType = flag ? type : '';
	},

	captureVideoStart() {
		const self = this;
		$(self.videoPreview).remove();
		$('body').append('<canvas id="videoPreview"></canvas>');
		self.elCanvas = $(self.videoPreview).get(0);
		self.elCanvas.width = qcConfig.capture.width;
		self.elCanvas.height = qcConfig.capture.height;
		let source_ctx = qcBrfv4.elCanvas.getContext('2d');
		let ctx = self.elCanvas.getContext('2d');
		//let rotate = qcConfig.webcam.rotation == 'plus90deg' ? 90 : -90;

		function nextFrame() {
			if (self.shootingFlag) {
				ctx.save();
				//ctx.translate(self.elCanvas.width / 2, self.elCanvas.height / 2);

				if(self.currentReverseMirror == 'YES') {
					ctx.translate(qcConfig.capture.width, 0);
					ctx.scale(-1, 1);
					qcLog.log('WebCam Output Reverse Mirror', 5);
				}
				//ctx.rotate(rotate * Math.PI / 180);
				//ctx.drawImage(self.elVideo, -self.elCanvas.height / 2, -self.elCanvas.width / 2, self.elCanvas.height, self.elCanvas.width);
				//ctx.putImageData(qcBrfv4.elCanvas.getImageData(0, 0, qcBrfv4.elCanvas.width, qcBrfv4.elCanvas.height), 0, 0);

				ctx.drawImage(qcBrfv4.elCanvas, 0, 0, qcConfig.capture.width, qcConfig.capture.height);
				if(qcConfig.ar.enabledAR) {
					//if(qcBrfv4.getDrawType() == '3D') {
						ctx.drawImage(qcBrfv4.elT3D, 0, 0, qcConfig.capture.width, qcConfig.capture.height);
					//} else {
						ctx.drawImage(qcBrfv4.elDrawing, 0, 0, qcConfig.capture.width, qcConfig.capture.height);
					//}
				}
				if(qcConfig.canvasEffect.enabledCanvasEffect) {
					ctx.drawImage(qcEffect.elEffect, 0, 0, qcConfig.capture.width, qcConfig.capture.height);
				}
				ctx.restore();
				ctx.drawImage(self.elWaterMark, 0, 0, qcConfig.capture.width, qcConfig.capture.height);
				self.animateSeed = window.requestAnimationFrame(nextFrame);
			}
		}

		return new Promise((resolve, reject) => {
			let canvasStream = self.elCanvas.captureStream(25);
			canvasStream.addTrack(self.cameraStream.getAudioTracks()[0]);
			self.recordedBlobs = [];
			nextFrame();

			self.mediaRecorder = new MediaRecorder(canvasStream, self._mediaRecordSupportOptions());
			self.mediaRecorder.ondataavailable = (e) => {
				if (e.data && e.data.size > 0) {
					self.recordedBlobs.push(e.data);
				}
			};
			self.mediaRecorder.onstart = (e) => {
				qcLog.log('WebCam MediaRecorder started', 1);
				resolve();
			};
			self.mediaRecorder.start();
		});
	},

	captureVideoEnd() {
		const self = this;

		return new Promise((resolve, reject) => {
			self.mediaRecorder.onstop = (e) => {
				qcLog.log('WebCam MediaRecorder Stop', 1);
				window.cancelAnimationFrame(self.animateSeed);
				const superBuffer = new Blob(self.recordedBlobs, {
					type: qcConfig.video.coder
				});
				self.animateSeed = null;
				self.recordedBlobs = [];
				self.mediaRecorder = null;
				resolve(superBuffer);
			};
			self.mediaRecorder.stop();
		});
	},

	capturePhoto(retType = 'ctx') {
		qcArduino.flashOn();
		const self = this;
		let source_ctx = qcBrfv4.elCanvas.getContext('2d');
		let ctx = self.elCanvas.getContext('2d');
		//let rotate = qcConfig.webcam.rotation == 'plus90deg' ? 90 : -90;

		ctx.save();
		//ctx.translate(self.elCanvas.width/2, self.elCanvas.height/2);
		if(self.currentReverseMirror == 'YES') {
			ctx.translate(qcConfig.capture.width, 0);
			ctx.scale(-1, 1);
			qcLog.log('WebCam Output Reverse Mirror', 5);
		}
		//ctx.rotate(rotate * Math.PI / 180);
		//ctx.drawImage(self.elVideo, -self.elCanvas.height/2, -self.elCanvas.width/2, self.elCanvas.height, self.elCanvas.width);
		//ctx.putImageData(source_ctx.getImageData(0, 0, qcBrfv4.elCanvas.width, qcBrfv4.elCanvas.height), 0, 0);
		
		ctx.drawImage(qcBrfv4.elCanvas, 0, 0, qcConfig.capture.width, qcConfig.capture.height);
		if(qcConfig.ar.enabledAR) {
			//if(qcBrfv4.getDrawType() == '3D') {
				ctx.drawImage(qcBrfv4.elT3D, 0, 0, qcConfig.capture.width, qcConfig.capture.height);
			//} else {
				ctx.drawImage(qcBrfv4.elDrawing, 0, 0, qcConfig.capture.width, qcConfig.capture.height);
			//}
		}
		if(qcConfig.canvasEffect.enabledCanvasEffect) {
			ctx.drawImage(qcEffect.elEffect, 0, 0, qcConfig.capture.width, qcConfig.capture.height);
		}
		ctx.restore();
		ctx.drawImage(self.elWaterMark, 0, 0, qcConfig.capture.width, qcConfig.capture.height);

		let retData = null;
		switch(retType) {
			case 'ctx':
				retData = ctx;
				break;
			case 'dataPNG':
				retData = self.elCanvas.toDataURL('image/png');
				break;
			case 'dataURL':
				retData = self.elCanvas.toDataURL('image/jpeg', qcConfig.capture.quality);
				break;
			case 'both':
				retData = {
					ctx: ctx,
					dataURL: self.elCanvas.toDataURL('image/jpeg', qcConfig.capture.quality)
				};
				break;
		}
		return retData;
	},

	imgTagCapturePhoto(el) {
		const self = this;
		let ctx = self.elCanvas.getContext('2d');

		ctx.drawImage(el, 0, 0, self.elCanvas.width, self.elCanvas.height);
		return self.elCanvas.toDataURL('image/jpeg', qcConfig.capture.quality);
	},

	getLastFrame(rettype = 'ctx') {
		const self = this;
		return rettype=='ctx' ? self.elCanvas.getContext('2d') : self.elCanvas.toDataURL('image/jpeg', qcConfig.capture.quality);
	},

	flashCapturePhoto(_countDownSec = 3, retType = 'dataURL') {
		const self = this;
		
		return new Promise((resolve, reject) => {
			$(qcCam.camTimer).show();
			qcTimer.countDown(_countDownSec, (cdSec) => {
				if(cdSec < 1) {
					$(self.camTimer).hide();
					$(self.camFlash).fadeIn(300);
				}else{
					const imgSrc = $(self.camTimerImages).find(`img[data-image-type="photo"][data-image-no="${cdSec}"]`).prop('src');
					$(self.camTimer).find('img.timer').prop('src', imgSrc);
				}
			}).then(() => {
				$(self.camTimer).find('img.tip').prop('src', qcConfig.pageImage.blank);
				$(self.camTimer).find('img.timer').prop('src', qcConfig.pageImage.blank);

				const _dataURL = self.capturePhoto(retType);
				$(self.camFlash).fadeOut(600);
				qcArduino.flashOff(); 
				resolve(_dataURL);
			});
		});
	},

	_mediaRecordSupportOptions() {
		let options = {
			mimeType: 'video/webm;codecs=vp9'
		};
		if (!MediaRecorder.isTypeSupported(options.mimeType)) {
			options.mimeType = 'video/webm;codecs=vp8';
			if (!MediaRecorder.isTypeSupported(options.mimeType)) {
				options.mimeType = 'video/webm';
				if (!MediaRecorder.isTypeSupported(options.mimeType)) {
					options.mimeType = '';
				}
			}
		}
		return options;
	}
};
