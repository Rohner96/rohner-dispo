# Rohner Kommunikationsapp

Lauffähiger Projektstand für das Dispositions- und Transportmanagementsystem der Rohner AG Transporte.

## Enthalten

- Rollenansichten für Disposition, Chauffeur und Sekretariat
- Dispositionskalender mit Demoaufträgen
- vollständig bedienbare Auftragserfassung
- separate Google-Maps-Links für Ladeort und Abladeort
- Zuteilung von Kunde/Projekt, Chauffeur, LKW und Anhänger/Auflieger
- flexible Auswahl der Verrechnungsart
- neue Aufträge erscheinen sofort im Kalender
- Stammdatenverwaltung für Kunden, Mitarbeitende, LKW, Anhänger und Benutzer
- getrennte Zuteilung von Chauffeur, LKW und Anhänger
- Auftragsstatus vom Eingang bis zur Verrechnung
- geführter Chauffeur-Ablauf mit Navigation zum nächsten Ziel
- getrennte Zeitmessung für Fahrten, Wartezeiten, Be- und Entladung
- Korrektur des letzten Schritts bei Fehlbedienung
- Lieferschein-PDF für Mitarbeiter und Administration
- einfacher Verrechnungspool und Preisberechnung
- Fachkonzept und Zielarchitektur
- automatisierte Tests der Verrechnungslogik

Dies ist Version **1.0.0**. Die Rohner-Supabase-Datenbank ist für den lokalen Start und den GitHub-Pages-Build vorkonfiguriert. Daten werden zentral und dauerhaft gespeichert.

Neu in Version 1.0.0:

- separates Hamburger-Menü für Administratoren und Mitarbeitende
- neue Startseite mit persönlicher Begrüssung und Flottenfoto der Rohner AG
- neuer Menüpunkt Einstellungen für beide Rollen
- heller und dunkler Darstellungsmodus mit lokaler Speicherung
- Mitarbeitermodus auf Deutsch, Englisch, Albanisch und Rumänisch umschaltbar
- Übersetzungen für Mitarbeitermenü, Auftragsablauf, Zeitmessung und Reparaturmeldungen
- bestehende Rollen und Berechtigungen bleiben unverändert

Neu in Version 0.24.0:

- Mitarbeitermaske mit getrennten Feldern für Vorname, Nachname, Adresse, Postleitzahl und Wohnort
- Mitarbeiterübersicht alphabetisch nach Nachnamen sortiert
- LKW, Anhänger und Kunden natürlich aufsteigend nach ihren Nummern sortiert
- Achsausführungen einheitlich als 2-Achs, 3-Achs, 4-Achs und 5-Achs bezeichnet
- Kranangaben werden nur noch bei der Fahrzeugart Sattelschlepper angezeigt und gespeichert
- neue Fahrzeugart Wechselsystem mit fester 5-Achs-Ausführung
- beim Wechselsystem können Kipper, Silowagen und Fahrmischer einzeln oder kombiniert als Aufbauarten gewählt werden
- bestehende Mitarbeiter- und Fahrzeugdaten sowie Portalverknüpfungen bleiben kompatibel

Neu in Version 0.23.0:

- Transportart aus der Auftragserfassung entfernt
- Chauffeur, LKW und Anhänger/Auflieger zwischen Projekt und Datum verschoben
- Standardgespann des ausgewählten Chauffeurs bleibt automatisch vorgewählt und weiterhin änderbar
- neue Aufträge erhalten keine versteckte Standard-Transportart mehr
- Verrechnungsarten «Pro Kilometer» und «Kombiniert» aus der Erfassung entfernt
- Adminnavigation neu geordnet: Kalender, Auftrag erfassen, Abwesenheiten, Reparaturen, Verrechnung, Stammdaten
- bestehende ältere Aufträge mit bisherigen Transport- oder Verrechnungsarten bleiben kompatibel

Neu in Version 0.22.0:

- Verbindung mit dem produktiven Supabase-Projekt der Rohner-App
- öffentlicher Projektzugang für lokale Entwicklung vorkonfiguriert
- GitHub-Pages-Build automatisch mit der zentralen Datenbank verbunden
- Administrator `admin` als erster Portalzugang vorbereitet
- keine geheimen Datenbank- oder Service-Schlüssel im Projekt

Neu in Version 0.21.0:

- zentrale PostgreSQL-Datenbank für Stammdaten und operative Daten
- richtige, dauerhaft gespeicherte Benutzersitzungen
- gemeinsame Daten für Web-App und Mobilgeräte
- automatische Aktualisierung gleichzeitig angemeldeter Geräte
- geschützte Firmenbereiche und rollenabhängige Datenbankrechte
- zentral gespeicherte Kunden, Projekte, Mitarbeiter, LKW, Anhänger, Aufträge, Abwesenheiten und Reparaturfälle
- vollständiges Datenbankschema und Einrichtungsanleitung unter `docs/ZENTRALE-DATENBANK.md`
- Demomodus bleibt ohne Zugangsdaten weiterhin verwendbar

