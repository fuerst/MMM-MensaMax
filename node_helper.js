const { GraphQLClient } = require("graphql-request");
const fetch = require("node-fetch");
const NodeHelper = require("node_helper");

const apiUrl = "https://m.mensamax.de/graphql/";
const graphQLClient = new GraphQLClient(apiUrl);

// console.error() will log to stderr at Docker Log.

module.exports = NodeHelper.create({

	socketNotificationReceived: function (notification, payload) {
		const self = this;

		if (notification === "GET_TOKEN") {
			getToken(self, payload.users)
		}

		if (notification === "GET_BENUTZER_DATEN") {
			addRequestHeaders(payload.token);
			queryBenutzerDaten(self, payload.benutzername);
		}

		if (notification === "GET_KONTOSTAND") {
			addRequestHeaders(payload.token)
			queryKontostand(self, payload.benutzername)
		}

		if (notification === "GET_SPEISEPLAN") {
			addRequestHeaders(payload.token)
			querySpeiseplan(self, payload.benutzername, payload.config)
		}

		if (notification === "GET_BESTELLUEBERSICHT") {
			addRequestHeaders(payload.token)
			queryBestellübersicht(self, payload.benutzername, payload.config)
		}
	}
});

function getToken(nodeHelper, users) {
	users.forEach(user => {
		const url = apiUrl + 'auth/login';
		const data = {
			projekt: user.projekt,
			benutzername: user.benutzername,
			passwort: user.passwort
		};

		fetch(url, {
			method: 'POST',
			body: JSON.stringify(data),
			headers: {
				'Content-Type': 'application/json',
				'Cookie': 'mensamax_superglue=https://mensaweb.de' // Ansonsten Redirect-Schleife auf sich selbst
			},
		})
			.then(NodeHelper.checkFetchStatus)
			.then(res => res.json())
			.then(json => {
				nodeHelper.sendSocketNotification("RECEIVED_TOKEN", {
					benutzername: user.benutzername,
					token: json.text
				})
			})
			.catch(error => console.error(error))
	});
}

function addRequestHeaders(token) {
  graphQLClient.setHeaders({
    'Content-Type': 'application/json',
    'Cookie': 'mensamax_superglue=https://mensaweb.de;token=' + token
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
