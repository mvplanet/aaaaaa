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
	network: {
		downloadTimeout: 30 * 1000,
		retryTime: 5 * 1000
	},
	api: {
		protocol: 'http',
		host: 'api.quickeecam.com',
		version: 'v2.0',
		port: 80,
		registerPasswd: 'jack1234'
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
	camEnded: {
		waitTime: 20 * 1000
	},
	preview: {
		picture: 3 * 1000,
		gif: 3 * 1000,
		video: 7 * 1000
	},
	capture: {
		height: 960,
		width: 720,
		quality: 100,
		prefixTime: 3 * 1000,
		cameraPositionTipTime: 3 * 1000,
	},
	video: {
		coder: 'video/webm',
		time: 6 * 1000
	},
	uploader: {
		interval: 10 * 000,
		uploadFile: true,
		uploadContact: true,
		uploadExtendData: true
	},
	ffmpeg: {
		binPath: `${window.qcStartUpParams.electronBasePath}/bin/ffmpeg.exe`,
		videoConvertArgs: '-y -v warning -stats -i {INPUT_FILE} -c:v libx264 -crf 18 -preset medium -profile:v high -level 51 -acodec aac -b:a 192k -ac 2 -r 24 -t 00:00:06 {OUTPUT_FILE}'
	},
	pageImage: {
		blank: './assets/images/blank.gif'
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
