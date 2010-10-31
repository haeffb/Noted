/*
 * debug.js
*/

var logIt = function (inString) {
	if (MyAPP.debug) {
		Mojo.Log.info(inString);
	}
	if (MyAPP.logItOutDiv) {
		logItOutDiv.innerHTML += "<br />" + inString;
	}
};

var debugError = function(level, msg){
    level = level.toUpperCase();
    
    if(Mojo.Log) {
        Mojo.Log.error(level + ': ' + msg);
    } else {
        console.log(level + ': ' + msg);
    }
};

var debugString = function(msg){
	if(Mojo.Log) {
		Mojo.Log.info('INFO: ' + msg);
	} else {
		console.log('INFO: ' + msg);
	}
};

var debugObject = function(obj, reflectType){
	var i;
    if(reflectType === 'properties') {
        for(i in obj) {
            if(obj.hasOwnProperty(i)) {
                debugString('OBJECT ITERATION: ' + i + ' : ' + obj[i]);
            }
        }
    } else if(reflectType === 'noFuncs') {
        for(i in obj) {
            if(typeof obj[i] !== 'function') {
                debugString('OBJECT ITERATION: ' + i + ' : ' + obj[i]);
            }
        }
    } else {
        for(i in obj) {
            debugString('OBJECT ITERATION: ' + i + ' : ' + obj[i]);
        }

    }
};