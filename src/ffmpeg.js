const qcFFmpeg = {
	runningFlag: false,

	init() {
		const self = this;
		qcLog.log('FFmpeg Init', 0);
	},

	videoConvert2MP4(accessCode, removeInputFileWidthDone = true) {
		const self = this;
		qcLog.log('FFmpeg video conver MP4 start', 1);

		return new Promise((resolve, reject) => {
			const inputFile = qcFile._uploadFileName(accessCode, 'webm');
			const outputFile = qcFile._uploadFileName(accessCode, 'mp4');
			self._ffmpegRun(inputFile, outputFile, qcConfig.ffmpeg.videoConvertArgs).then((res) => {
				qcLog.log('FFmpeg video convert MP4 done', 1);
				if(removeInputFileWidthDone) {
					qcFile.remove(inputFile);
				}
				resolve();
			}).catch((e) => {
				qcLog.log(`FFmpeg video convert MP4 error: ${e.stderr}`, 1);
				reject(e);
			});
		});
	},

	_ffmpegRun(inputFile, outputFile, cmdArgs) {
		return new Promise((resolve, reject) => {
			let ffmpegArgs = cmdArgs.replace(/\{INPUT_FILE\}/g, inputFile)
				.replace(/\{OUTPUT_FILE\}/g, outputFile)
				.split(' ');
			spawn(qcConfig.ffmpeg.binPath, ffmpegArgs, {
				capture: ['stdout', 'stderr']
			}).then((res) => {
				self.runningFlag = false;
				resolve(res); 
			}).catch((e) => {
				self.runningFlag = false;
				reject(e);
			});
		});
	}
};
