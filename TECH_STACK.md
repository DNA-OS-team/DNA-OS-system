# TECH_STACK.md

# DNA OS Construction Platform — Complete Tech Stack & Tools

เอกสารนี้ใช้สำหรับให้ AI Coding Agent / Developer อ่านครั้งเดียวแล้วเข้าใจว่าโปรเจกต์ **DNA OS Construction Platform** ควรใช้ Stack และเครื่องมืออะไรทั้งหมด

ควรวางไฟล์นี้ไว้ที่ root ของโปรเจกต์:

```txt
/TECH_STACK.md
```

ใช้ร่วมกับไฟล์:

```txt
/AGENT.md
/PROJECT_PROGRESS.md
/AI_STEP_PROMPTS.md
/API_DESCRIPTION.md
/DNA_OS_Construction_Platform_Blueprint.md
```

---

# 1. Project Summary

## Project Name

```txt
DNA OS Construction Platform
```

## Product Type

```txt
Construction Commerce Operating System
```

## Main Purpose

ระบบกลางสำหรับควบคุมธุรกิจรับเหมาก่อสร้างและวัสดุก่อสร้าง โดยเจ้าของระบบเป็น **Core Platform / Operator กลาง** ระหว่าง:

```txt
ลูกค้า
พาร์ทเนอร์ขายวัสดุ
รถร่วม / พาร์ทเนอร์ขนส่ง
ระบบ BOQ
ระบบเอกสาร
ระบบจัดซื้อ
ระบบการเงิน
ระบบติดตามหนี้
Dashboard ควบคุมงานทั้งหมด
```

---

# 2. Core Principle

```txt
ข้อมูลเกิดครั้งเดียว ถูกใช้ทั้งระบบ
```

ตัวอย่าง flow:

```txt
Customer Order
→ BOQ
→ Quotation
→ Supplier PO
→ Transport Job
→ Invoice
→ Payment
→ Receipt
→ Settlement
→ Dashboard
```

---

# 3. Recommended Main Stack

ใช้ Stack นี้เป็นค่าเริ่มต้นของโปรเจกต์

```txt
Next.js
TypeScript
PostgreSQL
Supabase
Prisma
Tailwind CSS
shadcn/ui
React Hook Form
Zod
TanStack Query
TanStack Table
Recharts
Puppeteer / Playwright PDF
Inngest
Supabase Storage
Supabase Realtime
Sentry
Vercel
pnpm
GitHub
```

---

# 4. Stack Summary Table

| Layer | Tool | Purpose |
|---|---|---|
| App Framework | Next.js | Web app, portals, admin, API routes |
| Language | TypeScript | Type safety |
| Database | PostgreSQL | Main relational database |
| Backend Platform | Supabase | Auth, DB, Storage, Realtime, RLS |
| ORM | Prisma | Schema, migration, type-safe DB access |
| Styling | Tailwind CSS | UI styling |
| UI Components | shadcn/ui | Reusable UI components |
| Icons | lucide-react | Icon system |
| Forms | React Hook Form | Form management |
| Validation | Zod | Schema validation |
| Server State | TanStack Query | Fetch/cache/refetch server data |
| Data Table | TanStack Table | Tables for admin/finance/order |
| Charts | Recharts | Dashboard charts |
| PDF | Puppeteer or Playwright | Generate document PDFs |
| Background Jobs | Inngest | Async jobs, retries, scheduled tasks |
| Storage | Supabase Storage | PDFs, slips, proofs, files |
| Realtime | Supabase Realtime | Order/job/payment updates |
| Monitoring | Sentry | Error tracking |
| Deployment | Vercel | Deploy Next.js |
| Package Manager | pnpm | Fast package management |
| Version Control | Git + GitHub | Code history and collaboration |

---

# 5. Frontend Stack

## Required

```txt
Next.js App Router
TypeScript
Tailwind CSS
shadcn/ui
lucide-react
React Hook Form
Zod
TanStack Query
TanStack Table
Recharts
date-fns
```

