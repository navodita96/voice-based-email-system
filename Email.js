
var Email = function () {
    var uuid = function () {
        return Math.random().toString(36).substring(2)
            + (new Date()).getTime().toString(36);
    }

    this.email = 'Message-ID: ' + uuid() + '\r\n';

    this.setTo = function (to) {
        this.email += 'To: ' + to + '\r\n';
    }

    this.setFrom = function (from) {
        this.email += 'From: ' + from + '\r\n';
        this.email += 'Reply-To: ' + from + '\r\n';
    }

    this.setSubject = function (subject) {
        this.email += 'Subject: ' + subject + '\r\n';
    }

    this.setBody = function (body) {
        this.email += '\n' + body;
    }

    this.toString = function () {
        return this.email;
    }
}