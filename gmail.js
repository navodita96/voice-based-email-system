var CLIENT_ID = '580989619423-alsqdjla5f6n96hec06459rnjc55vdtj.apps.googleusercontent.com';
var API_KEY = 'AIzaSyClKzhjr0_YRlv7GsLzkQXEMShMvSSGyS0';

var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"];
var SCOPES = 'https://www.googleapis.com/auth/gmail.modify';

var authorizeButton = document.getElementById('authorize-button');
var contentPanel = document.getElementById('contnet-panel');
var messageBus = new Bus();

function handleClientLoad() {
	gapi.load('client:auth2', initClient);
}

function initClient() {
	gapi.client.init({
		apiKey: API_KEY,
		clientId: CLIENT_ID,
		discoveryDocs: DISCOVERY_DOCS,
		scope: SCOPES
	}).then(function () {
		messageBus.publish(messageBus.topics.GMAIL_API_INITILIZED, true);
	});
}