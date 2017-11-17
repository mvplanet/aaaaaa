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
	initDrawCanvas: false,
	numFacesToTrack: 2,
	lastCatch: 0,
	localJsonFile: './assets/brfv4/assets/qc_face_textures_ext_lip.json',

	_faceTexturesReady: false,
	_faceTex: null,
	_texture: new Image(),

	init() {
		const self = this;
		self.elVideo = $(self.videoPlayer).get(0);
		self.elCanvas = $(self.videoCanvas).get(0);
		self.elT3D = $(self._t3d).get(0);
		self.elDrawing = $(self._drawing).get(0);
		self.elFace = $(self._faceSub).get(0);

		let jsLibs = [
			"./assets/brfv4/libs/threejs/three.js",
			"./assets/brfv4/qc/QcDOMUtils.js",
			"./assets/brfv4/qc/QcDrawing3DUtils_ThreeJS.js",
			"./assets/brfv4/libs/brf/BRFv4_JS_trial.js",
			"./assets/brfv4/qc/QcDrawingUtils_CreateJS.js",
			"./assets/brfv4/libs/createjs/easeljs-0.8.2.min.js",
			'./assets/brfv4/qc/QcPointUtils.js',
			'./assets/brfv4/qc/QcExtendedFace.js',
			'./assets/brfv4/qc/QcPublicAPI.js'
		];

		qcLoader.preload(jsLibs, () => {
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

		self.elDrawing.getContext('2d').globalCompositeOperation = 'multiply';
		
		qcNetwork.localJSON(self.localJsonFile).then((data) => {
			qcLog.log(`Brfv4 Loading Bitmap`, 4);
			self._faceTex = data.marcel_0;
			self._texture.src = data.marcel_0.tex;
			self._faceTexturesReady = true;
		});

		window.setInterval(self.trackFaces, 1000 / 30);
		window.setInterval(self.brfv4Reset, 30 * 1000);
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

	processAR() {
		if(qcBrfv4._faceTexturesReady) {
			let _extendedShape = new BRFv4Extended.BRFv4ExtendedFace();
			let imageDataCtx = qcBrfv4.elCanvas.getContext("2d");
			let maskDataCtx = qcBrfv4.elDrawing.getContext("2d");
			qcBrfv4.brfManager.update(imageDataCtx.getImageData(0, 0, qcBrfv4.resolution.width, qcBrfv4.resolution.height).data);
	
			const faces = qcBrfv4.brfManager.getFaces();
			maskDataCtx.clearRect(0, 0, qcBrfv4.resolution.width, qcBrfv4.resolution.height);
			for (let i = 0; i < faces.length; i++) {
				let face = faces[i];
				if (face.state === qcBrfv4.brfv4.BRFState.FACE_TRACKING_START ||
					face.state === qcBrfv4.brfv4.BRFState.FACE_TRACKING) {
					_extendedShape.update(face);
					qcBrfv4.drawFaceClip(_extendedShape.vertices);
	
					let triangles = _extendedShape.triangles.concat();
					let uvData = qcBrfv4._faceTex.uv;
					triangles.splice(triangles.length - 3 * 6, 3 * 6);
					qcBrfv4.drawTexture(face.vertices, triangles, qcBrfv4._faceTex.uv, qcBrfv4._texture);
					qcBrfv4.lastCatch = Date.now();
				}
			}
		}
	},

	drawFaceClip(vertices) {
		var ctx = qcBrfv4.elDrawing.getContext("2d");
	
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(vertices[0], vertices[0 + 1]);
		ctx.lineTo(vertices[1 * 2], vertices[1 * 2 + 1]);
		ctx.lineTo(vertices[2 * 2], vertices[2 * 2 + 1]);
		ctx.lineTo(vertices[3 * 2], vertices[3 * 2 + 1]);
		ctx.lineTo(vertices[4 * 2], vertices[4 * 2 + 1]);
		ctx.lineTo(vertices[5 * 2], vertices[5 * 2 + 1]);
		ctx.lineTo(vertices[6 * 2], vertices[6 * 2 + 1]);
		ctx.lineTo(vertices[7 * 2], vertices[7 * 2 + 1]);
		ctx.lineTo(vertices[8 * 2], vertices[8 * 2 + 1]);
		ctx.lineTo(vertices[9 * 2], vertices[9 * 2 + 1]);
		ctx.lineTo(vertices[10 * 2], vertices[10 * 2 + 1]);
		ctx.lineTo(vertices[11 * 2], vertices[11 * 2 + 1]);
		ctx.lineTo(vertices[12 * 2], vertices[12 * 2 + 1]);
		ctx.lineTo(vertices[13 * 2], vertices[13 * 2 + 1]);
		ctx.lineTo(vertices[14 * 2], vertices[14 * 2 + 1]);
		ctx.lineTo(vertices[15 * 2], vertices[15 * 2 + 1]);
		ctx.lineTo(vertices[16 * 2], vertices[16 * 2 + 1]);
	
		ctx.lineTo(vertices[73 * 2], vertices[73 * 2 + 1]);
		ctx.lineTo(vertices[72 * 2], vertices[72 * 2 + 1]);
		ctx.lineTo(vertices[71 * 2], vertices[71 * 2 + 1]);
		ctx.lineTo(vertices[70 * 2], vertices[70 * 2 + 1]);
		ctx.lineTo(vertices[69 * 2], vertices[69 * 2 + 1]);
		ctx.lineTo(vertices[68 * 2], vertices[68 * 2 + 1]);
	
		ctx.closePath();
		ctx.clip();
		
		ctx.drawImage(qcBrfv4.elCanvas, 0, 0);
		ctx.restore();
	},

	drawTexture(vertices, triangles, uvData, texture) {
		let ctx = qcBrfv4.elDrawing.getContext("2d");
	
		for (let i = 0; i < triangles.length; i += 3) {
			var i0 = triangles[i];
			var i1 = triangles[i + 1];
			var i2 = triangles[i + 2];
	
			var x0 = vertices[i0 * 2];
			var y0 = vertices[i0 * 2 + 1];
			var x1 = vertices[i1 * 2];
			var y1 = vertices[i1 * 2 + 1];
			var x2 = vertices[i2 * 2];
			var y2 = vertices[i2 * 2 + 1];
	
			var u0 = uvData[i0 * 2] * texture.width;
			var v0 = uvData[i0 * 2 + 1] * texture.height;
			var u1 = uvData[i1 * 2] * texture.width;
			var v1 = uvData[i1 * 2 + 1] * texture.height;
			var u2 = uvData[i2 * 2] * texture.width;
			var v2 = uvData[i2 * 2 + 1] * texture.height;
	
			// Set clipping area so that only pixels inside the triangle will
			// be affected by the image drawing operation
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(x0, y0);
			ctx.lineTo(x1, y1);
			ctx.lineTo(x2, y2);
			ctx.closePath();
			ctx.clip();
	
			// Compute matrix transform
			var delta = u0 * v1 + v0 * u2 + u1 * v2 - v1 * u2 - v0 * u1 - u0 * v2;
			var delta_a = x0 * v1 + v0 * x2 + x1 * v2 - v1 * x2 - v0 * x1 - x0 * v2;
			var delta_b = u0 * x1 + x0 * u2 + u1 * x2 - x1 * u2 - x0 * u1 - u0 * x2;
			var delta_c = u0 * v1 * x2 + v0 * x1 * u2 + x0 * u1 * v2 - x0 * v1 * u2 - v0 * u1 * x2 - u0 * x1 * v2;
			var delta_d = y0 * v1 + v0 * y2 + y1 * v2 - v1 * y2 - v0 * y1 - y0 * v2;
			var delta_e = u0 * y1 + y0 * u2 + u1 * y2 - y1 * u2 - y0 * u1 - u0 * y2;
			var delta_f = u0 * v1 * y2 + v0 * y1 * u2 + y0 * u1 * v2 - y0 * v1 * u2 - v0 * u1 * y2 - u0 * y1 * v2;
	
			// Draw the transformed image
			ctx.setTransform(
				delta_a / delta, delta_d / delta,
				delta_b / delta, delta_e / delta,
				delta_c / delta, delta_f / delta
			);
	
			ctx.drawImage(texture, 0, 0);
			ctx.restore();
		}
	},

	cleanLayer() {
		const self = this;
	
		let maskDataCtx = self.elDrawing.getContext("2d");	
		maskDataCtx.clearRect(0, 0, self.resolution.width, self.resolution.height);
		self._faceTexturesReady = false;
	}
};
