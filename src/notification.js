const qcNotification = {
	systemWarning: '#systemWarning',
	
	push(msg = '', type = 'info') {
		/*
		 * type: info, error, success
		 */
		Messenger({extraClasses: 'messenger-fixed messenger-on-top'}).post({
			type: type,
			message: msg
		});
	},

	warning(message = '') {
		const self = this;
		$(`<span>${message}</span>`).appendTo(self.systemWarning);
		$(self.systemWarning).show();
	}
};