Neu in Version 0.20.0:

- Feld «LKW-Nummer» anstelle von «Kurzform» bei LKW
- Feld «Anhängernummer» anstelle von «Kurzform» bei Anhängern
- LKW-Nummer und Anhängernummer sind die hauptsächlichen Anzeigenamen in der gesamten App
- interne Bezeichnung erscheint in den Stammdaten als detaillierte Zusatzinformation
- Nummern als Überschrift in Listen und Detailmasken

Neu in Version 0.19.0:

- LKW-Arten Sattelschlepper, Kipper, Silowagen und Fahrmischer
- abhängige Achsauswahl je Fahrzeugart
- Kran Ja/Nein und Kranleistungen 22, 23, 30 oder 54 Metertonnen
- Anhängerarten Kippsattel, Semi-Tieflader ohne Kran und Semi-Tieflader mit Kran
- Fahrzeugart, Achsen und Kranausstattung direkt in der LKW-Übersicht
- Anhängerart direkt in der Anhängerübersicht

Neu in Version 0.18.0:

- eigene Kalenderfarbe für Ferien, Kompensation, Krank und Unfall
- Ansichtsfilter für Aufträge, Werkstatt und jede Abwesenheitsart
- Filter blenden Einträge nur im Kalender aus und verändern keine gespeicherten Daten
- Samstag und Sonntag werden im grossen Kalender dezent hinterlegt
- Wochenenden sind auch in den kleinen Datumskalendern farblich erkennbar

Neu in Version 0.17.0:

- ISO-Kalenderwoche in der Tages- und Wochenüberschrift
- eigene KW-Angabe für jede Zeile der Monatsansicht
- Kalenderwochen in den kleinen Datumskalendern für Aufträge und Abwesenheiten
- KW-Angabe auch in der Kalender-Listenansicht
- korrekte KW-Berechnung über den Jahreswechsel

Neu in Version 0.16.0:

- nach dem Speichern automatisch zurück zur Stammdatenübersicht
- bei LKW und Anhängern heisst die bisherige interne Nummer neu «Kurzform»
- Feld «Interne Bezeichnung» für die ausführliche Bezeichnung
- interne Bezeichnung ist die Hauptüberschrift in der LKW- und Anhängerliste
- Kurzform und Fahrzeugart erscheinen als Detailinformationen darunter

Neu in Version 0.15.0:

- anklickbarer Monatskalender beim Auftrag erfassen
- anklickbarer Monatskalender für Von- und Bis-Datum bei Abwesenheiten
- Monat und Jahr mit Pfeilen wechseln
- ausgewähltes Datum und heutiger Tag werden markiert
- Von-Datum passt ein davorliegendes Bis-Datum automatisch an

Neu in Version 0.14.0:

- in Kunden-, Mitarbeiter-, LKW- und Anhängerlisten nur noch die Aktion «Details»
- eigene Detailmaske für jede Stammdatenart
- Bearbeiten, Speichern sowie Aktivieren/Deaktivieren nur innerhalb der Detailmaske
- Kundenkontakte und Projekte bleiben in der Kundendetailmaske
- Portalzugang und Standardgespann bleiben in der Mitarbeiterdetailmaske

Neu in Version 0.13.0:

- Kalendereinträge für Aufträge, Abwesenheiten und Werkstatttermine anklickbar
- Detailansicht direkt im Kalender
- von einer Abwesenheit zur Abwesenheitsverwaltung wechseln
- von einem Werkstatttermin zum Reparaturfall wechseln
- Aufträge in der Tagesansicht stundenweise vor- und zurückverschieben
- Aufträge in der Wochenansicht tageweise vor- und zurückverschieben
- Datum und Zeit werden nach der Verschiebung sofort im Kalender aktualisiert

Neu in Version 0.12.0:

- reduzierte Kalenderseite ohne Kennzahlenleiste
- Überschrift nur noch «Kalender»
- Tages-, Wochen-, Monats- und Listenansicht
- Navigation zum vorherigen und nächsten Tag
- Navigation zur vorherigen und nächsten Woche
- Navigation zum vorherigen und nächsten Monat
- Aufträge, Abwesenheiten und Werkstatttermine in allen Kalenderansichten

Neu in Version 0.11.0:

- eigene Admin-Sparte «Abwesenheiten»
- Mitarbeiter über Dropdown auswählen oder durch Texteingabe filtern
- Suche nach Name und Personalnummer
- Abwesenheitsarten Ferien, Kompensation, Krank und Unfall
- Von-/Bis-Datum und optionale Bemerkung
- neue Abwesenheit erscheint sofort im Wochenkalender
- erfasste Abwesenheiten auflisten und löschen