## Frontend Responsibilities

Frontend ต้องรองรับ portals เหล่านี้:

```txt
Admin Backoffice
Customer Storefront
Partner / Supplier Portal
Fleet / Truck Partner Portal
Document Preview
Dashboard
```

## Main Frontend Areas

```txt
/admin/dashboard
/admin/customers
/admin/products
/admin/partners
/admin/fleet
/admin/orders
/admin/procurement
/admin/logistics
/admin/documents
/admin/payments
/admin/debt
/admin/settlements
/admin/alerts
/admin/settings

/customer/catalog
/customer/cart
/customer/checkout
/customer/orders
/customer/documents
/customer/payments

/partner/products
/partner/pricing
/partner/purchase-orders
/partner/payouts

/fleet/vehicles
/fleet/availability
/fleet/jobs
/fleet/earnings
```

## UI Rules

```txt
Use shadcn/ui components first.
Use Tailwind CSS for layout and spacing.
Avoid heavy inline styles.
Keep React components thin.
Do not put business logic in JSX.
Do not calculate VAT, margin, payment balance, or document totals inside UI.
```

---

# 6. Backend Stack

## Required

```txt
Next.js Route Handlers
Next.js Server Actions
Supabase Auth
Prisma
PostgreSQL
Zod
Service Layer
Engine Layer
Audit Service
Permission Helpers
```

## Backend Responsibilities

```txt
Authentication
Authorization
Tenant isolation
Database access
Business workflow
Document generation
Payment processing
Audit log
Notifications
Background job triggers
```

## Backend Pattern

Every mutation should follow this pattern:

```txt
1. Parse request
2. Validate with Zod
3. Get current user/session
4. Resolve active company
5. Check permission
6. Check tenant access
7. Call service layer
8. Service calls engine layer
9. Write database transaction
10. Create audit log
11. Trigger event/notification/job if needed
12. Return common response format
```

---

# 7. Database Stack

## Database

```txt
PostgreSQL
```

## Managed Platform

```txt
Supabase Postgres
```

## ORM

```txt
Prisma
```

## Database GUI

```txt
Prisma Studio
Supabase Dashboard
```

## Database Security

```txt
Supabase Row Level Security
```

## Database Rules

```txt
Use UUID primary keys.
Use Decimal for money.
Do not use Float for money.
Use enums for important statuses.
Use indexes on foreign keys.
Use unique constraints for document numbers, order numbers, PO numbers.
Use soft delete for financial records.
Use audit log for financial and status changes.
```

---

# 8. Main Database Modules

Database ต้องรองรับ modules เหล่านี้:

```txt
Identity
Company
Company Member
Customer Site
Customer Credit Profile
Product Catalog
Supplier Products
Supplier Contracts
Price History
Fleet Partner
Vehicle
Vehicle Availability
Transport Rate Card
Customer Orders
BOQ
Documents
Supplier PO
Transport Jobs
Delivery Proof
Dispute
Payment
Bank Transaction
Reconciliation
Debt Snapshot
Settlement
Alert
Audit Log
Notification
System Health
```

---

# 9. First Tables To Create

ให้ AI สร้างตารางตามลำดับนี้ก่อน:

```txt
1. companies
2. users
3. company_members
4. audit_logs
5. customer_sites
6. customer_credit_profiles
7. product_categories
8. products
9. product_variants
10. supplier_products
11. customer_orders
12. customer_order_items
```

ยังไม่ควรเริ่มจาก:

```txt
dashboard
automation
LINE
advanced fleet matching
settlement
reconciliation
```

---

# 10. Supabase Stack

ใช้ Supabase สำหรับ:

```txt
Auth
PostgreSQL
Storage
Realtime
RLS
Edge Functions ถ้าจำเป็น
```

## Supabase Auth

ใช้สำหรับ:

