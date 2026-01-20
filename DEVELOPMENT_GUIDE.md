# Przewodnik dla Developerów - Waste Route Manager

## 🚀 Quick Start

### Instalacja

```bash
# Sklonuj repozytorium
git clone <your-repo-url>

# Przejdź do katalogu
cd waste-route-manager

# Zainstaluj zależności
npm install

# Uruchom dev server
npm run dev
```

### Logowanie (Demo)

Aplikacja działa na mock data. Użyj tych danych do logowania:

#### Konto Kierowcy
- Numer pracownika: `001`
- PIN: `1234` (lub dowolny 4+ cyfrowy)

#### Konto Administratora
- Numer pracownika: `002`  
- PIN: `1234` (lub dowolny 4+ cyfrowy)

## 📁 Struktura Projektu

### Główne Katalogi

```
src/
├── api/            - API client i serwisy
├── components/     - Komponenty React
│   ├── ui/        - Komponenty shadcn/ui
│   └── ...        - Komponenty biznesowe
├── constants/      - Stałe, konfiguracja, role
├── contexts/       - React Context providers
├── hooks/          - Custom React hooks
├── pages/          - Strony aplikacji
│   ├── admin/     - Panel administracyjny
│   ├── driver/    - Widoki kierowcy
│   └── shared/    - Wspólne strony
├── routes/         - Konfiguracja routingu
├── types/          - TypeScript types
└── utils/          - Funkcje pomocnicze
```

## 🔧 Architektura

### Flow Danych

```
Component → Hook → Context → Service → API Client → Backend (mock)
                                              ↓
                                         LocalStorage
```

### Autentykacja

```typescript
// Logowanie
const { login } = useAuth();
await login({ employeeId: '001', pin: '1234' });

// Sprawdzenie uprawnień
const { can, isAdmin } = usePermissions();
if (can('MANAGE_USERS')) {
  // Pokaż opcje admina
}

// Wylogowanie
const { logout } = useAuth();
await logout();
```

### Zarządzanie Trasami

```typescript
// Pobranie tras
const { routes, fetchRoutes } = useRoutes();

// Aktualizacja odbioru
const { updateAddressCollection } = useRoutes();
await updateAddressCollection(routeId, addressId, wasteData);
```

## 🎨 Dodawanie Nowych Funkcji

### 1. Nowy Endpoint API

```typescript
// src/api/services/your.service.ts
class YourService {
  private useMockData = true; // Zmień na false gdy masz backend

  async getData(): Promise<YourType> {
    if (this.useMockData) {
      return this.mockGetData();
    }
    return apiClient.get<YourType>('/your-endpoint');
  }

  private async mockGetData(): Promise<YourType> {
    await new Promise(r => setTimeout(r, 300)); // Symuluj delay
    return mockData;
  }
}

export const yourService = new YourService();
```

### 2. Nowy Typ TypeScript

```typescript
// src/types/your.ts
export interface YourData {
  id: string;
  name: string;
  // ... inne pola
}

export interface YourRequest {
  // ... pola requestu
}
```

### 3. Nowy Context (opcjonalnie)

```typescript
// src/contexts/YourContext.tsx
interface YourContextType {
  data: YourData[];
  isLoading: boolean;
  fetchData: () => Promise<void>;
}

const YourContext = createContext<YourContextType | undefined>(undefined);

export const YourProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<YourData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const result = await yourService.getData();
      setData(result);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <YourContext.Provider value={{ data, isLoading, fetchData }}>
      {children}
    </YourContext.Provider>
  );
};

export const useYour = () => {
  const context = useContext(YourContext);
  if (!context) throw new Error('useYour must be used within YourProvider');
  return context;
};
```

### 4. Nowa Strona

```typescript
// src/pages/admin/YourPage.tsx
import { useEffect } from 'react';
import { Header } from '@/components/Header';
import { useYour } from '@/contexts/YourContext';

export const YourPage = () => {
  const { data, isLoading, fetchData } = useYour();

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="Your Page" />
      <main className="p-4">
        {/* Your content */}
      </main>
    </div>
  );
};
```

