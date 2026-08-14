# GastroBeleg — Prototyp

Klickbarer Prototyp des MVP-Kerns plus drei Phase-2-Bildschirmen. Next.js 16 (App Router),
TypeScript strict, Tailwind 4, shadcn/ui (Preset `nova`, Radix). Kein Backend — alle Daten kommen
aus `src/lib/mock`, geformt wie die spätere API-Antwort.

## Starten

```bash
pnpm install
pnpm dev      # http://localhost:3000
```

Der Zustand liegt im `localStorage` (`gastrobeleg-prototype-v1`) und überlebt einen Reload.
„Prototyp zurücksetzen" unten in der Seitenleiste stellt den Ausgangszustand wieder her — vor jeder
Nutzervorführung einmal drücken.

## Die Runde, die getestet werden soll

1. **Beleg erfassen** (`/scan`) — Kamera, Datei oder einer von drei Beispielbelegen.
   Die XRechnung durchläuft sichtbar weniger Schritte als das Foto, weil kein OCR nötig ist.
2. **Prüfen** (`/belege/[id]`) — Positionen korrigieren, Produkt zuordnen, Pfand kennzeichnen,
   Steuersatz ändern. Buchen ist gesperrt, solange eine Position keinem Katalogartikel hängt oder
   der Beleg doppelt vorliegt.
3. **Abgleich** (`/abgleich`) — Lieferschein gegen Rechnung, Zeile für Zeile, mit Reklamation.
4. **DATEV-Export** (`/export`) — erzeugt eine echte EXTF-700-Datei zum Herunterladen.

## Alle Seiten

**Erfassen** `/scan` · `/belege` · `/belege/[id]` · `/whatsapp`
**Kontrolle** `/uebersicht` · `/abgleich` · `/abgleich/[id]` · `/gutschriften` · `/ersparnis`
**Auswertung** `/analyse` · `/wareneinsatz` · `/marge` · `/wochenbericht`
**Kosten** `/faelligkeiten` · `/vertraege` · `/energie` · `/plattformen`
**Stammdaten** `/katalog` · `/speisekarte` · `/lieferanten` · `/kasse` · `/dossier` · `/qr-karte`
**Buchhaltung** `/export` · `/betriebspruefung` · `/kanzlei`
**Einstellungen** `/einstellungen/{tarif,betrieb,nutzer,buchhaltung,rechtliches}`
**Ohne Anmeldung** `/login` · `/registrieren` · `/passwort` · `/onboarding`

## Aufbau

| Pfad | Inhalt |
|---|---|
| `src/lib/domain.ts` | Typen und Rechenregeln: Summen, USt je Satz, Pfandtrennung, Prüfschwellen |
| `src/lib/format.ts` | de-DE-Formatierung und das Einlesen von Kommazahlen |
| `src/lib/selectors.ts` | Abgleich, Preistrends, DATEV-Zeilen und der EXTF-Schreiber |
| `src/lib/mock/` | Stammdaten, Belege, Preishistorie, Beispielbelege für den Scan |
| `src/lib/store.tsx` | Externer Store über `useSyncExternalStore`, persistiert nach `localStorage` |
| `src/components/ui/` | shadcn-Komponenten, uns gehörender Quelltext |

**Geld ist überall Integer-Cent.** Gerundet wird erst beim Formatieren. Wer hier eine Fließkommazahl
einführt, baut einen Fehler ein, den erst der Steuerberater findet.

## Visuelles Feedback im Betrieb

[agentation](https://www.agentation.com/) läuft nur im Dev-Modus (`src/components/dev-annotations.tsx`).
Element anklicken, Notiz schreiben, Ausgabe an den Agenten geben. Für die automatische Variante den
Desktop-Client starten und `NEXT_PUBLIC_AGENTATION_ENDPOINT=http://localhost:4747` setzen.

## Was bewusst fehlt

- Kein Login gegen ein echtes Backend — `/login` verlinkt weiter.
- SKR04 ist auswählbar, die Kontenzuordnung zeigt SKR03. Die SKR04-Konten werden mit der Kanzlei
  abgestimmt, bevor sie im Code stehen.
- Keine Tests. Sobald der Prototyp zum Produkt härtet, kommt Playwright auf genau eine Strecke:
  hochladen → prüfen → korrigieren → buchen → exportieren.
