# Rohner Dispo

Erster lauffähiger Projektstand für das Dispositions- und Transportmanagementsystem der Rohner AG Transporte.

## Enthalten

- Rollenansichten für Disposition, Chauffeur und Sekretariat
- Dispositionskalender mit Demoaufträgen
- Transportarten Kipper, Kran und Tieflader als erste Beispiele
- getrennte Zuteilung von Chauffeur, LKW und Anhänger
- Auftragsstatus vom Eingang bis zur Verrechnung
- einfacher Verrechnungspool und Preisberechnung
- Fachkonzept und Zielarchitektur
- automatisierte Tests der Verrechnungslogik

Dies ist Version **0.1.0**. Die App verwendet noch Demodaten und ist nicht für den produktiven Einsatz bestimmt.

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

1. echte Stammdatenmasken
2. Auftrag erstellen und bearbeiten
3. Tages-/Wochenkalender nach Chauffeur und Fahrzeug
4. lokaler Fuhrrapport mit Fotoaufnahme
5. Server, Datenbank und Benutzeranmeldung

Weitere fachliche Details stehen in `docs/FACHKONZEPT.md` und `docs/ARCHITEKTUR.md`.

Die einmalige Übertragung in das Firmen-Repository ist in `UPLOAD_ZU_GITHUB.md` beschrieben.
