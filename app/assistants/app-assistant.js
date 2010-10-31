//	************************************************************
//
//						Noted! for Simplenote
//
// *************************************************************
//					Copyright 2010 Brian A Haeffner
// *************************************************************

// Setup namespace for Global Variables
MyAPP = {};

MyAPP.prefs = {
	firstuse: true,
	email: '',
	password: '',
	key: '',
	lastSync: 0,
	lastSyncServer: 0,
	showPreview: true,
	localWins: false,
	//showNoteIcon: true,
	focusMode: Mojo.Widget.focusAppendMode, //Mojo.Widget.focusSelectMode,
	syncOnStart: false,
	syncOnQuit: false,
	syncOnInterval: false,
	syncInterval: 1,  // 30 minutes for auto-sync
	syncTimerId: '',
	syncWifiOnly: false,
	allowRotate: false,
	color: 0,
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


function AppAssistant(appController) {
	//save global reference to App Assistant
	//Mojo.Log.info("AppAssistant CONSTRUCTOR!");
	//MyAPP.appAssistant = this;
	//this.appController = appController;
}

AppAssistant.prototype.setup = function () {
	//Mojo.Log.info("AppAssistant setup()");
	
};

// -------------------------------------------------------------------
//
// handleLaunch
//	- 
// 
// -------------------------------------------------------------------

AppAssistant.prototype.handleLaunch = function(launchParams){
	//Mojo.Log.info(" ********** App handleLaunch ***********");
	
	this.launchParams = launchParams;
	
	// Note: need to load prefs & other settings prior to launching app...
	// will call handleLaunchAfter
	api.init();
	this.getSyncLogCookie();
	this.getPrefs();
};

AppAssistant.prototype.handleLaunchAfter = function() {
	
	var launchParams = this.launchParams;
	
	var cardStageController, pushMainScene, stageArgs,
		dashboardStage, pushDashboard, scenes;
	cardStageController = this.controller.getStageController('mainStage');
	//Mojo.Log.info("controller is: " + cardStageController);
	Mojo.Log.info(" Launch Parameters: %j", launchParams);
	if (launchParams.addnote) {
		//launchParams.action = 'addnote';
	}
	switch (launchParams.action) {
	case "sync":

		if (cardStageController) {
			if (cardStageController.activeScene().sceneName === 'noteslist') {
				cardStageController.delegateToSceneAssistant("startSync");
			}
			//NOTE: Sync will not fire if other card is open (prefs, help, etc)
		}
		else {
			var launchSync = this.launchDashSync.bind(this, launchParams);

			//Mojo.Log.info("Calling Connection Service Request from AppAssistant");
			this.connectRequest = new Mojo.Service.Request('palm://com.palm.connectionmanager', {
				method: 'getstatus',
				parameters: {},
				onSuccess: function(response){
					//Mojo.Log.info("Connection Response %j", response);
					if (response.isInternetConnectionAvailable) {
						if (!MyAPP.prefs.syncWifiOnly ||
						response.wifi.state === 'connected') {
							launchSync();
							delete this.connectRequest;
						}
						else {
							//Mojo.Log.info("No wifi connection!");
							delete this.connectRequest;					
						}
					}
					else {
						//Mojo.Log.info("No internect connection!");
						delete this.connectRequest;				
					}
				},
				onFailure: function () {
					//Mojo.Log.info("Connection Status Service Request FAILED!");
				}
			});
		}
		if (MyAPP.prefs.syncOnInterval) {
			sync.setSyncTimer(MyAPP.prefs.syncInterval);
		}
		break;
	case "addnote":
		//Mojo.Log.info("app assitant addnote with value: ", launchParams.note);
		if (cardStageController) {
			// Application already running
			Mojo.Log.info("Relaunch! to add note");
			//if (cardStageController.activeScene().sceneName !== 'noteslist') {
				//cardStageController.popScenesTo('noteslist');
			//}
			//cardStageController.delegateToSceneAssistant("listAdd", launchParams.note);
			scenes = cardStageController.getScenes();
			if (scenes[0].sceneName === 'noteslist') {
				scenes[0].assistant.listAdd(launchParams.note);
			}
			cardStageController.activate();

		}
		else {
			Mojo.Log.info("Launch new noteslist stage!");
			//this.initDBandCookies();
			pushMainScene = function (stageController) {
				stageController.pushScene({
					name: 'noteslist',
					disableSceneScroller: false
				});
			};
			stageArgs = {
				name: 'mainStage',
				lightweight: true
			};
			this.controller.createStageWithCallback(stageArgs, pushMainScene.bind(this), 'card');
			cardStageController = this.controller.getStageProxy('mainStage');
			cardStageController.delegateToSceneAssistant("listAdd", launchParams.note);
		}
	
		break;
	case "search":
		//Mojo.Log.info("app assitant openTask with value: ", launchParams.taskValue);
		if (cardStageController) {
			// Application already running
			Mojo.Log.info("Relaunch! to search");
			if (cardStageController.activeScene().sceneName === 'noteslist') {
				cardStageController.activate();
				cardStageController.delegateToSceneAssistant("doFilter", launchParams.params.search);
			}
			else {
				cardStageController.popScenesTo('noteslist');
				scenes = cardStageController.getScenes();
				Mojo.Log.info("Scenes", scenes.length);
				if (scenes[0].sceneName === 'noteslist') {
					scenes[0].assistant.doFilter(launchParams.params.search);
				}
			}
			cardStageController.activate();
		}
		else {
			Mojo.Log.info("Launch new noteslist stage!");
			//this.initDBandCookies();
			pushMainScene = function (stageController) {
				stageController.pushScene({
						name: 'noteslist',
						disableSceneScroller: false
					},
					{	"type": "search",
						"search": launchParams.params.search
					}
				);
			};
			stageArgs = {
				name: 'mainStage',
				lightweight: true
			};
			this.controller.createStageWithCallback(stageArgs, pushMainScene.bind(this), 'card');
			cardStageController = this.controller.getStageProxy('mainStage');
			cardStageController.delegateToSceneAssistant("doFilter", launchParams.params.search);
		}
	
		break;
	default:
		//FIRST LAUNCH or TAP on Icon when minimized
		if (cardStageController) {
			// Application already running
			//Mojo.Log.info("Relaunch!");
			cardStageController.activate();
		}
		else {
			//Mojo.Log.info("Launch new noteslist stage!");
			//this.initDBandCookies();
			pushMainScene = function (stageController) {
				stageController.pushScene({
					name: 'noteslist',
					//assistantConstructor: NoteslistAssistant(),
					//sceneTemplate: 'noteslist/noteslist-scene',
					disableSceneScroller: false
					
				},
				{	"type": "search",
					"search": ""
				}
				);
			};
			stageArgs = {
				name: 'mainStage',
				lightweight: true
			};
			this.controller.createStageWithCallback(stageArgs, pushMainScene.bind(this), 'card');
		}
		break;
	}

	
};

AppAssistant.prototype.getPrefs = function () {
	//Mojo.Log.info("Getting Preferences");
	var options = {
		name: Mojo.appInfo.id + ".prefs",
		version: 0.1,
		displayName: Mojo.appInfo.title + " prefs DB"
	};
	
	MyAPP.prefsDb = new Mojo.Depot(options, this.gotPrefsDb.bind(this), this.dbFailure.bind(this));
};

AppAssistant.prototype.gotPrefsDb = function (event) {
	//Mojo.Log.info("Prefs DB Retrieved");
	MyAPP.prefsDb.get('prefs', this.gotPrefs.bind(this), this.dbFailure.bind(this));
};

AppAssistant.prototype.gotPrefs = function (args) {
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

AppAssistant.prototype.dbFailure = function (event) {
	//Mojo.Log.info("Prefs DB failure %j", event);
};

AppAssistant.prototype.pushFirstScene = function () {	
	//this.controller.pushScene("noteslist");
	this.handleLaunchAfter();
};

AppAssistant.prototype.getSyncLogCookie = function () {
	//Mojo.Log.info("Get Cookie!");
	MyAPP.syncLogCookie = new Mojo.Model.Cookie(MyAPP.appName + "syncLog");
};


AppAssistant.prototype.launchDashSync = function (launchParams) {
/*
		dashboardStage = this.controller.getStageController("dashsync");
		if (dashboardStage) {
			//Mojo.Log.info("Sync Dashboard already running");
			dashboardStage.delegateToSceneAssistant("displayDashboard", launchParams.dashInfo);
		}
		else {
			//Mojo.Log.info("No Sync dashboardStage found.");
			//this.initDBandCookies();
			pushDashboard = function(stageController){
				stageController.pushScene('dashsync', launchParams.dashInfo);
			};
			this.controller.createStageWithCallback({
				name: "dashsync",
				lightweight: true
			}, pushDashboard, 'dashboard');
		}
*/
	sync.initSync(this.finishedSync.bind(this));
};

AppAssistant.prototype.finishedSync = function (response) {
	//Mojo.Log.info("Sync Finished! %j", response);
};

AppAssistant.prototype.deactivate = function (event) {
	if (this.connectRequest) {
		//Mojo.Log.info("Deleting connection request object");
		delete this.connectRequest;
	}
};

