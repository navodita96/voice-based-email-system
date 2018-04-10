var getSpeechSynthesisUtterance = function () {
    console.log('Creating new SpeechSynthesisUtterance');
    var msg = new SpeechSynthesisUtterance();
    msg.voiceURI = 'native';
    msg.volume = 1; // 0 to 1
    msg.rate = 0.8; // 0.1 to 10
    msg.pitch = 0; //0 to 2
    msg.lang = 'en-US';
    return msg;
}

var msg = getSpeechSynthesisUtterance();
var IS_SPEAKING = false;

var count = 0;
var MAX_RESET_COUNT = 10;

var TextToSpeech = function () {

    var NOTIFY = [];

    this.isSpeaking = function () {
        return IS_SPEAKING;
    }

    this.speak = function (text, onEnd, args) {
        count = (count + 1) % MAX_RESET_COUNT;
        if (count === 0) {
            msg = getSpeechSynthesisUtterance();
        }

        IS_SPEAKING = true;
        msg.text = text;
        speechSynthesis.speak(msg)
        msg.onend = function (e) {
            IS_SPEAKING = false;
            console.log('Finished in ' + (e.elapsedTime) / 1000 + ' seconds.');
            while (NOTIFY.length !== 0) {
                var callback = NOTIFY.shift();
                callback(args);
            }
            if (onEnd) {
                onEnd(args);
            }
        };
    }

    this.notifyWhenDone = function (callback) {
        if (typeof callback !== "function") {
            throw new Error('callback should be a function. passed: ' + (typeof callback));
        }
        NOTIFY.push(callback);
    }
}