### 5. Dodanie do Routingu

```typescript
// src/routes/AdminRoutes.tsx
import { YourPage } from '@/pages/admin/YourPage';

// W komponencie Routes:
<Route
  path="/your-path"
  element={
    <ProtectedRoute requiredPermission="YOUR_PERMISSION">
      <YourPage />
    </ProtectedRoute>
  }
/>
```

### 6. Dodanie Uprawnienia (jeśli potrzebne)

```typescript
// src/types/user.ts
export type Permission = 
  | 'VIEW_ROUTES'
  | 'YOUR_NEW_PERMISSION' // Dodaj tu
  // ... inne

// src/constants/roles.ts
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    // ...
    'YOUR_NEW_PERMISSION', // Dodaj tu
  ],
};
```

## 🎯 Komponenty UI

### Używanie shadcn/ui

```typescript
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

<Button variant="outline" size="lg">
  Click me
</Button>
```

### Toast Notifications

```typescript
import { toast } from 'sonner';

// Success
toast.success('Sukces!', {
  description: 'Operacja zakończona pomyślnie',
});

// Error
toast.error('Błąd', {
  description: 'Coś poszło nie tak',
});

// Info
toast.info('Info', {
  description: 'Informacja dla użytkownika',
});
```

### Loading States

```typescript
// Pełnoekranowy loader
<div className="min-h-screen bg-background flex items-center justify-center">
  <div className="text-center space-y-4">
    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
    <p className="text-muted-foreground">Ładowanie...</p>
  </div>
</div>

// Inline loader
<div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
```

## 🔐 System Uprawnień

### Role

```typescript
DRIVER:   'VIEW_ROUTES', 'COLLECT_WASTE'
MANAGER:  'VIEW_ROUTES', 'COLLECT_WASTE', 'VIEW_STATISTICS'
ADMIN:    wszystkie uprawnienia
```

### Sprawdzanie Uprawnień

```typescript
const { can, canAny, canAll, isAdmin } = usePermissions();

// Pojedyncze uprawnienie
if (can('MANAGE_USERS')) {
  // Pokaż UI
}

// Którekolwiek z listy
if (canAny(['MANAGE_USERS', 'VIEW_STATISTICS'])) {
  // Pokaż UI
}

// Wszystkie z listy
if (canAll(['MANAGE_USERS', 'MANAGE_ROUTES'])) {
  // Pokaż UI
}

// Sprawdź rolę
if (isAdmin) {
  // Pokaż admin UI
}
```

### Protected Routes

```typescript
// Pojedyncze uprawnienie
<ProtectedRoute requiredPermission="MANAGE_USERS">
  <YourComponent />
</ProtectedRoute>

// Wiele uprawnień (domyślnie: którekolwiek)
<ProtectedRoute requiredPermissions={['PERM1', 'PERM2']}>
  <YourComponent />
</ProtectedRoute>

// Wiele uprawnień (wszystkie wymagane)
<ProtectedRoute 
  requiredPermissions={['PERM1', 'PERM2']} 
  requireAll={true}
>
  <YourComponent />
</ProtectedRoute>
```

## 💾 LocalStorage

### Używanie storage utils

```typescript
import { storage, cacheManager } from '@/utils/storage';

// Podstawowe operacje
storage.set('key', value);
const value = storage.get<YourType>('key');
storage.remove('key');

// Z wygasaniem
storage.setWithExpiry('key', value, 3600000); // 1h w ms
const value = storage.getWithExpiry<YourType>('key');

// Cache management
cacheManager.saveRoutes(routes);
const routes = cacheManager.getRoutes<Route[]>();
cacheManager.clearCache();
```

## 🔄 Przełączanie na Prawdziwe API

### 1. Zmień flagę w serwisach

```typescript
// W każdym pliku service
private useMockData = false; // było: true
```

### 2. Ustaw URL API

```env
# .env
VITE_API_URL=https://your-api.com/api
```

### 3. Backend Contract

