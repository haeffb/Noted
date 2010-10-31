function AccountsAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
}

AccountsAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the scene is first created */

	this.controller.get('accountNeeded2').innerHTML = $L("A Simplenote account is " +
		"required to sync. " +
		"If you have an existing Simplenote account, enter the email address " + 
		"and password and tap 'Login to Simplenote'. " + 
		"If you don't have a Simplenote account go " +
		"<a href='http://simple-note.appspot.com/createaccount.html'>here</a>. " +
		"After creating the account, close the Web browser and enter your email " +
		"and password to login to Simplenote.");
	
	this.controller.get('accountHeader').innerHTML = $L("Account Settings");
	this.controller.get('emailLabelId').innerHTML = $L("Enter Email");
	this.controller.get('passwordLabelId').innerHTML = $L("Enter Password");
	this.controller.get('accountNeeded').innerHTML = $L("Enter Simplenote email and password");
			
	/* use Mojo.View.render to render view templates and add them to the scene, if needed. */
	
	/* setup widgets here */
	
	this.controller.setupWidget("EmailFieldId",
         this.emailAttributes = {
             hintText: $L('Enter Email'),
             multiline: false,
             enterSubmits: false,
             autoFocus: true,
			 textCase: Mojo.Widget.steModeLowerCase,
			 focusMode: Mojo.Widget.focusSelectMode,
			 limitResize: true
         },
         this.emailModel = {
             value: MyAPP.prefs.email,
             disabled: false
    });

	this.controller.setupWidget("PasswordFieldId",
         this.passwordAttributes = {
		 	focusMode: Mojo.Widget.focusSelectMode,
            hintText: $L('Enter Password')
         },
         this.passwordModel = {
             value: "" //MyAPP.prefs.password
    });
	
	// Add Update button
	this.controller.setupWidget("UpdateButtonId", 
		this.updateButtonAttributes = {
			type: Mojo.Widget.activityButton
		}, 
		this.updateButtonModel = {
			buttonLabel : $L('Login to Simplenote'),        
			buttonClass : '',        
			disabled : false        
		});

/*
	// Add Create Account button
	this.controller.setupWidget("CreateButtonId", 
		this.updateButtonAttributes = {
			type: Mojo.Widget.activityButton
		}, 
		this.createButtonModel = {
			buttonLabel : $L('Create New Account'),        
			buttonClass : 'affirmative',        
			disabled : false        
		});

*/		
	/* add event handlers to listen to events from widgets */
	this.updateInfoHandler = this.updateInfo.bindAsEventListener(this);
	Mojo.Event.listen(this.controller.get('UpdateButtonId'), Mojo.Event.tap, this.updateInfoHandler);
	//this.createAccountHandler = this.createAccount.bindAsEventListener(this);
	//Mojo.Event.listen(this.controller.get('CreateButtonId'), Mojo.Event.tap, this.createAccountHandler);

};

AccountsAssistant.prototype.createAccount = function (event) {
/*
	if (MyAPP.prefs.userid) {
		var email = this.emailModel.value;
		var pass = this.passwordModel.value;
		this.controller.get('CreateButtonId').mojo.activate();
		Mojo.Log.info("Email is " + email + " Password is " + pass);
		api.createAccount(email, pass, this.gotUserid.bind(this));
	}

*/
	if (MyAPP.account.userid) {
		this.controller.showAlertDialog({
			onChoose: function(value){
				this.clearUser(value);
			},
			title: $L("Update Account Settings"),
			message: $L({
				value: "Warning: Updating account settings will delete all current data. Please make sure you have synced any new tasks before proceeding!",
				key: "update_Warning"
			}),
			choices:[
				{label:$L('Create Account'), value:"clearNewAccount", type:'affirmative'},  
				{label:$L("Cancel"), value:"cancel", type:'dismiss'}    
			]
		});
	}
	else {
		this.clearUser("newAccount");
	}

};

