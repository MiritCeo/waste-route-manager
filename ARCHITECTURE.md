# Architektura Waste Route Manager

## 🎯 Cel refaktoringu

Przekształcenie aplikacji z prostego prototypu w skalowalny system gotowy na:
- Panel administracyjny
- Integrację z backendem
- Rozbudowę o nowe funkcjonalności
- Łatwe utrzymanie i rozwój

## 📁 Nowa struktura projektu

```
src/
├── api/                        # API Layer
│   ├── client.ts              # Axios/Fetch konfiguracja
│   ├── endpoints.ts           # API endpoints
│   └── services/              # Serwisy API
│       ├── auth.service.ts
│       ├── routes.service.ts
│       ├── addresses.service.ts
│       └── admin.service.ts
│
├── components/                 # Komponenty UI (bez zmian)
│   ├── common/                # Wspólne komponenty
│   ├── driver/                # Komponenty dla kierowcy
│   ├── admin/                 # Komponenty dla admina
│   └── ui/                    # shadcn/ui komponenty
│
├── contexts/                   # React Contexts
│   ├── AuthContext.tsx        # Autentykacja i użytkownik
│   ├── RouteContext.tsx       # Zarządzanie trasami
│   └── ThemeContext.tsx       # Motyw (dark/light)
│
├── hooks/                      # Custom hooks
│   ├── useAuth.ts             # Hook do autentykacji
│   ├── useRoutes.ts           # Hook do tras
│   ├── useLocalStorage.ts     # Offline storage
│   └── usePermissions.ts      # Hook do uprawnień
│
├── pages/                      # Strony aplikacji
│   ├── driver/                # Widoki dla kierowcy
│   │   ├── RouteSelection.tsx
│   │   ├── AddressList.tsx
│   │   ├── CollectionView.tsx
│   │   └── DailySummary.tsx
│   │
│   ├── admin/                 # Panel administracyjny (NOWY)
│   │   ├── Dashboard.tsx
│   │   ├── RoutesManagement.tsx
│   │   ├── AddressesManagement.tsx
│   │   ├── EmployeesManagement.tsx
│   │   ├── Statistics.tsx
│   │   └── Settings.tsx
│   │
│   ├── shared/                # Wspólne strony
│   │   ├── LoginPage.tsx
│   │   ├── NotFound.tsx
│   │   └── Unauthorized.tsx
│   │
│   └── Index.tsx              # Główny routing
│
├── routes/                     # Konfiguracja routingu (NOWY)
│   ├── index.tsx              # Główny router
│   ├── DriverRoutes.tsx       # Trasy dla kierowcy
│   ├── AdminRoutes.tsx        # Trasy dla admina
│   └── ProtectedRoute.tsx     # HOC dla chronionych tras
│
├── store/                      # State management (opcjonalnie Zustand)
│   ├── useAuthStore.ts
│   ├── useRoutesStore.ts
│   └── useUIStore.ts
│
├── types/                      # TypeScript types
│   ├── waste.ts               # Istniejące typy
│   ├── user.ts                # Typy użytkownika (NOWY)
│   ├── api.ts                 # Typy API (NOWY)
│   └── admin.ts               # Typy dla admina (NOWY)
│
├── utils/                      # Narzędzia pomocnicze
│   ├── validation.ts          # Walidacja danych
│   ├── formatting.ts          # Formatowanie (daty, liczby)
│   ├── storage.ts             # LocalStorage helpers
│   └── permissions.ts         # Logika uprawnień
│
├── constants/                  # Stałe aplikacji (NOWY)
│   ├── roles.ts               # Role użytkowników
│   ├── routes.ts              # Ścieżki URL
│   └── config.ts              # Konfiguracja
│
└── lib/                        # Biblioteki (istniejące)
    └── utils.ts
```

## 🔄 Przepływ danych

### Przed refaktoringiem:
```
Component → Local State → Props → Child Component
```

### Po refaktoringu:
```
Component → Hook → Context/Store → API Service → Backend
                                  ↓
                              Local Storage (offline)
```

## 🔐 System autentykacji

```typescript
User Roles:
- DRIVER: Kierowca (obecna funkcjonalność)
- ADMIN: Administrator (nowy panel)
- MANAGER: Manager (przyszłość)

Permissions:
- VIEW_ROUTES
- COLLECT_WASTE
- MANAGE_ROUTES
- MANAGE_USERS
- VIEW_STATISTICS
```

