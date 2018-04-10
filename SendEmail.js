var messageBus = new Bus();
var textToSpeech = new TextToSpeech();
var speechToText = new SpeechToText();

var SendEmail = function () {

    var emailSent = function (result) {
        if (result.labelIds.includes('SENT')) {
            textToSpeech.speak("Your messages has been successfully sent.");
        } else {
            console.warn(result);
            textToSpeech.speak("There was some error sending your message. Please try again.");
        }
        textToSpeech.notifyWhenDone(function () {
            messageBus.publish(messageBus.topics.RESTART_APP, true);
        });
    }

    /**
     * Send Message.
     *
     * @param  {String} userId User's email address. The special value 'me'
     * can be used to indicate the authenticated user.
     * @param  {String} email RFC 5322 formatted String.
     * @param  {Function} callback Function to call when the request is complete.
     */
    var sendMessage = function (userId, email, callback) {
        // Using the js-base64 library for encoding:
        // https://www.npmjs.com/package/js-base64
        var base64EncodedEmail = Base64.encodeURI(email);
        var request = gapi.client.gmail.users.messages.send({
            'userId': userId,
            'resource': {
                'raw': base64EncodedEmail
            }
        });
        request.execute(callback);
    }

    var getBody = function (email) {
        var askFormMessage = function () {
            textToSpeech.speak("Tell me the message", function () {
                speechToText.listen(function (event) {
                    var result = event.results[0][0];
                    email.setBody(result.transcript);
                    console.log(email.toString());
                    sendMessage('me', email.toString(), emailSent);
                })
            });
        }
        if (textToSpeech.isSpeaking()) {
            textToSpeech.notifyWhenDone(askFormMessage);
        } else {
            askFormMessage();
        }

    }

    var getSubject = function (email) {
        var askForSubject = function () {
            textToSpeech.speak("Tell me the Subject", function () {
                speechToText.listen(function (event) {
                    var result = event.results[0][0];
                    email.setSubject(result.transcript);
                    getBody(email);
                })
            });
        }
        if (textToSpeech.isSpeaking()) {
            textToSpeech.notifyWhenDone(askForSubject);
        } else {
            askForSubject();
        }
    }

    var validateEmail = function (spokenEmail) {

    }

    var prepareEmail = function (utterence) {
        var splitted = utterence.split("@");
        var partOne = splitted[0].split(' ').join('');
        var partTwo = splitted[1].split(' ').join('');
        return partOne + '@' + partTwo;
    }

    var getToEmailAddress = function (email) {
        var askForToEmailAddress = function () {
            textToSpeech.speak("Tell me the email address to send the mail to", function () {
                speechToText.listen(function (event) {
                    var result = event.results[0][0];
                    textToSpeech.speak("Okay, sending email to " + result.transcript + ".");
                    var preparedEmail = prepareEmail(result.transcript);
                    email.setTo(preparedEmail);
                    getSubject(email);
                })
            });
        }
        if (textToSpeech.isSpeaking()) {
            textToSpeech.notifyWhenDone(askForToEmailAddress);
        } else {
            askForToEmailAddress();
        }
    }


    this.init = function () {
        var email = new Email();
        gapi.client.gmail.users.getProfile({
            'userId': 'me',
        }).then(function (response) {
            if (response.status == 200) {
                return response.result;
            } else {
                return new Error(response.statusText);
            }
        }).then(function (body) {
            email.setFrom(body.emailAddress);
            getToEmailAddress(email);
        })
    }
}