AccountsAssistant.prototype.updateInfo = function(event){
/*
	if (!MyAPP.account.userid) {
		var email = this.emailModel.value;
		var pass = this.passwordModel.value;
		this.controller.get('UpdateButtonId').mojo.activate();
		Mojo.Log.info("Email is " + email + " Password is " + pass);
		api.getUniqueUserid(email, pass, this.gotUserid.bind(this));
	}

*/	if (MyAPP.prefs.key) {
		//Mojo.Controller.errorDialog ("Can't change account settings yet! Coming soon...");
		//this.controller.get('UpdateButtonId').mojo.deactivate();
		this.controller.showAlertDialog({
			onChoose: function(value){
				this.clearUser(value);
			},
			title: $L("Update Account Settings"),
			message: $L("Warning: Updating account settings will delete all current data. Please make sure you have synced any new tasks before proceeding!"),
			choices:[
				{label:$L('Delete & Update'), value:"clearUser", type:'affirmative'},  
				{label:$L("Cancel"), value:"cancel", type:'dismiss'}    
			]
		});
	}
	else {
		this.clearUser("newUser");
	}
};

AccountsAssistant.prototype.clearUser = function (value) {
		//Mojo.Log.info("Value: ", value);
		//Mojo.Controller.errorDialog ("Can't change account settings yet! Coming soon...");
		if (value === 'newUser' || value === 'clearUser' || value === 'newAccount' || value === 'clearNewAccount') {
			if (value === 'clearUser' || value === 'clearNewAccount') {
				
				//delete all notes
				dao.deleteAllNotes();
				
				//reset default prefs
				MyAPP.prefs.lastSync = 0;
				MyAPP.prefs.lastSyncServer = 0;
				MyAPP.prefs.key = '';
				MyAPP.prefsDb.add('prefs', MyAPP.prefs, 
					function () {},
					function (event) {
						//Mojo.Log.info("Prefs DB failure %j", event);
					});
				//update sync key
				api.init();
			}
			var email = this.emailModel.value;
			var pass = this.passwordModel.value;
			//Mojo.Log.info("Email is " + email + " Password is " + pass);
			if (value === 'newUser' || value === 'clearUser') {
				this.controller.get('UpdateButtonId').mojo.activate();
				api.getTokenLogin(email, pass, this.gotKey.bind(this));
			}
			else {
				//this.controller.get('CreateButtonId').mojo.activate();
				//api.createAccount(email, pass, this.gotUserid.bind(this));		
			}
		}
		else {
			// User selected cancel
			this.controller.get('UpdateButtonId').mojo.deactivate();
		}
};

AccountsAssistant.prototype.gotKey = function (response) {
	//Mojo.Log.info("Response from getTokenLogin %j", response);
	this.controller.get('UpdateButtonId').mojo.deactivate();
//	this.controller.get('CreateButtonId').mojo.deactivate();
	if (response.status === 401 || response.status === 400) {
		this.controller.get('accountErrorText').innerHTML = $L("Invalid email/password combination!");
	}
	else if (response.responseText){
		//Mojo.Log.info("Save Prefs!");
		MyAPP.prefs.key = response.responseText;	
		MyAPP.prefs.email = this.emailModel.value;
		MyAPP.prefs.password = this.passwordModel.value;

		//MyAPP.prefsCookie.put(MyAPP.prefs);
		MyAPP.prefsDb.add('prefs', MyAPP.prefs, 
			function () {},
			function (event) {
				//Mojo.Log.info("Prefs DB failure %j", event);
			});
		
		this.controller.stageController.popScene();
	}	
	else if (response.error) {
		//Mojo.Log.info("Error! ", response.error);
		this.controller.get('accountErrorText').innerHTML = 
			$L("Toodledo Error - ") + response.error + " " + $L("Please use a new email address address or use 'Login to Simplenote'.");	
	}
	else {
		this.controller.get('accountErrorText').innerHTML = $L("Can't get account settings from Simplenote!");		
	}
};


AccountsAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
};


AccountsAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

AccountsAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	Mojo.Event.stopListening(this.controller.get('UpdateButtonId'), Mojo.Event.tap, this.updateInfoHandler);
	//Mojo.Event.stopListening(this.controller.get('CreateButtonId'), Mojo.Event.tap, this.createAccountHandler);
};
