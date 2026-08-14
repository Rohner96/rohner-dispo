import { RepairCategory, RepairPriority, RepairStatus, WorkflowStep } from '../domain/models';

export type AppLanguage = 'de' | 'en' | 'sq' | 'ro';

const de = {
  home: 'Startseite', orders: 'Meine Aufträge', reportRepair: 'Reparatur erfassen', settings: 'Einstellungen', logout: 'Abmelden', employee: 'Mitarbeiter',
  homeEyebrow: 'ÜBERSICHT', homeTitle: 'Willkommen', homePlaceholder: 'Dies ist die neue App der Firma Rohner AG.',
  settingsEyebrow: 'PORTAL', settingsTitle: 'Einstellungen', appearance: 'Darstellung', light: 'Hell', dark: 'Dunkel', language: 'Sprache', languageHint: 'Die Sprache gilt für den Mitarbeitermodus auf diesem Gerät.',
  currentOrders: 'AKTUELLE AUFTRÄGE', myTours: 'Meine Touren', nextDestination: 'NÄCHSTES ZIEL', mapsPickup: 'Google Maps zum Ladeort', mapsDelivery: 'Google Maps zum Abladeort',
  runningTime: 'Laufende Zeiterfassung', drivePickup: 'Fahrt Ladeort', waitPickup: 'Wartezeit Ladeort', loading: 'Beladung', driveDelivery: 'Fahrt Abladeort', waitDelivery: 'Wartezeit Abladeort', unloading: 'Entladung',
  stepBack: 'Einen Schritt zurück', confirmBack: 'Letzten Schritt wirklich korrigieren?', backHint: 'Die Zeit läuft danach wieder in der vorherigen Phase weiter.', cancel: 'Abbrechen', yesBack: 'Ja, Schritt zurück', downloadPdf: 'Lieferschein als PDF herunterladen', noOrders: 'Keine Aufträge zugeteilt.',
  pickupMaps: 'Ladeort in Google Maps', deliveryMaps: 'Abladeort in Google Maps', driverOpen: 'Chauffeur offen', truckOpen: 'LKW offen',
  vehicleWorkshop: 'FAHRZEUG & WERKSTATT', repairTitle: 'Schaden oder Defekt melden', affectedTruck: 'Betroffener LKW', reportType: 'Art der Meldung', urgency: 'Dringlichkeit', shortTitle: 'Kurzbezeichnung', whatHappened: 'Was ist passiert oder defekt?', titlePlaceholder: 'z. B. Scheibenwischer defekt', descriptionPlaceholder: 'Schaden möglichst genau beschreiben', replacePhoto: 'Foto ersetzen', takePhoto: '📷 Foto aufnehmen', submitRepair: 'Reparaturfall melden', myOpenReports: 'Meine offenen Meldungen', noOpenRepairs: 'Du hast keine offenen Reparaturfälle.',
  cameraPermission: 'Bitte erlaube den Kamerazugriff, damit du ein Foto aufnehmen kannst.', repairRequired: 'Bitte Kurzbezeichnung, Beschreibung und ein Foto erfassen.', workshopAppointment: 'Werkstatttermin', timeOpen: 'Zeit offen', workshopOpen: 'Werkstatt noch offen',
  accidentDamage: 'Unfall / äusserer Schaden', technicalDefect: 'Technischer Defekt', wear: 'Verschleiss / altersbedingt', normal: 'Normal', urgent: 'Dringend', stopVehicle: 'Fahrzeug nicht weiterfahren',
  reported: 'Neu gemeldet', appointmentOrganized: 'Werkstatttermin organisiert', inRepair: 'In Reparatur', repairDone: 'Reparatur erledigt',
  assigned: 'Auftrag zugeteilt', accepted: 'Auftrag angenommen', arrivedPickup: 'Am Ladeort angekommen', loadingStarted: 'Beladung begonnen', loadingFinished: 'Beladung beendet', arrivedDelivery: 'Am Abladeort angekommen', unloadingStarted: 'Entladung begonnen', unloadingFinished: 'Entladung beendet', completed: 'Auftrag abgeschlossen',
  acceptOrder: 'Auftrag annehmen', arrivePickup: 'Ankunft Ladeort', startLoading: 'Beginn Beladung', finishLoading: 'Beladung beenden', arriveDelivery: 'Ankunft Abladeort', startUnloading: 'Beginn Entladung', finishUnloading: 'Entladung beenden', finishOrder: 'Auftrag abschliessen', finished: 'Abgeschlossen',
} as const;

