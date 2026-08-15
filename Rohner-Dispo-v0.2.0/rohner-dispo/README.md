# Rohner Dispo

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

Dies ist Version **0.2.0**. Die App verwendet bewusst noch Demodaten und speichert Änderungen bis zum Neustart der App im Arbeitsspeicher. Sie ist noch nicht für den produktiven Einsatz bestimmt.

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
