# Mahalaxmi ERP

Full stack **Jockey showroom** ERP with barcode inventory, fast invoice scanning, customers, expenses, analytics, and role-based access control.

## Project structure

```bash
mahalaxmi/
├── app/          # React + Vite + TypeScript frontend
└── api/          # Node.js + Express + MongoDB backend
```

## Prerequisites

- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas connection string)

## Setup

### 1. Backend (`api/`)

```bash
cd api
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm install
npm run seed           # Jockey catalog + users + customers
npm run seed:products  # Refresh products only (keeps users)
npm run dev
```

API runs at **http://localhost:5001** (port 5001 avoids macOS AirPlay on 5000)

See **[docs/MONGODB.md](docs/MONGODB.md)** for local DB viewing and **MongoDB Atlas** setup.

### 2. Frontend (`app/`)

```bash
cd app
cp .env.example .env
npm install
npm run dev
```

App runs at **http://localhost:5173**

The Vite dev server proxies `/api` to the backend when `VITE_API_URL` is not set; with `.env` use `VITE_API_URL=http://localhost:5000/api`.

## Demo accounts

| Role     | Email                    | Password     |
|----------|--------------------------|--------------|
| Admin    | admin@mahalaxmi.com      | admin123     |
| Employee | employee@mahalaxmi.com   | employee123  |

## Role permissions

| Feature              | Employee | Admin |
|----------------------|----------|-------|
| Products CRUD        | ✓ (no delete) | ✓ |
| Customers CRUD       | ✓ (no delete) | ✓ |
| Invoices             | ✓        | ✓     |
| Expenses             | —        | ✓     |
| Analytics & reports  | —        | ✓     |
| Dashboard            | —        | ✓     |

## API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET/POST/PUT/DELETE | `/api/products` | Inventory |
| GET/POST/PUT/DELETE | `/api/customers` | Customers |
| GET | `/api/customers/:id/history` | Purchase history |
| GET/POST | `/api/invoices` | Invoices |
| PATCH | `/api/invoices/:id/cancel` | Cancel & restore stock |
| GET/POST/PUT/DELETE | `/api/expenses` | Expenses (admin) |
| GET | `/api/analytics/*` | Reports (admin) |

## Testing instructions

### Manual smoke test

1. Start MongoDB, API, and frontend.
2. Log in as **admin** — confirm dashboard stats load.
3. **Inventory**: add a product, edit it, filter by low stock, delete (admin only).
4. **Customers**: add customer, open history, create invoice from detail page.
5. **Invoices**: create multi-line invoice with discount and tax; print from detail view; verify stock decreased.
6. **Expenses** (admin): add expense for current month; confirm monthly total updates.
7. **Reports** (admin): verify sales chart, profit table, expense categories.
8. Log out; log in as **employee** — confirm no dashboard/expenses/reports in sidebar; confirm delete buttons hidden on products/customers.

### API health check

```bash
curl http://localhost:5000/api/health
```

### Production build

```bash
cd app && npm run build
cd ../api && npm start
```

Serve `app/dist` with any static host; set `CLIENT_URL` and `VITE_API_URL` for your deployment domain.

## Tech stack

- **Frontend**: React, Vite, TypeScript, React Router, Axios, Context API
- **Backend**: Express, Mongoose, JWT, bcrypt, express-validator
- **Database**: MongoDB
