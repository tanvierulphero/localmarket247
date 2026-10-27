# Jubayer Machineries - Industrial Machinery & Equipment Management ERP System

A complete, production-grade Web Application & ERP Solution for Machinery Showrooms, Air Compressor Distributors, HVAC & Industrial Equipment Suppliers, and Field Service Teams.

**Live Demo URL**: [https://hitachisolutioncenter.vercel.app/](https://hitachisolutioncenter.vercel.app/)

---

## 🌟 Key Features

1. **Public Showcase & Digital Catalog**:
   - Live public showcase for machinery, air compressors, and spare parts.
   - Quotation request generator & real-time WhatsApp contact integration.

2. **Full Invoicing & Document Generator**:
   - Automated creation of **Offer Letters**, **Quotations**, **Invoices**, and **Bills**.
   - Custom branding with Company Logos, Watermark settings, Tax Rates, and Signatures.
   - Instant PDF generation & Direct Printing.

3. **Stock Inventory & Warehouse Management**:
   - Category-wise inventory tracking, stock inward/outward logs, and brand breakdown.
   - Warranty card tracking and automated warranty expiry alerts.

4. **Field Service & Dispatch Management**:
   - Assign field service engineers to factory visits, repairs, and installations.
   - Track service fees, travel expenses, and payment collection status.

5. **Financial Accounting & Reports Hub**:
   - Real-time **Net Profit Statement**: `Total Income - Operating Expenses = Net Operating Profit`.
   - Due Ledger & Outstanding Receivables Tracker.
   - Daily Expenses Management & Owner Personal Drawings Ledger.
   - Sales Returns & Stock Restocking workflow.

6. **Staff Sub-Accounts & Role-Based Access Control**:
   - Multi-user authentication (Admin, Sales Manager, Accountant, Service Staff).
   - Fine-grained permission toggles for every section.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, HTML5 Canvas / jsPDF.
- **Backend / API**:
  - Express.js (Node.js Server) & Vite Proxy.
  - PHP REST API (`/api/index.php`) for cPanel MySQL / MariaDB web hosting.
  - Optional Firebase Firestore / Auth integration.
- **Database**:
  - MySQL / MariaDB (`database.sql` & `schema.sql`).
  - Drizzle ORM schema support (`src/db/schema.ts`).

---

## 📁 File & Directory Structure

```
├── api/                   # PHP Backend API for cPanel / MySQL hosting
│   ├── config.example.php # MySQL DB configuration template
│   ├── index.php          # Main REST API controller
│   └── upload.php         # Image/File upload controller
├── public/                # Static public assets (Favicon, Logo placeholders)
├── src/                   # React Frontend Source Code
│   ├── components/        # ERP Modules & UI Components
│   ├── db/                # Drizzle ORM Schema definitions
│   ├── lib/               # API clients, helpers, & formatters
│   ├── App.tsx            # Main Application Shell & View Routing
│   ├── main.tsx           # React Entry Point
│   └── types.ts           # TypeScript interfaces & types
├── database.sql           # Complete MySQL Database Seed SQL
├── schema.sql             # Table Structures & DDL SQL
├── .cpanel.yml            # Automated cPanel Git Deployment configuration
├── server.ts              # Node.js / Express Server
├── vite.config.ts         # Vite build configuration
└── package.json           # NPM dependencies & build scripts
```

---

## 🚀 Quick Installation & Setup Guide

### Option 1: Deploying on cPanel / Shared Web Hosting (PHP + MySQL)

1. **Upload Files**:
   - Run `npm run build` locally or upload the repository contents to your cPanel `public_html` directory.
   - Copy contents of `dist/` to `public_html/` or use `.cpanel.yml` for automated Git deployment.

2. **Configure Database**:
   - Create a MySQL Database and User in cPanel (e.g. `cpaneluser_machinerydb`).
   - Import `database.sql` into your database using **phpMyAdmin**.
   - Copy `api/config.example.php` to `api/config.php` and set your database details:
     ```php
     define('DB_HOST', 'localhost');
     define('DB_NAME', 'your_cpanel_dbname');
     define('DB_USER', 'your_cpanel_dbuser');
     define('DB_PASS', 'your_cpanel_dbpassword');
     ```

3. **File Permissions**:
   - Ensure the `/uploads` directory exists and has `0755` or `0777` write permissions for file uploads.

---

### Option 2: Running with Node.js / VPS (Express Server)

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Build Production Assets**:
   ```bash
   npm run build
   ```

3. **Start Node Server**:
   ```bash
   npm start
   ```
   The application will run on port `3000` by default.

---

## 🔐 Default Credentials

- **Admin Passcode**: `123456`
- **Salesman Passcode**: `654321`

*(Passcodes can be changed anytime under Staff Sub-Accounts in the Admin Panel).*

---

## 📄 License & Terms

Designed & Maintained for Industrial Machinery Sales, Invoicing, and Service Management.
