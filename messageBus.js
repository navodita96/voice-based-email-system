var TOPICS = ['GMAIL_API_INITILIZED', 'SIGN_IN_STATUS_CHANGED', 'RESTART_APP'];
var CALLBACKS = {};
var Bus = function () {

    this.topics = {
        GMAIL_API_INITILIZED: 'GMAIL_API_INITILIZED',
        SIGN_IN_STATUS_CHANGED: 'SIGN_IN_STATUS_CHANGED',
        RESTART_APP: 'RESTART_APP'
    }

    this.publish = function (topic, message) {
        if (!TOPICS.includes(topic)) {
            throw new Error('topic ' + topic + ' not found');
        }
        var callbacks = CALLBACKS[topic];
        if (callbacks) {
            callbacks.forEach(function (aCallback) {
                aCallback(topic);
            });
        }
    }

    this.subscribe = function (topic, callback) {
        if (!TOPICS.includes(topic)) {
            throw new Error('topic ' + topic + ' not found');
        }
        if (typeof callback !== "function") {
            throw new Error('callback should be a function. passed: ' + (typeof callback));
        }
        if (!CALLBACKS[topic]) {
            CALLBACKS[topic] = [];
        }
        CALLBACKS[topic].push(callback);
    }

    this.unsubscribe = function (topic, callback) {
        if (!TOPICS.includes(topic)) {
            throw new Error('topic ' + topic + ' not found');
        }
        if (typeof callback !== "function") {
            throw new Error('callback should be a function. passed: ' + (typeof callback));
        }
        var index = CALLBACKS[topic].indexOf(callback);
        if (index >= 0) {
            CALLBACKS[topic].splice(index, 1);
        }
    }
}