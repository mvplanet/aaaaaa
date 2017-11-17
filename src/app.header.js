const {ipcRenderer, webFrame} = require('electron');
const os = require('os');
const http = require('http');
const fs = require('fs-extra');
const fspath = require('path');
const request = require('request');
const url = require('url');
const querystring = require('querystring');
const moment = require('moment');
const socket = require('socket.io-client');
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const hasha = require('hasha');
const spawn = require('child-process-promise').spawn;
let firmata = undefined;
try {
	firmata = require("firmata");
} catch(e) {
	console.log(`Firmata Load Failure: ${JSON.stringify(e)}`);
}
webFrame.setZoomLevelLimits(1, 1);