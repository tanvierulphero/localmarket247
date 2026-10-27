# Jubayer Machineries ERP - Step-by-Step Installation & Deployment Guide

Welcome! This document provides clear, step-by-step instructions to install, configure, and run the **Jubayer Machineries Industrial Machinery ERP & Public Catalog Solution**.

**Live Demo Preview**: [https://hitachisolutioncenter.vercel.app/](https://hitachisolutioncenter.vercel.app/)

---

## 📋 Prerequisites

Before starting, ensure you have:
- A Web Server with **PHP 8.0+** and **MySQL / MariaDB** (for cPanel hosting) OR **Node.js v18+** (for VPS / Server hosting).
- Access to **phpMyAdmin** or MySQL command line to import the database.

---

## 💾 Database Setup (MySQL)

1. Open **phpMyAdmin** in your cPanel or database management tool.
2. Create a new database (e.g. `machinery_erp`).
3. Click on the **Import** tab.
4. Choose the `database.sql` file located in the root directory of this project.
5. Click **Go / Execute** to import all tables and initial seed data.

---

## 🌐 Option A: cPanel / Web Hosting Setup (Recommended)

1. **Upload Files**:
   - Build the static files using `npm run build`.
   - Upload the contents of the `dist/` folder and the `api/` folder to your `public_html/` folder on cPanel.

2. **Configure Database Connection**:
   - Navigate to the `api/` directory on your server.
   - Rename `config.example.php` to `config.php`.
   - Edit `config.php` and fill in your database credentials:
     ```php
     define('DB_HOST', 'localhost');
     define('DB_NAME', 'your_cpanel_dbname');
     define('DB_USER', 'your_cpanel_dbuser');
     define('DB_PASS', 'your_cpanel_password');
     ```

3. **Set Up Upload Directory**:
   - Create a folder named `uploads` inside `public_html/`.
   - Ensure folder permissions are set to `0755` or `0777`.

4. **Test Application**:
   - Visit your website URL. You should see the Public Showcase & Catalog.
   - Click **Admin Login** and enter passcode `123456` to access the ERP dashboard.

---

## 🖥️ Option B: Node.js / VPS Server Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Build Production Assets**:
   ```bash
   npm run build
   ```

3. **Start Node Production Server**:
   ```bash
   npm start
   ```

4. **PM2 Process Manager (Optional for 24/7 Uptime)**:
   ```bash
   npm install -g pm2
   pm2 start server.ts --name "machinery-erp"
   pm2 save
   ```

---

## 🔑 Default Login Credentials

| Role | Default Passcode | Permissions |
| :--- | :--- | :--- |
| **Admin** | `123456` | Full Access (All ERP Features, Settings, Staff Accounts) |
| **Salesman** | `654321` | Sales, Invoices, Customer Management, Due Ledger |

*(You can modify passcodes and permissions under **Staff Sub-Accounts** in the Admin Panel).*

---

## 📦 What's Included in the Zip Package

- `src/`: Complete React TypeScript source code with modular architecture.
- `api/`: Lightweight PHP REST API controllers for cPanel MySQL integration.
- `database.sql`: Full SQL dump with tables and initial sample data.
- `schema.sql`: DDL structure for MySQL database.
- `.cpanel.yml`: Automated deployment script for cPanel Git integration.
- `README.md`: System overview and technical documentation.
- `INSTALLATION_GUIDE.md`: Step-by-step setup guide.

---

## 📞 Support & Verification

All code is fully tested and compiled with zero errors. For customization or technical support, contact the developer.
