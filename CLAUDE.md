# CLAUDE.md - AI Coding Tool Guidelines

This document provides architecture overview, directory layout, coding conventions, and command references for AI assistants working on this repository.

---

## 🏗️ Architecture Overview

The application is a full-stack Industrial Machinery ERP, Catalog, and Invoicing system built with:
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons.
- **Full-Stack Server**: Express.js server (`server.ts`) with Vite middlewares mounted in development (`"dev": "tsx server.ts"`).
- **PHP REST API**: Lightweight cPanel PHP controllers in `/api` for shared MySQL web hosting.
- **Database Schema**: Drizzle ORM (`src/db/schema.ts`) and raw SQL scripts (`database/schema.sql`, `database/seed.sql`).

---

## 📁 Directory Map

```
├── api/                     # PHP REST API endpoints for cPanel MySQL hosting
│   ├── config.example.php   # MySQL database connection template
│   ├── index.php            # Main API router & controller
│   └── upload.php           # Image file upload handler
├── database/                # Database Scripts & Migrations
│   ├── schema.sql           # DDL Table Creations
│   └── seed.sql             # Initial Seed Data
├── src/                     # React Frontend Application Source
│   ├── components/          # ERP Feature Modules (Inventory, Invoicing, Staff, Settings, etc.)
│   ├── db/                  # Drizzle ORM schema & configuration
│   ├── lib/                 # API clients, helpers, formatters
│   ├── App.tsx              # Main Shell, Navigation Tabs & View Manager
│   ├── main.tsx             # React Mount
│   ├── index.css            # Tailwind CSS v4 import
│   └── types.ts             # TypeScript interfaces & types
├── Dockerfile               # Production Docker container definition
├── docker-compose.yml       # Docker Compose multi-container stack
├── HowToSetup.md            # Deployment & setup documentation
├── README.md                # Project overview
├── CHANGELOG.md             # Version release history
└── server.ts                # Express Node.js Server Entry
```

---

## 🛠️ Essential Commands

- **Development**:
  ```bash
  npm run dev
  ```
- **Production Build**:
  ```bash
  npm run build
  ```
- **Start Production Server**:
  ```bash
  npm start
  ```
- **Type Checking / Linting**:
  ```bash
  npm run lint
  ```

---

## 🎨 Coding Conventions & Discipline

1. **TypeScript**: Strictly typed code with no implicit `any`. Component props must be typed with interfaces.
2. **Styling**: Use Tailwind CSS utility classes exclusively. Avoid custom CSS files or inline style objects.
3. **Real Integrations**: Server-side storage and MySQL API endpoints must be prioritized over mock in-memory data.
4. **UI Design**: Modern, clean, dark/navy themed ERP interface. Maintain consistent typography, clear badges, and reactive state feedback.
