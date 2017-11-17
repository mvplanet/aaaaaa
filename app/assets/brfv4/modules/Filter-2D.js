qcBrfv4._baseNodes = [];
qcBrfv4._texturesData = [];

qcBrfv4.loadModules = function() {
	const self = this;

	//qcNetwork.localJSON("./assets/brfv4/assets/json/2Ddemo.json").then((data) => {
	qcNetwork.localJSON(self.localJsonFile).then((data) => {
		self._texturesData = data;
		if(self._texturesData.length > 0) {
			$(qcCam.camARChoice).empty();
			let arData = self.addCleanItem();
			$('#arcTemplate').tmpl({data: arData}).appendTo(qcCam.camARChoice);
			$(qcCam.camARChoice).find('img[data-ar-idx="1"]').parent('a').addClass('selected');
			$(qcEvent.camControl).find('a[data-action="arEffect"]').show();
		}
		let tasks = [];
		for(let i = 0; i < self._texturesData.length; i++) {
			self._texturesData[i]._imageBitmap = null;
			tasks.push(qcBrfv4.loadBitmap(i));
		}
		qcLog.log(`Brfv4 Loading Bitmap`, 4);
		return Promise.all(tasks);
	}).then(() => {
		for(let i = 0; i < self._texturesData.length; i++) {
			self._texturesData[i]._imageBitmap.scaleX = self._texturesData[i].scale;
			self._texturesData[i]._imageBitmap.scaleY = self._texturesData[i].scale;
		
			self._texturesData[i]._imageBitmap.x = -parseInt(self._texturesData[i]._imageBitmap.getBounds().width  * self._texturesData[i]._imageBitmap.scaleX * 0.50);
			self._texturesData[i]._imageBitmap.y = -parseInt(self._texturesData[i]._imageBitmap.getBounds().height * self._texturesData[i]._imageBitmap.scaleY * 0.45);
		}
		qcLog.log(`Brfv4 Loaded Bitmap`, 4);
		self.changeModules(1);
	});
};

qcBrfv4.processAR = function() {
	if(qcBrfv4._faceTexturesReady) {
		let imageDataCtx = qcBrfv4.elCanvas.getContext("2d");
		qcBrfv4.brfManager.update(imageDataCtx.getImageData(0, 0, qcBrfv4.resolution.width, qcBrfv4.resolution.height).data);
		t3d.hideAll(); // Hide 3d models. Only show them on top of tracked faces.
		drawing.clear();

		const faces = qcBrfv4.brfManager.getFaces();
		for (let i = 0; i < faces.length; i++) {
			let face = faces[i];
			if(face.state === qcBrfv4.brfv4.BRFState.FACE_TRACKING) {
				t3d.update(i, face, true);
			}
		}

		for (let i = 0; i < faces.length; i++) {
			let face = faces[i];
			let baseNode = qcBrfv4._baseNodes[i];	// get image container

			if (face.state === qcBrfv4.brfv4.BRFState.FACE_TRACKING_START ||
				face.state === qcBrfv4.brfv4.BRFState.FACE_TRACKING) {

				baseNode.x = face.points[27].x;
				baseNode.y = face.points[27].y;

				baseNode.scaleX = (face.scale / 480) * (1 - qcBrfv4.toDegree(Math.abs(face.rotationY)) / 110.0);
				baseNode.scaleY = (face.scale / 480) * (1 - qcBrfv4.toDegree(Math.abs(face.rotationX)) / 110.0);
				baseNode.rotation = qcBrfv4.toDegree(face.rotationZ);

				baseNode.alpha = 1.0;
				qcBrfv4.setLastCatch();
			} else {
				baseNode.alpha = 0.0;
			}
		}
	}
};

qcBrfv4.changeModules = function(idx) {
	const self = this;

	self._baseNodes = [];
	drawing.imageContainer.removeAllChildren();
	idx--;
	if(typeof self._texturesData[idx] !== 'undefined') {
		for(let i = 0, l = self.numFacesToTrack; i < l; i++) {
			let baseNode = new createjs.Container();
			drawing.imageContainer.addChild(baseNode);
			baseNode.removeAllChildren();

			if(i === 0) {
				baseNode.addChild(self._texturesData[idx]._imageBitmap);
			} else {
				baseNode.addChild(self._texturesData[idx]._imageBitmap.clone());
			}

			self._baseNodes.push(baseNode);
		}
		self._faceTexturesReady = true;
	}
};

qcBrfv4.loadBitmap = function(idx) {
	return new Promise((resolve, reject) => {
		let _imageBitmap = new createjs.Bitmap(qcBrfv4._texturesData[idx].moduleData.tex);
		_imageBitmap.image.onload = function() {
			qcBrfv4._texturesData[idx]._imageBitmap = _imageBitmap;
			resolve();
		};
	});
};

qcBrfv4.cleanLayer = function() {
	this._faceTexturesReady = false;
	this._baseNodes = [];
	drawing.imageContainer.removeAllChildren();
	qcLog.log('Brfv4 Clean Layer', 5);
};

qcBrfv4.toDegree = function(x) {
	return x * 180.0 / Math.PI;
};