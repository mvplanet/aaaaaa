const {app, ipcMain, BrowserWindow} = require('electron');
const os = require('os');
const fs = require('fs-extra');
const fspath = require('path');
const ejse = require('ejs-electron');

// 保持一个对于 window 对象的全局引用，如果你不这样做，
// 当 JavaScript 对象被垃圾回收， window 会被自动地关闭
const shouldQuit = app.makeSingleInstance((commandLine, workingDirectory) => {
	// Someone tried to run a second instance, we should focus our window.
	if (mainWindow) {
		if (mainWindow.isMinimized()) {
			mainWindow.restore();
		}
		mainWindow.focus();
	}
});

if (shouldQuit) {
	app.quit();
}

const appInfo = fspath.parse(__dirname);
const isProductEnv = process.env.NODE_ENV !== 'development';

let mainWindow;
let setupWindow;
let versionWindow;
let setupDialogShow = false;
let config = null;
let currentDevMode = false;
let updatePackageReady = false;
let autoUpdaterInit = false;

const extConfig = fspath.resolve(app.getPath('appData'), 'QuickeeCam/QC3-config.json').replace(/\\/g, "\\\\");
const rootPath = fspath.resolve(__dirname, '../').replace(/\\/g, '/');
if(!fs.existsSync(extConfig)) {
	fs.copySync(`${__dirname}/config.json`, extConfig, {
		overwrite: true
	});
}

const appRelaunch = (timeout = 100) => {
	setTimeout(() => {
		app.relaunch({args: process.argv.slice(1).concat(['--relaunch'])});
		appExit();
	}, timeout);
	startupLog('App: Relaunch');
};

const appExit = () => {
	startupLog('App: Exit');
	app.quit();
	app.exit(0);
};


const loadConfig = () => {
	config = fs.readJsonSync(extConfig);
	config.debug.devMode = config.debug.devMode || false;
	config.debug.alwaysOnTop = config.debug.alwaysOnTop || false;
	startupLog('App: Load Config');
};

const createWindow = () => {
	// 创建浏览器窗口。
	mainWindow = new BrowserWindow({
		icon: `${__dirname}/assets/favicon/icon_32.png`,
		width: (config.debug.devMode ? 1080 * config.debug.zoomSize + 16 : 1080),
		height: (config.debug.devMode ? 1920 * config.debug.zoomSize + 38 : 1920),
		resizable: false,
		skipTaskbar: true,
		autoHideMenuBar: true,
		kiosk: !config.debug.devMode,
		alwaysOnTop: false //config.debug.alwaysOnTop
	});

	// 加载应用的 index.html。
	mainWindow.loadURL(`file://${__dirname}/index.ejs`);

	mainWindow.webContents.on('crashed', () => {
		mainWindow.destroy();
		createWindow();
	});

	// 启用开发工具。
	if(config.debug.devMode) {
		mainWindow.webContents.openDevTools();
	}

	// 当 window 被关闭，这个事件会被触发。
	mainWindow.on('closed', () => {
		// 取消引用 window 对象，如果你的应用支持多窗口的话，
		// 通常会把多个 window 对象存放在一个数组里面，
		// 与此同时，你应该删除相应的元素。
		mainWindow = null;
	});
	startupLog('App: Start');
};

ipcMain.on('app-relaunch', (event, arg) => {
	appRelaunch(arg.timeout);
	event.returnValue = true;
});

ipcMain.on('app-restart', (event, arg) => {
	if(updatePackageReady) {
		appUpdate();
	} else {
		loadConfig();
		ejse.data('quickStart', (arg === 'quick' ? true : false));

		if(config.debug.devMode !== currentDevMode) {
			currentDevMode = config.debug.devMode;
			if(mainWindow) {
				mainWindow.destroy();
			}
			createWindow();
		} else {
			if(mainWindow) {
				mainWindow.reload();
			}else{
				createWindow();
			}
		}
		startupLog('App: Reload');
	}
	event.returnValue = true;
});

ipcMain.on('app-quit', (event, arg) => {
	appExit();
	event.returnValue = true;
});

// Electron 会在初始化后并准备
// 创建浏览器窗口时，调用这个函数。
// 部分 API 在 ready 事件触发后才能使用。
app.on('ready', () => {
	startupLog('App: Ready');
	loadConfig();
	currentDevMode = config.debug.devMode;

	ejse.data({
		productEnv: isProductEnv,
		asarPack: appInfo.ext || '',
		configPath: extConfig,
		electronBasePath: rootPath,
		appDataPath: `${app.getPath('appData')}/QuickeeCam`,
		quickStart: false,
		updatePackageReady: false
	});

	createWindow();
});

// 当全部窗口关闭时退出。
app.on('window-all-closed', () => {
	// 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
	// 否则绝大部分应用及其菜单栏会保持激活。
	appExit();
});

app.on('activate', () => {
	// 在 macOS 上，当点击 dock 图标并且该应用没有打开的窗口时，
	// 绝大部分应用会重新创建一个窗口。
	if (mainWindow === null) {
		createWindow();
	}
});

app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
	// On certificate error we disable default behaviour (stop loading the page)
	// and we then say "it is all fine - true" to the callback
	event.preventDefault();
	callback(true);
});