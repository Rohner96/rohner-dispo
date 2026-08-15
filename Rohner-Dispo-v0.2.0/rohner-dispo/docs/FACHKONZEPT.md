# Fachkonzept – Stand 0.1

## Ziel

Rohner Dispo verbindet Disposition, Sekretariat und Chauffeure in einem System. Der Auftrag wird einmal erfasst und bis zur Verrechnung weitergeführt.

## Benutzerrollen

- **Disposition:** Aufträge, Kalender, Kunden, Projekte, Chauffeure, LKW und Anhänger.
- **Chauffeur:** zugeteilte Aufträge, Navigation, Status, Fuhrrapporte, Fotos und Belege.
- **Sekretariat:** Kontrolle, unverrechnete Leistungen, Gruppierung und Rechnungsvorbereitung.

## Transportarten

Kipper, Silowagen, Fahrmischer, Tieflader, Langware, Kran und kombinierte Aufträge.

## Kernlogik

- LKW und Anhänger besitzen getrennte interne Nummern.
- Ein Auftrag kann Chauffeur, LKW und Anhänger unabhängig zugeteilt werden.
- Ein Projekt kann mehrere Aufträge und Fuhrrapporte enthalten.
- Ein Fuhrrapport gehört im Normalfall zu einem Kunden und Projekt.
- Rechnungen können Leistungen nach Monat, Projekt, mehreren Projekten oder Fahrzeug gruppieren.
- Verrechnung ist pauschal, pro Tonne, m³, Fuhre, Stunde, Kilometer oder kombiniert möglich.
- Verrechnete Leistungen werden gesperrt, damit keine Doppelverrechnung entsteht.

## Erste Entwicklungsetappe

1. Rollen und Stammdaten
2. Auftragserfassung
3. Dispositionskalender
4. Chauffeurstatus
5. Fuhrrapport mit Foto
6. Kontrolle und Verrechnungspool

## Noch offen

- vollständige Fahrzeug- und Anhängerliste
- genaue Chauffeurliste und Berechtigungen
- Pflichtfelder je Transportart
- Serverstandort und Backup-Konzept
- Rechnungsnummern, QR-Rechnung und Export für die Treuhand
- Google-Kalender-Import
