function NoteslistAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
}

NoteslistAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the scene is first created */
	this.controller.get('noteslist-title').innerHTML = Mojo.appInfo.title;
	this.controller.get("syncLog").innerHTML = MyAPP.syncLogCookie.get();
	this.controller.get('sort-order').innerHTML = MyAPP.sortItems[MyAPP.prefs.sortOrder].label;
	if (MyAPP.prefs.sortDir === 'ASC') {
		var sortNode = this.controller.get('sort-dir');
		sortNode.toggleClassName('sort-direction-down');
		sortNode.toggleClassName('sort-direction-up');
	}

	this.controller.get("bgcolor").style.backgroundColor = MyAPP.colors[MyAPP.prefs.color].color; //"#D2F7D4";
	
	/* use Mojo.View.render to render view templates and add them to the scene, if needed */
	
	/* setup widgets here */
	this.notes = [];
	this.controller.setupWidget("noteslist", 		
		{
			itemTemplate: 'noteslist/rowTemplate',
			listTemplate: 'noteslist/listTemplate',
			swipeToDelete: true,
			autoconfirmDelete: false,
			renderLimit: 20,
			lookahead: 10,
			//dividerFunction: this.notesDivider.bind(this),
			dividerTemplate: 'noteslist/divider',
			filterFunction: this.filterFunction.bind(this),
			delay: 300,
			formatters: {
				//note: this.formatNote.bind(this),
				title: this.formatTitle.bind(this),
				preview: this.formatPreview.bind(this),
				iconnote: this.formatNoteIcon.bind(this)
			},
			reorderable: false
		},
		this.notesListModel = {
			items: this.notes
		}
	);
	
	// Setup scrim and spinner to indicate activity while getting tasks
	this.controller.setupWidget ('Spinner', 
		this.spinnerAttributes = {
			spinnerSize: Mojo.Widget.spinnerLarge
		},
		this.spinnerModel = {
			spinning: false	
		}
	);
	this.controller.get('Scrim').hide();
	this.controller.get('syncLog').hide();

	this.cmdMenuModel = {
		items: [
			{
				items: [
					{icon: 'new',command: 'doAdd'}
				]
			},
			{
				items: [
					{icon: 'sync',command: 'doSync'}
				]
			}
		]
	};
	this.controller.setupWidget(Mojo.Menu.commandMenu, {}, this.cmdMenuModel);
	
	this.appMenuModel = {
		visible: true,
		items: [
			Mojo.Menu.editItem,
			{label: $L('Preferences & Accounts') + "...", command: 'doPrefs', disabled: false},
			//{label: $L('Folders Contexts & Goals') + "...", command: 'doFolders', disabled: false},
			//{label: $L('Custom Lists') + "...", command: 'doCustom', disabled: false},
			Mojo.Menu.helpItem
		]
	};
	this.controller.setupWidget(Mojo.Menu.appMenu, {omitDefaultItems: true}, this.appMenuModel);
	
	/* add event handlers to listen to events from widgets */
	this.listTapHandler = this.listTap.bindAsEventListener(this);
	this.controller.listen('noteslist', Mojo.Event.listTap, this.listTapHandler);
	this.listDeleteHandler = this.listDelete.bindAsEventListener(this);
	this.controller.listen('noteslist', Mojo.Event.listDelete, this.listDeleteHandler);

	this.toggleSyncOutputHandler = this.toggleSyncOutput.bindAsEventListener(this);
	this.controller.listen('syncLog', Mojo.Event.tap, this.toggleSyncOutputHandler);
	this.showSyncOutputHandler = this.showSyncOutput.bindAsEventListener(this);
	this.controller.listen('syncStats', Mojo.Event.tap, this.showSyncOutputHandler);	

	this.headerMenuTapHandler = this.headerMenuTap.bindAsEventListener(this);
	this.controller.listen('header-menu-button', Mojo.Event.tap, this.headerMenuTapHandler);
	this.headerMenuDirTapHandler = this.headerMenuDirTap.bindAsEventListener(this);
	this.controller.listen('header-menu-button-dir', Mojo.Event.tap, this.headerMenuDirTapHandler);

	this.filterListHandler = this.filterList.bindAsEventListener(this);
	this.controller.listen('noteslist', Mojo.Event.filter, this.filterListHandler);
    this.onKeyDownHandler = this.onKeyDown.bind(this);
    this.controller.listen(this.controller.document, "keyup", this.onKeyDownHandler, true);

	if (MyAPP.prefs.syncOnStart) {
		this.startSync();
	}
	
	dao.countNotes(this.setListLength.bind(this));

	//debugObject(this.controller.document, "noFuncs");

};

