# Changelog

All notable changes to the **Jubayer Machineries ERP** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-18

### Added
- **Public Showcase & Digital Catalog**:
  - Live public showcase for industrial machinery, screw air compressors, air dryers, and spare parts.
  - Interactive quotation request modal & direct WhatsApp contact integration.

- **Invoicing & Document Generator**:
  - Automated creation of **Offer Letters**, **Quotations**, **Invoices**, and **Bills**.
  - Document number prefix configuration (`INV-`, `QT-`, `OFF-`, `BILL-`).
  - Print & PDF export with custom company logo, grayscale watermark, and signature designations.

- **Stock Inventory & Warehouse Management**:
  - Category and brand-wise stock tracking, stock inward/outward history.
  - Automatic warranty card generation with expiry notifications.

- **Field Service & Dispatch Management**:
  - On-site engineer dispatch logging for factory visits, repairs, and installations.
  - Service fee, travel expense, and payment collection tracking.

- **Financial Accounting & Reports Hub**:
  - Real-time **Net Operating Profit Statement**: `Total Income - Operating Costs = Net Profit`.
  - Due Ledger & Outstanding Receivables Tracker with partial payment recording.
  - Daily Expenses Management & Owner Personal Drawings Ledger.
  - Sales Return & Inventory Restocking workflow.

- **Staff Sub-Accounts & Role-Based Access Control**:
  - Passcode-authenticated staff login (Admin vs Salesman vs Service staff).
  - Granular permission toggles for every module.

- **Database & Hosting Support**:
  - Complete MySQL/MariaDB database scripts (`database/schema.sql`, `database/seed.sql`).
  - Lightweight cPanel PHP REST API in `/api`.
  - Express.js Node.js server with Docker Compose configuration.
