# 🏆 Football Club Frontend

Nowoczesna aplikacja webowa do zarządzania klubem piłkarskim, napisana w React + TypeScript + MUI.

## 📋 Wymagania

- Node.js 18+
- npm lub yarn

## 🚀 Szybki Start

### Instalacja zależności
```bash
cd frontend
npm install
```

### Development
```bash
npm run dev
```
Aplikacja będzie dostępna na `http://localhost:3000`

### Build produkcyjny
```bash
npm run build
npm run preview
```

## 🏗️ Struktura projektu

```
frontend/
├── src/
│   ├── pages/           # Strony aplikacji
│   │   ├── LoginPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── EventsPage.tsx
│   │   ├── SquadPage.tsx
│   │   ├── StatsPage.tsx
│   │   ├── AdminPage.tsx
│   │   ├── ReportsPage.tsx
│   │   └── ContactPage.tsx
│   ├── components/      # Komponenty
│   │   ├── Layout.tsx
│   │   └── ProtectedRoute.tsx
│   ├── context/        # React Context
│   │   └── AuthContext.tsx
│   ├── services/       # API Services
│   │   └── api.ts
│   ├── types/          # TypeScript types
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tsconfig.json
├── vite.config.ts
└── Dockerfile
```

## 🔑 Role i permisje

### PREZES (Administrator)
- Widok wszystkich użytkowników
- Tworzenie/edycja/usuwanie kont
- Zarządzanie rolami i kategoriami
- Tworzenie i zarządzanie wydarzeniami
- Wysyłanie maili do użytkowników
- Generowanie raportów

### TRENER
- Widok zawodników w swojej kategorii
- Dodawanie statystyk
- Tworzenie i zarządzanie wydarzeniami dla swojej kategorii
- Zarządzanie kadrą meczową
- Wysyłanie maili do zawodników

### ZAWODNIK
- Widok swoich statystyk
- Przeglądanie kalendarza
- Odpowiadanie na zaproszenia do treningów
- Przeglądanie kadry meczowej
- Wysyłanie maili trenerom i prezesowi

## 🎨 Technologie

- **React 18** - UI library
- **TypeScript** - Type safety
- **Material-UI (MUI)** - Component library
- **React Router** - Routing
- **Axios** - HTTP client
- **Vite** - Build tool
- **react-big-calendar** - Calendar component
- **Formik + Yup** - Forms validation

## 🔐 Autentykacja

Logowanie opiera się na JWT tokenach:
1. Token przechowywany w `localStorage`
2. Automatycznie dodawany do każdego żądania API
3. Weryfikacja przy każdej ładowaniu aplikacji (route `GET /auth/me`)

## 🐳 Docker

### Build obrazu
```bash
docker build -t football-frontend .
```

### Uruchomienie kontenera
```bash
docker run -p 3000:3000 football-frontend
```

## 📡 Zmienne środowiska

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

## 📚 Dostępne API endpoints

- `POST /auth/logowanie` - Logowanie
- `POST /auth/rejestracja` - Rejestracja
- `GET /auth/me` - Dane zalogowanego użytkownika
- `GET /admin/uzytkownicy` - Lista użytkowników
- `POST /admin/uzytkownicy` - Tworzenie użytkownika
- `GET /admin/uzytkownicy/:id` - Szczegóły użytkownika
- `PATCH /admin/uzytkownicy/:id/role` - Zmiana roli
- `GET /wydarzenia` - Lista wydarzeń
- `POST /wydarzenia` - Tworzenie wydarzenia
- `GET /statystyki` - Lista statystyk
- `POST /statystyki/:zawodnikId` - Dodawanie statystyk
- `POST /mail/send` - Wysyłanie maili
- `GET /squads/:eventId` - Kadra na event
- `GET /reports/players` - Raport zawodników

## 🛠️ Development

### Uruchamianie z hot reload
```bash
npm run dev
```

### Budowanie
```bash
npm run build
```

### Podgląd produkcyjny
```bash
npm run preview
```

## 🤝 Kontakt

Stworzone przez **Mateusza Greczyn**

---

Część pracy inżynierskiej: "Projekt i implementacja aplikacji do zarządzania klubem piłkarskim"