NoteslistAssistant.prototype.setListLength = function (response) {
	Mojo.Log.info("List length: %j", response);
	this.listLength = response;
	var listWidget = this.controller.get('noteslist');
	listWidget.mojo.invalidateItems();
	//listWidget.mojo.getList().mojo.setLength(response);
	//listWidget.mojo.getList().mojo.setLength(100);
};

NoteslistAssistant.prototype.onKeyDown = function(event) {
	//debugObject(event, 'noFuncs');
	
	//
	// note: to capture gesture + keycode, use keyup event:
	// if (event.keycode === keycode && event.metakey === true)
	//
	
    if (Mojo.Char.isEnterKey(event.keyCode) && this.controller.stageController.activeScene().sceneName === 'noteslist') {
		//Mojo.Log.info("Enter was pressed!", this.filterString);
		var myString = '';
		myString = this.filterString.substr(0,1).toUpperCase() + this.filterString.substr(1,this.filterString.length);
		this.controller.get('noteslist').mojo.close();
		this.listAdd(myString);
		//this.filterString = '';
        // entered is not set!
    }
};

NoteslistAssistant.prototype.filterList = function (event) {
	//Mojo.Log.info("FILTER!!! ", event.filterString);
	this.filterString = event.filterString;
};

NoteslistAssistant.prototype.headerMenuTap = function (event) {
	this.controller.popupSubmenu({
        onChoose:this.changeSort.bind(this),
        placeNear: event.target,
		title: $L("Sort by"),
        items: MyAPP.sortItems
    });
};

NoteslistAssistant.prototype.headerMenuDirTap = function (event) {
	//Mojo.Log.info("Dir tap");
	var sortNode = this.controller.get('sort-dir');
	sortNode.toggleClassName('sort-direction-down');
	sortNode.toggleClassName('sort-direction-up');
	if (sortNode.hasClassName('sort-direction-down')) {
		MyAPP.prefs.sortDir = 'DESC';	
	}
	else {
		MyAPP.prefs.sortDir = 'ASC';
	}
	MyAPP.prefsDb.add('prefs', MyAPP.prefs, function(){
	}, function(event){
		//Mojo.Log.info("Prefs DB failure %j", event);
	});
	var listWidget = this.controller.get('noteslist');
	// Re-draw list
	listWidget.mojo.getList().mojo.invalidateItems(0);

};

NoteslistAssistant.prototype.changeSort = function (command) {
	//Mojo.Log.info("Changing sort order", command);
	if (command) {
		MyAPP.prefs.sortOrder = command;
		MyAPP.prefsDb.add('prefs', MyAPP.prefs, function(){
		}, function(event){
			//Mojo.Log.info("Prefs DB failure %j", event);
		});
		this.controller.get('sort-order').innerHTML = MyAPP.sortItems[command].label;
		//this.notes.sort(this.sortNotes.bind(this));
	}
	var listWidget = this.controller.get('noteslist');
	// Re-draw list
	listWidget.mojo.getList().mojo.invalidateItems(0);

};
NoteslistAssistant.prototype.sortNotes = function (a, b) {
	var sort = MyAPP.sortItems[MyAPP.prefs.sortOrder].sort;
	var dir = (MyAPP.prefs.sortDir === 'DESC') ? -1 : 1;
	if (a[sort] > b[sort]) {
		return dir;
	}
	if (a[sort] < b[sort]) {
		return -dir;
	}
	return 0;
	
};

NoteslistAssistant.prototype.listDelete = function (event) {
	//Mojo.Log.info("Event: %j", Object.toJSON(event.item));
	//Mojo.Log.info("Deleting %j", event.index, event.item.note);
	if (event.item.key === '0') {
		dao.deleteNote(event.item.value, function(){
		});
	}
	else {
		event.item.deleted = "True";
		event.item.modified = new Date().getTime();
		dao.updateNote(event.item, function(response){
			//Mojo.Log.info("Update response %j", response);
			this.updateList.bind(this);
		}.bind(this));
	}
};

NoteslistAssistant.prototype.updateList = function () {
	Mojo.Log.info("Updating list");
	var listWidget = this.controller.get('noteslist');
	// Re-draw list
	listWidget.mojo.getList().mojo.invalidateItems(0);
	
};

