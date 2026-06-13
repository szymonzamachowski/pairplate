# PairPlate

**PairPlate** to mobilna aplikacja PWA do liczenia kalorii i planowania posiłków **dla dwóch osób** (para) na jednym koncie. Interfejs po polsku, logika solo vs. wspólny posiłek dzielony gramaturą.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-green)

## Funkcje

- **Dwa profile** — osobne cele kaloryczne i makro (TDEE, Mifflin–St Jeor)
- **Dzisiaj** — pierścień kcal, makro, posiłki pogrupowane (śniadanie → kolacja)
- **Dodaj posiłek** — wyszukiwarka produktów, ulubione/ostatnie, posiłki solo i **wspólne** z podziałem gramatur
- **Przepisy** — zapisane dania z makro, dodawanie całego przepisu do dziennika
- **Plan posiłków** — tygodniowy planer dla obu profili
- **Lista zakupów** — generowana z planu + ręczne pozycje
- **Profil i waga** — edycja danych, wykres wagi, przypomnienia, historia dni
- **PWA** — instalacja na telefonie, tryb jasny/ciemny

## Stack

| Warstwa | Technologia |
|--------|-------------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| UI | Tailwind CSS 4, shadcn/ui, design system PairPlate |
| Backend | Supabase (Auth, Postgres, RLS) |
| PWA | Serwist |
| Wykresy | Recharts |

## Wymagania

- Node.js 20+
- Konto [Supabase](https://supabase.com) (darmowy tier wystarczy)

## Szybki start

### 1. Instalacja

```bash
git clone https://github.com/szymonzamachowski/pairplate.git
cd pairplate
npm install
```

### 2. Zmienne środowiskowe

Skopiuj szablon i uzupełnij klucze z **Supabase → Project Settings → API**:

```bash
cp .env.example .env.local
```

| Zmienna | Opis |
|---------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL projektu Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Klucz publiczny `anon` |
| `SUPABASE_SERVICE_ROLE_KEY` | Tylko serwer — cache Open Food Facts (nie commituj!) |

### 3. Baza danych

W **Supabase SQL Editor** uruchom migracje (kolejno):

```
supabase/migrations/20250613000000_initial_schema.sql
supabase/migrations/20250613100000_product_barcode_cache.sql
supabase/migrations/20250613200000_goal_pace_and_off_security.sql
```

Migracja tworzy tabele, RLS, seed produktów i strukturę `households` pod parę.

## Baza składników i skaner

PairPlate korzysta z **hybrydowego modelu**:

| Warstwa | Źródło | Opis |
|--------|--------|------|
| Lokalna | Supabase `products` | ~25 podstawowych składników + własne produkty użytkownika |
| Zewnętrzna | [Open Food Facts](https://world.openfoodfacts.org) | 3M+ produktów z kodami EAN (PL/EU) |
| Cache | Supabase (global) | Po skanowaniu/wyborze produkt OFF trafia do bazy — szybsze kolejne wyszukiwania |

**Wyszukiwanie tekstowe** — lokalna baza + Open Food Facts (wyniki oznaczone etykietą).

**Skaner kodów** — ekran Dodaj → ikona skanera obok pola wyszukiwania:

- kamera (PWA / HTTPS na telefonie)
- ręczne wpisanie kodu EAN
- pobranie kcal i makro na 100 g, zapis w cache

Pliki: `src/lib/products/open-food-facts.ts`, `src/components/products/barcode-scanner-sheet.tsx`

### 4. Uruchomienie

```bash
npm run dev
```

Otwórz [http://localhost:3000](http://localhost:3000).

Build produkcyjny (wymaga `--webpack` przez Serwist):

```bash
npm run build
npm start
```

## Flow użytkownika

1. Rejestracja / logowanie
2. Onboarding — dwa profile z kalkulatorem TDEE
3. Wybór aktywnego profilu na urządzeniu
4. Nawigacja: **Dzisiaj · Plan · Dodaj · Przepisy · Zakupy · Profil**

## Struktura projektu

```
src/
├── app/              # Trasy Next.js (auth + (app))
├── components/       # Widoki UI (today, meals, plan, …)
├── lib/
│   ├── actions/      # Server actions (Supabase)
│   ├── nutrition/    # Kalkulator makro
│   └── design-system.ts
supabase/migrations/  # Schemat Postgres + RLS
public/brand/         # Logo i ikony aplikacji
```

## Architektura pod rozwój

- **`src/lib/products/open-food-facts.ts`** — integracja Open Food Facts (search + barcode)
- **`src/lib/products/provider.ts`** — abstrakcja pod kolejne API (płatne bazy, AI)
- **`ai_meal_analyses`** — tabela pod analizę AI (tekst/zdjęcie)
- **RLS** na wszystkich tabelach użytkownika
- **`households`** — wspólna przestrzeń pary, gotowa pod zaproszenia i SaaS

## Design

Paleta i komponenty zdefiniowane w `src/lib/design-system.ts`:

- Primary: `#47645B`
- Mint container: `#D1F2E6`
- Violet secondary: `#625B73`
- Tło: `#F8FAFB`

## Bezpieczeństwo

- Nigdy nie commituj `.env.local` ani `SUPABASE_SERVICE_ROLE_KEY`
- Klucz `service_role` używaj wyłącznie po stronie serwera (Server Actions), nigdy w kodzie klienta

## Licencja

Prywatne repozytorium — użytek własny / portfolio.
