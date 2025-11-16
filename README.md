# 🏆 Football Club Management System
**Aplikacja do zarządzania klubem piłkarskim** | React + Node.js + MongoDB + TypeScript + Docker

Nowoczesna aplikacja webowa wspierająca pełny cykl zarządzania klubem piłkarskim od obsługi zawodników, poprzez statystyki, aż po organizację treningów i meczów.

---

## 📋 Wymagania

- **Docker** (v20.10+)
- **Docker Compose** (v2.0+)
- Alternatywnie: **Node.js 18+** + **MongoDB** (do lokalnego developmentu)

---

## 🚀 Szybki Start

### Opcja 1: Docker Compose (Rekomendowane)

#### 1. Przygotowanie zmiennych środowiskowych

```bash
cp .env.example .env
```

Edytuj `.env` i uzupełnij dane (zwłaszcza SMTP):

```env
JWT_SECRET=twoj_tajny_klucz_tutaj_123456789
MONGO_URI=mongodb://root:rootpassword@mongodb:27017/football?authSource=admin
SMTP_HOST=poczta.onet.pl
SMTP_PORT=587
SMTP_USER=twoj_email@op.pl
SMTP_PASS=twoje_haslo_do_poczty
VITE_API_BASE_URL=/api
```

#### 2. Uruchomienie aplikacji

```bash
docker-compose up -d
```

#### 3. Sprawdzenie statusu

```bash
docker-compose ps
```

Powinieneś zobaczyć:
- **football-backend** - Node.js API (port 4000) ✅ Healthy
- **football-frontend** - React/Nginx (port 3000) ✅ Running

#### 4. Dostęp do aplikacji

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **API Status**: http://localhost:4000/api/status

### Opcja 2: Lokalny Development

```bash
# Backend
cd backend
npm install
npm run dev          # Startuje na porcie 4000

# Frontend (w innym terminalu)
cd frontend
npm install
npm run dev          # Startuje na porcie 3000
```

---

## 📦 Docker Compose - Komendy

```bash
# Uruchomić kontenery
docker-compose up -d

# Zatrzymać kontenery
docker-compose down

# Wyświetlić logi
docker-compose logs -f

# Logi z konkretnego serwisu
docker-compose logs -f backend
docker-compose logs -f frontend

# Przebudować obrazy
docker-compose build --no-cache

# Zrestartować
docker-compose restart

# Usunąć wszystko (w tym bazy danych!)
docker-compose down -v
```

---

## 🏗️ Architektura

```
┌─────────────────────────────────────────────────────────────┐
│                    NGINX (Frontend)                         │
│                      :3000 ↔ :80                            │
│           React + Static files + Reverse Proxy              │
└────────┬───────────────────────────────────────────────────┘
         │
         │ /api/ requests
         ↓
┌─────────────────────────────────────────────────────────────┐
│                  Node.js Express (Backend)                  │
│                      :4000 ↔ :4000                          │
│  Routes, Auth, CORS, Rate Limiting, Error Handling         │
│              Cron Jobs (Email Reminders)                    │
└────────┬───────────────────────────────────────────────────┘
         │
         │ MongoDB Driver
         ↓
┌─────────────────────────────────────────────────────────────┐
│                   MongoDB Atlas/Local                       │
│           User, Squad, Stats, Events Collections           │
└─────────────────────────────────────────────────────────────┘

Sieć: football-network (bridge driver)
```

---

## 📁 Struktura Projektu

### Backend (`backend/`)

```
backend/
├── src/
│   ├── app.ts                   # Express aplikacja
│   ├── server.ts                # Punkt wejścia
│   ├── cron/
│   │   └── reminder.ts          # Email reminder (co godzinę)
│   ├── db/
│   │   └── connect.ts           # MongoDB connection
│   ├── middleware/
│   │   ├── auth.middleware.ts   # JWT verification
│   │   └── rola.middleware.ts   # Role-based access control
│   ├── models/
│   │   ├── User.ts              # Użytkownik/Zawodnik/Trener/Prezes
│   │   ├── Wydarzenie.ts        # Events (TRENING, MECZ, etc.)
│   │   ├── Statystyka.ts        # Player stats per season
│   │   └── Squad.ts             # Kadra meczowa
│   ├── routes/
│   │   ├── auth.routes.ts       # Logowanie, rejestracja
│   │   ├── admin.routes.ts      # Zarządzanie użytkownikami
│   │   ├── wydarzenia.routes.ts # Kalendarz zdarzeń + RSVP
│   │   ├── statystyki.routes.ts # Statystyki zawodników
│   │   ├── squads.routes.ts     # Kadry meczowe
│   │   ├── mail.routes.ts       # Email
│   │   └── reports.routes.ts    # Raporty PDF
│   ├── schemas/
│   │   └── auth.ts              # Zod validation schemas
│   └── utils/
│       ├── jwt.ts               # JWT generation
│       ├── mailer.ts            # SMTP email
│       └── password.ts          # Hash & verify
├── Dockerfile
├── package.json
└── tsconfig.json
```

