function API(){

	this.url = "https://simple-note.appspot.com/api/";
	this.url2 = "https://simple-note.appspot.com/api2/"; //"https://simple-note.appspot.com/api2/";
	//appid: Mojo.appInfo.id,
	this.invalidKey = 'key did not validate';
	
	this.init = function(){
		Mojo.Log.info("Initializing API");
		//Mojo.Log.info("Setting Key to", MyAPP.prefs.key);
		this.key = MyAPP.prefs.key;
		//this.key = 'xxx';
				
		//Mojo.Log.info("Authorization Key in API:", this.key);
	};
	
	// **************************************************************
	// ***** CALL API FUNCTIONS *****	
	// **************************************************************
		
	this.getTokenLogin = function (email, pass, inCallback) {
		Mojo.Log.info("Entering getTokenLogin in API");
		var postBody = Base64.encode('email='+ email + '&password=' + pass);
		//Mojo.Log.info("Encoded:", postBody);
		//Mojo.Log.info("Decoded:", Base64.decode(postBody));
		new Ajax.Request(this.url + 'login', {
	  		method: 'post',
			parameters: postBody,
	  		onSuccess: function(response){
				Mojo.Log.info("Response from API in getToken: %j", response);
				this.key = response.responseText;
				MyAPP.prefs.key = this.key;
				headers = response.getAllResponseHeaders();
				//Mojo.Log.info("Header %j", headers);
				
				inCallback(response);

			}.bind(this),
			onFailure: function (error) {
				inCallback(error);
			}.bind(this)
		});

	};

	this.getToken = function (inCallback) {
		//Mojo.Log.info("Entering getToken in API");
		var postBody = Base64.encode('email='+MyAPP.prefs.email + '&password=' + MyAPP.prefs.password);
		//Mojo.Log.info("Encoded:", postBody);
		//Mojo.Log.info("Decoded:", Base64.decode(postBody));
		new Ajax.Request(this.url + 'login', {
	  		method: 'post',
			parameters: postBody,
	  		onSuccess: function(response){
				//Mojo.Log.info("Response from API in getToken: %j", response);
				this.key = response.responseText;
				MyAPP.prefs.key = this.key;
				headers = response.getAllResponseHeaders();
				//Mojo.Log.info("Header %j", headers);
				
				inCallback();

			}.bind(this),
			onFailure: this.hadFailure.bind(this)
		});

	};
	
	this.getNotesIndex = function (inCallback, bookMark, since) {
		Mojo.Log.info("bookMark", bookMark);
		Mojo.Log.info("Key in getNotesIndex:", this.key);
		var url = this.url2 + 'index?auth=' + this.key + '&email=' + MyAPP.prefs.email;
		url += "&length=100";
		if (bookMark) {
			Mojo.Log.info("bookMark", bookMark);
			url += '&mark=' + bookMark;
		}
		if (since) {
			Mojo.Log.info("since", since);
			url += '&since=' + since;
		}
		Mojo.Log.info("Url in getNotesIndex:", url);
		new Ajax.Request( url, {
	  		method: 'get',
			evalJSON: 'force',
	  		onSuccess: function(response){
				//Mojo.Log.info("Response from getNotesIndex: %j", response);				
				inCallback(response);
			}.bind(this),
			onFailure: function(error){
				inCallback(error);
			}.bind(this)
		});
		
		
	};
		
	this.getNote = function (notekey, inCallback) {
		var note = {}, headers, i;
	
		var url = this.url2 + 'data/' + notekey + '?auth=' + this.key + '&email=' + MyAPP.prefs.email;
		new Ajax.Request( url, {
	  		method: 'get',
			evalJSON: "force",
	  		onSuccess: function(response){
				Mojo.Log.info("Response from API: %j", response.responseJSON);
				note = response.responseJSON;
				note.note = note.content;
				note.created = note.createdate * 1000; 
				note.value = note.key;
				note.modified = note.modifydate * 1000;
				note.deleted = note.deleted ? "True" : "False";
				note.custom = '';
				Mojo.Log.info("Note %j", note);
				
				inCallback(note);

			}.bind(this),
			onFailure: function (error) {
				// add notekey to error object
				Mojo.Log.info("Error in API.getNote %j", error);
				error.notekey = notekey;
				inCallback(error);
			}.bind (this)
			//this.hadFailure.bind(this)
		});		
	};
	
	this.createNote = function(note, inCallback){
		var url, postBody, modify;
		Mojo.Log.info("Note in createNote %j:", note);
		url = this.url2 + 'data'+ '?auth=' + this.key + '&email=' + MyAPP.prefs.email;
		
		//Mojo.Log.info("Url in createNote:", url);
		
		postBody = {};
		postBody.content = note.note;
		if (note.tags) {
			postBody.tags = note.tags.split(",");
		}
		if (note.systemtags) {
			postBody.systemtags = note.systemtags.split(",");
		}
		postBody.modifydate = note.modified / 1000;
		postBody.createdate = note.created / 1000;
		postBody.deleted = (note.deleted=== "False") ? 0 : 1;
		
		Mojo.Log.info("PostBody in createNote: %j", postBody);
		
		new Ajax.Request(url, {
			method: 'post',
			//parameters: postBody,
			postBody: JSON.stringify(postBody),
			evalJSON: "force",
			onSuccess: function(response){
				//Mojo.Log.info("API response in createNote: %j", response.responseJSON);
				note = response.responseJSON;
				note.note = note.content;
				note.created = note.createdate * 1000; 
				note.value = note.key;
				note.modified = note.modifydate * 1000;
				note.deleted = note.deleted ? "True" : "False";
				note.custom = '';
				inCallback(note);
			}.bind(this),
			onFailure: function(error){
				error.notekey = note.key;
				inCallback(error);
			}.bind(this)
			//this.hadFailure.bind(this)
		});
	};
	
	this.updateNote = function(note, inCallback){
		var url, postBody, modify;
		//Mojo.Log.info("****************LOOK HERE!!!!!!!!!!!!!!");
		Mojo.Log.info("Note in updateNote %j:", note);
		url = this.url2 + 'data/';
		if (note.key !== '0') {
			url += note.key;	
		}
		url += '?auth=' + this.key + '&email=' + MyAPP.prefs.email;
		
		//Mojo.Log.info("Url in updateNote:", url);
		
		postBody = {};
		postBody.content = note.note;
		if (note.tags) {
			postBody.tags = note.tags.split(",");
		}
		if (note.systemtags) {
			postBody.systemtags = note.systemtags.split(",");
		}
		postBody.modifydate = note.modified / 1000;
		postBody.createdate = note.created / 1000;
		postBody.version = note.version;
		postBody.deleted = (note.deleted=== "False") ? 0 : 1;
		
		//Mojo.Log.info("PostBody in updateNote: %j", postBody);
		
		new Ajax.Request(url, {
			method: 'post',
			//contentType: 'application/json',
			//parameters: postBody,
			postBody: JSON.stringify(postBody),
			evalJSON: "force",
			onSuccess: function(response){
				//debugObject(response.request, 'noFuncs');
				//Mojo.Log.info("API response in updateNote: %j", response.responseJSON);
				inCallback(response.responseJSON);
			}.bind(this)			,
			onFailure: function(error){
				error.notekey = note.key;
				inCallback(error);
			}.bind(this)
			//this.hadFailure.bind(this)
		});
	};
	
	this.deleteNote = function (notekey, inCallback) {
		var note = {}, headers, i;
	
		var url = this.url + 'delete?key=' + notekey + '&auth=' + this.key + 
			'&email=' + MyAPP.prefs.email + '&dead=1';
		new Ajax.Request( url, {
	  		method: 'get',
	  		onSuccess: function(response){
				//Mojo.Log.info("Response in API deleteNote %j", response);
				inCallback(response.responseText);
				//return note;
			}.bind(this),
			onFailure: this.hadFailure.bind(this)
		});
		
	};


	// **************************************************************
	// ***** FAILURE! *****
	// **************************************************************

	this.hadFailure = function (error) {
		Mojo.Log.info("****** AJAX REQUEST FAILURE *******");
		debugObject(error, 'noFuncs');
		Mojo.Log.info("Request was:");
		debugObject(error.request, 'noFuncs');
		//debugObject(error.transport);
		//Mojo.Log.info("Error %j", error);
		//Mojo.Controller.getAppController().getActiveStageController().activeScene().controller.get('outputDiv').innerHTML=Object.toJSON(error);
		Mojo.Controller.errorDialog("Unable to connect to Simplenote!");
		
		
		// TODO - check other error messages. counter?
		
	};



}

var api = new API();
