function API(){

	this.url = "https://simple-note.appspot.com/api/";
	//appid: Mojo.appInfo.id,
	this.appid = Mojo.appInfo.ToodledoId; //"Done";
	this.invalidKey = 'key did not validate';
	
	this.init = function(){
		//Mojo.Log.info("Initializing API");
		//Mojo.Log.info("Setting Key to", MyAPP.prefs.key);
		this.key = MyAPP.prefs.key;
		//this.key = 'xxx';
				
		//Mojo.Log.info("Authorization Key in API:", this.key);
	};
	
	// **************************************************************
	// ***** CALL API FUNCTIONS *****	
	// **************************************************************
		
	this.getTokenLogin = function (email, pass, inCallback) {
		//Mojo.Log.info("Entering getToken in API");
		var postBody = Base64.encode('email='+ email + '&password=' + pass);
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
				
				//this.getNotesIndex();
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
				
				//this.getNotesIndex();
				inCallback();

			}.bind(this),
			onFailure: this.hadFailure.bind(this)
		});

	};
	
	this.getNotesIndex = function (inCallback) {
		//Mojo.Log.info("Key in getNotesIndex:", this.key);
		var url = this.url + 'index?auth=' + this.key + '&email=' + MyAPP.prefs.email;
		//Mojo.Log.info("Url in getNotesIndex:", url);
		new Ajax.Request( url, {
	  		method: 'get',
			evalJSON: 'force',
	  		onSuccess: function(response){
				//Mojo.Log.info("Response: %j", response);
				//Mojo.Log.info("Response from API: %j", response.responseJSON);
				//headers = response.getAllResponseHeaders();
				//Mojo.Log.info("Header %j", headers);
				
				//var index = response.responseJSON;
				
				inCallback(response);
			}.bind(this),
			onFailure: function(error){
				inCallback(error);
/*
				if (error.status === 401) {
					//Mojo.Log.info("Unauthorized - try get token");
					this.getToken(inCallback);
				}

*/			}.bind(this)
		});
		
		
	};
		
	this.getNote = function (notekey, inCallback) {
		var note = {}, headers, i;
	
		var url = this.url + 'note?key=' + notekey + '&auth=' + this.key + '&email=' + MyAPP.prefs.email;
		new Ajax.Request( url, {
	  		method: 'get',
	  		onSuccess: function(response){
				//Mojo.Log.info("Response from API: %j", response.responseText);
				headers = response.getAllResponseHeaders();
				//Mojo.Log.info("Header %j", headers);
				note.note = response.responseText;
				//Mojo.Log.info(strtotime(note-createdate));
				note.created = utils.stringToTimeStamp(response.getHeader('note-createdate'));
				note.key = response.getHeader('note-key');
				note.value = note.key;
				note.modified = utils.stringToTimeStamp(response.getHeader('note-modifydate'));
				//Mojo.Log.info(response.getHeader('note-modifydate'));
				//Mojo.Log.info(new Date(note.modified));
				note.deleted = response.getHeader('note-deleted');
				note.custom = '';
				//Mojo.Log.info("Note %j", note);
				
				inCallback(note);
				//return note;
			}.bind(this),
			onFailure: this.hadFailure.bind(this)
		});
		
		//this.inCallback();
		
	};
	
	this.updateNote = function(note, inCallback){
		var url, postBody, modify;
		//Mojo.Log.info("****************LOOK HERE!!!!!!!!!!!!!!");
		//Mojo.Log.info("Note in updateNote %j:", note);
		url = this.url + 'note?auth=' + this.key + '&email=' + MyAPP.prefs.email;
		
		modify = utils.timeStampToUTCString(note.modified);
		url += (modify) ? "&modify=" + modify : "";
		
		// if no note.key, then API will create new note
		url += (note.key !== '0') ? "&key=" + note.key : "";
		
		//Mojo.Log.info("Url in updateNote:", url);
		
		postBody = Base64.encode(note.note);
		
		new Ajax.Request(url, {
			method: 'post',
			parameters: postBody,
			onSuccess: function(response){
				//Mojo.Log.info("API response in updateNote: %j", response);
				inCallback(response.responseText);
			}.bind(this)			,
			onFailure: this.hadFailure.bind(this)
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
		//Mojo.Log.info("****** AJAX REQUEST FAILURE *******");
		debugObject(error, 'noFuncs');
		//debugObject(error.transport);
		//Mojo.Log.info("Error %j", error);
		//Mojo.Controller.getAppController().getActiveStageController().activeScene().controller.get('outputDiv').innerHTML=Object.toJSON(error);
		Mojo.Controller.errorDialog("Unable to connect to Simplenote!");
		
		
		// TODO - check other error messages. counter?
		
	};



}

var api = new API();