export type TranslationKey = keyof typeof de;

const en: Record<TranslationKey, string> = {
  home: 'Home', orders: 'My orders', reportRepair: 'Report repair', settings: 'Settings', logout: 'Log out', employee: 'Employee',
  homeEyebrow: 'OVERVIEW', homeTitle: 'Welcome', homePlaceholder: 'This is the new app of Rohner AG.',
  settingsEyebrow: 'PORTAL', settingsTitle: 'Settings', appearance: 'Appearance', light: 'Light', dark: 'Dark', language: 'Language', languageHint: 'The language applies to employee mode on this device.',
  currentOrders: 'CURRENT ORDERS', myTours: 'My tours', nextDestination: 'NEXT DESTINATION', mapsPickup: 'Google Maps to pickup', mapsDelivery: 'Google Maps to delivery',
  runningTime: 'Running time tracking', drivePickup: 'Drive to pickup', waitPickup: 'Waiting at pickup', loading: 'Loading', driveDelivery: 'Drive to delivery', waitDelivery: 'Waiting at delivery', unloading: 'Unloading',
  stepBack: 'Go back one step', confirmBack: 'Really correct the last step?', backHint: 'Time tracking will resume in the previous phase.', cancel: 'Cancel', yesBack: 'Yes, go back', downloadPdf: 'Download delivery note as PDF', noOrders: 'No orders assigned.',
  pickupMaps: 'Pickup in Google Maps', deliveryMaps: 'Delivery in Google Maps', driverOpen: 'Driver not assigned', truckOpen: 'Truck not assigned',
  vehicleWorkshop: 'VEHICLE & WORKSHOP', repairTitle: 'Report damage or defect', affectedTruck: 'Affected truck', reportType: 'Type of report', urgency: 'Urgency', shortTitle: 'Short title', whatHappened: 'What happened or is defective?', titlePlaceholder: 'e.g. windscreen wiper defective', descriptionPlaceholder: 'Describe the damage as precisely as possible', replacePhoto: 'Replace photo', takePhoto: '📷 Take photo', submitRepair: 'Submit repair case', myOpenReports: 'My open reports', noOpenRepairs: 'You have no open repair cases.',
  cameraPermission: 'Please allow camera access so you can take a photo.', repairRequired: 'Please enter a short title, description and photo.', workshopAppointment: 'Workshop appointment', timeOpen: 'Time pending', workshopOpen: 'Workshop pending',
  accidentDamage: 'Accident / external damage', technicalDefect: 'Technical defect', wear: 'Wear / age-related', normal: 'Normal', urgent: 'Urgent', stopVehicle: 'Do not continue driving',
  reported: 'Newly reported', appointmentOrganized: 'Workshop appointment arranged', inRepair: 'Under repair', repairDone: 'Repair completed',
  assigned: 'Order assigned', accepted: 'Order accepted', arrivedPickup: 'Arrived at pickup', loadingStarted: 'Loading started', loadingFinished: 'Loading finished', arrivedDelivery: 'Arrived at delivery', unloadingStarted: 'Unloading started', unloadingFinished: 'Unloading finished', completed: 'Order completed',
  acceptOrder: 'Accept order', arrivePickup: 'Arrive at pickup', startLoading: 'Start loading', finishLoading: 'Finish loading', arriveDelivery: 'Arrive at delivery', startUnloading: 'Start unloading', finishUnloading: 'Finish unloading', finishOrder: 'Complete order', finished: 'Completed',
};