### Frontend (`frontend/`)

```
frontend/
├── src/
│   ├── pages/
│   │   ├── LoginPage.tsx        # Logowanie
│   │   ├── HomePage.tsx         # Panel startowy
│   │   ├── EventsPage.tsx       # Kalendarz z React Big Calendar
│   │   ├── EventsPage.css       # Styling (blue theme)
│   │   ├── SquadPage.tsx        # Kadry meczowe
│   │   ├── StatsPage.tsx        # Statystyki (filter po sezonie)
│   │   ├── PlayersPage.tsx      # Lista zawodników
│   │   ├── AdminPage.tsx        # Panel admina
│   │   ├── ReportsPage.tsx      # Raporty PDF
│   │   ├── MailPage.tsx         # Wysyłanie maili
│   │   ├── AddMemberPage.tsx    # Dodawanie zawodnika
│   │   ├── AddStatsPage.tsx     # Dodawanie statystyk
│   │   ├── ContactPage.tsx      # Kontakt
│   │   ├── ChangePasswordPage.tsx
│   │   └── ResetPasswordPage.tsx
│   ├── components/
│   │   ├── Layout.tsx           # Layout z navbarem
│   │   └── ProtectedRoute.tsx   # Route protection
│   ├── context/
│   │   └── AuthContext.tsx      # User auth state
│   ├── services/
│   │   └── api.ts               # Axios config + API calls
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── Dockerfile
├── nginx.conf
├── package.json
└── vite.config.ts
```

---

## 🔑 Role i Uprawnienia

| Rola | Uprawnienia |
|------|-------------|
| **PREZES** | Pełny dostęp - zarządzanie użytkownikami, rolami, wszystkimi danymi |
| **TRENER** | Zarządzanie zawodnikami w swojej kategorii, dodawanie statystyk, tworzenie zdarzeń dla swoich zawodników |
| **ZAWODNIK** | Przeglądanie statystyk, odpowiadanie na zaproszenia do treningów, przeglądanie kalendarza |

---

## 🎨 Funkcjonalności

### Kalendarz Zdarzeń
- **React Big Calendar** z polskiej lokalizacją (moment.js)
- Role-based filtering (ZAWODNIK widzi tylko swoje kategorie)
- Obsługa RSVP (TAK/NIE/NIEOKREŚLONY)
- Typy zdarzeń: TRENING, MECZ_LIGOWY, MECZ_PUCHAROWY, SPARING, ZBIORKA

### Email Reminders
- **Cron job** sprawdzający co godzinę
- Automatyczne powiadomienia 48h przed treningiem
- Odbiorcy: zawodnicy (TAK), trener kategorii, prezes
- Deduplicacja emaili

### Statystyki
- Filtrowanie po **sezonie** dla każdego zawodnika
- Unique index `{zawodnikId + sezon}` w DB
- Dla ZAWODNIKA: widok tylko własnych stat z filtrem
- Dla PREZES/TRENER: widok wszystkich

### Bezpieczeństwo
- **JWT authentication** (token w localStorage)
- **Role-based middleware** na każdym endpoincie
- **TypeScript** dla type safety
- **Zod validation** dla request body

---

## 🛠️ Technologie

### Backend
- **Node.js 18** + **Express**
- **TypeScript**
- **MongoDB** + Mongoose
- **JWT** do autentykacji
- **node-cron** do automatycznych zadań
- **Nodemailer** do wysyłania emaili
- **Zod** do walidacji

### Frontend
- **React 18**
- **TypeScript**
- **Material-UI (MUI)** 5.14
- **react-big-calendar** + moment.js
- **Vite** build tool
- **Axios** HTTP client

---

## 🔐 Autentykacja

1. **Logowanie**: `POST /auth/logowanie` → zwraca JWT token
2. **Token storage**: localStorage pod kluczem `token`
3. **Request headers**: Każde żądanie zawiera `Authorization: Bearer <token>`
4. **Weryfikacja**: Middleware `authMiddleware` sprawdza token na każdym endpoincie
5. **Auto-login**: Przy załadowaniu strony, `GET /auth/me` weryfikuje token

---

## 🏥 Health Checks

```bash
# Backend
curl http://localhost:4000/api/status

# Frontend
curl http://localhost:3000

# MongoDB (w kontenerze)
docker-compose exec backend npm run test:db
```

---

## 📡 API Endpoints

