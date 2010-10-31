function Sync(){
		
	// initialize variables.
	this.initSync = function(syncCallback, outputDiv){
		// function to call when sync finishes
		this.syncCallback = syncCallback;
		
		// write sync log to screen
		if (outputDiv) {
			this.outputDiv = outputDiv;
		}
		else {
			this.outputDiv = null;
		}
		
		//Mojo.Log.info("Starting Sync Process");
		this.syncLog = "<br />" + $L("Starting Sync Process");
		if (this.outputDiv) {
			this.outputDiv.innerHTML = "<br />" + $L("Starting Sync Process");
		}
		
		// objects to keep track of sync progress
		// so we know when we're Done!
		this.synced = {
			notes: false,
			notesdeleted: false,
			localdeleted: true,
			notesadded: false,
			localmodified: false
		};
		// used to count number of database transactions that need to complete:
		this.count = {
			notes: 0,
			notesdeleted: 0,
			localdeleted: 0,
			notesadded: 0,
			localmodified: 0
		};
				
		this.localWins = MyAPP.prefs.localWins;

		this.webNotesModified = [];
		this.localNotesModified = [];
		this.localNotesNew = [];
		
		
		// Delete notes from server
		var sqlString = "SELECT * FROM notes WHERE deleted='True'; GO;";
		dao.retrieveNotesByString(sqlString, this.gotDeletedNotes.bind(this));	
		
				
	};
	
	this.gotToken = function (response) {
		if (response.status === 200 && response.responseText) {
			MyAPP.prefs.key = response.responseText;
			MyAPP.prefsDb.add('prefs', MyAPP.prefs, 
				function () {},
				function (event) {
					//Mojo.Log.info("Prefs DB failure %j", event);
			});
			api.getNotesIndex(this.gotNotesIndex.bind(this));
		}
		else {
			//Mojo.Log.info("Error getting Token %j", response);
			this.syncCallback("Error Logging into Simplenote");
			this.syncLog += "<br />" + 
					$L("Error Logging into Simplenote")+ 
					"<br />";
			if (this.outputDiv) {
				this.outputDiv.innerHTML += "<br />" 
					+ $L("Error Logging into Simplenote") + 
					"<br />";
			}
		}
	};
	
	this.gotNotesIndex = function (response) {
		
		if (response.status !== 200) {
			Mojo.Log.info("Error getting index");
			api.getTokenLogin(MyAPP.prefs.email, MyAPP.prefs.password, this.gotToken.bind(this));
		}
		else {
			this.syncLog += "<br />" +
			$L("Retrieved Notes Index");
			if (this.outputDiv) {
				this.outputDiv.innerHTML += "<br />" +
				$L("Retrieved Notes Index");
			}
			var index = response.responseJSON;
			Mojo.Log.info("Index in GotNotesIndex %j", index);
			
			var i, d, lastSyncUTC;
			
			d = new Date(MyAPP.prefs.lastSync);
			//Mojo.Log.info("Last Sync", d);
			//d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
			//Mojo.Log.info("Last Sync UTC", d);
			lastSyncUTC = MyAPP.prefs.lastSync; //d.getTime();
			for (i = 0; i < index.length; i++) {
				//Mojo.Log.info("Note in index: %j", note);
				if (utils.stringToTimeStamp(index[i].modify) > lastSyncUTC) {
					//Note modfied since last sync!
					//Mojo.Log.info("lastSync", new Date(lastSyncUTC));
					//Mojo.Log.info("modify", new Date(utils.stringToTimeStamp(index[i].modify)));
					//Mojo.Log.info("pushing %j", index[i]);
					index[i].sync = true;
					this.webNotesModified.push(index[i]);
				}
			}
			
			// Get locally modified notes
			var sqlString = "SELECT * FROM notes WHERE modified > " +
			MyAPP.prefs.lastSync +
			" AND key != 0 AND deleted = 'False'; GO;";
			//Mojo.Log.info("SQL for mod notes: ", sqlString);
			dao.retrieveNotesByString(sqlString, this.gotLocalNotesModified.bind(this));
		}
	};			
	
	this.gotDeletedNotes = function (deletedNotes) {
		
		//Mojo.Log.info("Deleting Notes: ", deletedNotes.length);
		this.syncLog += "<br />" + $L("Deleting Notes on Web") 
			+ ": " + deletedNotes.length +$L(" notes");
		if (this.outputDiv) {
			this.outputDiv.innerHTML += "<br />" + $L("Deleting Notes on Web") 
			+ ": " + deletedNotes.length +$L(" notes");
		}
		var i;
		if (deletedNotes.length) {
			for (i = 0; i < deletedNotes.length; i++) {
				//Mojo.Log.info("Deleting: ", deletedNotes[i].note);
				this.count.notesdeleted += 1;
				api.deleteNote(deletedNotes[i].key, this.noteDeletedWeb.bind(this, deletedNotes[i]));
			}
		}
		else {
			this.finishTransactions('notesdeleted');
		}
		
		//Get notes index from server:
		api.getNotesIndex(this.gotNotesIndex.bind(this));
		
	};
	
	this.noteDeletedWeb = function (note, response) {
		if (response === note.key) {
			dao.deleteNote(note.key, this.noteDeleted.bind(this, note));
		}
		
	};
	this.noteDeleted = function (note, response) {
		//Mojo.Log.info("deleted note %j %j", note, response);
		if (response === note.key) {
			this.finishTransactions('notesdeleted');
		}	
	};
	
	this.gotLocalNotesModified = function (localNotes) {
		var i, j;

			//Mojo.Log.info("Local: %j", localNotes);
			//Mojo.Log.info("Web:%j", this.webNotesModified);

		for (i = 0; i < localNotes.length; i++) {
			localNotes[i].sync = true;

			//Mojo.Log.info("Local Note %s %j", i, localNotes[i]);
			if (localNotes[i].key) {
				for (j = 0; j < this.webNotesModified.length; j++) {
					if (localNotes[i].key === this.webNotesModified[j].key) {
						//Mojo.Log.info("Key in both!");
						localNotes[i].sync = false;
						this.webNotesModified[j].sync = false;
					}
				}
			}
		}
		this.localNotesModified = localNotes;
		this.syncLocalToWeb();
	};
	
	this.syncLocalToWeb = function () {
		var i;
		//Mojo.Log.info("Sending Modified Notes to Web: ", this.localNotesModified.length);
		this.syncLog += "<br />" + $L("Sending Modified Notes to Web") 
			+ ": " + this.localNotesModified.length +$L(" notes");
		if (this.outputDiv) {
			this.outputDiv.innerHTML += "<br />" + $L("Sending Modified Notes to Web") 
			+ ": " + this.localNotesModified.length +$L(" notes");
		}
		if (this.localNotesModified.length) {
			for (i = 0; i < this.localNotesModified.length; i++) {
				this.count.localmodified += 1;
				if (this.localNotesModified[i].sync || MyAPP.prefs.localWins) {
					api.updateNote(this.localNotesModified[i], this.localToWebUpdated.bind(this, this.localNotesModified[i]));
				}
				else {
					this.finishTransactions('localmodified');
				}
			}
		}
		else {
			this.finishTransactions('localmodified');
		}
		
		this.syncWebToLocal();
	};
	
	this.localToWebUpdated = function(note, response) {
		//Mojo.Log.info("Local mod note %j", note);
		//Mojo.Log.info("Response from updateNote API", response);
		if (note.key === response) {
			// we're good!
			this.finishTransactions('localmodified');
		}
	};
	
	this.syncWebToLocal = function () {
		var i;
		
		//Mojo.Log.info("Getting Web Modified Notes: ", this.webNotesModified.length);
		this.syncLog += "<br />" + $L("Getting Web Modified Notes") 
			+ ": " + this.webNotesModified.length +$L(" notes");
		if (this.outputDiv) {
			this.outputDiv.innerHTML += "<br />" + $L("Getting Web Modified Notes") 
			+ ": " + this.webNotesModified.length +$L(" notes");
		}
	
		if (this.webNotesModified.length) {
			for (i = 0; i < this.webNotesModified.length; i++) {
				//Mojo.Log.info("Web Mod Note: %j", this.webNotesModified[i]);
				if ((this.webNotesModified[i].sync || !MyAPP.prefs.localWins)) {
					this.count.notes += 1;
					if (!this.webNotesModified[i].deleted) {
						api.getNote(this.webNotesModified[i].key, this.gotNote.bind(this));
					}
					else {
						dao.deleteNote(this.webNotesModified[i].key, 
							this.webNoteDeleted.bind(this, this.webNotesModified[i].key));
					}
				}
			}
		}
		else {
			this.finishTransactions('notes');
		}
		
		var sqlString = "SELECT * FROM notes WHERE key = 0; GO;";
		dao.retrieveNotesByString(sqlString, this.syncNewLocalToWeb.bind(this));
	};
	
	this.webNoteDeleted = function (note, response) {
		//Mojo.Log.info("Web Note Deleted %j %j", note, response);	
		if (note === response) {
			this.finishTransactions('notes');
		}	
	};
	
	this.syncNewLocalToWeb = function (notes) {
		var i;
		//Mojo.Log.info("Sending New Notes to Web: ", notes.length);
		this.syncLog += "<br />" + $L("Sending New Notes to Web") 
			+ ": " + notes.length +$L(" notes");
		if (this.outputDiv) {
			this.outputDiv.innerHTML += "<br />" + $L("Sending New Notes to Web") 
			+ ": " + notes.length +$L(" notes");
		}
		if (notes.length) {
			for (i = 0; i < notes.length; i++) {
				this.count.notesadded += 1;
				api.updateNote(notes[i], this.newNoteAdded.bind(this, notes[i]));
			}
		}
		else {
			this.finishTransactions('notesadded');
		}
	};
	
	this.newNoteAdded = function (note, response) {
		//Mojo.Log.info("Value %j", note);
		//Mojo.Log.info("Response %j", response);	
		if (response) {
			dao.deleteNote(note.value, function () {
				//Mojo.Log.info("Old Note Deleted %j", note.value);
			});
			note.key = response;
			note.value = response;
			dao.createNote(note, this.finishTransactions.bind(this, 'notesadded'));
		}
	};

	this.gotNote = function (note) {
		if (true) { //(note.deleted === 'False') {
			dao.createNote(note, this.finishTransactions.bind(this, 'notes'));
		}
	};

	this.finishTransactions = function(type){
		this.count[type] -= 1;
		//Mojo.Log.info("Transaction type: ", type, this.count[type]);
		if (this.count[type] <= 0) {
			//Mojo.Log.info("Sync finished for ", type);
			this.synced[type] = true;
		}
		
		if (this.synced.notes &&
			this.synced.notesdeleted &&
			this.synced.localdeleted &&
			this.synced.notesadded && 
			this.synced.localmodified) {
				
			this.syncLog += "<br />" + $L("Finished Syncing!") + "<br /> &nbsp;";
			MyAPP.syncLogCookie = new Mojo.Model.Cookie(MyAPP.appName + "syncLog");
			MyAPP.syncLogCookie.put(this.syncLog);
			if (this.outputDiv) {
				this.outputDiv.innerHTML += "<br />" + $L("Finished Syncing!")
				+ "<br /> &nbsp;";
			}
			//Update last sync date/time - leave in milliseconds
			MyAPP.prefs.lastSync = utils.getUTCTime(new Date());
			MyAPP.prefsDb.add('prefs', MyAPP.prefs, 
				function () {},
				function (event) {
					//Mojo.Log.info("Prefs DB failure %j", event);
				}
			);
			
		
			//Mojo.Log.info("Finished Syncing", MyAPP.prefs.lastSync);
			this.syncCallback($L("Finished Syncing!"));
		}
	};
		
	this.setSyncTimer = function(delayInMinutes){
		//Mojo.Log.info("Delay: ", delayInMinutes);
		var dashInfo, d, mo, yr, hrs, mins, secs, myDateString, dStr, bannerParams, date;
		//Mojo.Log.info("Starting Sync");
		dashInfo = {
			title: Mojo.appInfo.title + " " + $L("Starting Sync!"),
			message: $L("Swipe to Cancel"),
			count: 1
		};
		
		//For testing purposes ONLY, set delay to 0.5 minutes!
		//delayInMinutes = 0.5;
		
		d = new Date();
		d.setTime(d.getTime() + delayInMinutes * 60 * 1000);
		mo = d.getUTCMonth() + 1;
		if (mo < 10) {
			mo = '0' + mo;
		}
		date = d.getUTCDate();
		if (date < 10) {
			date = '0' + date;
		}
		yr = d.getUTCFullYear();
		//get hours according to GMT
		hrs = d.getUTCHours();
		if (hrs < 10) {
			hrs = '0' + hrs;
		}
		mins = d.getUTCMinutes();
		if (mins < 10) {
			mins = '0' + mins;
		}
		secs = d.getUTCSeconds();
		if (secs < 10) {
			secs = '0' + secs;
		}
		myDateString = mo + "/" + date + "/" + yr + " " + hrs + ":" + mins + ":" + secs;
		//Mojo.Log.info("Date String", myDateString);
		
		dStr = Mojo.Format.formatDate(d, 'medium');
		//Mojo.Log.info("Time is", dStr);
		
		
		MyAPP.prefs.syncTimerId = new Mojo.Service.Request("palm://com.palm.power/timeout", {
			method: 'set',
			parameters: {
				key: Mojo.appInfo.id + '.sync',
				//'in': 	'00:05:00',
				at: myDateString,
				wakeup: true,
				uri: 'palm://com.palm.applicationManager/launch',
				params: {
					'id': Mojo.appInfo.id,
					'params': {
						action: 'sync',
						dashInfo: dashInfo
					}
				}
			},
			onSuccess: function(){
				//Mojo.Log.info("Success in Setting up Sync!!! at", dStr);
			}.bind(this)
		});
	};
	
	this.clearSyncTimer = function(timerId){
		if (timerId) {
			new Mojo.Service.Request("palm://com.palm.power/timeout", {
				method: "clear",
				parameters: {
					"key": Mojo.appInfo.id + '.sync'
				},
				onSuccess: function(){
					//Mojo.Log.info("Cleared Sync Timer!");
				}
			});
		}
	};
}

var sync = new Sync();
