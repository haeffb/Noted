function SupportAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
}

SupportAssistant.prototype.setup = function () {
	/* this function is for setup tasks that have to happen when the scene is first created */
	
	/* use Mojo.View.render to render view templates and add them to the scene, if needed. */
	
	/* setup widgets here */
	
	/* add event handlers to listen to events from widgets */
	var licString;
	this.controller.get('title').innerHTML = $L("Help");
	
	//setup Translators info
	this.controller.get('translators').innerHTML = ""; //"<b>" + $L("Translations provided by:") + "</b> <br />" 
	//	+ "&nbsp;Deutsch: <a href='http://www.thinmachine.ch'>Markus Leutwyler</a> and " +
	//	" Björn Dethlefs";
		
	//setup License info
	licString = 'Permission is hereby granted, free of charge, to any person  obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:<br />&nbsp;<br />The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.<br />&nbsp;<br />THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.';
	this.controller.get('license').innerHTML = licString;
	
	this.controller.setupWidget(Mojo.Menu.appMenu, this.attributes = {
			omitDefaultItems: true
		},
		this.model = {
			visible: true,
			items: [
				Mojo.Menu.editItem,
				{ label: $L("Help") + "...", command: Mojo.Menu.helpCmd, disabled: true }
			]
		}
	);
	this.controller.get('appname').innerHTML = _APP_Name; // + " - " + MyAPP.appSlogan;
	this.controller.get('appdetails').innerHTML = _APP_VersionNumber + " " + $L("by") + " " + _APP_PublisherName;
	
	var supportitems = [], helpitems,
		i = 0, j;
	if (typeof _APP_Publisher_URL !== "undefined" && _APP_Publisher_URL) {
		supportitems[i++] = {text: _APP_PublisherName + ' Website', detail: $L(_APP_Publisher_URL), Class: $L('img_web'),  type: 'web'};
	}
	if (typeof _APP_Support_URL !== "undefined" && _APP_Support_URL) {
		supportitems[i++] = {text: $L('Support Website'), detail: $L(_APP_Support_URL), Class: $L("img_web"), type: 'web'};
	}
	if (typeof _APP_Support_Email !== "undefined" && _APP_Support_Email) {
		supportitems[i++] = {text: $L('Send Email'), address: _APP_Support_Email.address, subject: _APP_Support_Email.subject, Class: $L("img_email"), type: 'email'};
	}
	if (typeof _APP_Support_Phone !== "undefined" && _APP_Support_Phone) {
		supportitems[i++] = {text: $L(_APP_Support_Phone), detail: $L(_APP_Support_Phone), Class: $L("img_phone"), type: 'phone'};
	}
	try {
		helpitems = [];
		i = 0;
		for (j = 0; j < _APP_Help_Resource.length; j++) {
			if (_APP_Help_Resource[j].type === 'web')  {
				helpitems[i++] = {
					text: _APP_Help_Resource[j].label,
					detail: _APP_Help_Resource[j].url,
					Class: $L("img_web"),
					type: 'web'
				};
			}
			else  {
				if (_APP_Help_Resource[j].type === 'scene') {
					helpitems[i++] = {
						text: _APP_Help_Resource[j].label,
						detail: _APP_Help_Resource[j].sceneName,
						Class: $L("list_scene"),
						type: 'scene'
					};
				}
			}
		}
		if (_APP_Help_Resource.length > 0) {
			this.controller.setupWidget('AppHelp_list', {
				itemTemplate: 'support/listitem',
				listTemplate: 'support/listcontainer',
				emptyTemplate: 'support/emptylist',
				swipeToDelete: false			
			}, {
				listTitle: $L('Help'),
				items: helpitems
			});
		}
	}catch (e) {
		//Mojo.Log.error(e);
	}
	this.controller.setupWidget('AppSupport_list', 
		{
			itemTemplate: 'support/listitem', 
			listTemplate: 'support/listcontainer',
			emptyTemplate: 'support/emptylist',
			swipeToDelete: false						
		},
		{
			listTitle: $L('Support'),
			items : supportitems
		}
	);
	this.handleListTap = this.handleListTap.bind(this);  
	Mojo.Event.listen(this.controller.get('AppHelp_list'), Mojo.Event.listTap, this.handleListTap);
	Mojo.Event.listen(this.controller.get('AppSupport_list'), Mojo.Event.listTap, this.handleListTap);
	this.controller.get('copywrite').innerHTML = _APP_Copyright;
	
	this.handleDoTap = this.doTap.bindAsEventListener(this);
	this.controller.listen('copyright', Mojo.Event.tap, this.handleDoTap);
	
};

SupportAssistant.prototype.doTap = function (event) {
	//Mojo.Log.info("Tap Handler");
	if (this.controller.get('license').getStyle('display') === 'none') {
		this.controller.get('license').show();
		this.controller.get('license').setStyle({visibility: 'visible'});
	} else {
		this.controller.get('license').hide();
		this.controller.get('license').setStyle({display: 'none'});
		this.controller.get('license').setStyle({visibility: 'hidden'});
	}
};

SupportAssistant.prototype.handleListTap = function (event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
	if (event.item.type === 'web') {
		this.controller.serviceRequest("palm://com.palm.applicationManager", {
			method: "open",
			parameters:  {
				id: 'com.palm.app.browser',
				params: {
					target: event.item.detail
				}
			}
		});
	}	  
	else if (event.item.type === 'email') {
		this.controller.serviceRequest('palm://com.palm.applicationManager', {
			method: 'open',
			parameters: {
				target: 'mailto:' + event.item.address + "?subject="  + Mojo.appInfo.title + " " + event.item.subject
			}
		});	
	}
	else if (event.item.type === 'phone')  {
		this.controller.serviceRequest('palm://com.palm.applicationManager', {
			method: 'open',
			parameters: {
				target: "tel://" + event.item.detail
			}
		});	
	}
	  else if (event.item.type === 'scene') {
		this.controller.stageController.pushScene(event.item.detail);	
	}
};

SupportAssistant.prototype.activate = function (event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
};


SupportAssistant.prototype.deactivate = function (event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

SupportAssistant.prototype.cleanup = function (event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	Mojo.Event.stopListening(this.controller.get('AppHelp_list'), Mojo.Event.listTap, this.handleListTap);
	Mojo.Event.stopListening(this.controller.get('AppSupport_list'), Mojo.Event.listTap, this.handleListTap);

	this.controller.stopListening('copyright', Mojo.Event.tap, this.handleDoTap);
	
};
