const qcLog = {
	error(e) {
		if(qcConfig.debug.logOutput == 'file') {
			qcFile.appendLog('Err: ' + JSON.stringify(e));
		}
		console.log('Err', e);
	},

	log(msg, lv = 0) {
		if(lv <= qcConfig.debug.consoleLogLevel) {
			if(qcConfig.debug.logOutput == 'file') {
				qcFile.appendLog('-'.repeat(lv + 1) + msg);
			}
			console.log('-'.repeat(lv + 1), msg);
		}
	}
};