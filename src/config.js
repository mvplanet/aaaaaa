let qcConfig = {
	productEnv: window.qcStartUpParams.productEnv,
	themeName: 'default',
	appBasePath: window.qcStartUpParams.electronBasePath,
	resourcesBasePath: `${window.qcStartUpParams.electronBasePath}/files`,
	asarPack: {
		asarFlag: (window.qcStartUpParams.asarPack === '.asar'),
		appPack: `app${window.qcStartUpParams.asarPack}`,
		themesPack: `themes${window.qcStartUpParams.asarPack}`,
		pluginsPack: `plugins${window.qcStartUpParams.asarPack}`,
		brfv4Pack: `app${window.qcStartUpParams.asarPack}/assets/brfv4/modules`,
		canvasEffectPack: `app${window.qcStartUpParams.asarPack}/assets/canvasEffect`
	},
	autoUpdater: {
		currentVersion: '',
		url: "http://releases.quickeecam.com/qc3-electron/lastest",
		enabledAutoUpdate: false,
		checkUpdateLater: 10000,
		checkUpdateInterval: 5 * 60 * 1000
	},
	macAddress: '',
	winPlatform: true,
	system: {
		arch: 'x64',
		type: 'Windows_NT',
		platform: 'win32',
		computerName: '',
		autoReload: true,
		autoReloadShootCounter: 200,
		autoReloadLocTime: '03:00:00'
	},
	deviceInfo: {},
	socket: {
		host: 'http://api.quickeecam.com',
		port: '3388',
		timeout: 30 * 1000
	},
	network: {
		downloadTimeout: 30 * 1000,
		retryTime: 5 * 1000
	},
	arduino: {
		enabledArduino: false,
		serialport: ''
	},
	api: {
		protocol: 'http',
		host: 'api.quickeecam.com',
		version: 'v2.0',
		port: 80,
		registerPasswd: 'jack1234'
	},
	localApi: {
		protocol: 'http',
		host: 'localhost',
		port: 8080
	},
	license: {
		brfv4License: "fatest.com,DanceHistoryBooth,Avecca,r98r17q5y2lbx134ortj,deleft.com,FaceRecognitionSensor,pukul.in,Gasometro,pl.netizens,Sorriso,noName,fatest.com"
	},
	cameraSetting: {
		audio: {
			echoCancellation: false
		},
		video: true
	},
	webcam: {
		rotation: 'plus90deg'
	},
	ar: {
		enabledAR: true,
		arFilter: '',
		waitTime: 20 * 1000,
		filterPacks: ['2D', '3D', 'RF'],
		fullMemTime: 4 * 60 * 60 * 1000
	},
	canvasEffect: {
		enabledCanvasEffect: false,
		effectFilter: ''
	},
	launch: {
		timeoutRestart: 10 * 60 * 1000,
		downloadSupervene: 3
	},
	watermark: {
		disabledArrowChoiceOption: true,
		waitTime: 20 * 1000
	},
	preImage: {
		waitTime: 20 * 1000,
		extPage: ''
	},
	postImage: {
		waitTime: 20 * 1000,
		extPage: ''
	},
	camEnded: {
		waitTime: 20 * 1000
	},
	preview: {
		picture: 3 * 1000,
		gif: 3 * 1000,
		video: 7 * 1000
	},
	gallery: {
		interval: 60 * 1000
	},
	capture: {
		height: 960,
		width: 720,
		quality: 100,
		prefixTime: 3 * 1000,
		cameraPositionTipTime: 3 * 1000,
	},
	gif: {
		repeat: 0,
		delay: 500,
		frames: 3,
		quality: 10
	},
	video: {
		coder: 'video/webm',
		time: 6 * 1000
	},
	keyboard: {
		interval: 10 * 1000,
		waitTime: 120 * 1000
	},
	sponsor: {
		interval: 3 * 60 * 1000
	},
	turnplate: {
		waitTime: 30 * 1000
	},
	visenze: {
		enabledExtract: false,
		codeLength: 8,
		keyboardInterval: 10 * 1000,
		keyboardWaitTime: 2 * 60 * 000
	},
	uploader: {
		interval: 10 * 000,
		uploadFile: true,
		uploadContact: true,
		uploadExtendData: true
	},
	ffmpeg: {
		binPath: `${window.qcStartUpParams.electronBasePath}/bin/ffmpeg.exe`,
		videoConvertArgs: '-y -v warning -stats -i {INPUT_FILE} -c:v libx264 -crf 18 -preset medium -profile:v high -level 51 -acodec aac -b:a 192k -ac 2 -r 24 -t 00:00:06 {OUTPUT_FILE}',
		videoCaptureArgs: '-y -ss 00:00:03 -i {INPUT_FILE} -f image2 -vframes 1 -crf 10 {OUTPUT_FILE}',
		gifCaptureArgs: '-y -i {INPUT_FILE} -f image2 -vframes 1 -crf 10 {OUTPUT_FILE}',
		gifCompositionArgs: '-y -f image2 -framerate 2 -i {INPUT_FILE} {OUTPUT_FILE}',
		pngConvertJpgArgs: '-y -i {INPUT_FILE} -q:v 3 -quality 100 {OUTPUT_FILE}'
	},
	webUrl: {
		protocol: 'http',
		domain: 'quickeecam.com',
		detailPage: 'detail/'
	},
	pageImage: {
		blank: './assets/images/blank.gif'
	},
	apiCache: ['device/register', 'device/info', 'device/sponsor', 'device/ar'],
	networkConnectionName: ['eth', '本地连接'],
	viodeBannerSupport: ['mp4', 'webm', 'ogg'],
	regular: {
		email: /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/
	},
	debug: {
		devMode: false,
		offlineLaunchMode: false,
		webviewDebug: false,
		zoomSize: 1,
		alwaysOnTop: true,
		autoLongTimeTestTask: false,
		autoLongTimeTestType: 'random',
		logOutput: 'console',
		consoleLogLevel: 3,
		disabledVideoBanner: false,
		disabledGallery: false,
		disabledUploadFile: false,
		enabledTurnplateGame: false,
		cleanDbWithLaunch: false,
		cleanFilesWithLaunch: false
	}
};