const sq: Record<TranslationKey, string> = {
  home: 'Kryefaqja', orders: 'Porositë e mia', reportRepair: 'Raporto riparim', settings: 'Cilësimet', logout: 'Dil', employee: 'Punonjës',
  homeEyebrow: 'PËRMBLEDHJE', homeTitle: 'Mirë se vini', homePlaceholder: 'Ky është aplikacioni i ri i kompanisë Rohner AG.',
  settingsEyebrow: 'PORTALI', settingsTitle: 'Cilësimet', appearance: 'Pamja', light: 'E çelët', dark: 'E errët', language: 'Gjuha', languageHint: 'Gjuha vlen për modalitetin e punonjësit në këtë pajisje.',
  currentOrders: 'POROSITË AKTUALE', myTours: 'Udhëtimet e mia', nextDestination: 'DESTINACIONI I ARDHSHËM', mapsPickup: 'Google Maps te vendi i ngarkimit', mapsDelivery: 'Google Maps te vendi i shkarkimit',
  runningTime: 'Regjistrimi aktual i kohës', drivePickup: 'Udhëtimi për ngarkim', waitPickup: 'Pritja te ngarkimi', loading: 'Ngarkimi', driveDelivery: 'Udhëtimi për shkarkim', waitDelivery: 'Pritja te shkarkimi', unloading: 'Shkarkimi',
  stepBack: 'Një hap prapa', confirmBack: 'Ta korrigjoj vërtet hapin e fundit?', backHint: 'Koha do të vazhdojë përsëri në fazën e mëparshme.', cancel: 'Anulo', yesBack: 'Po, një hap prapa', downloadPdf: 'Shkarko fletëdorëzimin si PDF', noOrders: 'Nuk ka porosi të caktuara.',
  pickupMaps: 'Ngarkimi në Google Maps', deliveryMaps: 'Shkarkimi në Google Maps', driverOpen: 'Shoferi i pacaktuar', truckOpen: 'Kamioni i pacaktuar',
  vehicleWorkshop: 'MJETI & SERVISI', repairTitle: 'Raporto dëmtim ose defekt', affectedTruck: 'Kamioni i prekur', reportType: 'Lloji i raportimit', urgency: 'Urgjenca', shortTitle: 'Përshkrim i shkurtër', whatHappened: 'Çfarë ka ndodhur ose çfarë është prishur?', titlePlaceholder: 'p.sh. fshirësi i xhamit është prishur', descriptionPlaceholder: 'Përshkruaj dëmin sa më saktë', replacePhoto: 'Zëvendëso foton', takePhoto: '📷 Bëj foto', submitRepair: 'Dërgo rastin e riparimit', myOpenReports: 'Raportimet e mia të hapura', noOpenRepairs: 'Nuk ke raste të hapura riparimi.',
  cameraPermission: 'Lejo qasjen në kamerë që të bësh një foto.', repairRequired: 'Plotëso përshkrimin e shkurtër, përshkrimin dhe një foto.', workshopAppointment: 'Termini në servis', timeOpen: 'Ora e pacaktuar', workshopOpen: 'Servisi i pacaktuar',
  accidentDamage: 'Aksident / dëmtim i jashtëm', technicalDefect: 'Defekt teknik', wear: 'Konsumim / vjetërsi', normal: 'Normal', urgent: 'Urgjent', stopVehicle: 'Mos vazhdo vozitjen',
  reported: 'Sapo raportuar', appointmentOrganized: 'Termini në servis u organizua', inRepair: 'Në riparim', repairDone: 'Riparimi përfundoi',
  assigned: 'Porosia u caktua', accepted: 'Porosia u pranua', arrivedPickup: 'Mbërritur te ngarkimi', loadingStarted: 'Ngarkimi filloi', loadingFinished: 'Ngarkimi përfundoi', arrivedDelivery: 'Mbërritur te shkarkimi', unloadingStarted: 'Shkarkimi filloi', unloadingFinished: 'Shkarkimi përfundoi', completed: 'Porosia përfundoi',
  acceptOrder: 'Prano porosinë', arrivePickup: 'Mbërritja te ngarkimi', startLoading: 'Fillo ngarkimin', finishLoading: 'Përfundo ngarkimin', arriveDelivery: 'Mbërritja te shkarkimi', startUnloading: 'Fillo shkarkimin', finishUnloading: 'Përfundo shkarkimin', finishOrder: 'Përfundo porosinë', finished: 'Përfunduar',
};

