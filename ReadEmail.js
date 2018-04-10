var messageBus = new Bus();
var textToSpeech = new TextToSpeech();
var speechToText = new SpeechToText();


var ReadEmail = function () {

    var MAX_MESSAGE_LENGTH = 100;

    var getUnreadEmailIDs = function (callback) {
        if (typeof callback !== "function") {
            throw new Error('callback should be a function. passed: ' + (typeof callback));
        }
        gapi.client.gmail.users.messages.list({
            'userId': 'me',
            'labelIds': ['UNREAD']
        }).then(function (response) {
            if (response.status == 200) {
                return response.result;
            } else {
                return new Error(response.statusText);
            }
        }).then(function (body) {
            callback(body);
        }).catch(function (e) {
            console.warn('Something went wrong while getting unread emails', e);
            textToSpeech.speak('Something went wrong while getting unread emails. Please try again later');
        });
    }

    var getAllEmailIDs = function (callback) {
        if (typeof callback !== "function") {
            throw new Error('callback should be a function. passed: ' + (typeof callback));
        }
        gapi.client.gmail.users.messages.list({
            'userId': 'me'
        }).then(function (response) {
            if (response.status == 200) {
                return response.result;
            } else {
                return new Error(response.statusText);
            }
        }).then(function (body) {
            callback(body);
        }).catch(function (e) {
            console.warn('Something went wrong while getting all emails', e);
            textToSpeech.speak('Something went wrong while getting all emails. Please try again later');
        })
    }

    var searchForID = function (id, messages) {
        if (!id || !messages) {
            return undefined;
        }
        for (var i = 0; i < messages.length; i++) {
            if (messages[i] && messages[i].id === id) {
                return i;
            }
        }
        return undefined;
    }

    var readNextEmail = function (id) {
        var onBodyFinalized = function (body) {
            var index = searchForID(id, body.messages);
            if (index !== undefined) {
                if (index + 1 < body.messages.length) {
                    readEmail(body.messages[index + 1].id);
                } else {
                    textToSpeech.speak("That was the last email. You do not have any more emails");
                    textToSpeech.notifyWhenDone(function () {
                        messageBus.publish(messageBus.topics.RESTART_APP, true);
                    });
                }
            } else {
                textToSpeech.speak("Something went wrong while getting the next email.");
                textToSpeech.notifyWhenDone(function () {
                    messageBus.publish(messageBus.topics.RESTART_APP, true);
                });
            }
        }

        getUnreadEmailIDs(function (body) {
            if (body.resultSizeEstimate === 0) {
                getAllEmailIDs(onBodyFinalized);
            } else {
                onBodyFinalized(body);
            }
        })
    }

    var readPreviousEmail = function (id) {
        var onBodyFinalized = function (body) {
            var index = searchForID(id, body.messages);
            if (index !== undefined) {
                if (index - 1 >= 0) {
                    readEmail(body.messages[index - 1].id);
                } else {
                    textToSpeech.speak("That was the first email. I can not go back from first email");
                    textToSpeech.notifyWhenDone(function () {
                        messageBus.publish(messageBus.topics.RESTART_APP, true);
                    });
                }
            } else {
                textToSpeech.speak("Something went wrong while getting the next email.");
                textToSpeech.notifyWhenDone(function () {
                    messageBus.publish(messageBus.topics.RESTART_APP, true);
                });
            }
        }

        getUnreadEmailIDs(function (body) {
            if (body.resultSizeEstimate === 0) {
                getAllEmailIDs(onBodyFinalized);
            } else {
                onBodyFinalized(body);
            }
        })
    }


    var emailReadingDone = function (id) {
        var msg = "I have done reading the email. To read it again, say 'again', to go to the next email, say 'next' to go to the previous email, say 'previous'.";
        var callback = function () {
            speechToText.listen(function (event) {
                var result = event.results[0][0];
                switch (result.transcript.toLowerCase().trim()) {
                    case 'again': {
                        readEmail(id);
                        break;
                    }
                    case 'next': {
                        readNextEmail(id);
                        break;
                    }
                    case 'previous': {
                        readPreviousEmail(id);
                        break;
                    }
                    default: {
                        textToSpeech.speak("Response '" + result.transcript + "' is not recognized. say 'again', to go to the next email, say 'next' to go to the previous email, say 'previous'", callback);
                        break;
                    }
                }
            });
        };
        textToSpeech.speak(msg, callback);
    }


    var getHeaderValue = function (headers, headerToFind) {
        var op = headers.filter(function (aHeader) {
            return aHeader.name === headerToFind;
        });
        return op.length > 0 ? op[0].value : null;
    }

    var prepareSnippet = function (body) {
        var snippet = body.snippet;
        var from = getHeaderValue(body.payload.headers, 'From');
        var subject = getHeaderValue(body.payload.headers, 'Subject');
        return 'From: "' + from + '". Subject: "' + subject + '". Message: "' + snippet + '"';
    }


    var readEmail = function (id) {
        var speakByParts = function (body) {
            if (textToSpeech.isSpeaking()) {
                textToSpeech.notifyWhenDone(speakByParts);
                return;
            }
            textToSpeech.speak('From: ' + getHeaderValue(body.payload.headers, 'From'), function () {
                textToSpeech.speak('Subject: ' + getHeaderValue(body.payload.headers, 'Subject'), function () {
                    textToSpeech.speak('Message: ' + body.snippet.substring(0, MAX_MESSAGE_LENGTH), emailReadingDone, id);
                });
            });
        }

        textToSpeech.speak('Okay, reading your email. Please wait', function () {
            gapi.client.gmail.users.messages.get({
                'userId': 'me',
                'id': id
            }).then(function (response) {
                if (response.status == 200) {
                    return response.result;
                } else {
                    return new Error(response.statusText);
                }
            }).then(function (body) {
                speakByParts(body);
            }).catch(function (e) {
                console.warn('Something went wrong while getting email with id:' + id, e);
                textToSpeech.speak('Something went wrong while getting your email. Please try again later');
            })
        });
    }

    var getAllEmails = function () {
        getAllEmailIDs(function (body) {
            var emailID = body.messages[0].id;
            readEmail(emailID);
        });
    }

    var unreadEmailsRecevied = function (body) {
        var init = function () {
            var msg = body.resultSizeEstimate ?
                "You have " + body.resultSizeEstimate + " unread emails. Say 'reed' to read the first email"
                : "You have no new emails. Say 'reed' to read the last received email";


            var callback = function (event) {
                speechToText.listen(function (event) {
                    var result = event.results[0][0];
                    switch (result.transcript.toLowerCase().trim()) {
                        case 'reed':
                        case 'read': {
                            if (body.resultSizeEstimate) {
                                readEmail(body.messages[0].id);
                            } else {
                                getAllEmails();
                            }
                            break;
                        }
                        default: {
                            textToSpeech.speak("Response '" + result.transcript + "' is not recognized. Please say 'reed' to read the emails", callback);
                            break;
                        }
                    }
                });
            }
            textToSpeech.speak(msg, callback);
        }
        if (textToSpeech.isSpeaking()) {
            textToSpeech.notifyWhenDone(init);
        } else {
            init();
        }
    }

    this.init = function () {
        textToSpeech.speak("Okay, Getting your emails. Please wait...");
        getUnreadEmailIDs(unreadEmailsRecevied);
    }
}