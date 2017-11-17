$(function() {
	let reluncSeed = null;
	if(qcConfig.launch.timeoutRestart) {
		reluncSeed = window.setTimeout(() => {
			ipcRenderer.sendSync('app-restart');
		}, qcConfig.launch.timeoutRestart);
	}

	qcFile.init().then(() => {
		initialPercent(10, 'Initializing File system');
		return qcFramework.init();
	}).then(() => {
		initialPercent(15, 'Initializing Framework');
		return qcFile.createResourceDir();
	}).then(() => {
		initialPercent(25, 'Initializing Device Info');
		qcNetwork.init();
		return qcScene.init();
	}).then(() => {
		initialPercent(50, 'Initializing Scene');
		return qcEvent.init();
	}).then(() => {
		initialPercent(60, 'Initializing Event');
		return qcCam.init({
			videoPlayer: '#localVideo',
			videoWaterMark: '#videoWaterMark',
			videoPreview: '#videoPreview'
		});
	}).then(() => {
		initialPercent(80, 'Initializing Gallery');

		qcQRcode.init();
		qcFFmpeg.init();
		qcSession.init();
		qcHelper.init();
		qcTimer.init();
		return Promise.resolve;
	}).then(() => {
		initialPercent(100, 'Initializing Done');
		qcBrfv4.init();
		
		qcScene.switch('webcam');

		if(reluncSeed) {
			window.clearTimeout(reluncSeed);
			reluncSeed = null;
		}
	}).catch((e) => {
		qcLog.log(`Init Error: ${JSON.stringify(e)}`, 0);
		//window.alert(JSON.stringify(e));
		//ipcRenderer.sendSync('app-restart');
	});
});

const initialPercent = (pc = 0, msg = '') => {
	$('#loadingBox .loading-bar .bar-effect').css({width: `${pc}%`});
	$('#loadingBox .loading-msg span.first-msg').after(`<span>${msg}</span>`);
};

