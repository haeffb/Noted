var NotesList = Class.create(DataModelBase, {
	initialize: function($super, options) {
		$super(options);
	},

	getCacheName: function() {
		return "notes-list";
	},
 	loadRange: function($super, offset, limit, onSuccess, onFailure) {
		var self = this;
		var context = appContext();
		// Mojo.Log.info("In HERE!");
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
	},

  formatBirthdays: function(results) {
      var dateRegex = /^(\d{2})\/(\d{2})(?:\/(\d{4}))?$/,
          today = Mojo.Format.formatDate(new Date(), "MM/dd"),
          thisYear = new Date().getFullYear(),
          nextYear = thisYear + 1;

      var i = results.length;
      while (i--) {
          var result = results[i];
          var matches = dateRegex.exec(result.birthday_date);
          if (matches) {
              var month = matches[1], day = matches[2];
              var dateThisYear = new Date(thisYear, month-1, day); // darn month 0 - 11

              // if the date is in the past, bump up to next years birthday
              if (result.birthday_date < today) {
                  dateThisYear.setFullYear(nextYear);
              }
              result.rawBirthdayDate = dateThisYear.getTime();
              result.birthdayDate = Mojo.Format.formatRelativeDate(dateThisYear, "long");
          }
      }

      return results;
  }
});
