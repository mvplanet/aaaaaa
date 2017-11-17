qcBrfv4._texturesData = [];

qcBrfv4.loadModules = function() {
	const self = this;
	if(t3d) {
		//qcNetwork.localJSON("./assets/brfv4/assets/json/3Ddemo.json").then((data) => {
		qcNetwork.localJSON(self.localJsonFile).then((data) => {
			self._texturesData = data;
			if(self._texturesData.length > 0) {
				$(qcCam.camARChoice).empty();
				let arData = self.addCleanItem();
				$('#arcTemplate').tmpl({data: arData}).appendTo(qcCam.camARChoice);
				$(qcCam.camARChoice).find('img[data-ar-idx="1"]').parent('a').addClass('selected');				
				$(qcEvent.camControl).find('a[data-action="arEffect"]').show();
			}

			t3d.loadOcclusionHead("./assets/brfv4/assets/3D/brfv4_occlusion_head.json", qcBrfv4.numFacesToTrack);			
			self.changeModules(1);
		});
	}
};

qcBrfv4.processAR = function() {
	if(t3d) {
		let imageDataCtx = qcBrfv4.elCanvas.getContext("2d");
		qcBrfv4.brfManager.update(imageDataCtx.getImageData(0, 0, qcBrfv4.resolution.width, qcBrfv4.resolution.height).data);
		t3d.hideAll(); // Hide 3d models. Only show them on top of tracked faces.
		drawing.clear();

		const faces = qcBrfv4.brfManager.getFaces();
		for (let i = 0; i < faces.length; i++) {
			let face = faces[i];
			if(face.state === qcBrfv4.brfv4.BRFState.FACE_TRACKING) {
				t3d.update(i, face, true);
				qcBrfv4.setLastCatch();
			}
		}
		
		t3d.render();
	}
};

qcBrfv4.changeModules = function(idx) {
	const self = this;

	if(t3d) {
		idx--;
		if(typeof self._texturesData[idx] !== 'undefined') {
			qcLog.log(`Brfv4 Change Module: ${idx}(${self._texturesData[idx].name})`, 5);			
			t3d.removeAll();
			t3d.loadModelData(self._texturesData[idx].moduleData, qcBrfv4.numFacesToTrack);
			self._faceTexturesReady = true;
		}
	}
};

t3d.loadModelData = function(jsonData, maxFaces) {
	t3d.addBaseNodes(maxFaces);
	t3d.updateLayout(dom.stageWidth, dom.stageHeight);

	var containers = t3d.baseNodes;
	var loader = new THREE.ObjectLoader();

	loader.loadData(jsonData, (function(model) {
		for(var k = 0; k < containers.length; k++) {
			var mesh = model.clone();
			mesh.position.set(model.position.x, model.position.y, model.position.z);
			mesh.renderOrder = 2;
			containers[k].add(mesh);
		}

		t3d.render();
	}));
};

qcBrfv4.cleanLayer = function() {
	if(t3d) {
		this._faceTexturesReady = false;
		t3d.removeAll();
		qcLog.log('Brfv4 Clean Layer', 5);			
	}
};