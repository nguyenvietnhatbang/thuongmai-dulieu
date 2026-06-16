# Dulieu Thuongmai

Internal CRM, consulting service, commerce, inventory, receivables, and reporting system.

## Stack

- Next.js App Router
- PostgreSQL for application data and APIs
- Supabase Storage for image buckets only
- Tailwind CSS

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Configure `DATABASE_URL` for PostgreSQL. Configure Supabase URL and server key only when using image upload helpers.

## Database

Apply the base PostgreSQL schema:

```bash
npm run db:migrate
```

The base migration creates:

- Catalog, department, team, user, RBAC, notification, audit, and image metadata tables.
- CRM tables for customers, contacts, opportunities, quotes, quote items, contracts, and payment milestones.
- Project delivery tables for projects, tasks, schedules, internal notes, project closures, receivables, and customer care reminders.
- Commerce and inventory tables for suppliers, products, warehouses, purchase orders, stock receipts, sales orders, inventory balances, and inventory movements.

## Development Rules

- API data access uses PostgreSQL through `lib/db/postgres.ts`.
- Supabase client code belongs in `lib/supabase` and is limited to Storage bucket operations.
- Keep route handlers thin and move business logic into feature services.
- Validate API input on the server.
- Use backend RBAC checks for protected actions.
- List APIs should support database-level pagination, search, filters, and sorting.

## Health Check

Open:

```txt
/api/health
```

The endpoint checks PostgreSQL when `DATABASE_URL` is configured and reports whether Supabase image Storage env values are present.