```txt
User login
User session
Magic link / email password
Role/member lookup ผ่าน company_members
```

## Supabase Storage Buckets

```txt
company-logos
document-pdfs
delivery-proofs
payment-slips
supplier-attachments
fleet-vehicle-docs
audit-exports
```

## Supabase Realtime

ใช้เฉพาะ events ที่จำเป็น:

```txt
new_order
supplier_confirmed_po
fleet_accepted_job
transport_status_changed
payment_reconciled
document_approved
alert_created
```

## Supabase RLS

ต้องใช้เพื่อกันข้อมูลข้าม tenant:

```txt
Customer เห็นเฉพาะ order/document/payment ของตัวเอง
Supplier เห็นเฉพาะ PO ของตัวเอง
Fleet เห็นเฉพาะ job ของตัวเอง
Core admin เห็นข้อมูลใน platform
```

---

# 11. Prisma Stack

ใช้ Prisma สำหรับ:

```txt
Schema definition
Migration
Database access
Type-safe queries
Relations
Enums
```

## Required Scripts

```json
{
  "db:generate": "prisma generate",
  "db:push": "prisma db push",
  "db:migrate": "prisma migrate dev",
  "db:studio": "prisma studio"
}
```

## Prisma Rules

```txt
Use Decimal for money.
Use DateTime for timestamps.
Use Json for flexible specs.
Use enums for statuses.
Do not use String for important status fields.
Do not use Prisma Client in client components.
Use singleton PrismaClient in development.
```

---

# 12. UI Component Stack

## shadcn/ui Components To Install First

```txt
button
card
input
label
select
textarea
table
badge
dialog
tabs
dropdown-menu
form
separator
alert
toast / sonner
calendar
popover
checkbox
switch
```

## Other UI Tools

```txt
lucide-react
Recharts
TanStack Table
```

## UI Design Direction

```txt
Clean backoffice interface
Dark/light compatible
Table-heavy admin screens
Clear status badges
Document preview A4
Dashboard cards
Alert center
```

---

# 13. Form & Validation Stack

## Tools

```txt
React Hook Form
Zod
@hookform/resolvers
```

## Form Rules

```txt
Every form must have Zod schema.
Client validation and server validation should use same schema if possible.
Do not trust client validation only.
Server actions / API routes must validate again.
```

## Example Schemas

```txt
customer.schema.ts
customerSite.schema.ts
product.schema.ts
supplierProduct.schema.ts
order.schema.ts
boq.schema.ts
document.schema.ts
payment.schema.ts
transportJob.schema.ts
settlement.schema.ts
```

---

# 14. API Stack

## API Patterns

```txt
Next.js Route Handlers
Server Actions
Service Layer
Zod Validation
Common Response Format
```

## Common Response

Success:

```json
{
  "ok": true,
  "data": {},
  "message": "Success"
}
```

