function PreferencesAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
}

PreferencesAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the scene is first created */
	this.controller.get('appOptionsTitle').innerHTML = $L("Display Settings");
	this.controller.get('syncOptionsTitle').innerHTML = $L("Sync Settings");
		
	this.controller.get('accountOptionsTitle').innerHTML = $L("Account Settings");
	this.controller.get('AccountId').innerHTML = $L("Email:") + " " + MyAPP.prefs.email;

	/* use Mojo.View.render to render view templates and add them to the scene, if needed */
	
	/* setup widgets here */
	this.controller.setupWidget("EditAccountButtonId", 
		this.accountButtonAttributes = {}, 
		this.accountButtonModel = {
			buttonLabel : $L('Edit Account Settings'),        
			buttonClass : '',        
			disabled : false        
		});

	this.toggleAttributes = {
		trueLabel: $L('Yes'),
		falseLabel: $L('No')
	};

	// Add Background Color Selector List
	this.controller.setupWidget("BGColorSelectorId",
        this.bgColorAttributes = {
			label: $L("Color")
		},
		this.bgColorModel = {
			choices: MyAPP.colors,
			value: MyAPP.prefs.color
		}
    );


	// Add Show Preview toggle
	this.controller.setupWidget('showPreviewToggleId',
		this.toggleAttributes,
		this.showPreviewModel = {
			value: MyAPP.prefs.showPreview,
			disabled: false			
		});
	this.controller.get('showPreviewLabel').innerHTML = $L("Show Preview");


	// Add allow Landscape toggle
	this.controller.setupWidget('allowRotateToggleId',
		this.toggleAttributes,
		this.allowRotateModel = {
			value: MyAPP.prefs.allowRotate,
			disabled: false			
		});
	this.controller.get('allowRotateLabel').innerHTML = $L("Allow Landscape");
	
	
	// ****************************************************
	//  SYNC OPTIONS
	// ****************************************************
	// Add localWins toggle
	this.controller.setupWidget('localWinsToggleId',
		this.toggleAttributes,
		this.localWinsModel = {
			value: MyAPP.prefs.localWins,
			disabled: false			
		});
	this.controller.get('localWinsLabel').innerHTML = $L("Local wins on conflict");


	// Add syncOnStart toggle
	this.controller.setupWidget('syncOnStartToggleId',
		this.toggleAttributes,
		this.syncOnStartModel = {
			value: MyAPP.prefs.syncOnStart,
			disabled: false			
		});
	this.controller.get('syncOnStartLabel').innerHTML = $L("Sync at Launch");

	// Add syncOnQuit toggle
	this.controller.setupWidget('syncOnQuitToggleId',
		this.toggleAttributes,
		this.syncOnQuitModel = {
			value: MyAPP.prefs.syncOnQuit,
			disabled: false			
		});
	this.controller.get('syncOnQuitLabel').innerHTML = $L("Sync after Exit");

	// Add syncOnInterval toggle
	this.controller.setupWidget('syncOnIntervalToggleId',
		this.toggleAttributes,
		this.syncOnIntervalModel = {
			value: MyAPP.prefs.syncOnInterval,
			disabled: false			
		});
	this.controller.get('syncOnIntervalLabel').innerHTML = $L("Auto-Sync");


	// Add syncWifiOnly toggle
	this.controller.setupWidget('syncWifiOnlyToggleId',
		this.toggleAttributes,
		this.syncWifiOnlyModel = {
			value: MyAPP.prefs.syncWifiOnly,
			disabled: false			
		});
	this.controller.get('syncWifiOnlyLabel').innerHTML = $L("Sync only on Wifi");

	// Setup app menu	
	this.appMenuModel = {
		visible: true,
		items: [
			Mojo.Menu.editItem,
			{label: $L('Preferences & Accounts') + "...", command: 'doPrefs', disabled: true},
			//{label: $L('Folders Contexts & Goals') + "...", command: 'doFolders', disabled: false},
			//{label: $L('Custom Lists') + "...", command: 'doCustom', disabled: false},
			Mojo.Menu.helpItem
		]
	};
	this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, this.appMenuModel);
	
	/* add event handlers to listen to events from widgets */
	this.editAccountHandler = this.editAccount.bind(this);
	this.controller.listen('EditAccountButtonId', Mojo.Event.tap, this.editAccountHandler);
};

PreferencesAssistant.prototype.handleCommand = function (event) {
	if (event.type === Mojo.Event.commandEnable) {
		switch (event.command) {
		case Mojo.Menu.helpCmd:
			event.stopPropagation();
			break;
		}
	}
	if (event.type === Mojo.Event.command) {
		switch (event.command) {
			case Mojo.Menu.helpCmd:
				this.controller.stageController.pushScene('support');
				break;
		}
	}
};

PreferencesAssistant.prototype.editAccount = function (event) {
	//Mojo.Log.info('Going to accounts scene');
	this.controller.stageController.pushScene('accounts');
};

PreferencesAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */

	// update email in case returning from Account settings
	this.controller.get('AccountId').innerHTML = $L("Email:") + " " + MyAPP.prefs.email;
};

PreferencesAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */

	MyAPP.prefs.showPreview = this.showPreviewModel.value;
	MyAPP.prefs.color = this.bgColorModel.value;
	MyAPP.prefs.allowRotate = this.allowRotateModel.value;
	MyAPP.prefs.localWins = this.localWinsModel.value;
	MyAPP.prefs.syncOnStart = this.syncOnStartModel.value;
	MyAPP.prefs.syncOnQuit = this.syncOnQuitModel.value;
	MyAPP.prefs.syncOnInterval = this.syncOnIntervalModel.value;
	MyAPP.prefs.syncWifiOnly = this.syncWifiOnlyModel.value;
	
	//Mojo.Log.info("Leaving Prefs Scene with %j", MyAPP.prefs);
	//MyAPP.prefsCookie = new Mojo.Model.Cookie(MyAPP.appName + "prefs");
	//MyAPP.prefsCookie.put(MyAPP.prefs);
	MyAPP.prefsDb.add('prefs', MyAPP.prefs, 
		function () {},
		function (event) {
			//Mojo.Log.info("Prefs DB failure %j", event);
	});

	// Set auto-syncing if selected
	if (MyAPP.prefs.syncOnInterval) {
		//Mojo.Log.info("Setting up Auto-Sync in", MyAPP.prefs.syncInterval, "minutes");
		sync.setSyncTimer(MyAPP.prefs.syncInterval);
	}
	else {
		//Mojo.Log.info("Clearing Auto-Sync Timer");
		sync.clearSyncTimer(MyAPP.prefs.syncTimerId);
	}


};

PreferencesAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	this.controller.stopListening('EditAccountButtonId', Mojo.Event.tap, this.editAccountHandler);
};
