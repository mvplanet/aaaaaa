const qcQRcode = {
	qrcodeLayer: '#qrCodeView',

	init(config = {}) {
		const self = this;
		qcLog.log('QRcode Init', 0);
	},

	generate(url, level = 'L') {
		const self = this;
		$(self.qrcodeLayer).empty();
		
		const qrcode = new QRCode($(self.qrcodeLayer).get(0), {
			text: url,
			width: 256,
			height: 256,
			colorDark : "#000000",
			colorLight : "#ffffff",
			correctLevel : QRCode.CorrectLevel[level]
		});
	}
};
