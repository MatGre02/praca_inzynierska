# 🚀 Football Club API - Instrukcja Testowania

## 📌 Przygotowanie

### 1. Import kolekcji do Postmana
1. Otwórz **Postman**
2. Kliknij **Import**
3. Wskaż plik: `Football_Club_API.postman_collection.json`
4. Kolekcja zostanie zaimportowana

### 2. Ustawienie zmiennych
Kolekcja ma już zmienne przygotowane:
- `BASE_URL` = `http://localhost:4000/api` (dostosuj jeśli potrzeba)
- `PREZES_TOKEN`, `TRENER_TOKEN`, `ZAWODNIK_TOKEN` - będą wypełniane automatycznie

---

## 🔐 KROK 1: Zaloguj się

Wykonaj **w tej kolejności**:

1. **[AUTH] Login PREZES** ✅
2. **[AUTH] Login TRENER** ✅
3. **[AUTH] Login ZAWODNIK** ✅

Po każdym logowaniu token zostanie automatycznie zapisany w zmiennej środowiskowej.

> ⚠️ Jeśli logowanie nie działa, sprawdź czy:
> - Backend działa na `localhost:4000`
> - Dane logowania są prawidłowe (email/hasło w bazie)

---

## 👥 KROK 2: Testy ADMIN (zarządzanie użytkownikami)

### ✅ Testy pozytywne (powinny działać)

| Endpoint | Rola | Opis |
|----------|------|------|
| **GET /admin/uzytkownicy** | PREZES | Powinien zwrócić listę wszystkich użytkowników |
| **GET /admin/uzytkownicy** | PREZES | Filtr `role=TRENER` - tylko trenerzy |
| **GET /admin/uzytkownicy** | PREZES | Filtr `kategoria=U19` - tylko U19 |
| **GET /admin/uzytkownicy/:id** | PREZES | Powinien zwrócić dane użytkownika |
| **GET /admin/uzytkownicy/:id** | ZAWODNIK | Powinien zwrócić SWOJE dane |
| **PATCH /admin/uzytkownicy/:id/role** | PREZES | Zmiana roli (role, position, category) |

### ❌ Testy negatywne (powinny zwrócić błąd)

| Endpoint | Rola | Spodziewany rezultat |
|----------|------|------|
| **GET /admin/uzytkownicy** | ZAWODNIK | **403 Forbidden** |
| **GET /admin/uzytkownicy/:id** | ZAWODNIK (obca osoba) | **403 Forbidden** |
| **PATCH /admin/uzytkownicy/:id/role** | ZAWODNIK | **403 Forbidden** |

---

## 📊 KROK 3: Testy STATYSTYKI

### ✅ Testy pozytywne

```
[PREZES] POST /statystyki/:zawodnikId - Dodaj statystykę
[TRENER] POST /statystyki/:zawodnikId - Dodaj dla swojej kategorii
[ZAWODNIK] GET /statystyki/:zawodnikId - Pobierz swoje statystyki
[PREZES] GET /statystyki/ - Lista wszystkich
```

### ❌ Testy negatywne

```
[ZAWODNIK] POST /statystyki/:zawodnikId - ❌ 403 Forbidden
[TRENER] POST /statystyki/:zawodnikId (innego trenera) - ❌ 403 Forbidden
```

---

## 📅 KROK 4: Testy WYDARZENIA

### ✅ Testy pozytywne

```
[PREZES] POST /wydarzenia - Utwórz wydarzenie
[ZAWODNIK] GET /evenimente - Pobierz listę (bez listy uczestników!)
[PREZES] GET /wydarzenia?type=MECZ_LIGOWY - Filtruj po typie
[ZAWODNIK] POST /:id/udzial - RSVP (TAK/NIE) - TYLKO NA TRENINGACH
[PREZES] PATCH /події/:id - Zmień dane
[PREZES] DELETE /събития/:id - Usuń
```

### ❌ Testy negatywne

```
[ZAWODNIK] DELETE /събития/:id - ❌ 403 Forbidden
[ZAWODNIK] POST /:id/udzial (na MECZ_LIGOWY) - ❌ 400 Bad Request
```

---

## 👥 KROK 5: Testy SQUAD (Kadra meczowa)

### ✅ Testy pozytywne

```
[PREZES] POST /squads - Utwórz kadrę (max 18 zawodników)
[ZAWODNIK] GET /squads/:eventId - Pobranie składu
[PREZES] PATCH /squads/:eventId - Aktualizacja
[PREZES] DELETE /squads/:eventId - Usunięcie
```

### ❌ Testy negatywne

```
[ZAWODNIK] PATCH /squads/:eventId - ❌ 403 Forbidden
[PREZES] POST /squads (19+ zawodników) - ❌ 400 Bad Request
```

---

## ✉️ KROK 6: Testy MAIL

