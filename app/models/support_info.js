/*
 * The purpose of the Help scene is to give users a consistent place within
 * webOS apps to find publisher information, support contact information and 
 * help resources.
 * 
 * We intend to provide framework-level support for the Help scene in a future
 * SDK release. For now, you'll need to manually add the Help scene and hook it
 * up to your app's Help menu item.
 * 
 * The contents of the Help scene are determined by the fields provided in this
 * file. Required fields are noted below. For most fields, UI labels are
 * automatically generated; the Help Resources are the exception to this rule.
 * 
 * Help resources may take various forms (help topics, FAQs, tips, rules,
 * tutorials, etc.). As far as the Help scene is concerned, a help resource is
 * defined by a UI label describing the resource and either a scene name (if the
 * resource is included as a scene in the app itself) or a URL (if the resource
 * is to be viewed in the webOS browser). You may provide any number of help
 * resources, or none at all. Make sure to replace the icon32x32.png with a 32x32 
 * version of your app's icon.
 */

// Required
_APP_Name = Mojo.appInfo.title;
_APP_VersionNumber = Mojo.appInfo.version;
_APP_PublisherName = Mojo.appInfo.vendor;
_APP_Copyright = Mojo.appInfo.copy;

// At least one of these three is required
_APP_Support_Email = {
	address: 'tigercountrysoftware@gmail.com',
	subject: 'Support - ' + Mojo.appInfo.version
};        // label = “Send Email”

// Optional
_APP_Publisher_URL = 'http://www.tigercountrysoftware.com/noted'; // label = _APP_PublisherName + “Website”
/*
_APP_Help_Resource = [
						{ type : 'scene', label: $L('Help Topics'), sceneName: 'faq' } //Sample to include an FAQ scene
					 ];

*/