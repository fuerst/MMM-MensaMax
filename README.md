# MMM-MensaMax

Zeigt den "Mein Speiseplan" für [MensaMax](https://mensamax.de)-Kunden.

Als Modul im [MagicMirror²](https://github.com/MichMich/MagicMirror)-Projekt einsetzbar.


Note for english readers: This MagicMirror² modules shows the menu of german school lunch service provider _MensaMax_. Because MensaMax operates in Germany only there is no english documentation.

## Installation

1. In MagicMirror's `modules` Verzeichnis navigieren.
1. Ausführen: `git clone https://github.com/fuerst/MMM-MensaMax.git`.
1. Ausführen: `cd MMM-MensaMax`.
1. Ausführen: `npm install`.

## Konfiguration

### Ein MensaMax-Login:

```javascript
{
  module: "MMM-MensaMax",
  position: "top_left",
  config: {
    users: [
      {
        projekt: "XY123",
        benutzername: "xxxxxxx",
        passwort: "xxxxxxx"
      }
    ]
  }
}
```

Werte für _projekt_, _benutzername_ und _passwort_ durch die ersetzen, die beim Login auf https://mensamax.de verwendet werden.

### Mehrere MensaMax-Logins:

```javascript
{
  module: "MMM-MensaMax",
  position: "top_left",
  config: {
    users: [
      {
        projekt: "XY123",
        benutzername: "xxxxxxx",
        passwort: "xxxxxxx"
      },
      {
        projekt: "XY123",
        benutzername: "yyyyyyy",
        passwort: "yyyyyy"
      },
      {
        projekt: "XY123",
        benutzername: "zzzzzz",
        passwort: "zzzzz"
      }
    ]
  }
}
```

### Optionen

`daysAhead`: Wieviele Tage vorab der Speiseplan der kommenden Woche angezeigt werden soll. Default ist 2, so dass ab Samstag der Speiseplan der kommenden Woche angezeigt wird.
