# How To Setup & Deploy Jubayer Machineries ERP

This document provides step-by-step installation instructions for two deployment targets:
1. **VPS / Node.js Server Deployment (with PM2)**
2. **Docker Container Deployment (with Docker Compose)**
3. **Database Setup & Migrations**
4. **First Admin Login & Security Configuration**
5. **Branding & Logo Customization**

---

## Target 1: VPS / Node.js Server Deployment (Linux / Ubuntu)

### Prerequisites:
- Ubuntu 20.04/22.04 LTS or any Linux VPS.
- Node.js v18.x or v20.x installed (`node -v`).
- MySQL 8.0+ or MariaDB 10.5+ installed and running.

### Step 1: Clone or Extract Application
```bash
cd /var/www
mkdir machinery-erp
cd machinery-erp
# Extract project files here
```

### Step 2: Install Dependencies & Build
```bash
npm install
npm run build
```

### Step 3: Setup Database Connection
Create `.env` or `api/config.php`:
```bash
cp .env.example .env
```
For cPanel / PHP API:
```bash
cp api/config.example.php api/config.php
```
Edit `api/config.php` with your MySQL connection credentials:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'machinery_erp');
define('DB_USER', 'erp_user');
define('DB_PASS', 'YOUR_STRONG_DATABASE_PASSWORD_CHANGE_ME');
```

### Step 4: Import Database Schema & Seed Data
```bash
mysql -u erp_user -p machinery_erp < database/schema.sql
mysql -u erp_user -p machinery_erp < database/seed.sql
```

### Step 5: Start Node Server with PM2
```bash
npm install -g pm2
pm2 start server.ts --name "machinery-erp"
pm2 save
pm2 startup
```
The server will run on port `3000` by default.

---

## Target 2: Docker Container Deployment

### Step 1: Clone Repository & Build Docker Stack
Ensure Docker and Docker Compose are installed on your machine.
Run:
```bash
docker-compose up -d --build
```

### Step 2: Verify Running Containers
```bash
docker-compose ps
```
You will see two running containers:
- `machinery_app` (Node.js Express App running on port `3000`)
- `machinery_db` (MySQL 8.0 Database on port `3306`)

### Step 3: Verify Database Initialization
The `database/schema.sql` and `database/seed.sql` files are automatically mounted into `/docker-entrypoint-initdb.d` inside the MySQL container, initializing tables and sample data upon first container startup.

---

## First Admin Login

1. Open your browser and navigate to `http://localhost:3000` or your VPS domain `https://your-domain.com`.
2. Click **Admin Login** on the top navigation bar.
3. Enter the default credentials:
   - **Admin Passcode**: `123456`
   - **Salesman Passcode**: `654321`
4. Once logged in, navigate to **Staff Sub-Accounts** in the sidebar to change the default passcode for security.

---

## Branding & Logo Customization

1. Log in as **Admin** and navigate to **Showroom Settings** in the sidebar navigation.
2. Under **Custom Branding & Document Letterhead**:
   - **Company Header Logo**: Click *Upload Header Logo* to upload your official logo.
   - **Public Site Showcase Logo**: Click *Upload Public Site Logo*.
   - **Printout Watermark**: Upload a grayscale watermark logo and adjust transparency slider.
3. Under **Showroom & Business Details**:
   - Update Company Brand Name, Slogan, physical address, and contact hotlines.
   - Set document prefixes (e.g. `INV-`, `QT-`, `OFF-`, `BILL-`).
   - Set default signing authority name and designation for printed invoices.
4. Click **Save Branding & Logos** and **Save & Sync**.