NoteslistAssistant.prototype.listAdd = function (noteString) {

	// Create a new note and call up the editnote scene
	var now = utils.getUTCTime(new Date()), note = {};
	note = {
		value: now,
		key: "0",
		deleted: "False",
		created: now,
		modified: now,
		note: noteString,
		custom: ''
	};
	dao.createNote(note, this.goToEditNote.bind(this, note.value));
};

NoteslistAssistant.prototype.goToEditNote = function (value) {
	this.controller.stageController.pushScene('editnote', value);
};

NoteslistAssistant.prototype.toggleSyncOutput = function (event) {
	this.controller.get('syncLog').hide();
};

NoteslistAssistant.prototype.showSyncOutput = function (event) {
	this.controller.get('syncLog').show();
};

NoteslistAssistant.prototype.listTap = function (event) {
	//Mojo.Log.logProperties(event, 'event');
	//Mojo.Log.info("Event: %j", Object.toJSON(event.item));
	//debugObject(event, 'noFuncs');
	//Mojo.Log.info("event item %j", event.item);
	var id = event.originalEvent.target.id,
		className = event.originalEvent.target.className,
		curNode, curPreview, curPreviewNode, note;
	//Mojo.Log.info("Classname:", className, "Id:", id);

	if (className === 'note-details-link') {
		this.controller.stageController.pushScene('editnote', 
			event.item.value);
		
	}
	else {
		//Mojo.Log.info("Note Icon or drawer tapped!", event.index, id, className);

		curNode = this.controller.get('noteslist').mojo.getList().mojo.getNodeByIndex(event.index);

		curTitle = curNode.getElementsByClassName('title')[0];
		curPreview = curNode.getElementsByClassName('preview')[0];
		
		curTitle.toggleClassName('truncating-text');
		curPreview.toggleClassName('truncating-text');
		curPreview.toggleClassName('open');
		
		note = event.item; //this.someNotes[event.index];
		firstCR = note.note.indexOf('\n');
			
		if (curPreview.hasClassName('open')) {
			this.scrollState = this.controller.get('mojo-scene-noteslist-scene-scroller').mojo.getState();
			if (!note.previewFormatted) {
				note.previewFormatted = (firstCR !== -1) ? 
				Mojo.Format.runTextIndexer(note.note.slice(firstCR + 1)).replace(/\n/g, '<br/>') : "";
			}
			curPreview.innerHTML = note.previewFormatted; // (firstCR !== -1) ? 
				//Mojo.Format.runTextIndexer(note.slice(firstCR + 1)).replace(/\n/g, '<br/>') : "";
		}
		else {
			curPreview.innerHTML = (MyAPP.prefs.showPreview) ? note.preview : ""; //(firstCR !== -1) ? 
				//Mojo.Format.runTextIndexer(note.slice(firstCR + 1)).replace(/<br\s*\/*>/gi, '') : "";
			//this.controller.get('noteslist').mojo.getList().mojo.revealItem(event.index);
			this.controller.get('mojo-scene-noteslist-scene-scroller').mojo.setState(this.scrollState, false);
		}
	}
};

NoteslistAssistant.prototype.handleCommand = function (event) {
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
			case 'doAdd':
				this.goToEditNote();
				break;
			case 'doSync':
				this.startSync();
				break;
			case 'doPrefs':
				this.controller.stageController.pushScene('preferences');
				break;
		}
	}
};

NoteslistAssistant.prototype.startSync = function () {
	if (!MyAPP.prefs.key) {
		this.controller.stageController.pushScene('accounts');
	}
	else {
		this.connectRequest = new Mojo.Service.Request('palm://com.palm.connectionmanager', {
			method: 'getstatus',
			parameters: {},
			onSuccess: function(response){
				//Mojo.Log.info("Response %j", response);
				if (response.isInternetConnectionAvailable) {
					if (!MyAPP.prefs.syncWifiOnly ||
					response.wifi.state === 'connected') {
						this.controller.get('Scrim').show();
						var syncOutput = this.controller.get('syncLog');
						syncOutput.show();
						this.spinnerModel.spinning = true;
						this.controller.modelChanged(this.spinnerModel);
						sync.initSync(this.finishedSync.bind(this), syncOutput);
						delete this.connectRequest;
					}
					else {
						//Mojo.Log.info("Wifi connection not available!");
						Mojo.Controller.errorDialog($L("Wifi connection not available!"));						
						delete this.connectRequest;
					}
				}
				else {
					//Mojo.Log.info("Internet connection not available!");
					Mojo.Controller.errorDialog($L("Internet connection not available!"));	
					delete this.connectRequest;
				}
			}.bind(this)			,
			onFailure: function(response){
				//Mojo.Log.info("Connection Status Service Request FAILED!");
				delete this.connectRequest;
			}.bind(this)
		});
	}
};

