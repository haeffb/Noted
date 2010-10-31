function EditnoteAssistant(noteValue) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */

	this.noteValue = null;
	if (noteValue) {
		this.noteValue = noteValue;
	}
}

EditnoteAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	this.controller.get("bgcolor").style.backgroundColor = MyAPP.colors[MyAPP.prefs.color].color; //"#D2F7D4";
	
	// check for screen height: 372 = Pixi
	//Mojo.Log.info("height:", Mojo.Environment.DeviceInfo.maximumCardHeight);
	if (parseInt(Mojo.Environment.DeviceInfo.maximumCardHeight, 10) === 372) {
		this.controller.get("noteEdit").toggleClassName('note-text-480');
		this.controller.get("noteEdit").toggleClassName('note-text-400');
	}

	/* use Mojo.View.render to render view templates and add them to the scene, if needed */
	
	/* setup widgets here */

	this.controller.setupWidget('tagEdit', {
			hintText: $L("Tags") + "...",
			textCase: Mojo.Widget.steModeLowerCase
		},
		this.tagModel = {
			value: "" 
		}
	);
	
    this.controller.setupWidget("noteEdit", this.noteAttributes = {
        hintText: $L('Enter a note') + '...',
        multiline: true,
        enterSubmits: false,
        autoFocus: true,
        changeOnKeyPress: true,
        focusMode: MyAPP.prefs.focusMode
    }, this.noteModel = {
        value: ""
    });
	
	this.cmdMenuModel = {
		items: [
			{
				items: [
					{icon: 'clock',command: 'timeStamp'},
					{icon: 'month',command: 'dateStamp'}
				]
			},
			{
				items: [
					{icon: 'send',command: 'sendNote'}
				]
			}
		]
	};
	this.controller.setupWidget(Mojo.Menu.commandMenu, {}, this.cmdMenuModel);
	
	
	/* add event handlers to listen to events from widgets */
	this.delayedNoteChange = Mojo.Function.debounce(undefined, this.changeNote.bind(this), 0.5);
	this.noteChangedHandler = this.noteChanged.bindAsEventListener(this);
	this.controller.listen('noteEdit', Mojo.Event.propertyChanged, this.noteChangedHandler);
	this.controller.listen('tagEdit', Mojo.Event.propertyChanged, this.noteChangedHandler);
};

EditnoteAssistant.prototype.handleCommand = function (event) {
	//debugObject(event.originalEvent, 'noFuncs');
	switch (event.command) {
		case 'timeStamp':
			this.addStamp('time');
			break;
		case 'dateStamp':
			this.addStamp('date');
			break;
		case 'sendNote':
			this.controller.popupSubmenu({
	            onChoose:this.sendNote.bind(this),
	            placeNear: event.originalEvent.target,
	            items: [{label: $L('Email'), command: 'email-cmd'},
	                      {label: $L('SMS'), command: 'sms-cmd'}
				]
	        });
	}
};

EditnoteAssistant.prototype.sendNote = function (choice) {
	//Mojo.Log.info("Sending Note %j", choice);	
	switch (choice) {
		case 'email-cmd':
			this.sendByEmail(this.note);
			break;
		case 'sms-cmd':
			this.sendBySMS(this.note);
			break;
	}
};

EditnoteAssistant.prototype.sendByEmail = function (note) {
	var text =  Mojo.Format.runTextIndexer(note.note.replace(/\n/g, "<br />"));

	//Mojo.Log.info("Text is", text);
	
	myController = this.controller; //getActiveStageController().activeScene();
	myController.serviceRequest(
		'palm://com.palm.applicationManager', {
			method: 'open',
			parameters: {
				id: 'com.palm.app.email',
				params: {
					summary: Mojo.appInfo.title + ' Export',
					recipients: [ {
						//value: MyAPP.prefs.defaultEmail
						//contactDisplay:'myname'
					}],
					text: text
				}
			}
		}
	);
};

EditnoteAssistant.prototype.sendBySMS = function (note) {
	var text = note.note;
	//Mojo.Log.info("Text is", text);
	
	myController = this.controller; //getActiveStageController().activeScene();
	myController.serviceRequest(
		'palm://com.palm.applicationManager', {
			method: 'open',
			parameters: {
				id: 'com.palm.app.messaging',
				params: {
					//composeAddress: '4085555555',
					messageText: text
				}
			}
		}
	);
};