## 🛣️ Routing

```
/                           → Redirect based on auth
/login                      → LoginPage
/driver/*                   → Driver routes (protected)
  /driver/routes            → RouteSelection
  /driver/route/:id         → AddressList
  /driver/collect/:addressId → CollectionView
  /driver/summary           → DailySummary
/admin/*                    → Admin routes (protected)
  /admin/dashboard          → Dashboard
  /admin/routes             → RoutesManagement
  /admin/addresses          → AddressesManagement
  /admin/employees          → EmployeesManagement
  /admin/statistics         → Statistics
  /admin/settings           → Settings
/unauthorized               → Unauthorized access
/*                          → NotFound
```

## 🔌 API Integration

### Endpoints struktura:

```typescript
/api/auth
  POST /login
  POST /logout
  GET  /me

/api/routes
  GET    /routes              # Lista tras
  GET    /routes/:id          # Szczegóły trasy
  POST   /routes              # Nowa trasa (admin)
  PUT    /routes/:id          # Edycja trasy (admin)
  DELETE /routes/:id          # Usunięcie (admin)

/api/addresses
  GET    /addresses           # Lista adresów
  PUT    /addresses/:id       # Update odbioru
  POST   /addresses           # Nowy adres (admin)

/api/admin
  GET    /statistics          # Statystyki
  GET    /employees           # Lista pracowników
  POST   /employees           # Nowy pracownik
  PUT    /employees/:id       # Edycja pracownika
```

## 📦 State Management

### Option 1: Context API (prostsze)
- AuthContext dla użytkownika
- RouteContext dla tras i adresów
- UIContext dla UI state

### Option 2: Zustand (zalecane dla większej app)
- Lżejsze niż Redux
- Łatwiejsze w użyciu
- Lepsze dla TypeScript
- Devtools support

## 🎨 Komponenty UI

### Organizacja:
```
components/
├── common/          # Wspólne (Header, Footer, etc.)
├── driver/          # Specyficzne dla kierowcy
├── admin/           # Specyficzne dla admina
│   ├── Tables/      # Tabele z danymi
│   ├── Forms/       # Formularze
│   ├── Charts/      # Wykresy
│   └── Modals/      # Modale
└── ui/              # shadcn/ui (bez zmian)
```

## 🔄 Offline Support

### Strategia:
1. LocalStorage dla cache'owania tras
2. Service Worker dla offline mode
3. Sync queue dla zapisów offline
4. Conflict resolution przy synchronizacji

## 📱 Responsive Design

- Mobile-first (obecne)
- Tablet support
- Desktop dla panelu admina

## 🧪 Testowanie

```
src/
├── __tests__/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── utils/
```

## 🚀 Deployment Strategy

1. **Development**: Mock API
2. **Staging**: Backend integration
3. **Production**: Full system

## 📝 TODO dla refaktoringu

### Faza 1: Fundamenty (priorytet: WYSOKI)
- [ ] Stworzenie struktury folderów
- [ ] API client i service layer
- [ ] AuthContext i useAuth hook
- [ ] Prawdziwy routing z React Router
- [ ] ProtectedRoute component

### Faza 2: Panel admina (priorytet: WYSOKI)
- [ ] Layout dla panelu admina
- [ ] Dashboard z statystykami
- [ ] Zarządzanie trasami (CRUD)
- [ ] Zarządzanie adresami (CRUD)
- [ ] Zarządzanie pracownikami (CRUD)

### Faza 3: Ulepszenia (priorytet: ŚREDNI)
- [ ] Offline support
- [ ] State management (Zustand)
- [ ] Better error handling
- [ ] Loading states
- [ ] Toast notifications consistency

### Faza 4: Optymalizacja (priorytet: NISKI)
- [ ] Code splitting
- [ ] Lazy loading
- [ ] Performance optimization
- [ ] PWA features
- [ ] Tests

## 🎯 Korzyści z refaktoringu

1. **Skalowalność**: Łatwo dodawać nowe funkcje
2. **Maintainability**: Czysty, zorganizowany kod
3. **Testability**: Łatwiejsze testowanie
4. **Team collaboration**: Jasna struktura
5. **Backend integration**: Gotowe pod API
6. **Admin panel**: Pełne zarządzanie systemem
