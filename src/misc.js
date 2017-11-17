const qcMisc = {
	rand(min = 0, max = 1) {
		return Math.floor(Math.random() * (max - min + 1) + min);
	},

	MD5(str = new Date().toTimeString()) {
		const md5sum = crypto.createHash('md5');
		md5sum.update(str);
		return md5sum.digest('hex');
	},

	hash(str = new Date().toTimeString()) {
		const hash = crypto.createHash('sha256');
		hash.update(str);
		return hash.digest('hex');
	},

	sha1File(filePath = '') {
		return hasha.fromFileSync(filePath, {algorithm: 'sha1'});
	},

	md5File(filePath = '') {
		return hasha.fromFileSync(filePath, {algorithm: 'md5'});
	},

	parseJSON(str = '{}') {
		return JSON.parse(str);
	}
};