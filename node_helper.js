const { GraphQLClient } = require("graphql-request");
const fetch = require("node-fetch");
const NodeHelper = require("node_helper");

const apiUrl = "https://m.mensamax.de/graphql/";
const graphQLClient = new GraphQLClient(apiUrl);

const Log = require("logger");

// console.error() will log to stderr at Docker Log.

module.exports = NodeHelper.create({

	socketNotificationReceived: function (notification, payload) {
		const self = this;

		if (notification === "GET_TOKEN") {
			getToken(self, payload.users)
		}

		if (notification === "GET_BENUTZER_DATEN") {
			addRequestHeaders(payload.token, payload.mensamaxSuperglue);
			queryBenutzerDaten(self, payload.benutzername);
		}

		if (notification === "GET_KONTOSTAND") {
			addRequestHeaders(payload.token, payload.mensamaxSuperglue)
			queryKontostand(self, payload.benutzername)
		}

		if (notification === "GET_SPEISEPLAN") {
			addRequestHeaders(payload.token, payload.mensamaxSuperglue)
			querySpeiseplan(self, payload.benutzername, payload.config)
		}

		if (notification === "GET_BESTELLUEBERSICHT") {
			addRequestHeaders(payload.token, payload.mensamaxSuperglue)
			queryBestellübersicht(self, payload.benutzername, payload.config)
		}
	}
});

function getToken(nodeHelper, users) {
	users.forEach(async user => {
		const url = apiUrl + 'auth/login';
		const loginData = {
			projekt: user.projekt,
			benutzername: user.benutzername,
			passwort: user.passwort
		};
		const options = {
			method: 'POST',
			body: JSON.stringify(loginData),
			headers: {
				'Content-Type': 'application/json'
			}
		}

		try {
			// Extract "mensamax_superglue" Cookie needed for following requests.
			options.redirect = 'manual';
			const response = await fetch(url, options);
			const mensamaxSuperglue = response.headers.raw()['set-cookie']
			.at(-1)
			.split(';')
			.at(0);

			options.headers.Cookie = mensamaxSuperglue;

			// Get token.
			options.redirect = 'follow';
			const response2 = await fetch(url, options);
			const data = await response2.json();

			nodeHelper.sendSocketNotification("RECEIVED_TOKEN", {
				benutzername: user.benutzername,
				token: data.text,
				mensamaxSuperglue: mensamaxSuperglue
			})
		} catch (error) {
			Log.error(error.type, error.message);
		}
	});
}

function addRequestHeaders(token, mensamaxSuperglue) {
  graphQLClient.setHeaders({
    'Content-Type': 'application/json',
    'Cookie': `${mensamaxSuperglue};token=` + token
  });
}

function queryBenutzerDaten(self, benutzername) {
  const query = `
    {
      meineDaten { angemeldetePerson { vorname, nachname }}
    }
  `

  graphQLClient.request(query)
    .then((data) => self.sendSocketNotification("RECEIVED_BENUTZER_DATEN", {
			benutzername,
			benutzerdaten: data.meineDaten.angemeldetePerson
		}))
		.catch(error => console.error(error));
}

function queryKontostand(self, benutzername) {
  const query = `
    {
      meinKontostand { gesamtKontostandAktuell }
    }
  `

  graphQLClient.request(query)
    .then((data) => self.sendSocketNotification("RECEIVED_KONTOSTAND", {
			benutzername,
			kontostand: data.meinKontostand.gesamtKontostandAktuell
		}))
		.catch(error => console.error(error));
}

function querySpeiseplan(self, benutzername, config) {
  const variables = {
    startTime: config.monday,
    endTime: config.friday
  };

  const query = `
    query ($startTime: DateTime!, $endTime: DateTime!) {
      meinSpeiseplan(von: $startTime, bis: $endTime) {
        menues {
          meineBestellung { anzahl },
          hauptspeisen { bezeichnung },
          vorspeisen { bezeichnung },
          nachspeisen { bezeichnung }
        }
      }
    }
  `

  graphQLClient.request(query, variables)
    .then((data) => self.sendSocketNotification("RECEIVED_SPEISEPLAN", {
			benutzername,
			speiseplan: data.meinSpeiseplan
		}))
		.catch(error => console.error(error));
}

function queryBestellübersicht(self, benutzername, config) {
	const variables = {
		kw: config.week,
		year: config.year
	};

	const query = `
		query ($kw: Int!, $year: Int!) {
			bestelluebersicht(kw: $kw, year: $year) {
					date,
					bestellungen {
							menue {
									id
									vorspeisen { bezeichnung }
									hauptspeisen { bezeichnung }
									nachspeisen { bezeichnung }
							}
					}
			}
		}
  `

  graphQLClient.request(query, variables)
    .then((data) => self.sendSocketNotification("RECEIVED_BESTELLUEBERSICHT", {
			benutzername,
			bestelluebersicht: data.bestelluebersicht
		}))
		.catch(error => console.error(error));
}
