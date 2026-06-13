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
| UI | Tailwind CSS 4, shadcn/ui, design system ze stitch mockups |
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
| `SUPABASE_SERVICE_ROLE_KEY` | Tylko lokalnie — do skryptu seed (nie commituj!) |

### 3. Baza danych

W **Supabase SQL Editor** uruchom migrację:

```
supabase/migrations/20250613000000_initial_schema.sql
```

Migracja tworzy tabele, RLS, seed produktów i strukturę `households` pod parę.

### 4. (Opcjonalnie) Konto testowe

```bash
node scripts/seed-test-account.mjs
```

Domyślne dane: `test@example.com` / `***` (profile: Ania + Tomek).

### 5. Uruchomienie

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
scripts/              # Seed konta testowego
UI+logos/             # Mockupy i materiały designu (stitch)
public/brand/         # Placeholder logo (podmień własnym)
```

## Architektura pod rozwój

- **`src/lib/products/provider.ts`** — abstrakcja pod Open Food Facts / skaner
- **`ai_meal_analyses`** — tabela pod analizę AI (tekst/zdjęcie)
- **RLS** na wszystkich tabelach użytkownika
- **`households`** — wspólna przestrzeń pary, gotowa pod zaproszenia i SaaS

## Design

UI oparte o mockupy w `UI+logos/stitch_pairplate_shared_nutrition_ui/`:

- Primary: `#47645B`
- Mint container: `#D1F2E6`
- Violet secondary: `#625B73`
- Tło: `#F8FAFB`

## Bezpieczeństwo

- Nigdy nie commituj `.env.local` ani `SUPABASE_SERVICE_ROLE_KEY`
- Klucz `service_role` używaj wyłącznie w skryptach lokalnych / CI backend

## Licencja

Prywatne repozytorium — użytek własny / portfolio.