EditnoteAssistant.prototype.addStamp = function (type) {
	var textField, pos, start, end, stamp, note;
	type = type ? type : 'date';
	textField = this.controller.get('noteEdit');
	note = (this.noteModel.value) ? this.noteModel.value : "";
	Mojo.Log.info("Get position");
	pos = null;
	if (note.length) {
		// workaround because getCursorPosition errors if textfield is blank
		pos = textField.mojo.getCursorPosition();
	}
	Mojo.Log.info("Position: %j", pos);
	switch (type) {
		case 'time':
			stamp = Mojo.Format.formatDate(new Date(), {time: 'short'}) + " ";
			break;
		case 'date':
			stamp = Mojo.Format.formatDate(new Date(), {date: 'medium'}) + " ";
			break;
	}
	Mojo.Log.info("Stamp", stamp);
	//Mojo.Log.info ("note length", note.length);
	start = "";
	end = "";
	if (note) {
		start = note.substring(0, pos.selectionStart);
		end = note.substring(pos.selectionEnd, note.length);
	}
	//Mojo.Log.info("Note:", start, "+",  stamp, "+", end);
	this.noteModel.value = start + stamp + end;
	this.controller.modelChanged(this.noteModel);
	if (pos) {
		textField.mojo.setCursorPosition(pos.selectionStart + stamp.length, pos.selectionStart + stamp.length);
	}
	
	// need to save note!		
	this.noteChanged("stamp");

};


EditnoteAssistant.prototype.noteChanged = function (event) {
	//Mojo.Log.info("keypress");
	this.delayedNoteChange(event);
};

EditnoteAssistant.prototype.changeNote = function (event) {
	//save note changes on every keypress!!!
	//Mojo.Log.info("Model: %j", event.model);
	
	var now = new Date().getTime(); //utils.getUTCTime(new Date());
	this.note.note = this.noteModel.value;
	this.note.tags = this.tagModel.value.split(" ").join(",");
	this.note.modified = now;
	if (this.note.value) {
		// existing note
		dao.updateNote(this.note, function(results){
			//Mojo.Log.info("Updated: %j", results);
		});
	}
	else {
		// new note that we need to give a value and create
		this.note.value = now;
		dao.createNote(this.note, function (results) {
			//Mojo.Log.info("Created insertId: %j", results);			
		});	 
	}
};

EditnoteAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
	
	if (this.noteValue) {
		dao.retrieveNoteByValue(this.noteValue, this.gotNote.bind(this));
	}
	else {
		// Create a new note and call up the editnote scene
		var now = new Date().getTime(); //utils.getUTCTime(new Date());
		this.note = {
			value: null,
			key: "0",
			deleted: "False",
			created: now,
			modified: now,
			tags: '',
			systemtags: '',
			note: '',
			custom: ''
		};
		this.noteModel.value = this.note.note;
		this.controller.modelChanged(this.noteModel);
		
		this.showDates();
	}
};

EditnoteAssistant.prototype.showDates = function () {
		var c = new Date(this.note.created);
		//c = c.setMinutes(c.getMinutes() - c.getTimezoneOffset());
		//Mojo.Log.info(c);
		var m = new Date(this.note.modified);
		//m = m.setMinutes(m.getMinutes() - m.getTimezoneOffset());
		
		this.controller.get('notedetails').innerHTML =  $L("Created") + ": " +
			Mojo.Format.formatDate(new Date(c), 'medium') +
			"<br />" + $L("Modified") + ": " + 
			Mojo.Format.formatDate(new Date(m), 'medium');
		
	
};

EditnoteAssistant.prototype.gotNote = function (notes) {
	Mojo.Log.info("Notes in editNoteScene: %j", notes);
	if (notes) {
		this.note = notes[0];
		//save for undo?
		this.oldNote = Object.clone(notes)[0];
		this.noteModel.value = this.note.note;
		this.tagModel.value = this.note.tags.split(',').join(" ");
		this.controller.modelChanged(this.tagModel);
		this.controller.modelChanged(this.noteModel);
		
		this.showDates();
	}
};

EditnoteAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

EditnoteAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	this.controller.stopListening('noteEdit', Mojo.Event.propertyChanged, this.noteChangedHandler);
	this.controller.stopListening('tagEdit', Mojo.Event.propertyChanged, this.noteChangedHandler);
};
