# Backend (Fastify + Prisma + MySQL)

## Wymagania
- Node.js 20+
- MySQL 8+

## Konfiguracja
Ustaw zmienne środowiskowe:

- `DATABASE_URL` — np. `mysql://user:password@localhost:3306/waste_route_manager`
- `JWT_SECRET` — tajny klucz JWT
- `PORT` — domyślnie `3000`
- `ADMIN_EMPLOYEE_ID` — login admina (seed)
- `ADMIN_NAME` — nazwa admina (seed)
- `ADMIN_PIN` — PIN admina (seed)

## Uruchomienie
1. Instalacja zależności:
   - `npm install`
2. Generacja Prisma Client:
   - `npm run prisma:generate`
3. Migracje:
   - `npm run prisma:migrate`
4. Seed admina:
   - `npm run prisma:seed`
5. Start:
   - `npm run dev`

API działa pod `http://localhost:3000/api`.