Neu in Version 0.10.0:

- erweiterte Mitarbeitermaske mit Kontakt-, Anstellungs- und internen Angaben
- Standard-LKW und Standard-Anhänger je Mitarbeiter
- Standardgespann wird bei der Chauffeurwahl im Auftrag automatisch vorausgewählt
- Fahrzeug und Anhänger bleiben im Auftrag frei veränderbar
- Mitarbeiter und Benutzer in einer gemeinsamen Stammdatenmaske
- jeder neue Mitarbeiter erhält automatisch einen Portalzugang
- Benutzername, Berechtigung und Zugangssperre direkt beim Mitarbeiter verwalten

Neu in Version 0.9.0:

- eigene Detailmaske für jeden Kunden
- beliebig viele Ansprechpersonen mit Funktion, Telefon und E-Mail
- Projekte direkt einem Kunden zuordnen
- Projekte bearbeiten, aktivieren und deaktivieren
- Auftragserfassung zeigt nur aktive Projekte des gewählten Kunden
- Änderungen am Kundennamen werden in dessen Projekten übernommen

Neu in Version 0.8.0:

- Auftrag annehmen und anschliessend zum Ladeort navigieren
- Ankunft, Wartezeit, Beladung, Fahrt, Entladung und Abschluss protokollieren
- laufende Zeitanzeige für jede Arbeitsphase
- einen versehentlichen Statusschritt korrigieren
- Lieferschein mit Zeitübersicht als PDF herunterladen

Neu in Version 0.6.0:

- Kunden, Mitarbeitende, LKW, Anhänger und Benutzer erfassen und bearbeiten
- Stammdaten aktivieren und deaktivieren, ohne alte Auftragsbezüge zu löschen
- echte aufklappbare Auswahlfelder in der Auftragserfassung
- getrennte Auswahl von Kunde und Projekt
- nur aktive Chauffeure, LKW und Anhänger stehen zur Auswahl
- Benutzerrollen und Zuordnung zum Mitarbeiter als vorbereitete Testverwaltung

Neu in Version 0.5.0:

- Mitarbeiter melden Schäden, technische Defekte und Verschleiss je LKW
- Fotoaufnahme auf dem Handy und Bildauswahl im Browser
- persönliche Liste offener Meldungen
- Administrator sieht Melder, Fahrzeug, Dringlichkeit, Beschreibung und Foto
- Werkstatttermine erscheinen im Wochenkalender
- Statusablauf von «Neu gemeldet» bis «Reparatur erledigt»
- erledigte Fälle verschwinden aus der offenen Mitarbeiterliste

Neu in Version 0.4.0:

- kompakteres, rechtsbündiges Firmenlogo
- Wochenkalender für Aufträge und Personalabwesenheiten
- Abwesenheitsarten Ferien, Krankheit, Kompensation und Urlaub
- geführter Chauffeur-Ablauf mit Zeitprotokoll
- Google-Maps-Routenaufruf vom Auftrag
- administrative Freigabe abgeschlossener Aufträge zur Verrechnung

## Testzugänge

- Administrator: `admin` / `demo`
- Mitarbeiter René: `rene` / `demo`
- Mitarbeiter Marcel: `marcel` / `demo`

Die Administratoransicht enthält Kalender, Auftragserfassung, Stammdaten, Benutzer und Verrechnung. Mitarbeitende sehen ausschliesslich ihre eigenen zugeteilten Aufträge und können deren Status melden.

## Webversion über GitHub

Bei jeder Änderung am Hauptzweig erstellt GitHub automatisch eine neue Webversion. Einmalig muss im Repository unter **Settings → Pages** bei **Source** die Option **GitHub Actions** gewählt werden.

Danach ist die App unter folgender Adresse erreichbar:

`https://rohner96.github.io/rohner-dispo/`

## Voraussetzungen

- Node.js 22 oder neuer
- npm
- für Tests auf Mobilgeräten: Expo Go oder eine lokale native Entwicklungsumgebung

## Installation

```bash
npm install
npm run web
```

Danach zeigt das Terminal die lokale Adresse der Webversion an.

## Prüfungen

```bash
npm run typecheck
npm test
```

## Nächste Etappe

1. Auftrag öffnen, bearbeiten und duplizieren
2. Tages-/Wochenkalender nach Chauffeur und Fahrzeug
3. digitaler Fuhrrapport mit Fotoaufnahme
4. Abwesenheiten und Zeiterfassung ausbauen
5. ganz am Schluss: Server, Datenbank und sichere Benutzeranmeldung

Weitere fachliche Details stehen in `docs/FACHKONZEPT.md` und `docs/ARCHITEKTUR.md`.

Die einmalige Übertragung in das Firmen-Repository ist in `UPLOAD_ZU_GITHUB.md` beschrieben.
