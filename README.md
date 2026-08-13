# Rohner Kommunikationsapp

Lauffähiger Projektstand für das Dispositions- und Transportmanagementsystem der Rohner AG Transporte.

## Enthalten

- Rollenansichten für Disposition, Chauffeur und Sekretariat
- Dispositionskalender mit Demoaufträgen
- vollständig bedienbare Auftragserfassung
- separate Google-Maps-Links für Ladeort und Abladeort
- Zuteilung von Kunde/Projekt, Transportart, Chauffeur, LKW und Anhänger
- flexible Auswahl der Verrechnungsart
- neue Aufträge erscheinen sofort im Kalender
- Stammdatenverwaltung für Kunden, Mitarbeitende, LKW, Anhänger und Benutzer
- Transportarten Kipper, Kran und Tieflader als erste Beispiele
- getrennte Zuteilung von Chauffeur, LKW und Anhänger
- Auftragsstatus vom Eingang bis zur Verrechnung
- geführter Chauffeur-Ablauf mit Navigation zum nächsten Ziel
- getrennte Zeitmessung für Fahrten, Wartezeiten, Be- und Entladung
- Korrektur des letzten Schritts bei Fehlbedienung
- Lieferschein-PDF für Mitarbeiter und Administration
- einfacher Verrechnungspool und Preisberechnung
- Fachkonzept und Zielarchitektur
- automatisierte Tests der Verrechnungslogik

Dies ist Version **0.9.0**. Die App verwendet bewusst noch Demodaten und speichert Änderungen bis zum Neustart der App im Arbeitsspeicher. Die angezeigten Testzugänge sind noch keine sicheren produktiven Benutzerkonten.

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
