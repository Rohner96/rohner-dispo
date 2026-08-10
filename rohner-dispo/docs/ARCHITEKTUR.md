# Technische Architektur – Stand 0.1

## Aktueller Stand

Der erste Stand ist eine React-Native-/Expo-Anwendung in TypeScript. Dieselbe Codebasis kann auf iOS, Android und im Browser ausgeführt werden. Die Demo arbeitet momentan mit lokalen Beispieldaten.

## Zielarchitektur

- mobile Anwendung und Büro-Weboberfläche aus gemeinsam nutzbaren Komponenten
- unabhängige API auf einem Firmenserver
- PostgreSQL-Datenbank
- verschlüsselter Dokumentenspeicher für Rapporte und Fotos
- rollenbasierte Anmeldung
- Offline-Speicher mit späterer Synchronisation
- Push-Mitteilungen über die Betriebssystemdienste von Apple und Google

## Eigentum und Portabilität

- Quellcode im Repository `rohner-transport/rohner-dispo`
- keine Pflicht zur Nutzung eines kostenpflichtigen Expo-Cloud-Dienstes
- Datenexport in offenen Formaten
- dokumentierte Installation und Backups
