Module.register("MMM-MensaMax", {
	defaults: {
		daysAhead: 2,
		week: 1,
		year: 2022,
		monday: '',
		friday: '',
  },

	getStyles: function () {
		return ["mensamax_styles.css"];
	},

	start: function() {
		Log.log('Start ' + this.name)

		this.dataStore = new Map();

		const currentDate = moment().add(this.config.daysAhead, 'days');
		this.config.week = Number(currentDate.format('W'));
		this.config.year = Number(currentDate.format('YYYY'));
		this.config.monday = currentDate.day(1).toISOString();
		this.config.friday = currentDate.day(6).toISOString();

		if (this.config.hasOwnProperty('users') && this.config.users.length > 0) {
			this.sendSocketNotification("GET_TOKEN", {
				users: this.config.users,
			});
		}
  },

	socketNotificationReceived: function(notification, payload) {
		if (notification === "RECEIVED_TOKEN") {
			this.storeAddData(payload.benutzername, 'token', payload.token);
			this.sendSocketNotification("GET_BENUTZER_DATEN", this.currentUser(payload.benutzername));
		}

		if (notification === "RECEIVED_BENUTZER_DATEN") {
			this.storeAddData(payload.benutzername, 'benutzerdaten', payload.benutzerdaten);
			this.sendSocketNotification("GET_KONTOSTAND", this.currentUser(payload.benutzername));
		}

		if (notification === "RECEIVED_KONTOSTAND") {
			this.storeAddData(payload.benutzername, 'kontostand', payload.kontostand);
			const newPayload = this.currentUser(payload.benutzername);
			newPayload.config = this.config;
			this.sendSocketNotification("GET_SPEISEPLAN", newPayload);
	  }

		if (notification === "RECEIVED_SPEISEPLAN") {
			this.storeAddData(payload.benutzername, 'speiseplan', payload.speiseplan);
			const newPayload = this.currentUser(payload.benutzername);
			newPayload.config = this.config;
			this.sendSocketNotification("GET_BESTELLUEBERSICHT", newPayload);
		}

		if (notification === "RECEIVED_BESTELLUEBERSICHT") {
			this.storeAddData(payload.benutzername, 'bestelluebersicht', payload.bestelluebersicht);
			this.updateDom(1000);
		}
	},

	getDom: function () {
		let content = '';
		for (const [, user] of this.dataStore.entries()) {
			if (!user.bestelluebersicht) {
				continue;
			}

			const kontostandFormatted = this.currencyFormat(user.kontostand);
			const redKontostand = user.kontostand < 15 ? ' red' : '';
			const tableCaption = user.benutzerdaten.vorname + ' ' + user.benutzerdaten.nachname + ' - <span class=' + redKontostand + '>' + kontostandFormatted + '</span>';
			content += '<table><caption class="xsmall thin">' + tableCaption + '</caption>';
			user.bestelluebersicht.forEach(el => {
				const day = moment(el.date).format('dd');
				let bestellung = '';
				if (el.bestellungen.length === 0) {
					bestellung = '';
				}
				else {
					bestellung = el.bestellungen[0].menue.vorspeisen[0] ? el.bestellungen[0].menue.vorspeisen[0].bezeichnung + ', ': '';
					bestellung += el.bestellungen[0].menue.hauptspeisen[0].bezeichnung;
					bestellung += el.bestellungen[0].menue.nachspeisen[0] ? ', ' + el.bestellungen[0].menue.nachspeisen[0].bezeichnung : '';
				}

				content += '<tr><td class="xsmall dimmed">' + day + '</td><td class="xsmall bright">' + bestellung + '</td></tr>';
			})
			content += '</table>';

		}
		this.dataStore.forEach(user => {
		});

    var wrapper = document.createElement("div");
		wrapper.classList.add('mensamax');
		wrapper.innerHTML = content;
    return wrapper;
  },

	storeAddData: function(benutzername, key, value) {
		if (! this.dataStore.has(benutzername)) {
			this.dataStore.set(benutzername, {});
		}

		const data = this.dataStore.get(benutzername);
		data[key] = value;
		this.dataStore.set(benutzername, data);
	},

	currentUser: function(benutzername) {
		return { benutzername, token: this.dataStore.get(benutzername).token };
	},

	currencyFormat: function(amount) {
		const numberFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
		return numberFormat.format(amount);
	},

});

