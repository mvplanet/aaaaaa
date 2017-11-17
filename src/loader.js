const qcLoader = {
	queuePreloader: null,

	preload(filesToLoad, callback) {
		const self = this;

		if (self.queuePreloader !== null || !filesToLoad) {
			return;
		}

		self.queuePreloader = new createjs.LoadQueue(true);
		self.queuePreloader.on("progress", (evt) => {

		});

		self.queuePreloader.on("complete", (evt) => {
			qcLoader.queuePreloader = null;
			if(typeof callback === 'function') {
				callback();
			}
		});

		self.queuePreloader.loadManifest(filesToLoad, true);
	}
};