NoteslistAssistant.prototype.finishedSync = function () {
	//var n = {};
	//n.title = note.note.slice(0,note.note.indexOf('\n')); //Get to first LF char
	//n.note = note.note;
	//this.notes.push(n);
	this.controller.get("Scrim").hide();	
	this.hideScrim = function () {
		this.controller.get('syncLog').hide();
	}.bind(this);
	this.hideScrim.delay(10);
	this.spinnerModel.spinning = false;
	this.controller.modelChanged(this.spinnerModel);
	this.updateList();
};

NoteslistAssistant.prototype.notesDivider = function (itemModel) {
	return "";
};

NoteslistAssistant.prototype.filterFunction = function (filterString, listWidget, offset, count) {
	Mojo.Log.info("Offset", offset, "Count", count);
	var sqlString;
	sqlString = 'SELECT * FROM notes WHERE deleted = "False" ';
	if (!offset) {
		this.notes = [];
		//count = 90;
	}
	if (filterString) {
		this.controller.get('header-spacer').hide();
		//sqlString += 'WHERE note REGEXP "' + filterString + '" ';
		sqlString += 'AND note LIKE "%' + filterString + '%" ';
	}
	sqlString += 'ORDER BY ' + MyAPP.sortItems[MyAPP.prefs.sortOrder].sort + " ";
	if (MyAPP.sortItems[MyAPP.prefs.sortOrder].sort === 'note') {
		sqlString += 'COLLATE NOCASE ';
	}
	sqlString += MyAPP.prefs.sortDir + ' ';
	sqlString += 'LIMIT ' + count + ' OFFSET ' + offset + ';GO;';
	Mojo.Log.info("SQLstring", sqlString);
	dao.retrieveNotesByString(sqlString, this.gotFilter.bind(this, filterString, listWidget, offset, count));
};