### Auth
- `POST /api/auth/rejestracja` - Rejestracja nowego użytkownika
- `POST /api/auth/logowanie` - Logowanie
- `GET /api/auth/me` - Dane zalogowanego użytkownika

### Admin
- `GET /api/admin/uzytkownicy` - Lista użytkowników
- `POST /api/admin/uzytkownicy` - Tworzenie użytkownika
- `GET /api/admin/uzytkownicy/:id` - Szczegóły użytkownika
- `PATCH /api/admin/uzytkownicy/:id` - Edycja użytkownika
- `PATCH /api/admin/uzytkownicy/:id/role` - Zmiana roli
- `DELETE /api/admin/uzytkownicy/:id` - Usunięcie użytkownika

### Wydarzenia
- `GET /api/wydarzenia` - Lista zdarzeń (filtrowane po roli)
- `POST /api/wydarzenia` - Tworzenie zdarzenia (PREZES/TRENER)
- `GET /api/wydarzenia/:id` - Szczegóły zdarzenia
- `POST /api/wydarzenia/:id/udzial` - RSVP na trening (ZAWODNIK)
- `PATCH /api/wydarzenia/:id` - Edycja zdarzenia
- `DELETE /api/wydarzenia/:id` - Usunięcie zdarzenia

### Statystyki
- `GET /api/statystyki/filters/available` - Dostępne filtry (kategorie, pozycje, sezony)
- `GET /api/statystyki` - Lista statystyk
- `POST /api/statystyki/:zawodnikId` - Dodawanie/edycja statystyk
- `GET /api/statystyki/:zawodnikId` - Statystyki zawodnika

### Kadry
- `GET /api/squads` - Lista kadr
- `POST /api/squads` - Tworzenie kadry
- `PATCH /api/squads/:id` - Edycja kadry
- `DELETE /api/squads/:id` - Usunięcie kadry

### Maile
- `POST /api/mail/send` - Wysłanie maila do wybranych użytkowników
- `GET /api/mail/recipients` - Lista możliwych odbiorców

---

## 🐛 Troubleshooting

### Port 3000/4000 już w użyciu

Zmień port w `docker-compose.yml`:
```yaml
services:
  backend:
    ports:
      - "4001:4000"  # użyj 4001
  frontend:
    ports:
      - "3001:3000"  # użyj 3001
```

### Frontend nie widzi backendu

Upewnij się, że:
1. Backend jest uruchomiony: `docker-compose ps`
2. Zmienna `VITE_API_BASE_URL=/api` w `.env`
3. `nginx.conf` ma proxy_pass do `http://backend:4000`

### MongoDB connection error

```bash
# Sprawdź logi MongoDB
docker-compose logs mongodb

# Zrestartuj
docker-compose restart mongodb

# Lub czyszczenie pełne
docker-compose down -v
docker-compose up -d
```

### Błąd TypeScript podczas build'u

```bash
# W kontenerze frontend
docker-compose exec frontend npm run build

# Lokalnie
cd frontend
npm run build
```

### Czyszczenie wszyst danych

```bash
# Usuń kontenery, wolumeny, sieci
docker-compose down -v

# Uruchom od nowa
docker-compose up -d
```

---

## 📚 Zmienne Środowiskowe

```env
# Backend
PORT=4000
MONGO_URI=mongodb://root:rootpassword@mongodb:27017/football?authSource=admin
JWT_SECRET=super_tajny_klucz_123456789
SMTP_HOST=poczta.onet.pl
SMTP_PORT=587
SMTP_USER=twoj_email@op.pl
SMTP_PASS=twoje_haslo

# Frontend
VITE_API_BASE_URL=/api
```

---

## 📊 Bazy Danych

### Collections
- **users** - Użytkownicy (Prezes, Trener, Zawodnik)
- **wydarzenia** - Zdarzenia (Treningi, Mecze)
- **statystyka** - Statystyki zawodników (unique: zawodnikId + sezon)
- **squads** - Kadry meczowe

---

## 🔄 Pipeline Wdrażania

1. **Lokalne zmiany** → git push
2. **Docker build** → `docker-compose build --no-cache`
3. **Restart** → `docker-compose down && docker-compose up -d`
4. **Health check** → `docker-compose ps`

---

## 📝 Uwagi Developmentu

- **Console logs usunięte** z production build'u
- **TypeScript strict mode** włączony
- **CORS** skonfigurowany dla frontend URL
- **Rate limiting** na endpunktach login/rejestracja

---

## 👨‍💼 Autor

**Mateusz Greczyn**

Prace inżynierskie: *"Projekt i implementacja aplikacji do zarządzania klubem piłkarskim"*

---

## 📄 Licencja

MIT
