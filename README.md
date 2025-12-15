# City Light Pole Management Web

Frontend application for managing city light poles, issues, and maintenance built with React, Vite, and Mantine.

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **Mantine** - UI component library
- **TanStack Query** - Data fetching and caching
- **React Router** - Routing
- **Recharts** - Charts and visualizations
- **Axios** - HTTP client

## Prerequisites

- Node.js 18+
- npm or yarn
- Running backend API (city-light-pole-api)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:3011/api/v1
```

**Note:** In development, the Vite proxy will handle `/api` routes automatically. In production, set `VITE_API_BASE_URL` to your API server URL.

### 3. Generate API Types

```bash
npm run api:types
```

This fetches the OpenAPI schema from the backend and generates TypeScript types.

## Run Order (Local Dev)

1. **Start the backend API** (city-light-pole-api):
   ```bash
   cd ../city-light-pole-api
   npm run dev-run
   ```

2. **In city-light-pole-web:**
   ```bash
   npm install
   npm run dev-run
   ```

   The `dev-run` script will:
   - Validate environment variables
   - Generate API types from the backend
   - Start the Vite dev server

3. **Access the application:**
   - Web App: http://localhost:5173
   - Login with seeded credentials (see backend README)

## Default Login Credentials

- **Admin:**
  - Email: `admin@city.gov`
  - Password: `admin123`

- **Maintenance Engineer:**
  - Email: `engineer@city.gov`
  - Password: `engineer123`

- **Supervisor Viewer:**
  - Email: `viewer@city.gov`
  - Password: `viewer123`

## Scripts

- `npm run dev` - Start Vite dev server
- `npm run dev-run` - Validate env, generate types, and start dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run api:types` - Generate TypeScript types from OpenAPI schema

## Project Structure

```
src/
├── api/              # API client and generated types
├── components/       # Reusable components
├── hooks/           # Custom React hooks
├── pages/           # Page components
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── PolesListPage.tsx
│   ├── PoleDetailPage.tsx
│   ├── IssuesListPage.tsx
│   ├── MaintenancePage.tsx
│   └── UsersPage.tsx
├── App.tsx          # Main app component
└── main.tsx         # Entry point
```

## Features

### Authentication
- JWT-based authentication
- Protected routes
- Role-based access control

### Pages

1. **Dashboard**
   - Summary statistics (poles, issues, maintenance)
   - Faulty poles by district chart
   - Maintenance cost summary

2. **Light Poles**
   - List all poles with filters (district, status, search)
   - View pole details
   - Generate and download QR codes (ADMIN)
   - Create/edit poles (ADMIN)

3. **Issues**
   - List all issues
   - Create new issues (ADMIN, ENGINEER)
   - Update issue status
   - Upload before/after attachments

4. **Maintenance**
   - View maintenance schedules
   - View maintenance logs
   - Create maintenance records

5. **Users** (ADMIN only)
   - List all users
   - Update user roles and status

## API Integration

The frontend uses:
- **Development:** Vite proxy (`/api` → `VITE_API_BASE_URL/api/v1`)
- **Production:** Direct API calls to `VITE_API_BASE_URL/api/v1`

API types are generated from the backend OpenAPI schema and stored in `src/api/generated/types.ts`.

## User Roles

- **ADMIN** - Full access to all features
- **MAINTENANCE_ENGINEER** - Can create/update issues and maintenance logs
- **SUPERVISOR_VIEWER** - Read-only access (view only, no edit buttons)

## License

UNLICENSED


