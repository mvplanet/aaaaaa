# QuickeeCam-Electron
## Npm 命令说明
源码方式运行 (同 gulp run)
`$> npm run start`

安装 modules (需先安装 Visual Studio，npm组件 node-gyp node-pre-gyp windows-build-tools)
`$> npm install`

自增版本号 (脚本自动执行 gulp version:auto)
`$> npm run version_auto_increment`

生成 exe (脚本自动执行 gulp minify/publish)
`$> npm run package`

生成 release 包 (生成 nupkg / setup / RELEASES)
`$> npm run release64`

## Gulp 命令说明
源码方式运行
`$> gulp run`

清空已安装npm modules
`$> gulp clean:npm`

清空builds
`$> gulp clean:build`

压缩 src/\*.js 生成 app/\*.js
`$> gulp minify`

生成 asar 并删除源码等无用文件 (npm run package 生成exe后才能执行)
`$> gulp publish`

当前版本号
`$> gulp version:current`

自增版本号并写入package.json (--assign可指定版本号)
`$> gulp version:auto`
`$> gulp version:auto --assign=1.1.1`

## Build exe 说明
1. 安装 Visual Studio 2015/2017
2. 安装 nodejs LTS 版本
3. `$> npm install bower gulp node-gyp node-pre-gyp windows-build-tools -g`
4. `$> git clone https://github.com/qisolutionsinc/QuickeeCam-Electron.git`
   (或直接下载 https://github.com/qisolutionsinc/QuickeeCam-Electron/archive/master.zip 解压)
5. `$QuickeeCam-Electron> npm install`
6. `$QuickeeCam-Electron> npm run version_auto_increment`
7. `$QuickeeCam-Electron> npm run package` (exe 生成在 builds/ 下)
8. `$QuickeeCam-Electron> npm run release64` (exe 生成在 builds/ 下)

## China npm CDN
`$> npm install --registry=https://registry.npm.taobao.org`


## AR Tool
http://admin.quickeecam.com/brfv4Tools/demoToolext.html