Error:

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": {}
  }
}
```

## First API Endpoints To Build

```txt
GET  /api/me
GET  /api/admin/companies
POST /api/admin/companies
GET  /api/admin/customers
POST /api/admin/customers
GET  /api/admin/customers/:id/sites
POST /api/admin/customers/:id/sites
GET  /api/catalog/products
POST /api/admin/catalog/products
POST /api/admin/catalog/products/:id/variants
GET  /api/admin/suppliers
POST /api/admin/suppliers
POST /api/admin/suppliers/:id/products
POST /api/orders
GET  /api/orders/:id
POST /api/orders/:id/price
POST /api/orders/:id/boq
POST /api/orders/:id/documents/quotation
```

---

# 15. Business Logic / Engine Stack

Business logic ต้องอยู่ใน:

```txt
src/core/engines
```

## Required Engines

```txt
calculationEngine
pricingEngine
supplierSelectionEngine
orderSplitEngine
numberingEngine
documentEngine
documentRelationEngine
workflowEngine
paymentEngine
collectionEngine
bankSMSEngine
reconciliationEngine
idempotencyEngine
fleetMatchingEngine
dispatchEngine
deliveryProofEngine
settlementEngine
auditEngine
notificationEngine
marginEngine
routeCostEngine
```

## Engine Rules

```txt
Engines should be pure or mostly pure.
Engines must not import React.
Engines must not render UI.
Engines should not write database directly.
Database writes belong in service layer.
Engines must be testable.
```

---

# 16. Service Layer Stack

Service layer อยู่ใน:

```txt
src/server/services
```

## Required Services

```txt
companyService
customerService
customerSiteService
catalogService
supplierService
fleetService
orderService
pricingService
boqService
documentService
documentCounterService
procurementService
transportService
deliveryProofService
disputeService
paymentService
reconciliationService
debtService
settlementService
alertService
notificationService
auditService
fileService
dashboardService
```

## Service Rules

```txt
Services can use Prisma.
Services can call engines.
Services handle transactions.
Services create audit logs.
Services enforce business workflow.
Services should not return secret/internal data to unauthorized roles.
```

---

# 17. Document / PDF Stack

## Tools

```txt
React document components
Puppeteer or Playwright
Supabase Storage
Inngest PDF job
```

## Document Types

```txt
BOQ
QT   ใบเสนอราคา
INV3 ใบแจ้งหนี้ / ใบกำกับ / ใบเสร็จ
INV  ใบแจ้งหนี้
RCT  ใบเสร็จรับเงิน
PV   ใบสำคัญจ่าย
PMT  ใบสั่งจ่าย
PO   ใบจัดซื้อ / ใบสั่งซื้อ
```

## PDF Flow

```txt
Document created
→ Snapshot document data
→ Generate HTML/A4 preview
→ Generate PDF server-side
→ Upload to Supabase Storage
→ Save pdfUrl
→ Create audit log
```

## PDF Rules

```txt
Do not generate PDF on client.
Do not overwrite issued PDF silently.
Use document versioning.
Receipt should be locked after issue.
Paid invoice should not be edited directly.
```

---

# 18. Background Jobs Stack

## Tool

```txt
Inngest
```

## Jobs

```txt
document.pdf.generate
invoice.overdue.check
daily.debt.snapshot
notification.line.send
payment.reconciliation.run
supplier.po.reminder
fleet.job.reminder
dashboard.metrics.refresh
```

## Job Rules

```txt
Jobs must call service layer.
Jobs must be idempotent.
Jobs must log failure to system_health_events.
Jobs must not duplicate notifications.
Jobs must not generate duplicate PDFs without checking version.
```

---

# 19. Notification Stack

## Channels

```txt
LINE
Email
In-app notification
Dashboard alert
Webhook
```

## Tools

```txt
LINE Messaging API or LINE Notify alternative
Resend or email provider later
Supabase Realtime for in-app alerts
Inngest for retry
```

## Notification Events

```txt
order.created
order.quoted
order.confirmed
supplier_po.created
supplier_po.confirmed
transport_job.created
transport_job.assigned
transport_job.delivered
invoice.created
payment.confirmed
payment.reconciled
debt.overdue
settlement.approved
```

## Rules

```txt
Never expose LINE token to client.
Notification templates should be centralized.
Failed notification creates system health event.
Avoid duplicate notifications by event id.
```

---

# 20. Monitoring / Logging Stack

## Tools

```txt
Sentry
Vercel Logs
Supabase Logs
Inngest Logs
Prisma query logs in dev
audit_logs table
system_health_events table
alerts table
```

## Monitor These

```txt
API errors
PDF generation failure
LINE send failure
Payment reconciliation failure
Supplier PO stuck
Truck job delayed
Invoice overdue
Storage upload failure
Permission errors
Tenant mismatch
```

---

# 21. Testing Stack

## Tools

```txt
Vitest
React Testing Library
Playwright
Prisma test database
```

## Test Types

```txt
Unit tests
Component tests
Integration tests
E2E tests
API tests
```

## First Engines To Test

```txt
calculationEngine
paymentEngine
pricingEngine
supplierSelectionEngine
orderSplitEngine
numberingEngine
documentEngine
collectionEngine
reconciliationEngine
idempotencyEngine
```

## Required Test Cases

```txt
VAT exclusive
VAT inclusive
empty items
decimal rounding
partial payment
full payment
supplier split one supplier
supplier split multiple suppliers
missing supplier
duplicate bank transaction
high confidence reconciliation
low confidence reconciliation
invalid status transition
```

---

# 22. Development Tools

## Required

```txt
VSCode
Cursor or AI coding agent
Git
GitHub
pnpm
Node.js LTS
Supabase CLI optional
Prisma Studio
Vercel CLI optional
```

## Recommended VSCode Extensions

```txt
Prisma
Tailwind CSS IntelliSense
ESLint
Prettier
Error Lens
GitLens
PostgreSQL extension optional
```

---

# 23. Deployment Stack

## Platform

```txt
Vercel
```

## Services

```txt
Supabase
Inngest
Sentry
GitHub
```

## Environments

```txt
development
staging
production
```

## Deployment Rules

```txt
Use staging before production.
Production must use strict env variables.
Production must have RLS enabled.
Production must have backups.
Production must have monitoring.
```

---

# 24. Environment Variables

Create:

```txt
.env.example
```

Required variables:

```env
DATABASE_URL=
DIRECT_URL=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