### ✅ Testy pozytywne

```
[ZAWODNIK] POST /mail/send - Do trenera swojej kategorii ✅
[ZAWODNIK] POST /mail/send - Do prezesa ✅
[TRENER] POST /mail/send - Do innego trenera ✅
[TRENER] POST /mail/send - Do zawodnika swojej kategorii ✅
[PREZES] POST /mail/send-category - Broadcast do całej kategorii ✅
```

### ❌ Testy negatywne

```
[ZAWODNIK] POST /mail/send - Do innego zawodnika ❌ 403 Forbidden
[ZAWODNIK] POST /mail/send-category - ❌ 403 Forbidden
[ZAWODNIK] POST /mail/send - Do trenera innej kategorii ❌ 403 Forbidden
```

---

## 📈 KROK 7: Testy REPORTS

### ✅ Testy pozytywne

```
[PREZES] GET /reports/players?format=json - Raport JSON
[PREZES] GET /reports/players?format=csv - Raport CSV
[PREZES] GET /reports/category/U19?format=json - Kategoria
[PREZES] GET /reports/position/FWD?format=csv - Pozycja
```

### ❌ Testy negatywne

```
[ZAWODNIK] GET /reports/players - ❌ 403 Forbidden
[TRENER] GET /reports/category - ❌ 403 Forbidden (tylko PREZES)
```

---

## 🔒 KROK 8: Testy BEZPIECZEŃSTWA

```
GET /api/status - ✅ OK (bez uwierzytelnienia)
GET /admin/uzytkownicy (bez tokenu) - ❌ 401 Unauthorized
GET /admin/uzytkownicy (zły token) - ❌ 401 Unauthorized
5x POST /auth/logowanie w 15 minut - ❌ 429 Too Many Requests (rate limit)
```

---

## 📋 Checklist testowania

### Przed testami
- [ ] Backend uruchomiony na `localhost:4000`
- [ ] MongoDB połączona i ma dane testowe
- [ ] Postman zainstalowany
- [ ] Kolekcja zaimportowana

### ADMIN
- [ ] ✅ PREZES widzi wszystkich
- [ ] ✅ PREZES filtruje po role/kategoria/pozycja
- [ ] ✅ TRENER widzi tylko swoją kategorię
- [ ] ✅ ZAWODNIK widzi tylko siebie
- [ ] ❌ ZAWODNIK nie może modyfikować
- [ ] ✅ contractStart/End NIE widoczne dla ZAWODNIKA

### STATYSTYKI
- [ ] ✅ PREZES dodaje dla każdego
- [ ] ✅ TRENER dodaje dla swojej kategorii
- [ ] ❌ ZAWODNIK nie może dodawać
- [ ] ✅ Validacja kategorii TRENERA

### WYDARZENIA
- [ ] ✅ Filtracja po typie/miesiącu/roku
- [ ] ✅ ZAWODNIK nie widzi listy uczestników
- [ ] ✅ RSVP tylko na TRENING
- [ ] ❌ ZAWODNIK nie może usuwać

### SQUAD
- [ ] ✅ Max 18 zawodników
- [ ] ✅ PREZES/TRENER mogą tworzyć
- [ ] ❌ ZAWODNIK nie może modyfikować

### MAIL
- [ ] ✅ ZAWODNIK → TRENER (jego kategoria)
- [ ] ✅ ZAWODNIK → PREZES
- [ ] ❌ ZAWODNIK → ZAWODNIK (zakazane!)
- [ ] ✅ PREZES → all
- [ ] ✅ Broadcast po kategorii

### REPORTS
- [ ] ✅ JSON format
- [ ] ✅ CSV format
- [ ] ✅ Filtracja po kategorii/pozycji
- [ ] ❌ ZAWODNIK nie ma dostępu

---

## 🆘 Troubleshooting

### Problem: "Invalid token"
**Rozwiązanie:** Zaloguj się ponownie, nowy token będzie automatycznie zapisany

### Problem: "Rate limited"
**Rozwiązanie:** Czekaj 15 minut albo zmień IP/VPN

### Problem: "Category not found"
**Rozwiązanie:** Sprawdź czy zawodnik ma ustawioną kategorię (U9-U19, SENIOR)

### Problem: "Nie mogę wysłać maila"
**Rozwiązanie:** Sprawdź czy SMTP (Nodemailer) jest skonfigurowany w `.env`

---

## 💾 Export wyników

Aby zaexportować wyniki testów:
1. Kliknij na kolekcję → **Run** (w Postman)
2. Postman uruchomi automatycznie wszystkie requesty
3. Będziesz widzieć które przeszły ✅ a które upadły ❌

---

**🎉 Powodzenia w testowaniu! Jeśli coś nie działa, sprawdź logi backendu (`console.log`).**
