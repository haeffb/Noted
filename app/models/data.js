// **********************************************
// 	Data Access Object 
// **********************************************

function DAO(){
	this.db = null;
	var databaseName = "ext:" + Mojo.appInfo.title + "DB", // required
		version = "0.3", // required
		displayName = Mojo.appInfo.title + " database"; // optional
		


/*

 */

// **********************************************
// Initialize database
// **********************************************
	this.init = function(inCallback) {
		var sqlCreateNotesTable = "CREATE TABLE IF NOT EXISTS 'notes' " +
		"(value TEXT PRIMARY KEY, note TEXT, deleted TEXT, created INTEGER, " +
		"modified INTEGER, key TEXT, custom STRING, " +
		"syncnum INTEGER, version INTEGER, minversion INTEGER, " + 
		"sharekey STRING, publishkey STRING, tags STRING, systemtags STRING " +
		"); GO;";
		//Mojo.Log.info("Entering db init");
		
		var welcomeNote = "Welcome to Noted! \nTap Me! " + 
		"for a quick tutorial on how to use Noted! \n\n" + 
		"Noted! can sync with the web service Simplenote. You must " +
		"have a Simplenote account to sync your notes. You can create a Simplenote " +
		"account by going to http://www.simple-note.appspot.com/createaccount.html " + 
		"and entering your email address and a password. \n\n" +
		"Search your notes by simply typing while in the notes list. \n\n" +
		"Use the 'Enter' key to create a new note while in the search field. \n\n" +
		"Tap the '+' icon to create a new note. \n\n" +
		"Tap the 'sync' icon to sync with Simplenote. \n\n" +
		"Tap the sort by menu in the upper right corner or the adjacent arrow to " +
		"change how your notes are sorted (by created date, modified date or title, " +
		"in either ascending or descending order). \n\n" +
		"Tap on a note to expand/contract the note view. \n\n" +
		"Tap on the 'e' icon to edit a note. \n\n" +
		"When editing a note, tap the 'clock' icon to add a timestamp and " +
		"the 'calendar' icon to add a datestamp. \n\n" +
		"Tap the 'airplane' icon to send the note via email or SMS.";
		
		Mojo.Log.info("Database info:", databaseName, version, displayName);
		//Mojo.Log.info("SQL =", sqlCreateNotesTable);
		
		this.db = openDatabase(databaseName, "", displayName);
		Mojo.Log.info("Database version", this.db.version);
		if (this.db.version === "0.2") {
			var updateSQL = ["ALTER TABLE notes ADD COLUMN syncnum INTEGER default 1",
				"ALTER TABLE notes ADD COLUMN version INTEGER default 1",
				"ALTER TABLE notes ADD COLUMN minversion INTEGER default 1",
				"ALTER TABLE notes ADD COLUMN sharekey STRING default ''",
				"ALTER TABLE notes ADD COLUMN publishkey STRING default ''",
				"ALTER TABLE notes ADD COLUMN tags STRING default ''",
				"ALTER TABLE notes ADD COLUMN systemtags STRING default ''"
			];
			this.updateOldVersion(this.db, updateSQL, inCallback);
			
		}
		else {
		
			//this.db = openDatabase(databaseName, version, displayName);
			
			if (!this.db) {
				//Mojo.Log.info("DAO ERROR! - Could not Open Database!");
				Mojo.Controller.errorDialog($L("DAO ERROR! - Could not Open Database!"));
			}
			this.db.transaction((function(inTransaction){
			
				inTransaction.executeSql(sqlCreateNotesTable, [], function(){
				Mojo.Log.info("Created Notes Table"); 
				}, this.errorHandler);
				if (MyAPP.prefs.firstuse) {
					var now = new Date(); utils.getUTCTime(new Date());
					//Mojo.Log.info("Now in Data", now);
					var n = {
						value: now,
						key: "0",
						deleted: "False",
						created: now,
						modified: now,
						note: welcomeNote,
						tags: "",
						systemtags: "",
						sharekey: "",
						publishkey: "",
						syncnum: 0,
						version: 0,
						minversion: 0,
						custom: ''
					};
					
					inTransaction.executeSql(sqlCreateNote, [n.value, n.note, n.deleted, n.created, n.modified, n.key, n.custom, n.tags, n.systemtags, n.sharekey, n.publishkey, n.syncnum, n.version, n.minversion], function(){
					//Mojo.Log.info("Created Welcome Note"); 
					}, this.errorHandler);
					
					MyAPP.prefs.firstuse = false;
					MyAPP.prefsDb.add('prefs', MyAPP.prefs, function(){
					}, function(event){
					//Mojo.Log.info("Prefs DB failure %j", event);
					});
				}
				
			}).bind(this));
			
			inCallback();
		}

		//Mojo.Log.info("****** Leaving db init *******");
	}; // End init().
  
	this.updateOldVersion = function (database, sqlStringArray, inCallback) {
		var i;
		
		Mojo.Log.info ("Entering updateOldVersion in DB to version", version, database.version);
		database.changeVersion (database.version, version, 
			function(transaction){
				Mojo.Log.info("Transaction executeSql", sqlStringArray);
				for (i = 0; i< sqlStringArray.length; i++) {
					transaction.executeSql (sqlStringArray[i], 
						function(){
							Mojo.Log.info("success! updating DB with ", i);
						},
						function(){
							Mojo.Log.info("FAILURE! updating DB with", i);
						}
					);
				}
			},
			function(error){
				Mojo.Log.info("Too bad!", database.version);
				Mojo.Log.info("error %j", error);

			},
			function () {
				Mojo.Log.info("Success from changeVersion");
				//this.init(inCallback) // success handler
				inCallback();
			}
		);
	};

// **********************************************
// NOTE functions
// **********************************************
	
	// Note SQL queries
	var sqlCreateNote = "INSERT OR REPLACE INTO 'notes' " + 
		"(value, note, deleted, created, " +
		"modified, key, custom, " + 
		"tags, systemtags, sharekey, publishkey, " + 
		"syncnum, version, minversion) " +
		"VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?); GO;";
	//var sqlUpdateNote = "REPLACE INTO 'notes' (value, note, deleted, created, " +
	//	"modified, key, custom) " +
	//	"VALUES (?, ?, ?, ?, ?, ?, ?); GO;";
	var sqlUpdateNote = "UPDATE 'notes' SET note=?, deleted=?, " +
		"created=?, modified=?, key=?, custom=?, tags=?, systemtags=?, " +
		"sharekey=?, publishkey=?, syncnum=?, version=?, " + 
		"minversion=? WHERE value=?; GO;";
	var sqlRetrieveNotes = "SELECT * FROM notes WHERE deleted='False' ORDER BY modified DESC; GO;";
	//var sqlRetrieveNotes = "SELECT * FROM notes; GO;";
	var sqlRetrieveNoteByValue = "SELECT * FROM notes WHERE value = ?; GO;";
	var sqlRetrieveNotesForSync = "SELECT * FROM notes WHERE (key = 0 " +
		"OR modified > ?); GO;"; 
	var sqlDeleteNote = "DELETE FROM 'notes' WHERE value=?; GO;";
	var sqlDeleteAllNotes = "DELETE FROM notes; GO;";

	// ***** Note methods *****
	this.createNote = function (n, inCallback) {
		//Mojo.Log.info("Entering db createNote()");
		
		Mojo.Log.info("Creating Note: %j", n);

	    this.db.transaction((function (inTransaction) { 
			inTransaction.executeSql(sqlCreateNote, 
				[ n.value, n.note, n.deleted,
				n.created, n.modified, n.key, n.custom, 
				n.tags, n.systemtags, n.sharekey, n.publishkey,
				n.syncnum, n.version, n.minversion ], 
			function(inTransaction, inResultSet){
				//Mojo.Log.info("DB results: %j", inResultSet);
				var results = inResultSet.insertId;
				inCallback(results);
			},
			this.errorHandler.bind(this));
	    }).bind(this));

  	}; // End createNote().

	// Update Note
	this.updateNote = function (n, inCallback) {
		//Mojo.Log.info("Entering db updateNote()");

		Mojo.Log.info("Updating Note: %j", n);
		
		this.db.transaction((function (inTransaction) {
			inTransaction.executeSql(sqlUpdateNote, 
				[  n.note, n.deleted,
				n.created, n.modified, n.key, n.custom,
				n.tags, n.systemtags, n.sharekey, n.publishkey,
				n.syncnum, n.version, n.minversion, 
				n.value ],
				function(inTransaction, inResultSet){
					//Mojo.Log.info("DB results: %j", inResultSet);
					//var results = inResultSet.insertId;
					var results = "Update OK";
					inCallback(results);
				},
				this.errorHandler.bind(this));
	    }).bind(this));

	}; // End updateNote().

	var sqlCountNotes = "SELECT COUNT(*) FROM notes WHERE DELETED = 'False'; GO;";

	this.countNotes = function (inCallBack) {
		//Mojo.Log.info("Entering db countNotes()");
		
		this.db.transaction((function (inTransaction) {
			inTransaction.executeSql(sqlCountNotes,
			[ ],
			function (inTransaction, inResultSet) {
				//Mojo.Log.info("DB Retrieve Notes Success");
				var count, i;
				if (inResultSet.rows) {
					Mojo.Log.info("Count in DB %j", inResultSet.rows.item(0));
					for (i = 0; i < inResultSet.rows.length; i++) {
						//Mojo.Log.info("Result in retrieveNotes db: %j", inResultSet.rows.item(i));
						// Use clone of object to avoid problems with immutability
						//results.push(Object.clone(inResultSet.rows.item(i)));
						count = inResultSet.rows.item(0)["COUNT(*)"];
					}
				}
				//Mojo.Log.info("Note Results in db: %j", results);
				inCallBack(count);
			},
			this.errorHandler.bind(this)
			);
	    }).bind(this));
	};
	
	this.retrieveNotes = function (inCallBack) {
		//Mojo.Log.info("Entering db retrieveNotes()");
		
		this.db.transaction((function (inTransaction) {
			inTransaction.executeSql(sqlRetrieveNotes,
			[ ],
			function (inTransaction, inResultSet) {
				//Mojo.Log.info("DB Retrieve Notes Success");
				var results = [], i;
				if (inResultSet.rows) {
					for (i = 0; i < inResultSet.rows.length; i++) {
						//Mojo.Log.info("Result in retrieveNotes db: %j", inResultSet.rows.item(i));
						// Use clone of object to avoid problems with immutability
						results.push(Object.clone(inResultSet.rows.item(i)));
					}
				}
				//Mojo.Log.info("Note Results in db: %j", results);
				inCallBack(results);
			},
			this.errorHandler.bind(this)
			);
	    }).bind(this));
	};
	
	this.retrieveNotesByString = function (inString, inCallBack) {
		Mojo.Log.info("Entering db retrieveNotesBySting() with", inString);
		
		this.db.transaction((function (inTransaction) {
			inTransaction.executeSql( inString,
			[ ],
			function (inTransaction, inResultSet) {
				Mojo.Log.info("Retrieve Notes Success");
				var results = [], i;
				if (inResultSet.rows) {
					for (i = 0; i < inResultSet.rows.length; i++) {
						//Mojo.Log.info("Result in retrieveNotes db: %j", inResultSet.rows.item(i));
						// Use clone of object to avoid problems with immutability
						results.push(Object.clone(inResultSet.rows.item(i)));
					}
				}
				//Mojo.Log.info("Note Results in db: %j", results);
				inCallBack(results);
			},
			this.errorHandler.bind(this));
	    }).bind(this));
	};

	this.retrieveNoteByValue = function (inValue, inCallBack) {
		//Mojo.Log.info("Entering db retrieveNotes()");
		
		this.db.transaction((function (inTransaction) {
			inTransaction.executeSql(sqlRetrieveNoteByValue,
			[ inValue ],
			function (inTransaction, inResultSet) {
				//Mojo.Log.info("Retrieve Notes Success");
				var results = [], i;
				if (inResultSet.rows) {
					for (i = 0; i < inResultSet.rows.length; i++) {
						//Mojo.Log.info("Result in retrieveNotes db: %j", inResultSet.rows.item(i));
						// Use clone of object to avoid problems with immutability
						results.push(Object.clone(inResultSet.rows.item(i)));
					}
				}
				//Mojo.Log.info("Note Results in db: %j", results);
				inCallBack(results);
			},
			this.errorHandler.bind(this));
	    }).bind(this));
	};

	this.retrieveNotesForSync = function (mod, inCallBack) {
		//Mojo.Log.info("Entering db retrieveNotesForSync()");
		
		this.db.transaction((function (inTransaction) {
			inTransaction.executeSql(sqlRetrieveNotesForSync,
			[ mod ],
			function (inTransaction, inResultSet) {
				//Mojo.Log.info("Retrieve Notes For Sync Success");
				var results = [], i;
				if (inResultSet.rows) {
					for (i = 0; i < inResultSet.rows.length; i++) {
						//Mojo.Log.info("Result in retrieveNotes db: %j", inResultSet.rows.item(i));
						// Use clone of object to avoid problems with immutability
						results.push(Object.clone(inResultSet.rows.item(i)));
					}
				}
				//Mojo.Log.info("Note Results in db: %j", results);
				inCallBack(results);
			},
			this.errorHandler.bind(this));
	    }).bind(this));
	};

	this.deleteNote = function (inNote, inCallback) {
		//Mojo.Log.info("Entering db deleteNote()");
		// Delete Folder with value inNote
		this.db.transaction((function (inTransaction) {
			inTransaction.executeSql(sqlDeleteNote,
				[inNote], 
				function(){
					//Mojo.Log.info("Deleted Note", inNote);
					inCallback(inNote);
				},
				this.errorHandler.bind(this));
	    }).bind(this));
	};
	
	this.deleteAllNotes = function () {
		// Delete Notes
		this.db.transaction((function (inTransaction) {
			inTransaction.executeSql(sqlDeleteAllNotes,
				[], 
				function(){
					//Mojo.Log.info("Deleted Notes");
				},
				this.errorHandler.bind(this));
	    }).bind(this));
	};
		
// **********************************************
// Error Handler
// **********************************************

	this.errorHandler = function(inTransaction, inError) {
		Mojo.Log.info("DAO ERROR!", inError.message);
	    Mojo.Controller.errorDialog(
	     	$L("DAO ERROR") + " - (" + inError.code + ") : " + inError.message
	    );

  	}; // End errorHandler().

}

var dao = new DAO();
