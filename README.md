# praca_inzynierska
Aplikacja do zarządzania klubem piłkarskim (React, Node, MongoDB, TypeScript, Docker)

Projekt wykorzystuje nowoczesne technologie webowe: React, Node.js, TypeScript, MongoDB, MUI i Docker.  

## Wymagania

- **Docker** (v20.10+)
- **Docker Compose** (v2.0+)

## Szybki Start z Docker Compose

### 1. Przygotowanie zmiennych środowiskowych

Skopiuj plik `.env.example` na `.env` i uzupełnij zmienne:

```bash
cp .env.example .env
```

Następnie edytuj `.env` i wstaw swoje dane (zwłaszcza SMTP):

```env
JWT_SECRET=twoj_tajny_klucz_tutaj_123456789
SMTP_HOST=poczta.onet.pl
SMTP_PORT=587
SMTP_USER=twoj_email@op.pl
SMTP_PASS=twoje_haslo_do_poczty
```

### 2. Uruchomienie aplikacji

```bash
docker-compose up -d
```

### 3. Sprawdzenie statusu

```bash
docker-compose ps
```

Powinieneś zobaczyć:
- **football-db** - MongoDB (port 27017)
- **football-backend** - Node.js API (port 4000)
- **football-frontend** - React/Nginx (port 3000)

### 4. Dostęp do aplikacji

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000/api/status
- **MongoDB**: mongodb://localhost:27017

## Komendy Docker Compose

```bash
# Uruchomić kontenery
docker-compose up -d

# Zatrzymać kontenery
docker-compose down

# Sprawdzić logi
docker-compose logs -f

# Logi z konkretnego serwisu
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb

# Zrestartować
docker-compose restart

# Usunąć wszystko (w tym dane!)
docker-compose down -v
```

## Architektura

```
┌─────────────────────────────────────────────────────────────┐
│                    NGINX (Frontend)                         │
│                      :3000 ↔ :80                            │
│                   React + Static files                      │
└────────┬───────────────────────────────────────────────────┘
         │
         │ /api/ requests
         ↓
┌─────────────────────────────────────────────────────────────┐
│                  Node.js Express (Backend)                  │
│                      :4000 ↔ :4000                          │
│  Routes, Auth, CORS, Rate Limiting, Error Handling         │
└────────┬───────────────────────────────────────────────────┘
         │
         │ MongoDB Driver
         ↓
┌─────────────────────────────────────────────────────────────┐
│                   MongoDB Database                          │
│                      :27017 ↔ :27017                        │
│           User, Squad, Stats, Events Collections           │
└─────────────────────────────────────────────────────────────┘

Sieć: football-network (bridge driver)
```

## Struktura projektu

- `backend/` — kod serwera Node.js + TypeScript
  - `src/app.ts` — Express app z routami
  - `src/server.ts` — punkt startowy serwera
  - `src/models/` — MongoDB schematy (User, Squad, Statystyka, Wydarzenie)
  - `src/routes/` — endpointy API
  - `src/middleware/` — auth, CORS, rate limiting
  - `Dockerfile` — konteneryzacja backendu
  
- `frontend/` — aplikacja React + TypeScript
  - `src/pages/` — strony aplikacji
  - `src/components/` — komponenty React
  - `src/services/api.ts` — axios config i API calls
  - `Dockerfile` — multi-stage build dla produkcji
  - `nginx.conf` — konfiguracja serwera web

- `docker-compose.yml` — orkiestracja kontenerów
- `.env.example` — zmienne środowiskowe (kopiuj na `.env`)

## Health Checks

Każdy serwis ma włączony health check:

```bash
# Backend health check
curl http://localhost:4000/api/status

# Frontend health check
curl http://localhost:3000

# MongoDB health check (wewnątrz sieci)
docker-compose exec mongodb mongosh -u root -p rootpassword --eval "db.adminCommand('ping')"
```

## Troubleshooting

### Port 3000/4000 już w użyciu

Zmień port w `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # użyj 3001 zamiast 3000
```

### Błędy połączenia MongoDB

```bash
# Zrestartuj MongoDB
docker-compose restart mongodb

# Sprawdź logi
docker-compose logs mongodb
```

### Frontend nie widzi backendu

Upewnij się, że:
1. Backend jest uruchomiony: `docker-compose ps`
2. Zmienna `VITE_API_BASE_URL=/api` jest ustawiona
3. Nginx.conf ma proxy do `http://backend:4000`

### Czyszczenie danych

```bash
# Usuń wszystkie kontenery i wolumeny
docker-compose down -v

# Uruchom ponownie od czystej instalacji
docker-compose up -d
```

## Autor

Mateusz Greczyn
