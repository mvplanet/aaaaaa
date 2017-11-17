const gulp = require('gulp');
const argv = require('yargs').argv;
const childProcess = require('child_process');
const electron = require('electron');
const asar = require('asar');
const compressor = require('node-minify');
const concat = require('concat');
const fs = require('fs-extra');
const url = require('url');
const fspath = require('path');
const del = require('del');
const request = require('request');
const appPath = './builds/QuickeeCam-win32-x64/resources/app';

gulp.task('run', () => {
	childProcess.spawn(electron, ['--debug-brk=5858', '.'], {
		stdio: 'inherit'
	});
});

gulp.task('clean:npm', [], del.bind(this, ['node_modules']));

gulp.task('clean:build', [], del.bind(this, ['builds']));

gulp.task('minify', () => {
	compressor.minify({
		compressor: 'gcc',
		input: [
			'./src/config.js',
			'./src/log.js',
			'./src/misc.js',
			'./src/loader.js',
			'./src/helper.js',
			'./src/session.js',
			'./src/timer.js',
			'./src/ffmpeg.js',
			'./src/theme.js',
			'./src/gallery.js',
			'./src/database.js',
			'./src/network.js',
			'./src/websocket.js',
			'./src/file.js',
			'./src/webcam.js',
			'./src/brfv4.js',
			'./src/effect.js',
			'./src/framework.js',
			'./src/scene.js',
			'./src/event.js',
			'./src/uploader.js',
			'./src/notification.js',
			'./src/keyboard.js',
			'./src/autoDebug.js',
			'./src/qrcode.js',
			'./src/gameTurnplate.js',
			'./src/visenzeExtract.js',
			'./src/restServer.js',
			'./src/arduino.js',
			'./src/autoUpdater.js',
			'./src/app.js'
		],
		output: './app/app.bundler.js',
		options: {
			compilation_level: 'SIMPLE_OPTIMIZATIONS',
			language: 'ECMASCRIPT6'
		},
		callback: (err, min) => {
			concat(['./src/app.header.js', './app/app.bundler.js'], './app/app.min.js').then((res) => {
				del.sync(['./app/app.bundler.js']);
			});
		}
	});

	compressor.minify({
		compressor: 'gcc',
		input: [
			'./src/config.js',
			'./src/log.js',
			'./src/file.js',
			'./src/setup.js'
		],
		output: './app/setup.bundler.js',
		options: {
			compilation_level: 'SIMPLE_OPTIMIZATIONS',
			language: 'ECMASCRIPT6'
		},
		callback: (err, min) => {
			concat(['./src/setup.header.js', './app/setup.bundler.js'], './app/setup.min.js').then((res) => {
				del.sync(['./app/setup.bundler.js']);
			});
		}
	});

	compressor.minify({
		compressor: 'gcc',
		input: [
			'./src/version.js'
		],
		output: './app/version.bundler.js',
		options: {
			compilation_level: 'SIMPLE_OPTIMIZATIONS',
			language: 'ECMASCRIPT6'
		},
		callback: (err, min) => {
			concat(['./src/version.header.js', './app/version.bundler.js'], './app/version.min.js').then((res) => {
				del.sync(['./app/version.bundler.js']);
			});
		}
	});
});

gulp.task('publish', () => {
	console.log('Package ./app');
	asarPackager(`${appPath}/app`, `${appPath}/app.asar`).then(() => {
		console.log('Package ./themes');
		return asarPackager('./themes', `${appPath}/themes.asar`);
	}).then(() => {
		console.log('Package ./plugins');
		return asarPackager('./plugins', `${appPath}/plugins.asar`);
	}).then(() => {
		console.log('Package Completed');
		['.vscode', 'plugins', 'app', 'src', 'files', 'themes', 'gulpfile.js', 'prepros-6.config', 'README.md', 'release.json', 'bootup.log'].map((dir) => {
			del.sync([`${appPath}/${dir}`]);
		});
		console.log('Remove Dir & Files');
		return Promise.resolve();
	}).then(() => {
		let packageJson = require(`${appPath}/package.json`);
		packageJson.main = "./app.asar/main.js";
		fs.writeFileSync(`${appPath}/package.json`, JSON.stringify(packageJson));
		console.log('Update package.json');
	});
});

gulp.task('version:auto', () => {
	let packageJson = require('./package.json');
	let appVersion = packageJson.version;
	if(typeof argv.assign !== 'undefined' && argv.assign.split('.').length == 3) {
		appVersion = argv.assign;
	} else {
		let avs = appVersion.split('.');
		avs[2] = parseInt(avs[2]) + 1;
		if(avs[2] >= 50) {
			avs[1] = parseInt(avs[1]) + 1;
			avs[2] = 0;
		}
		appVersion = avs.join('.');
	}

	packageJson.version = appVersion;
	packageJson.scripts.package = packageJson.scripts.package.replace(/\-\-build\-version\=(\d{1,}\.\d{1,}\.\d{1,})/, `--build-version=${appVersion}`);
	fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));
	console.log('New Version', appVersion);
});

gulp.task('version:current', () => {
	let packageJson = require('./package.json');
	console.log('Current Version', packageJson.version);
});

const asarPackager = (src, dest) => {
	return new Promise((resolve, reject) => {
		if(fs.existsSync(src)) {
			asar.createPackage(src, dest, () => {
				resolve();
			});
		} else {
			resolve();
		}
	});
};
