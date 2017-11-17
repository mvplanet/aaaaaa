qcBrfv4.loadModules = function() {
	if(t3d) {
		t3d.removeAll();
		t3d.loadOcclusionHead("./assets/brfv4/assets/3D/brfv4_occlusion_head.json", qcBrfv4.numFacesToTrack);
		t3d.loadModel("./assets/brfv4/assets/3D/hilton_brfv4_model.json", qcBrfv4.numFacesToTrack);
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
			}
		}
		
		t3d.render();
	}
};