LINE_CHANNEL_ACCESS_TOKEN=
LINE_NOTIFY_TOKEN=

INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

SENTRY_DSN=
PDF_SECRET=
APP_URL=
```

## Env Rules

```txt
NEXT_PUBLIC_* can be used on client.
SUPABASE_SERVICE_ROLE_KEY server only.
DATABASE_URL server only.
LINE tokens server only.
PDF_SECRET server only.
Never commit real .env.
```

---

# 25. Package Installation Commands

## Create Project

```bash
pnpm create next-app@latest dna-os-construction-platform
cd dna-os-construction-platform
```

Recommended choices:

```txt
TypeScript: Yes
ESLint: Yes
Tailwind: Yes
App Router: Yes
src directory: Yes
import alias: @/*
```

---

## Install UI

```bash
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button card input label select textarea table badge dialog tabs dropdown-menu form separator alert switch checkbox popover calendar
pnpm add lucide-react
```

---

## Install Database / Prisma

```bash
pnpm add prisma @prisma/client
pnpm dlx prisma init
```

---

## Install Supabase

```bash
pnpm add @supabase/supabase-js
```

---

## Install Forms / Validation

```bash
pnpm add react-hook-form zod @hookform/resolvers
```

---

## Install Query / Table / Charts

```bash
pnpm add @tanstack/react-query @tanstack/react-table recharts
```

---

## Install Jobs / Monitoring

```bash
pnpm add inngest @sentry/nextjs
```

---

## Install PDF Tool

Choose one:

```bash
pnpm add playwright
```

or

```bash
pnpm add puppeteer
```

Recommended for server rendering:

```txt
Use Playwright or Puppeteer behind a server route/job only.
```

---

## Install Testing

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom playwright
```

---

## Install Utilities

```bash
pnpm add date-fns
```

---

# 26. First Build Order

AI must follow this order:

```txt
1. Project setup
2. Environment setup
3. Prisma setup
4. Company/User/CompanyMember
5. Permission helpers
6. Audit log
7. Customer + Customer Site
8. Product Catalog
9. Supplier + Supplier Product
10. Fleet foundation
11. Customer Order
12. Pricing Engine
13. BOQ
14. Document foundation
15. Quotation
16. Order split
17. Supplier PO
18. Transport job
19. Delivery proof
20. Invoice
21. Payment
22. Receipt
23. Debt
24. Settlement
25. Dashboard
26. Automation
```

---

# 27. What Not To Build First

Do not start with:

```txt
Advanced dashboard
LINE automation
Bank reconciliation
Auto fleet matching
Mobile app
Advanced analytics
Settlement
Realtime map tracking
```

Build these later, after the core order → BOQ → quotation → PO → invoice flow works.

---

# 28. Security Rules

```txt
All protected APIs require authentication.
All resource access requires permission checks.
companyId must come from session.
Never accept companyId from frontend as source of truth.
Customer must not see supplier cost.
Supplier must not see other supplier POs.
Fleet must not see unrelated transport jobs.
Financial mutation must create audit log.
Document number must be server-side.
Private files must use signed URLs.
Service role key must never reach client.
```

---

# 29. Financial Safety Rules

```txt
Use Decimal for money.
Do not use Float for money.
VAT calculation must be centralized.
Payment balance must be centralized.
Invoice paid status must come from paymentEngine.
Receipt requires confirmed payment.
Paid invoice must not be edited directly.
Receipt must be locked after issue.
Price changes must create price history.
Settlement changes after approval require adjustment.
```

---

# 30. API Documentation File

API details are documented separately in:

```txt
/API_DESCRIPTION.md
```

AI must read it before creating endpoints.

---

# 31. Progress Tracking File

Progress tracking is documented in:

```txt
/PROJECT_PROGRESS.md
```

AI must update it after completing steps.

---

# 32. Prompt File

Step-by-step prompts are documented in:

```txt
/AI_STEP_PROMPTS.md
```

AI should follow prompts by phase.

---

# 33. Agent Rules File

General coding agent rules are documented in:

```txt
/AGENT.md
```

AI must read it first before coding.

---

# 34. Recommended Root Files

The root of the project should contain:

```txt
AGENT.md
PROJECT_PROGRESS.md
AI_STEP_PROMPTS.md
API_DESCRIPTION.md
TECH_STACK.md
README.md
.env.example
package.json
prisma/schema.prisma
```

---

# 35. Final Stack Short Version

```txt
Next.js + TypeScript
Supabase PostgreSQL + Auth + Storage + Realtime + RLS
Prisma ORM
Tailwind CSS + shadcn/ui
React Hook Form + Zod
TanStack Query + TanStack Table
Recharts
Playwright/Puppeteer PDF
Inngest background jobs
Sentry monitoring
Vercel deployment
pnpm + GitHub
```

---

# 36. Final Instruction For AI

When AI starts work:

```txt
1. Read AGENT.md
2. Read PROJECT_PROGRESS.md
3. Read TECH_STACK.md
4. Read API_DESCRIPTION.md if creating APIs
5. Read AI_STEP_PROMPTS.md for the current step
6. Do only the current unfinished step
7. Do not skip ahead
8. Update PROJECT_PROGRESS.md after finishing
```

---

# END OF TECH STACK

---

# UPDATE — LINE-First Tools & Realtime Dashboard Additions

## Additional Recommended Tools

```txt
LINE Messaging API
LINE LIFF
LINE Rich Menu
LINE Flex Message
Supabase Realtime
line_action_tokens table
line_notification_logs table
event_logs table
```

## UI Strategy Update

```txt
Admin: desktop-first, dashboard/table/detail heavy
Partner: LINE-first, mobile action pages
Customer: LINE-first, mobile action pages
Fleet/Driver: LINE-first, mobile action pages
```

## Additional Modules

```txt
Partner Product Submission
Supplier Inventory
Supplier Inventory Movement
Product Approval Flow
LINE Action Handler
LINE Notification Template Registry
Project Model
Document Group Model
Document Reference Engine
Real-time Debt Dashboard
Document Search
Project Document Timeline
```

## Realtime Events

```txt
supplier_product.submitted
supplier_product.approved
supplier_product.stock_updated
order.created
quotation.confirmed
supplier_po.confirmed
transport_job.status_changed
invoice.created
payment.confirmed
debt.overdue
alert.created
```