const ro: Record<TranslationKey, string> = {
  home: 'Pagina principală', orders: 'Comenzile mele', reportRepair: 'Raportează reparație', settings: 'Setări', logout: 'Deconectare', employee: 'Angajat',
  homeEyebrow: 'PREZENTARE GENERALĂ', homeTitle: 'Bun venit', homePlaceholder: 'Aceasta este noua aplicație a companiei Rohner AG.',
  settingsEyebrow: 'PORTAL', settingsTitle: 'Setări', appearance: 'Aspect', light: 'Luminos', dark: 'Întunecat', language: 'Limbă', languageHint: 'Limba se aplică modului angajat pe acest dispozitiv.',
  currentOrders: 'COMENZI CURENTE', myTours: 'Cursele mele', nextDestination: 'URMĂTOAREA DESTINAȚIE', mapsPickup: 'Google Maps către locul de încărcare', mapsDelivery: 'Google Maps către locul de descărcare',
  runningTime: 'Înregistrarea curentă a timpului', drivePickup: 'Drum spre încărcare', waitPickup: 'Așteptare la încărcare', loading: 'Încărcare', driveDelivery: 'Drum spre descărcare', waitDelivery: 'Așteptare la descărcare', unloading: 'Descărcare',
  stepBack: 'Un pas înapoi', confirmBack: 'Corectezi ultimul pas?', backHint: 'Cronometrul va continua din nou în faza anterioară.', cancel: 'Anulare', yesBack: 'Da, un pas înapoi', downloadPdf: 'Descarcă avizul ca PDF', noOrders: 'Nu sunt comenzi alocate.',
  pickupMaps: 'Încărcare în Google Maps', deliveryMaps: 'Descărcare în Google Maps', driverOpen: 'Șofer nealocat', truckOpen: 'Camion nealocat',
  vehicleWorkshop: 'VEHICUL & ATELIER', repairTitle: 'Raportează daună sau defect', affectedTruck: 'Camion afectat', reportType: 'Tipul sesizării', urgency: 'Urgență', shortTitle: 'Denumire scurtă', whatHappened: 'Ce s-a întâmplat sau ce este defect?', titlePlaceholder: 'de ex. ștergător defect', descriptionPlaceholder: 'Descrie dauna cât mai exact', replacePhoto: 'Înlocuiește fotografia', takePhoto: '📷 Fă fotografie', submitRepair: 'Trimite cazul de reparație', myOpenReports: 'Sesizările mele deschise', noOpenRepairs: 'Nu ai cazuri de reparație deschise.',
  cameraPermission: 'Permite accesul la cameră pentru a face o fotografie.', repairRequired: 'Completează denumirea scurtă, descrierea și o fotografie.', workshopAppointment: 'Programare la atelier', timeOpen: 'Ora neprecizată', workshopOpen: 'Atelier neprecizat',
  accidentDamage: 'Accident / daună exterioară', technicalDefect: 'Defect tehnic', wear: 'Uzură / vechime', normal: 'Normal', urgent: 'Urgent', stopVehicle: 'Nu continua deplasarea',
  reported: 'Raportat recent', appointmentOrganized: 'Programare la atelier organizată', inRepair: 'În reparație', repairDone: 'Reparație finalizată',
  assigned: 'Comandă alocată', accepted: 'Comandă acceptată', arrivedPickup: 'Sosit la încărcare', loadingStarted: 'Încărcare începută', loadingFinished: 'Încărcare terminată', arrivedDelivery: 'Sosit la descărcare', unloadingStarted: 'Descărcare începută', unloadingFinished: 'Descărcare terminată', completed: 'Comandă finalizată',
  acceptOrder: 'Acceptă comanda', arrivePickup: 'Sosire la încărcare', startLoading: 'Începe încărcarea', finishLoading: 'Termină încărcarea', arriveDelivery: 'Sosire la descărcare', startUnloading: 'Începe descărcarea', finishUnloading: 'Termină descărcarea', finishOrder: 'Finalizează comanda', finished: 'Finalizat',
};

