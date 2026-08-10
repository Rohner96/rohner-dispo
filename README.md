# Rohner Kommunikationsapp

Lauffähiger Projektstand für das Dispositions- und Transportmanagementsystem der Rohner AG Transporte.

## Enthalten

- Rollenansichten für Disposition, Chauffeur und Sekretariat
- Dispositionskalender mit Demoaufträgen
- vollständig bedienbare Auftragserfassung
- Zuteilung von Kunde/Projekt, Transportart, Chauffeur, LKW und Anhänger
- flexible Auswahl der Verrechnungsart
- neue Aufträge erscheinen sofort im Kalender
- Stammdatenübersicht für Chauffeure, LKW und Anhänger
- Transportarten Kipper, Kran und Tieflader als erste Beispiele
- getrennte Zuteilung von Chauffeur, LKW und Anhänger
- Auftragsstatus vom Eingang bis zur Verrechnung
- einfacher Verrechnungspool und Preisberechnung
- Fachkonzept und Zielarchitektur
- automatisierte Tests der Verrechnungslogik

Dies ist Version **0.5.0**. Die App verwendet bewusst noch Demodaten und speichert Änderungen bis zum Neustart der App im Arbeitsspeicher. Die angezeigten Testzugänge sind noch keine sicheren produktiven Benutzerkonten.

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

`https://rohner-transport.github.io/rohner-dispo/`

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

1. dauerhafte lokale Speicherung
2. Auftrag öffnen und bearbeiten
3. Tages-/Wochenkalender nach Chauffeur und Fahrzeug
4. digitaler Fuhrrapport mit Fotoaufnahme
5. Server, Datenbank und Benutzeranmeldung

Weitere fachliche Details stehen in `docs/FACHKONZEPT.md` und `docs/ARCHITEKTUR.md`.

Die einmalige Übertragung in das Firmen-Repository ist in `UPLOAD_ZU_GITHUB.md` beschrieben.
