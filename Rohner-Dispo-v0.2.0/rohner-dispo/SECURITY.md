# Sicherheitshinweis – Version 0.1.0

Diese Version ist eine Entwicklungsgrundlage mit lokalen Demodaten und darf noch nicht mit echten Kunden-, Personal- oder Rechnungsdaten produktiv eingesetzt werden.

Die aktuelle Expo-/React-Native-Werkzeugkette meldet über `npm audit` bekannte Denial-of-Service-Schwachstellen im Build-Werkzeug `image-size`, das indirekt von Metro verwendet wird. Der von npm vorgeschlagene automatische Fix würde inkompatible ältere Hauptversionen von Expo beziehungsweise React Native installieren und wurde deshalb nicht angewendet. Die Anwendung, der TypeScript-Check, die Fachtests und der Web-Build funktionieren mit der aktuellen Version.

Vor dem produktiven Betrieb sind mindestens erforderlich:

- Update auf eine Expo-/Metro-Version mit behobener Abhängigkeit, sobald verfügbar
- Serveranmeldung und rollenbasierte Berechtigungen
- verschlüsselte Übertragung und Speicherung
- Backup- und Wiederherstellungstest
- Protokollierung sicherheitsrelevanter Änderungen
- unabhängige Sicherheitsprüfung
