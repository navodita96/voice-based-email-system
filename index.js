var messageBus = new Bus();
var textToSpeech = new TextToSpeech();
var speechToText = new SpeechToText();
var IS_SIGNED_OUT = false;
function initializeSignIn() {
    gapi.auth2.getAuthInstance().signIn();
}

var signout = function() {
    gapi.auth2.getAuthInstance().signOut();
    IS_SIGNED_OUT = true;
    textToSpeech.speak("You are signed out. Please refresh the window to sign in.");

}

var takeMainActionCommand = function () {
    var callback = function () {
        speechToText.listen(function (event) {
            var result = event.results[0][0];
            switch (result.transcript.toLowerCase().trim()) {
                case 'compose': {
                    new SendEmail().init();
                    break;
                }
                case 'reed':
                case 'read': {
                    new ReadEmail().init();
                    break;
                }
                case 'stop': {
                    console.warn('The app is stopped. Refresh the browser window to restart.');
                    break;
                }
                case 'sign out':
                case 'signout':
                case 'sign-out': {
                    signout();
                    break;
                }
                default: {
                    textToSpeech.speak("Response '" + result.transcript + "' is not recognized. Please say 'compose' to create and send a new email, or 'reed' to read the emails. To stop the application, say 'stop'. To sign out, say 'sign out'", callback);
                    break;
                }
            }
        });
    };
    textToSpeech.speak("You can either say 'compose' or 'reed'. To stop the application, say 'stop'. To sign out, say 'sign out'", callback);
}

var initializeSignedInUser = function () {
    if (textToSpeech.isSpeaking()) {
        textToSpeech.notifyWhenDone(initializeSignedInUser);
        return;
    }
    textToSpeech.speak("You are successfully signed in.", takeMainActionCommand);
}

var initializeNewUser = function () {
    if (textToSpeech.isSpeaking()) {
        textToSpeech.notifyWhenDone(initializeNewUser);
        return;
    }
    textToSpeech.speak("You are not signed in. Please say 'Sign In' to initialize sign in process", function () {
        speechToText.listen(function (event) {
            var result = event.results[0][0];
            var msg;
            if (result.confidence >= 0.75) {
                msg = "Initializing sign in process";
            } else {
                msg = "I am not quite confident what you said but I am initializing sign in process anyway";
            }
            textToSpeech.speak(msg, initializeSignIn);
        });
    });
}

function updateSigninStatus(isSignedIn) {
    if(IS_SIGNED_OUT) {
        return;
    }
    if (isSignedIn) {
        initializeSignedInUser();
    } else {
        initializeNewUser();
    }
}

var gmailApiInitilized = function () {
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
    var isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
    if (isSignedIn) {
        initializeSignedInUser();
    } else {
        initializeNewUser();
    }
}

var restartApp = function () {
    takeMainActionCommand();
}

function initializeApp() {
    messageBus.subscribe(messageBus.topics.GMAIL_API_INITILIZED, gmailApiInitilized);
    messageBus.subscribe(messageBus.topics.RESTART_APP, restartApp);
    textToSpeech.speak("Please wait while I am checking your signed in status");
}
initializeApp();