NoteslistAssistant.prototype.gotFilter = function (filterString, listWidget, offset, count, response) {
	Mojo.Log.info("Response %j", response);
	if (!filterString) {
		this.controller.get('header-spacer').show();
	}
	var i, firstCR;
	Mojo.Log.info("Response length", response.length);
	if (response.length ) { //&& (offset + count > this.maxPushed)) {
		for (i = 0; i < response.length; i++) {
			firstCR = response[i].note.indexOf('\n');
			response[i].title = (firstCR !== -1) ? Mojo.Format.runTextIndexer(response[i].note.slice(0, firstCR)) : response[i].note;
			response[i].preview = (firstCR !== -1) ? Mojo.Format.runTextIndexer(response[i].note.slice(firstCR + 1, firstCR + 60)).replace(/<br\s*\/*>/gi, '') : "";
			this.notes[i+offset] = response[i];
		}
		listWidget.mojo.getList().mojo.noticeUpdatedItems(offset, this.notes.slice(offset, offset+response.length));
		//listWidget.mojo.getList().mojo.noticeUpdatedItems(offset, response);
		//listWidget.mojo.getList().mojo.setLength(this.notes.length);
		listWidget.mojo.getList().mojo.setLength(this.listLength);
		Mojo.Log.info("List length", listWidget.mojo.getList().mojo.getLength());	
		listWidget.mojo.setCount(offset + response.length);
	}
};

/*
NoteslistAssistant.prototype.filterFunction = function (filterString, listWidget, offset, count) {
	this.listOffset = offset;
	//Mojo.Log.info("FilterFunction", listWidget.id, filterString, offset, count);
	//Mojo.Log.info("Original length", this.tasks.length);
	var i, s;
	this.someNotes = [];
	if (filterString !== '') {
		var len = this.notes.length;
		this.controller.get('header-spacer').hide();
		for (i = 0; i < len; i++) {
			s = this.notes[i]; 
			if (s.note.toUpperCase().indexOf(filterString.toUpperCase()) >=0) {
				//Mojo.Log.info("Found string in subject", i);
				this.someNotes.push(s);
			}
		}
	}
	else {
		//Mojo.Log.info("No filter string");
		this.someNotes = this.notes;
		this.controller.get('header-spacer').show();
	}
	//Mojo.Log.info("SomeTasks length", this.someTasks.length);
	
	// cut down list results to just the window asked for by the widget
	var cursor = 0;
	var subset = [];
	var totalSubsetSize = 0;
	while (true) {
		if (cursor >= this.someNotes.length) {
			break;
		}
		if (subset.length < count && totalSubsetSize >= offset) {
			subset.push(this.someNotes[cursor]);
		}
		totalSubsetSize ++;
		cursor ++;
	}
	//Mojo.Log.info("ListWidget", listWidget.id, offset, subset.length);
	//listWidget.mojo.noticeUpdatedItems(offset, subset);
	//listWidget.mojo.setLength(totalSubsetSize);
	//listWidget.mojo.setCount(totalSubsetSize);
	listWidget.mojo.getList().mojo.noticeUpdatedItems(offset, subset);
	listWidget.mojo.getList().mojo.setLength(totalSubsetSize);
	listWidget.mojo.setCount(totalSubsetSize);
	
	//leave filter open all the time...
	//listWidget.mojo.open();
};

*/

NoteslistAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
		  
	var syncString = $L("Last Sync:") + " ";

	var m = new Date(MyAPP.prefs.lastSync);
		m = m.setMinutes(m.getMinutes() - m.getTimezoneOffset());

	syncString += (MyAPP.prefs.lastSync > 0) ? Mojo.Format.formatDate(new Date(m), "medium") : "Not Synced!";


	this.controller.get("syncStats").innerHTML = syncString;
	//this.loadNotes();
	//var listWidget = this.controller.get('noteslist');
	//listWidget.mojo.getList().mojo.invalidateItems(0);
	this.updateList();
		
	this.controller.get("bgcolor").style.backgroundColor = MyAPP.colors[MyAPP.prefs.color].color; //"#D2F7D4";
	this.controller.get("syncStats").style.backgroundColor = MyAPP.colors[MyAPP.prefs.color].color; //"#D2F7D4";

	//Mojo.Log.info("Rotate:", MyAPP.prefs.allowRotate);
	if (MyAPP.prefs.allowRotate) {
		this.controller.stageController.setWindowOrientation("free");
		//Mojo.Log.info("Rotate FREE!");
	}
	else {
		this.controller.stageController.setWindowOrientation("up");
		//Mojo.Log.info("Rotate UP!");
	}

};


NoteslistAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

NoteslistAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	this.controller.stopListening('noteslist', Mojo.Event.listTap, this.listTapHandler);
	this.controller.stopListening('noteslist', Mojo.Event.listDelete, this.listDeleteHandler);
	this.controller.stopListening('syncLog', Mojo.Event.tap, this.toggleSyncOutputHandler);
	this.controller.stopListening('syncStats', Mojo.Event.tap, this.showSyncOutputHandler);	
	this.controller.stopListening('header-menu-button', Mojo.Event.tap, this.headerMenuTapHandler);
	this.controller.stopListening('header-menu-button-dir', Mojo.Event.tap, this.headerMenuDirTapHandler);

	// cleanup connection request object
	if (this.connectRequest) {
		//Mojo.Log.info("Deleting connection request object");
		delete this.connectRequest;
	}
	// Delay "Sync on Quit" by 6 seconds so that app is closed before beginning sync
	if (MyAPP.prefs.syncOnQuit && !MyAPP.prefs.syncOnInterval) {
		// delay by 6 seconds to allow app to close...
		sync.setSyncTimer(0.1);
	}

};


/*
NoteslistAssistant.prototype.formatNote = function (value, model) {
	//Mojo.Log.info("Model Duedate", value, model.duedate);
	if (value) {
		return Mojo.Format.runTextIndexer(value.replace(/\n/g, "<br />"));
	}
	else {
		return "";
	}
};
*/

NoteslistAssistant.prototype.formatPreview = function (value, model) {

	if (model.note && MyAPP.prefs.showPreview) {
//		firstCR = model.note.indexOf('\n');
//		return (firstCR !== -1) ? 
//			Mojo.Format.runTextIndexer(model.note.slice(firstCR+1)).replace(/<br\s*\/*>/gi, '') : "";
		return model.preview;
	}
	else {
		return "";
	}
};

NoteslistAssistant.prototype.formatTitle = function (value, model) {
	if (model.note) {
		//firstCR = model.note.indexOf('\n');
		//return (firstCR !== -1) ? 
 		//	Mojo.Format.runTextIndexer(model.note.slice(0, model.note.indexOf('\n'))) : model.note;
		return model.title;
	}
};

NoteslistAssistant.prototype.formatNoteIcon = function (value, model) {
	if (true) {
		//return (MyAPP.prefs.showNoteIcon) ? "note-details-link" : "";
		return "note-details-link";
	}
};

