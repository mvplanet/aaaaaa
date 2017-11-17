qcBrfv4.initDrawCanvas = false;
qcBrfv4._faceTexturesUrl = './assets/brfv4/assets/qc_face_textures.json';
qcBrfv4._faceTextures = null;
qcBrfv4._faceTex = null;
qcBrfv4._texture = new Image();
qcBrfv4._faceTexturesReady = false;

qcBrfv4.loadModules = function() {
	const self = this;

	self.elDrawing.getContext('2d').globalCompositeOperation = 'multiply';

	self.loadExtendJS().then(() => {
		return self.loadTextures();
	}).then(() => {
		self._faceTex = self._faceTextures.marcel_0;
		self._texture.src = self._faceTextures.marcel_0.tex;
		self._faceTexturesReady = true;
	});
};

qcBrfv4.processAR = function() {
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
			}
		}
	}
};

qcBrfv4.loadExtendJS = function() {
	const self = this;
	return new Promise((resolve, reject) => {
		qcLoader.preload([
			'./assets/brfv4/qc/QcPointUtils.js',
			'./assets/brfv4/qc/QcExtendedFace.js',
			'./assets/brfv4/qc/QcPublicAPI.js'
		], () => {
			resolve();
		});
	});
};

qcBrfv4.loadTextures = function() {
	const self = this;
	return new Promise((resolve, reject) => {
		$.getJSON(self._faceTexturesUrl, (data) => {
			self._faceTextures = data;
			resolve();
		});
	});
};

qcBrfv4.drawFaceClip = function(vertices) {
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
};

qcBrfv4.drawTexture = function(vertices, triangles, uvData, texture) {
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
};