const translations: Record<AppLanguage, Record<TranslationKey, string>> = { de, en, sq, ro };

export const languageOptions: { value: AppLanguage; label: string }[] = [
  { value: 'de', label: 'Deutsch' },
  { value: 'en', label: 'English' },
  { value: 'sq', label: 'Shqip' },
  { value: 'ro', label: 'Română' },
];

export const languageLocales: Record<AppLanguage, string> = { de: 'de-CH', en: 'en-GB', sq: 'sq-AL', ro: 'ro-RO' };

export function isAppLanguage(value: string | null): value is AppLanguage {
  return value === 'de' || value === 'en' || value === 'sq' || value === 'ro';
}

export function translate(language: AppLanguage, key: TranslationKey): string {
  return translations[language][key];
}

const workflowKeys: Record<WorkflowStep, TranslationKey> = {
  zugeteilt: 'assigned', angenommen: 'accepted', ladeort_angekommen: 'arrivedPickup', beladung_gestartet: 'loadingStarted', beladung_beendet: 'loadingFinished', entladeort_angekommen: 'arrivedDelivery', entladung_gestartet: 'unloadingStarted', entladung_beendet: 'unloadingFinished', abgeschlossen: 'completed',
};

const actionKeys: Record<WorkflowStep, TranslationKey> = {
  zugeteilt: 'acceptOrder', angenommen: 'arrivePickup', ladeort_angekommen: 'startLoading', beladung_gestartet: 'finishLoading', beladung_beendet: 'arriveDelivery', entladeort_angekommen: 'startUnloading', entladung_gestartet: 'finishUnloading', entladung_beendet: 'finishOrder', abgeschlossen: 'finished',
};

const repairCategoryKeys: Record<RepairCategory, TranslationKey> = { unfallschaden: 'accidentDamage', technischer_defekt: 'technicalDefect', verschleiss: 'wear' };
const repairPriorityKeys: Record<RepairPriority, TranslationKey> = { normal: 'normal', dringend: 'urgent', fahrzeug_stilllegen: 'stopVehicle' };
const repairStatusKeys: Record<RepairStatus, TranslationKey> = { gemeldet: 'reported', termin_organisiert: 'appointmentOrganized', in_reparatur: 'inRepair', erledigt: 'repairDone' };

export const translatedWorkflowLabel = (language: AppLanguage, step: WorkflowStep) => translate(language, workflowKeys[step]);
export const translatedWorkflowAction = (language: AppLanguage, step: WorkflowStep) => translate(language, actionKeys[step]);
export const translatedRepairCategory = (language: AppLanguage, category: RepairCategory) => translate(language, repairCategoryKeys[category]);
export const translatedRepairPriority = (language: AppLanguage, priority: RepairPriority) => translate(language, repairPriorityKeys[priority]);
export const translatedRepairStatus = (language: AppLanguage, status: RepairStatus) => translate(language, repairStatusKeys[status]);
