
// create global namespace
MyAPP = {};

MyAPP.prefs = {
	firstuse: true,
	email: '',
	password: '',
	key: '',
	lastSync: 0,
	localWins: false,
	//showNoteIcon: true,
	focusMode: Mojo.Widget.focusSelectMode,
	syncWifiOnly: false,
	allowRotate: false,
	color: 1,
	sortOrder: "1",
	sortDir: "DESC"
};

MyAPP.debug = true;

MyAPP.sortItems = [
	{label: $L('Created'), sort: 'created', command: "0"},
	{label: $L('Modified'), sort: 'modified', command: "1"},
	{label: $L('Title'), sort: 'note', command: "2"}
];


// colors from: http://en.wikipedia.org/wiki/Web_colors
MyAPP.colors = [
	{value: 0, label: $L("White"), color: "#FFFFFF", secondaryIcon: "icon-color-white"},
	{value: 1, label: $L("Light Yellow"), color: "#FFFFE0", secondaryIcon: "icon-color-lightyellow"},
	{value: 2, label: $L("Cornsilk"), color: "#FFF8DC", secondaryIcon: "icon-color-cornsilk"},
	{value: 3, label: $L("Beige"), color: "#F5F5DC", secondaryIcon: "icon-color-beige"},
	{value: 4, label: $L("Khaki"), color: "#F0E68C", secondaryIcon: "icon-color-khaki"},
	{value: 5, label: $L("Honeydew"), color: "#F0FFF0", secondaryIcon: "icon-color-honeydew"},
	{value: 6, label: $L("Pale Green"), color: "#98FB98", secondaryIcon: "icon-color-palegreen"},
	{value: 7, label: $L("Seashell"), color: "#FFF5EE", secondaryIcon: "icon-color-seashell"},
	{value: 8, label: $L("Antique White"), color: "#FAEBD7", secondaryIcon: "icon-color-antiquewhite"},
	{value: 9, label: $L("Pink"), color: "#FFC0CB", secondaryIcon: "icon-color-pink"},
	{value: 10, label: $L("Wheat"), color: "#F5DEB3", secondaryIcon: "icon-color-wheat"},
	{value: 11, label: $L("Tan"), color: "#D2B48C", secondaryIcon: "icon-color-tan"},
	{value: 12, label: $L("Alice Blue"), color: "#F0F8FF", secondaryIcon: "icon-color-aliceblue"},
	{value: 13, label: $L("Lavender"), color: "#E6E6FA", secondaryIcon: "icon-color-lavender"},
	{value: 14, label: $L("Light Gray"), color: "#D3D3D3", secondaryIcon: "icon-color-lightgray"},
	{value: 15, label: $L("Light Blue"), color: "#ADD8E6", secondaryIcon: "icon-color-lightblue"},
	{value: 16, label: $L("Plum"), color: "#DDA0DD", secondaryIcon: "icon-color-plum"}
];


function StageAssistant() {
	/* this is the creator function for your stage assistant object */
}

StageAssistant.prototype.setup = function(){
	/* this function is for setup tasks that have to happen when the stage is first created */
	api.init();
	this.getSyncLogCookie();
	this.getPrefs();
};

StageAssistant.prototype.getPrefs = function () {
	//Mojo.Log.info("Getting Preferences");
	var options = {
		name: Mojo.appInfo.id + ".prefs",
		version: 0.1,
		displayName: Mojo.appInfo.title + " prefs DB"
	};
	
	MyAPP.prefsDb = new Mojo.Depot(options, this.gotPrefsDb.bind(this), this.dbFailure.bind(this));
};

StageAssistant.prototype.gotPrefsDb = function (event) {
	//Mojo.Log.info("Prefs DB Retrieved");
	MyAPP.prefsDb.get('prefs', this.gotPrefs.bind(this), this.dbFailure.bind(this));
};

StageAssistant.prototype.gotPrefs = function (args) {
	if (args) {
		//Mojo.Log.info("Preferences retrieved from Depot");

		//MyAPP.prefs = args;
		for (value in args) {
				MyAPP.prefs[value] = args[value];
				//Mojo.Log.info("Pref: ", value, args[value], MyAPP.prefs[value]);
		}
	}
	else {
		//Mojo.Log.info("PREFS LOAD FAILURE!!!");
	}
	//Mojo.Log.info("Prefs: %j", MyAPP.prefs);

	dao.init(this.pushFirstScene.bind(this));
};

StageAssistant.prototype.dbFailure = function (event) {
	//Mojo.Log.info("Prefs DB failure %j", event);
};

StageAssistant.prototype.pushFirstScene = function () {	
	this.controller.pushScene("noteslist");
};

StageAssistant.prototype.getSyncLogCookie = function () {
	//Mojo.Log.info("Get Cookie!");
	MyAPP.syncLogCookie = new Mojo.Model.Cookie(MyAPP.appName + "syncLog");
};
