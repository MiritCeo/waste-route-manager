# 🚀 Quick Start - Waste Route Manager

## Instalacja (5 minut)

```bash
# 1. Zainstaluj zależności
npm install

# 2. Uruchom development server
npm run dev

# 3. Otwórz w przeglądarce
# http://localhost:5173
```

## Logowanie

### 👷 Konto Kierowcy
```
Employee ID: 001
PIN: 1234
```
- Dostęp do tras
- Zbieranie odpadów
- Podsumowanie dnia

### 👨‍💼 Konto Administratora
```
Employee ID: 002
PIN: 1234
```
- Panel administracyjny
- Zarządzanie trasami
- Zarządzanie pracownikami
- Statystyki i raporty

## Podstawowe Funkcje

### Dla Kierowcy:
1. **Wybór trasy** → Lista dostępnych tras
2. **Lista adresów** → Adresy do odbioru
3. **Zbieranie** → Liczniki pojemników
4. **Podsumowanie** → Statystyki dnia

### Dla Admina:
1. **Dashboard** → Przegląd systemu
2. **Trasy** → Zarządzanie trasami
3. **Pracownicy** → Lista i edycja
4. **Statystyki** → Raporty (w przygotowaniu)

## Struktura Projektu

```
📁 src/
├── 🔌 api/          - API client i serwisy
├── 🎨 components/   - Komponenty React
├── 🔐 contexts/     - State management
├── 📄 pages/        - Strony aplikacji
│   ├── driver/     - Widoki kierowcy
│   ├── admin/      - Panel admina
│   └── shared/     - Wspólne strony
├── 🛣️ routes/       - Konfiguracja routingu
└── 📝 types/        - TypeScript types
```

## Najczęstsze Zadania

### Dodanie Nowej Trasy (Admin)
1. Zaloguj jako admin (002/1234)
2. Panel → Zarządzanie trasami
3. Kliknij "Nowa trasa"
4. (Funkcjonalność w przygotowaniu)

### Zmiana Mock Data

```typescript
// src/data/mockData.ts
export const mockRoutes: Route[] = [
  // Dodaj lub edytuj trasy tutaj
];
```

### Przełączenie na Prawdziwe API

```typescript
// W każdym serwisie (np. src/api/services/auth.service.ts)
private useMockData = false; // Zmień z true na false

// Ustaw API URL w .env
VITE_API_URL=https://your-api.com/api
```

## Dostępne Komendy

```bash
# Development
npm run dev              # Uruchom dev server

# Build
npm run build           # Production build
npm run build:dev       # Development build
npm run preview         # Preview production build

# Code Quality
npm run lint            # Sprawdź kod
```

## Routing

### Driver Routes
- `/driver/routes` - Lista tras
- `/driver/route/:id` - Szczegóły trasy
- `/driver/collect/:routeId/:addressId` - Zbieranie
- `/driver/summary` - Podsumowanie

### Admin Routes
- `/admin/dashboard` - Panel główny
- `/admin/routes` - Zarządzanie trasami
- `/admin/employees` - Pracownicy
- `/admin/addresses` - Adresy
- `/admin/statistics` - Statystyki
- `/admin/settings` - Ustawienia

### Auth Routes
- `/login` - Logowanie
- `/unauthorized` - Brak dostępu

## Troubleshooting

### Problem: Nie mogę się zalogować
**Rozwiązanie:** Użyj PIN minimum 4 cyfry (np. 1234)

### Problem: Strona się nie ładuje
**Rozwiązanie:** 
```bash
# Wyczyść cache i reinstaluj
rm -rf node_modules
npm install
npm run dev
```

### Problem: TypeScript errors
**Rozwiązanie:** 
```bash
# Restart TypeScript server w VS Code
Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### Problem: Hot reload nie działa
**Rozwiązanie:** 
- Zapisz plik ponownie (Ctrl+S)
- Lub odśwież przeglądarkę (Ctrl+R)

## Następne Kroki

1. 📖 Przeczytaj `DEVELOPMENT_GUIDE.md` - Pełny przewodnik
2. 🏗️ Zobacz `ARCHITECTURE.md` - Architektura systemu
3. 📝 Sprawdź `REFACTORING_SUMMARY.md` - Co się zmieniło
4. 💻 Przejrzyj kod w `src/pages/` - Przykłady

## Potrzebujesz Pomocy?

- 📚 Dokumentacja w plikach `*.md`
- 💡 Przykłady w `src/pages/`
- 🔍 TypeScript hints w IDE
- 🛠️ React DevTools do debugowania

---

**Gotowy na kodowanie? Let's go! 🚀**

```bash
npm run dev
```
