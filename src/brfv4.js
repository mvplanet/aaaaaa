const qcBrfv4 = {
	canvasGroup: '#localCanvasGroup',
	videoPlayer: '#localVideo',
	videoCanvas: '#localCanvas',
	_t3d: '#localCanvasT3D',
	_faceSub: '#localCanvasFaceSub',
	_drawing: '#localCanvasDrawing',
	elVideo: null,
	elCanvas: null,
	elT3D: null,
	elDrawing: null,
	elFace: null,
	brfManager: null,
	resolution: null,
	brfv4: null,
	initDrawCanvas: true,
	numFacesToTrack: 2,
	lastCatch: 0,
	localJsonFile: '',

	init() {
		const self = this;
		self.elVideo = $(self.videoPlayer).get(0);
		self.elCanvas = $(self.videoCanvas).get(0);
		self.elT3D = $(self._t3d).get(0);
		self.elDrawing = $(self._drawing).get(0);
		self.elFace = $(self._faceSub).get(0);
		self.localJsonFile = qcScene._sponsorResLocalName('ar', 'ar', 'ar.json');

		let jsLibs = [
			"./assets/brfv4/libs/threejs/three.js",
			"./assets/brfv4/qc/QcDOMUtils.js",
			"./assets/brfv4/qc/QcDrawing3DUtils_ThreeJS.js",
			"./assets/brfv4/libs/brf/BRFv4_JS_trial.js",
			"./assets/brfv4/qc/QcDrawingUtils_CreateJS.js",
			"./assets/brfv4/libs/createjs/easeljs-0.8.2.min.js"
		];
		if(qcConfig.ar.enabledAR && qcConfig.ar.arFilter) {
			jsLibs.push(`./assets/brfv4/modules/${qcConfig.ar.arFilter}.js`);
			qcLog.log(`AR Filter: ${qcConfig.ar.arFilter}`, 3);
		} else {
			self.initDrawCanvas = false;
		}
		qcLoader.preload(jsLibs, () => {
			self.loadExtendJS().then(() => {
				if (self.initDrawCanvas) {
					if (t3d.setup && !t3d.stage) {
						t3d.setup(self.elT3D);
					}
					if (drawing.setup && !drawing.stage) {
						drawing.setup(self.elDrawing, self.elFace, 30);
					}
				}
				self.startCamera();
			});
		});
	},

	startCamera() {
		const self = this;
		
		// Start video playback once the camera was fetched.
		function onStreamFetched(mediaStream) {
			qcCam.cameraStream = mediaStream;
			qcBrfv4.elVideo.srcObject = mediaStream;
			qcBrfv4.elVideo.play();

			// Check whether we know the video dimensions yet, if so, start BRFv4.
			function onStreamDimensionsAvailable () {
				if (qcBrfv4.elVideo.videoWidth === 0) {
					setTimeout(onStreamDimensionsAvailable, 100);
				} else {
					qcBrfv4.waitForSDK();
				}
			}

			onStreamDimensionsAvailable();
		}

		qcLog.log('Brfv4 WebCam Init', 0);
		navigator.mediaDevices.getUserMedia(qcConfig.cameraSetting)
			.then(onStreamFetched)
			.catch((error) => {
				qcLog.log("No camera available.");
				qcNotification.warning(`WebCam Error: ${error.name}`);
			});
	},

	waitForSDK() {
		if(qcBrfv4.brfv4 === null) {
			qcBrfv4.brfv4 = {
				locateFile: function() {
					return "./assets/brfv4/libs/brf/BRFv4_JS_trial.js.mem"
				}
			};
			initializeBRF(qcBrfv4.brfv4);
		}

		if(qcBrfv4.brfv4.sdkReady) {
			qcBrfv4.initSDK();
		} else {
			window.setTimeout(qcBrfv4.waitForSDK, 100);
		}
	},
	
	initSDK() {
		const self = this;

		self.resolution	= new self.brfv4.Rectangle(0, 0, self.elCanvas.width, self.elCanvas.height);
		self.brfManager	= new self.brfv4.BRFManager();
		self.brfManager.init(self.resolution, self.resolution, "com.tastenkunst.brfv4.js.examples.minimal.webcam");
		self.brfManager.setNumFacesToTrack(self.numFacesToTrack);

		var maxFaceSize = self.resolution.height;
		if (self.resolution.width < self.resolution.height) {
			maxFaceSize = self.resolution.width;
		}

		self.brfManager.setFaceDetectionParams(maxFaceSize * 0.20, maxFaceSize * 1.00, 12, 8);
		self.brfManager.setFaceTrackingStartParams(maxFaceSize * 0.20, maxFaceSize * 1.00, 32, 35, 32);
		self.brfManager.setFaceTrackingResetParams(maxFaceSize * 0.15, maxFaceSize * 1.00, 40, 55, 32);

		self.loadModules();

		window.setInterval(self.trackFaces, 1000 / 30);
		window.setInterval(self.brfv4Reset, 30 * 1000);
	},

	getDrawType() {
		return this.drawType;
	},
	
	trackFaces() {
		let imageDataCtx = qcBrfv4.elCanvas.getContext("2d");

		if(qcConfig.webcam.rotation == 'plus90deg') {
			imageDataCtx.setTransform(-1.0, 0, 0, 1, qcBrfv4.resolution.width, 0); // mirrored for draw of video
			imageDataCtx.rotate(90 * Math.PI / 180);
		} else {
			imageDataCtx.setTransform(-1.0, 0, 0, 1, 0, qcBrfv4.resolution.height); // mirrored for draw of video
			imageDataCtx.rotate(-90 * Math.PI / 180);
		}	

		imageDataCtx.drawImage(qcBrfv4.elVideo, 0, -qcBrfv4.elCanvas.width , qcBrfv4.elCanvas.height, qcBrfv4.elCanvas.width);
		imageDataCtx.restore();

		imageDataCtx.setTransform(1.0, 0, 0, 1, 0, 0); // unmirrored for draw of results

		if(qcConfig.ar.enabledAR) {
			qcBrfv4.processAR();
		}
	},

	brfv4Reset() {
		if(qcBrfv4.lastCatch > 0 && (Date.now() - qcBrfv4.lastCatch >= 600 * 1000)) {
			qcBrfv4.brfManager.reset();
			qcLog.log('Brfv4 Manager Reset', 5);
		}
	},

	setLastCatch() {
		this.lastCatch = Date.now();
	},

	loadExtendJS() {
		return new Promise((resolve, reject) => {
			resolve();
		});
	},

	cleanLayer() {
	},

	changeModules(idx) {
	},

	loadModules() {
	},

	processAR() {
		let imageDataCtx = qcBrfv4.elCanvas.getContext("2d");
		let t3dCtx = qcBrfv4.elT3D.getContext("2d");
		qcBrfv4.brfManager.update(imageDataCtx.getImageData(0, 0, qcBrfv4.resolution.width, qcBrfv4.resolution.height).data);
		
		const faces = qcBrfv4.brfManager.getFaces();

		for(let i = 0; i < faces.length; i++) {
			let face = faces[i];
			if(	face.state === qcBrfv4.brfv4.BRFState.FACE_TRACKING_START ||
				face.state === qcBrfv4.brfv4.BRFState.FACE_TRACKING) {

				t3dCtx.strokeStyle = "#00a0ff";
				for(let k = 0; k < face.vertices.length; k+= 2) {
					t3dCtx.beginPath();
					t3dCtx.arc(face.vertices[k], face.vertices[k + 1], 2, 0, 2 * Math.PI);
					t3dCtx.stroke();
				}
				qcBrfv4.setLastCatch();
			}
		}
	},

	addCleanItem() {
		let data = $.extend(true, [], this._texturesData);
		for(let i = 0; i < data.length; i++) {
			data[i].type = 'AR';
		}
		data.splice(0, 0, {type: 'NO', thumbData: './assets/images/No-filter.png', data: ''});
		return data;
	}
};
