# Zentrale Datenbank einrichten

Die App ist für Supabase (PostgreSQL, Auth und Row Level Security) vorbereitet. Ohne Umgebungsvariablen läuft sie weiterhin im bisherigen Demomodus. Mit einer konfigurierten Verbindung werden Stammdaten, Aufträge, Abwesenheiten und Reparaturfälle zentral geladen und gespeichert.

Änderungen werden über die Realtime-Funktion automatisch an gleichzeitig angemeldete Geräte übertragen.

## 1. Supabase-Projekt erstellen

1. Unter `https://database.new` ein neues Projekt erstellen.
2. Im SQL Editor den Inhalt von `supabase/migrations/202608130001_central_database.sql` ausführen.
3. Unter Authentication einen Benutzer mit der E-Mail `admin@login.rohner-app.ch` und einem sicheren Passwort erstellen.

## 2. Firma und Administrator einmalig anlegen

Die UUID des eben erstellten Auth-Benutzers kopieren und im folgenden SQL einsetzen:

```sql
with new_org as (
  insert into public.organizations (name)
  values ('Rohner AG Transporte')
  returning id
)
insert into public.portal_users (id, organization_id, auth_user_id, username, display_name, role, active)
select 'u-admin', id, 'AUTH-BENUTZER-UUID'::uuid, 'admin', 'Administrator', 'admin', true
from new_org;
```

## 3. App verbinden

`.env.example` nach `.env` kopieren. Die öffentlichen Projektwerte der Rohner-Datenbank sind im Projektstand bereits eingetragen:

```env
EXPO_PUBLIC_SUPABASE_URL=https://fukxlbqahzfccmrtjugx.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Danach die App neu starten. Die Anmeldung erfolgt weiterhin mit dem Benutzernamen `admin`; intern verwendet die App dafür `admin@login.rohner-app.ch`.

Der GitHub-Pages-Workflow enthält dieselben veröffentlichbaren Projektwerte, damit die Webversion nach dem nächsten Push automatisch mit der zentralen Datenbank gebaut wird.

## Sicherheit und Benutzer

- In der App wird ausschliesslich der veröffentlichbare Schlüssel verwendet. Der geheime Service-Role-Schlüssel darf nie in `.env`, App-Code oder GitHub stehen.
- Daten sind per Row Level Security auf die eigene Firma begrenzt.
- Nur Administratoren dürfen Stammdaten, Abwesenheiten und die Verrechnung ändern.
- Mitarbeiter dürfen operative Auftrags- und Reparaturdaten aktualisieren.
- Neue Mitarbeiter werden als Portalprofile gespeichert. Bevor sie sich erstmals anmelden können, muss zusätzlich ein Auth-Benutzer mit `BENUTZERNAME@login.rohner-app.ch` angelegt und dessen UUID beim entsprechenden Eintrag in `portal_users.auth_user_id` hinterlegt werden. Die automatische Einladung neuer Mitarbeiter ist für eine nächste Ausbaustufe vorgesehen.