Backend powinien zwracać dane zgodne z typami w `src/types/`:

```typescript
// Przykład: GET /api/routes
Response: Route[]

// Przykład: POST /api/auth/login
Request: { employeeId: string, pin: string }
Response: { user: User, token: string }
```

### 4. Error Handling

API client automatycznie obsługuje:
- 401 → redirect do /login
- Timeout → toast error
- Network error → toast error

## 📦 Build i Deploy

```bash
# Development build
npm run build:dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

## 🐛 Debugging

### React DevTools
- Zainstaluj rozszerzenie React DevTools
- Sprawdzaj Context values
- Monitoruj re-renders

### Network
- Otwórz DevTools → Network
- Sprawdzaj API calls (gdy mock = false)
- Monitoruj localStorage

### Mock Data
- Mock data w `src/data/mockData.ts`
- Mock implementations w każdym serwisie
- Delay symuluje prawdziwe API (300-500ms)

## 📚 Dokumentacja

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Szczegółowa architektura
- [REFACTORING_SUMMARY.md](./REFACTORING_SUMMARY.md) - Podsumowanie zmian
- Typy TypeScript - dokumentują struktury danych

## 🤝 Best Practices

### 1. Zawsze używaj TypeScript
```typescript
// ✅ Dobrze
const data: YourType = await service.getData();

// ❌ Źle
const data: any = await service.getData();
```

### 2. Error Handling
```typescript
// ✅ Dobrze
try {
  await service.operation();
} catch (error: any) {
  toast.error('Błąd', { description: error.message });
  console.error('Operation failed:', error);
}

// ❌ Źle
await service.operation(); // bez try-catch
```

### 3. Loading States
```typescript
// ✅ Dobrze
const [isLoading, setIsLoading] = useState(false);

const fetchData = async () => {
  setIsLoading(true);
  try {
    await service.getData();
  } finally {
    setIsLoading(false); // zawsze wyłącz
  }
};

// ❌ Źle
const fetchData = async () => {
  setIsLoading(true);
  await service.getData();
  setIsLoading(false); // nie wyłączy się przy błędzie
};
```

### 4. useEffect Dependencies
```typescript
// ✅ Dobrze
useEffect(() => {
  fetchData();
}, [fetchData]); // lub []

// ❌ Źle
useEffect(() => {
  fetchData();
}); // brak dependency array = infinite loop
```

## 💡 Tips & Tricks

### Hot Reload
- Zmiany w Context mogą wymagać full reload (Ctrl+R)
- Zmiany w .env wymagają restartu dev server

### TypeScript
- Używaj `type` dla unions i primitives
- Używaj `interface` dla object shapes
- Export typów używanych w wielu miejscach

### Performance
- Używaj `useMemo` dla drogich obliczeń
- Używaj `useCallback` dla funkcji przekazywanych jako props
- Lazy load route components gdy projekt urośnie

### Styling
- Tailwind classes w kolejności: layout → spacing → typography → colors
- Używaj `cn()` z lib/utils dla conditional classes
- Zmienne CSS w tailwind.config.ts

## ❓ FAQ

**Q: Jak dodać nową rolę?**
A: Dodaj w `src/types/user.ts` i `src/constants/roles.ts`

**Q: Jak zmienić domyślną stronę po logowaniu?**
A: Edytuj `RootRedirect` w `src/App.tsx`

**Q: Czy mogę użyć Redux zamiast Context?**
A: Tak, ale Context wystarczy dla większości przypadków

**Q: Jak dodać dark mode?**
A: shadcn/ui ma wbudowane wsparcie, dodaj ThemeProvider

**Q: Gdzie dodać zmienne środowiskowe?**
A: W pliku `.env` z prefixem `VITE_`

## 🆘 Support

Jeśli masz pytania:
1. Sprawdź dokumentację w `*.md` plikach
2. Przejrzyj istniejące komponenty jako przykłady
3. Sprawdź TypeScript errors w IDE
4. Użyj React DevTools do debugowania

---

**Happy coding! 🚀**
