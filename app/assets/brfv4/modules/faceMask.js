qcBrfv4._imageURL = './assets/brfv4/assets/brfv4_lion.png';
qcBrfv4._imageScale = 3.3;
qcBrfv4._baseNodes = [];

qcBrfv4.loadModules = function() {
	const self = this;

	drawing.imageContainer.removeAllChildren();

	qcBrfv4.loadBitmap().then((_imageBitmap) => {
		_imageBitmap.scaleX = qcBrfv4._imageScale;
		_imageBitmap.scaleY = qcBrfv4._imageScale;
	
		_imageBitmap.x = -parseInt(_imageBitmap.getBounds().width  * _imageBitmap.scaleX * 0.50);
		_imageBitmap.y = -parseInt(_imageBitmap.getBounds().height * _imageBitmap.scaleY * 0.45);
	
		for(let i = 0, l = qcBrfv4.numFacesToTrack; i < l; i++) {
			let baseNode = new createjs.Container();
			drawing.imageContainer.addChild(baseNode);
			baseNode.removeAllChildren();
	
			if(i === 0) {
				baseNode.addChild(_imageBitmap);
			} else {
				baseNode.addChild(_imageBitmap.clone());
			}
	
			qcBrfv4._baseNodes.push(baseNode);
		}
	});
};

qcBrfv4.processAR = function() {
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
		} else {
			baseNode.alpha = 0.0;
		}
	}
};

qcBrfv4.loadBitmap = function() {
	return new Promise((resolve, reject) => {
		let _imageBitmap = new createjs.Bitmap(qcBrfv4._imageURL);
		_imageBitmap.image.onload = function() {
			resolve(_imageBitmap);
		};
	});
};

qcBrfv4.toDegree = function(x) {
	return x * 180.0 / Math.PI;
};