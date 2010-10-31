var utils = {
	
	// **************************************************************
	// ***** Time & String Utils *****
	// **************************************************************
		
	timeStampToUTCString: function (t) {
		if (!t) {
			return null;
		}
		var mo, yr, hrs, mins, secs, millis, myDateString, date;
		d = new Date(t);
		//Mojo.Log.info("Setting dateString for Note", d);
		
		mo = d.getMonth() + 1;
		//Mojo.Log.info("Month:", mo);
		if (mo < 10) {
			mo = '0' + mo;
		}
		//Mojo.Log.info("Month:", mo);
		
		date = d.getDate();
		if (date < 10) {
			date = '0' + date;
		}
		//Mojo.Log.info("Date:", date);
		yr = d.getFullYear();

		//Mojo.Log.info("Year", yr);
		hrs = d.getHours();
		if (hrs < 10) {
			hrs = '0' + hrs;
		}
		//Mojo.Log.info("Hours", hrs);
		mins = d.getMinutes();
		if (mins < 10) {
			mins = '0' + mins;
		}
		//Mojo.Log.info("Minutes", mins);
		secs = d.getSeconds();
		if (secs < 10) {
			secs = '0' + secs;
		}
		//Mojo.Log.info("Seconds", secs);
		millis = d.getMilliseconds();
		//Mojo.Log.info("Millis", millis);
		if (millis < 10) {
			millis = '0' + millis;
		}
		if (millis*1 < 100) {
			millis = '0' + millis;
		}
		millis = millis + '000';

		myDateString = yr + "-" + mo + "-" + date + " " + 
			hrs + ":" + mins + ":" + secs + "." + millis;
		//Mojo.Log.info("Date String", myDateString);
		return (myDateString);
	},
	
	
	stringToTimeStamp: function (s) {
		var t;
		if (s) {
			t = new Date(s.substr(0, 4), s.substr(5, 2) - 1, s.substr(8, 2), 
				s.substr(11, 2), s.substr(14, 2), s.substr(17, 2), s.substr(20, 3));
		}
		//Mojo.Log.info("Date:", t);
		
		return t ? t.getTime(): '';
	},
	
	getUTCTime : function (d) {
		d = d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
		return d;
		
	}

};
