var SpeechToText = function () {
	this.listen = function (callback) {
		if (typeof callback !== "function") {
			throw new Error('callback should be a function. passed: ' + (typeof callback));
		}
		var recognition = new webkitSpeechRecognition();
		recognition.onresult = callback;
		var audio = new Audio('assets/beep.mp3');
		audio.play().then(function () {
			recognition.start();
		}).catch(function (e) {
			console.warn('Something went wrong while listening', e);
		});
	}
}