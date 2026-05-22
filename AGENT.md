# DNA OS Construction Commerce Platform — System Blueprint

เอกสารนี้ออกแบบสำหรับใช้เป็นไฟล์หลักใน VSCode เพื่อเริ่มพัฒนาระบบ **DNA OS Construction Commerce Platform**

ระบบนี้คือแพลตฟอร์มกลางสำหรับงานรับเหมาก่อสร้างและวัสดุก่อสร้าง โดยมีคุณเป็น **Core Operator** เชื่อมระหว่าง:

- ลูกค้า
- พาร์ทเนอร์ขายวัสดุ
- รถร่วม / พาร์ทเนอร์ขนส่ง
- ระบบเอกสาร
- ระบบจัดซื้อ
- ระบบการเงิน
- ระบบติดตามหนี้
- Dashboard ควบคุมงานทั้งหมด

---

## 1. Product Vision

ระบบนี้ไม่ใช่แค่ระบบออกเอกสาร แต่เป็น:

```txt
Construction Marketplace
+ Procurement Control
+ Logistics / Fleet Dispatch
+ Document Control
+ Finance & Debt Control
+ Partner Operating System
```

หลักการสำคัญ:

```txt
ข้อมูลเกิดครั้งเดียว ถูกใช้ทั้งระบบ
```

ข้อมูลลูกค้า, รายการสินค้า, BOQ, ใบเสนอราคา, ใบสั่งซื้อ, ใบแจ้งหนี้, ใบเสร็จ, การชำระเงิน, งานขนส่ง และ Dashboard ต้องเชื่อมถึงกันทั้งหมด

---

## 2. Business Model

คุณเป็นตัวกลางระหว่าง 3 ฝั่งหลัก

```txt
Customer
ลูกค้าเลือกสินค้า / ขอราคา / สั่งซื้อ / ชำระเงิน / ติดตามสถานะ

Core Platform
ระบบของคุณคุมสินค้า ราคา เอกสาร supplier logistics finance dashboard

Partner / Supplier
พาร์ทเนอร์ลงขายสินค้า รับ PO ยืนยันสินค้า ส่งของ รับเงิน

Fleet / Truck Partner
รถร่วมเพิ่มรถ เปิด-ปิดรับคิว รับงานขนส่ง อัปเดตสถานะ และรับเงิน
```

---

## 3. Example Use Case

ลูกค้าสั่งสินค้า:

```txt
ทราย 5 คิว
หิน 30 คิว
ดิน 4 คิว
```

ระบบต้องทำงานดังนี้:

```txt
1. ลูกค้าเลือกสินค้าจากหน้าบ้าน
2. ระบบสร้าง Customer Order
3. ระบบหา supplier ที่เหมาะสม
4. ระบบแยกรายการตาม supplier
5. ระบบสร้างใบสั่งซื้อให้แต่ละบริษัท
6. ระบบสร้างงานขนส่งถ้าต้องใช้รถร่วม
7. ระบบออก BOQ / ใบเสนอราคา
8. ลูกค้ายืนยัน
9. supplier ยืนยันสินค้า
10. รถร่วมรับงาน
11. ส่งของ
12. ออกใบแจ้งหนี้ / ใบกำกับ / ใบเสร็จ
13. บันทึกการชำระเงิน
14. Dashboard อัปเดตทั้งหมด
```

ตัวอย่างการ split:

```txt
Customer Order #ORD-001

Items:
- ทราย 5 คิว
- หิน 30 คิว
- ดิน 4 คิว

Supplier PO #PO-001 → บริษัท A
- ทราย 5 คิว

Supplier PO #PO-002 → บริษัท B
- หิน 30 คิว
- ดิน 4 คิว

Transport Job #TRK-001
- ขนดิน 4 คิว
- เลือกรถที่เปิดรับคิว
```

---

## 4. Recommended Technology Stack

### Best Overall Stack

```txt
Framework: Next.js
Language: TypeScript
Database: PostgreSQL
Backend Platform: Supabase
ORM: Prisma
UI: Tailwind CSS + shadcn/ui
Forms: React Hook Form + Zod
Server State: TanStack Query
PDF Generation: Puppeteer / Playwright PDF
Background Jobs: Inngest
Realtime: Supabase Realtime
Storage: Supabase Storage
Monitoring: Sentry
Deployment: Vercel
```

---

## 5. Infrastructure Overview

```txt
┌──────────────────────────────────────────────────────────────┐
│                           USERS                              │
├──────────────────────────────────────────────────────────────┤
│ Customer │ Supplier Partner │ Fleet Partner │ Admin / Core   │
└──────────┬──────────────────┬───────────────┬────────────────┘
           │                  │               │
           ▼                  ▼               ▼
┌──────────────────────────────────────────────────────────────┐
│                       Next.js Web App                        │
│ Customer Storefront │ Partner Portal │ Fleet Portal │ Admin  │
└──────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│                    Next.js Server Layer                      │
│ Server Actions │ Route Handlers │ Validation │ Permissions   │
└──────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│                     Core Domain Services                     │
│ Order │ Split │ Pricing │ Procurement │ Logistics │ Finance  │
│ Document │ Payment │ Debt │ Audit │ Notification │ Dashboard │
└──────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│                    Supabase / PostgreSQL                     │
│ Auth │ RLS │ Database │ Storage │ Realtime │ Edge Functions  │
└──────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│                       Background Jobs                        │
│ PDF │ LINE │ Overdue │ Debt Snapshot │ Reconciliation        │
└──────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│                    External Integrations                     │
│ LINE │ Bank SMS/Email │ Payment Slip │ Map / Routing         │
└──────────────────────────────────────────────────────────────┘
```

---

## 6. Application Portals

### 6.1 Customer Storefront

สำหรับลูกค้า

Features:

```txt
- สมัครสมาชิก / เข้าสู่ระบบ
- เลือกสินค้า
- เลือกจำนวน
- เลือกไซต์งาน / ที่อยู่จัดส่ง
- เลือกวันที่ต้องการรับสินค้า
- ขอใบเสนอราคา
- ยืนยันคำสั่งซื้อ
- ดูสถานะ order
- ดูสถานะขนส่ง
- ดาวน์โหลดเอกสาร
- แจ้งชำระเงิน
```

Routes:

```txt
/customer
/customer/catalog
/customer/cart
/customer/checkout
/customer/orders
/customer/orders/[id]
/customer/documents
/customer/payments
```

---

### 6.2 Supplier Partner Portal

สำหรับพาร์ทเนอร์ขายวัสดุ

Features:

```txt
- สมัครเป็นพาร์ทเนอร์
- เพิ่มสินค้า
- กำหนดราคา
- กำหนดพื้นที่ให้บริการ
- กำหนดขั้นต่ำการขาย
- เปิด-ปิดสถานะพร้อมขาย
- รับ PO จากระบบ
- ยืนยันสินค้า
- อัปเดตสถานะจัดเตรียมสินค้า
- แนบใบส่งของ
- ดูยอดขาย
- ดูยอดค้างรับ
```

Routes:

```txt
/partner
/partner/products
/partner/pricing
/partner/purchase-orders
/partner/purchase-orders/[id]
/partner/delivery-confirmations
/partner/payouts
```

---

### 6.3 Fleet / Truck Partner Portal

สำหรับรถร่วม

Features:

```txt
- สมัครเป็นพาร์ทเนอร์ขนส่ง
- เพิ่มประเภทรถ
- เพิ่มขนาดรถ
- เพิ่มทะเบียนรถ
- เพิ่มคนขับ
- เปิด-ปิดรับคิว
- รับงานขนส่ง
- ปฏิเสธงาน
- อัปเดตสถานะงาน
- แนบรูปหน้างาน
- แนบใบชั่ง / ใบส่งของ
- ดูรายได้
```

Routes:

```txt
/fleet
/fleet/vehicles
/fleet/availability
/fleet/jobs
/fleet/jobs/[id]
/fleet/earnings
```

---

### 6.4 Admin / Core Backoffice

สำหรับคุณและทีมงาน

Features:

```txt
- Dashboard รวม
- จัดการลูกค้า
- จัดการพาร์ทเนอร์
- จัดการรถร่วม
- จัดการสินค้า
- จัดการราคา
- อนุมัติ order
- Split order ไปยัง supplier
- สร้าง PO
- สร้าง BOQ
- สร้างใบเสนอราคา
- สร้างใบแจ้งหนี้
- สร้างใบกำกับภาษี
- สร้างใบเสร็จ
- สร้างใบสำคัญจ่าย
- สร้างใบสั่งจ่าย
- ติดตามหนี้
- Reconcile payment
- ดู audit log
- ดู system health
```

Routes:

```txt
/admin/dashboard
/admin/orders
/admin/procurement
/admin/logistics
/admin/documents
/admin/projects
/admin/customers
/admin/partners
/admin/fleet
/admin/payments
/admin/debt
/admin/reconciliation
/admin/reports
/admin/settings
/admin/audit
/admin/system-health
```

---

## 7. Core Modules

### 7.1 Identity & Tenant Module

Entities:

```txt
Company
User
CompanyMember
Role
Permission
TenantProfile
```

Company Types:

```txt
CORE
CUSTOMER
SUPPLIER
FLEET
```

Roles:

```txt
OWNER
ADMIN
ACCOUNTANT
PROCUREMENT
OPERATION
CUSTOMER
SUPPLIER
FLEET_OWNER
DRIVER
VIEWER
```

Rules:

```txt
- companyId ต้องมาจาก session เท่านั้น
- ห้ามรับ companyId จาก frontend
- customer เห็นเฉพาะ order ของตัวเอง
- supplier เห็นเฉพาะ PO ของตัวเอง
- fleet partner เห็นเฉพาะ job ของตัวเอง
- admin/core เห็นข้อมูลของ platform
```

---

### 7.2 Catalog Module

Entities:

```txt
ProductCategory
Product
ProductVariant
Unit
SupplierProduct
SupplierPrice
ServiceArea
StockStatus
```

Example:

```txt
Category: วัสดุถม
Product: ทราย
Variant: ทรายหยาบ
Unit: คิว
SupplierProduct: บริษัท A ขายทรายหยาบ
SupplierPrice: 450 บาท / คิว
ServiceArea: ชลบุรี
```

Rules:

```txt
- Product กลางไม่ควรผูกกับ supplier เดียว
- Supplier แต่ละรายมีราคาของตัวเอง
- Supplier แต่ละรายมีพื้นที่ให้บริการของตัวเอง
- ต้องแยก customer price และ supplier cost
```

---

### 7.3 Customer Order Module

Entities:

```txt
CustomerOrder
CustomerOrderItem
OrderAddress
OrderRequirement
OrderStatusHistory
```

Order Status:

```txt
DRAFT
SUBMITTED
PRICING
QUOTED
CONFIRMED
PROCUREMENT
DISPATCHING
PARTIALLY_DELIVERED
DELIVERED
INVOICED
PAID
CANCELLED
```

---

### 7.4 Order Split Engine

หน้าที่:

```txt
- รับ CustomerOrder
- ตรวจ supplier ที่ขายสินค้า
- ตรวจพื้นที่ให้บริการ
- ตรวจ availability
- เลือก supplier ที่เหมาะสม
- รวม item ที่ supplier เดียวกัน
- สร้าง SupplierPurchaseOrder
- สร้าง TransportRequirement
- คำนวณต้นทุน
- คำนวณ margin
```

Pseudo Code:

```ts
export function splitOrder(orderItems, supplierRules) {
  const groups = {};

  for (const item of orderItems) {
    const supplier = selectBestSupplier(item, supplierRules);

    if (!groups[supplier.id]) {
      groups[supplier.id] = [];
    }

    groups[supplier.id].push(item);
  }

  return Object.entries(groups).map(([supplierId, items]) => ({
    supplierId,
    items,
  }));
}
```

Supplier selection criteria:

```txt
- มีสินค้า
- อยู่ในพื้นที่บริการ
- ราคาดี
- lead time สั้น
- rating ดี
- พร้อมส่ง
- margin เหมาะสม
```

---

### 7.5 Procurement Module

Entities:

```txt
SupplierPurchaseOrder
SupplierPurchaseOrderItem
SupplierConfirmation
GoodsReceiveNote
SupplierBill
SupplierPayment
```

PO Status:

```txt
DRAFT
SENT
ACKNOWLEDGED
CONFIRMED
PARTIALLY_FULFILLED
FULFILLED
BILLED
PAID
CANCELLED
```

Documents:

```txt
PO  - ใบสั่งซื้อ / ใบจัดซื้อ
PV  - ใบสำคัญจ่าย
PMT - ใบสั่งจ่าย
```

---

### 7.6 Logistics / Fleet Module

Entities:

```txt
FleetPartner
Vehicle
VehicleType
VehicleCapacity
Driver
VehicleAvailability
TransportJob
TransportJobStop
DeliveryProof
QueueSlot
```

Transport Job Status:

```txt
CREATED
SEARCHING_TRUCK
ASSIGNED
ACCEPTED
GOING_TO_PICKUP
ARRIVED_PICKUP
LOADED
IN_TRANSIT
ARRIVED_SITE
DELIVERED
PROOF_UPLOADED
COMPLETED
CANCELLED
FAILED
```

Vehicle Availability:

```txt
OPEN
BUSY
OFFLINE
MAINTENANCE
BLOCKED
```

Vehicle Example:

```txt
รถสิบล้อ
ทะเบียน: 83-1234
Capacity: 10 คิว
รับคิววันนี้: เปิด
พื้นที่: ชลบุรี / ระยอง
```

---

### 7.7 Pricing & Margin Module

ระบบต้องแยก 3 ราคา:

```txt
Supplier Cost
ราคาทุนจากพาร์ทเนอร์

Transport Cost
ต้นทุนรถร่วม

Customer Sell Price
ราคาขายให้ลูกค้า
```

Formula:

```txt
Customer Price =
Supplier Cost
+ Transport Cost
+ Platform Margin
+ Risk Buffer
+ VAT
```

Entities:

```txt
PriceBook
PriceRule
CustomerPriceOverride
SupplierCostRule
TransportRateCard
MarginRule
```

Pricing Rules:

```txt
- markup เป็น %
- markup เป็นจำนวนเงินต่อหน่วย
- ราคาตามพื้นที่
- ราคาตามปริมาณ
- ราคาตาม supplier
- ราคาพิเศษรายลูกค้า
- minimum order
- delivery fee
```

---

### 7.8 BOQ Module

BOQ ควรมี 2 แบบ:

```txt
Customer BOQ
แสดงราคาขายให้ลูกค้า

Internal Cost BOQ
ใช้ภายในเพื่อดูต้นทุนและกำไร
```

Entities:

```txt
BOQ
BOQItem
BOQCostBreakdown
BOQVersion
```

Example:

```txt
Customer BOQ
- ทราย 5 คิว x 650 = 3,250
- หิน 30 คิว x 720 = 21,600
- ดิน 4 คิว x 500 = 2,000

Internal BOQ
- ทราย supplier cost 450 x 5 = 2,250
- หิน supplier cost 520 x 30 = 15,600
- ดิน supplier cost 300 x 4 = 1,200
- transport cost = 1,500
- gross margin = ...
```

---

### 7.9 Document Module

Documents:

```txt
BOQ  - Bill of Quantities
QT   - ใบเสนอราคา
INV3 - ใบแจ้งหนี้ / ใบกำกับ / ใบเสร็จ
INV  - ใบแจ้งหนี้
RCT  - ใบเสร็จรับเงิน
PV   - ใบสำคัญจ่าย
PMT  - ใบสั่งจ่าย
PO   - ใบจัดซื้อ / ใบสั่งซื้อ
```

Customer Document Flow:

```txt
BOQ
  ↓
Quotation
  ↓
Invoice / Tax Invoice
  ↓
Receipt
```

Supplier Document Flow:

```txt
Purchase Order
  ↓
Goods Received / Delivery Proof
  ↓
Payment Voucher
  ↓
Payment Order
  ↓
Supplier Paid
```

Fleet Document Flow:

```txt
Transport Job
  ↓
Delivery Proof
  ↓
Fleet Payment Voucher
  ↓
Fleet Payment Order
```

---

### 7.10 Payment & Reconciliation Module

Incoming payment:

```txt
Customer Invoice
Customer Payment
Receipt
Debt / Collection
Bank Transaction
Reconciliation Match
```

Outgoing payment:

```txt
Supplier Bill
Payment Voucher
Payment Order
Supplier Payment
Fleet Payout
```

Payment Status:

```txt
UNPAID
PARTIAL
PAID
OVERPAID
REFUNDED
CANCELLED
```

---

### 7.11 Debt & Collection Module

Collection States:

```txt
CURRENT
OVERDUE
WARNING
COLLECTION
PROMISED
PARTIAL
LEGAL
CLOSED
```

Flow:

```txt
ครบกำหนด
  ↓
เกินกำหนด
  ↓
แจ้งเตือน
  ↓
โทรติดตาม
  ↓
คำสัญญาชำระ
  ↓
ชำระบางส่วน
  ↓
ปิดหนี้ / ดำเนินการทางกฎหมาย
```

---

### 7.12 Notification Module

Channels:

```txt
LINE
Email
In-app notification
Dashboard alert
Webhook
```

Events:

```txt
order.created
order.quoted
order.confirmed
supplier_po.created
supplier_po.confirmed
transport_job.created
transport_job.assigned
transport_job.delivered
document.invoice.created
payment.received
payment.reconciled
debt.overdue
```

---

## 8. Database Design

### 8.1 Companies

```sql
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tax_id text,
  address text,
  phone text,
  email text,
  bank_name text,
  bank_account_no text,
  type text not null check (type in ('CORE', 'CUSTOMER', 'SUPPLIER', 'FLEET')),
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

### 8.2 Users

```sql
create table users (
  id uuid primary key,
  email text not null unique,
  name text,
  phone text,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now()
);
```

---

### 8.3 Company Members

```sql
create table company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  user_id uuid not null references users(id),
  role text not null,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  unique(company_id, user_id)
);
```

---

### 8.4 Product Catalog

```sql
create table product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  sort_order int not null default 0
);

create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references product_categories(id),
  name text not null,
  description text,
  default_unit text not null,
  is_active boolean not null default true
);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id),
  name text not null,
  unit text not null,
  specs jsonb not null default '{}',
  is_active boolean not null default true
);
```

---

### 8.5 Supplier Products

```sql
create table supplier_products (
  id uuid primary key default gen_random_uuid(),
  supplier_company_id uuid not null references companies(id),
  product_variant_id uuid not null references product_variants(id),
  sku text,
  price numeric(14,2) not null default 0,
  min_qty numeric(14,3) not null default 0,
  service_area text,
  lead_time_hours int,
  is_available boolean not null default true,
  updated_at timestamptz not null default now()
);
```

---

### 8.6 Customer Orders

```sql
create table customer_orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique,
  customer_company_id uuid not null references companies(id),
  project_id uuid,
  site_address text,
  requested_delivery_date date,
  status text not null default 'DRAFT',
  subtotal numeric(14,2) not null default 0,
  vat numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  internal_cost numeric(14,2) not null default 0,
  gross_margin numeric(14,2) not null default 0,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table customer_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references customer_orders(id),
  product_variant_id uuid references product_variants(id),
  description text not null,
  qty numeric(14,3) not null,
  unit text not null,
  customer_unit_price numeric(14,2) not null default 0,
  customer_amount numeric(14,2) not null default 0,
  selected_supplier_id uuid references companies(id),
  supplier_unit_cost numeric(14,2) not null default 0,
  supplier_cost_amount numeric(14,2) not null default 0,
  transport_required boolean not null default false
);
```

---

### 8.7 Supplier Purchase Orders

```sql
create table supplier_purchase_orders (
  id uuid primary key default gen_random_uuid(),
  po_no text not null unique,
  customer_order_id uuid references customer_orders(id),
  supplier_company_id uuid not null references companies(id),
  status text not null default 'DRAFT',
  subtotal numeric(14,2) not null default 0,
  vat numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  sent_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create table supplier_purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  supplier_po_id uuid not null references supplier_purchase_orders(id),
  customer_order_item_id uuid references customer_order_items(id),
  product_variant_id uuid references product_variants(id),
  description text not null,
  qty numeric(14,3) not null,
  unit text not null,
  unit_cost numeric(14,2) not null,
  amount numeric(14,2) not null
);
```

---

### 8.8 Fleet / Transport

```sql
create table fleet_partners (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  status text not null default 'ACTIVE',
  rating numeric(3,2)
);

create table vehicle_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text
);

create table vehicles (
  id uuid primary key default gen_random_uuid(),
  fleet_partner_id uuid not null references fleet_partners(id),
  vehicle_type_id uuid references vehicle_types(id),
  plate_no text not null,
  capacity_value numeric(14,3),
  capacity_unit text,
  status text not null default 'OPEN',
  is_accepting_queue boolean not null default true
);

create table vehicle_availability (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id),
  date date not null,
  start_time time,
  end_time time,
  max_jobs int,
  status text not null default 'OPEN'
);

create table transport_jobs (
  id uuid primary key default gen_random_uuid(),
  job_no text not null unique,
  customer_order_id uuid references customer_orders(id),
  supplier_po_id uuid references supplier_purchase_orders(id),
  assigned_fleet_partner_id uuid references fleet_partners(id),
  assigned_vehicle_id uuid references vehicles(id),
  pickup_address text,
  dropoff_address text,
  status text not null default 'CREATED',
  scheduled_pickup_at timestamptz,
  scheduled_delivery_at timestamptz,
  transport_cost numeric(14,2) not null default 0,
  customer_delivery_fee numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table delivery_proofs (
  id uuid primary key default gen_random_uuid(),
  transport_job_id uuid not null references transport_jobs(id),
  proof_type text not null,
  file_url text,
  note text,
  uploaded_by uuid references users(id),
  uploaded_at timestamptz not null default now()
);
```

---

### 8.9 Documents

```sql
create table documents (
  id uuid primary key default gen_random_uuid(),
  doc_no text not null unique,
  doc_type text not null,
  status text not null default 'draft',
  version int not null default 1,
  parent_doc_id uuid references documents(id),
  customer_order_id uuid references customer_orders(id),
  supplier_po_id uuid references supplier_purchase_orders(id),
  project_id uuid,
  company_id uuid not null references companies(id),
  counterparty_company_id uuid references companies(id),
  issue_date date not null default current_date,
  due_date date,
  vat_mode text not null default 'EXCL',
  subtotal numeric(14,2) not null default 0,
  vat numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  notes text,
  pdf_url text,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_archived boolean not null default false
);

create table document_items (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id),
  seq int not null,
  description text not null,
  qty numeric(14,3) not null,
  unit text not null,
  unit_price numeric(14,2) not null,
  amount numeric(14,2) not null,
  source_ref_type text,
  source_ref_id uuid
);
```

---

### 8.10 Payments

```sql
create table payments (
  id uuid primary key default gen_random_uuid(),
  payment_no text not null unique,
  direction text not null check (direction in ('IN', 'OUT')),
  company_id uuid not null references companies(id),
  counterparty_company_id uuid references companies(id),
  document_id uuid references documents(id),
  order_id uuid references customer_orders(id),
  amount numeric(14,2) not null,
  method text not null,
  paid_at timestamptz,
  bank_account_id uuid,
  reference text,
  status text not null default 'PENDING',
  created_at timestamptz not null default now()
);

create table bank_transactions (
  id uuid primary key default gen_random_uuid(),
  bank text,
  amount numeric(14,2) not null,
  sender text,
  tx_date date,
  raw_text text,
  hash text not null unique,
  parsed boolean not null default false,
  created_at timestamptz not null default now()
);

create table reconciliation_matches (
  id uuid primary key default gen_random_uuid(),
  bank_transaction_id uuid references bank_transactions(id),
  payment_id uuid references payments(id),
  document_id uuid references documents(id),
  score int not null default 0,
  confidence text not null default 'NONE',
  status text not null default 'PENDING',
  matched_by uuid references users(id),
  matched_at timestamptz
);
```

---

### 8.11 Audit / Workflow / Notification

```sql
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references users(id),
  company_id uuid references companies(id),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  field text,
  old_value text,
  new_value text,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table workflow_instances (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  status text not null default 'pending',
  current_step int not null default 0,
  created_at timestamptz not null default now()
);

create table workflow_steps (
  id uuid primary key default gen_random_uuid(),
  workflow_instance_id uuid not null references workflow_instances(id),
  seq int not null,
  approver_role text,
  approver_user_id uuid references users(id),
  status text not null default 'waiting',
  decided_at timestamptz,
  comment text
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id),
  user_id uuid references users(id),
  type text not null,
  channel text not null,
  title text,
  message text,
  status text not null default 'queued',
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table system_health_events (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  message text not null,
  context jsonb not null default '{}',
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);
```

---

### 8.12 Document Counters

```sql
create table document_counters (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  prefix text not null,
  year int not null,
  month int not null,
  current_seq int not null default 0,
  updated_at timestamptz not null default now(),
  unique(company_id, prefix, year, month)
);
```

Rules:

```txt
- สร้างเลขเอกสารจาก server เท่านั้น
- ใช้ database transaction
- lock counter row ก่อน increment
- ห้ามสร้างเลขจาก frontend
```

---

## 9. ERD Overview

```txt
Company
  ├── Users through CompanyMember
  ├── SupplierProducts
  ├── FleetPartners
  ├── CustomerOrders
  ├── Documents
  └── Payments

CustomerOrder
  ├── CustomerOrderItems
  ├── SupplierPurchaseOrders
  ├── TransportJobs
  ├── BOQ
  ├── Quotation
  ├── Invoice
  └── Receipt

SupplierPurchaseOrder
  ├── SupplierPurchaseOrderItems
  ├── TransportJobs
  ├── SupplierBill
  ├── PaymentVoucher
  └── PaymentOrder

TransportJob
  ├── Vehicle
  ├── FleetPartner
  ├── DeliveryProofs
  └── TransportPayment

Document
  ├── DocumentItems
  ├── Parent Document
  ├── Child Documents
  ├── Payments
  └── AuditLogs

BankTransaction
  └── ReconciliationMatch
        ├── Document
        └── Payment
```

---

## 10. Core Engines

ระบบควรมี engines เหล่านี้

```txt
numberingEngine
statusEngine
calculationEngine
paymentEngine
collectionEngine
documentRelationEngine
auditEngine
notificationEngine
workflowEngine
documentEngine
automationEngine
tenantEngine
masterDataGuard
bankSMSEngine
reconciliationEngine
idempotencyEngine

catalogEngine
pricingEngine
supplierSelectionEngine
orderSplitEngine
procurementEngine
fleetMatchingEngine
dispatchEngine
deliveryProofEngine
settlementEngine
commissionEngine
inventoryAvailabilityEngine
routeCostEngine
```

---

## 11. Engine Responsibilities

### numberingEngine

```txt
- สร้างเลขเอกสาร
- สร้างเลข order
- สร้างเลข PO
- สร้างเลข transport job
- ใช้ database counter ใน production
```

### calculationEngine

```txt
- subtotal
- VAT
- WHT
- total
- interest
- balance
- margin
```

### pricingEngine

```txt
- คำนวณราคาขาย
- คำนวณต้นทุน
- คำนวณ transport cost
- คำนวณ margin
- apply customer override
```

### supplierSelectionEngine

```txt
- เลือก supplier ตามสินค้า
- ตรวจพื้นที่
- ตรวจ availability
- เปรียบเทียบราคา
- เลือก best supplier
```

### orderSplitEngine

```txt
- แยก order ตาม supplier
- รวม item ของ supplier เดียวกัน
- เตรียมข้อมูลสร้าง PO
```

### procurementEngine

```txt
- สร้าง Supplier PO
- ส่ง PO ให้ supplier
- รับ confirmation
- track fulfillment
```

### fleetMatchingEngine

```txt
- หา vehicle ที่เปิดรับคิว
- ตรวจ capacity
- ตรวจพื้นที่
- ตรวจ availability
- เลือกรถที่เหมาะสม
```

### dispatchEngine

```txt
- assign transport job
- update job status
- track pickup/delivery
```

### documentEngine

```txt
- สร้างเอกสารจาก order / PO / payment
- snapshot item
- version document
- generate PDF event
```

### paymentEngine

```txt
- total paid
- balance
- payment status
- partial payment
- overpayment
```

### reconciliationEngine

```txt
- match bank transaction กับ invoice
- score confidence
- prevent duplicate
```

### collectionEngine

```txt
- ตรวจ overdue
- auto collection state
- next action
- debt workflow
```

### auditEngine

```txt
- สร้าง audit entry
- log financial change
- log document status change
```

---

## 12. API Design

### Customer APIs

```txt
POST /api/customer/orders
GET  /api/customer/orders
GET  /api/customer/orders/:id
POST /api/customer/orders/:id/confirm
POST /api/customer/payments/slip
GET  /api/customer/documents
```

### Partner APIs

```txt
POST /api/partner/products
GET  /api/partner/products
PATCH /api/partner/products/:id
GET  /api/partner/purchase-orders
POST /api/partner/purchase-orders/:id/confirm
POST /api/partner/purchase-orders/:id/reject
```

### Fleet APIs

```txt
POST /api/fleet/vehicles
GET  /api/fleet/vehicles
PATCH /api/fleet/vehicles/:id/availability
GET  /api/fleet/jobs
POST /api/fleet/jobs/:id/accept
POST /api/fleet/jobs/:id/reject
POST /api/fleet/jobs/:id/status
POST /api/fleet/jobs/:id/proof
```

### Admin APIs

```txt
GET  /api/admin/dashboard
GET  /api/admin/orders
POST /api/admin/orders/:id/price
POST /api/admin/orders/:id/split
POST /api/admin/orders/:id/confirm
POST /api/admin/documents
POST /api/admin/documents/:id/approve
POST /api/admin/payments
POST /api/admin/reconciliation/match
GET  /api/admin/audit
GET  /api/admin/system-health
```

### Webhooks

```txt
POST /api/webhooks/line
POST /api/webhooks/bank-email
POST /api/webhooks/inngest
```

---

## 13. Permission Matrix

| Role | Scope |
|---|---|
| OWNER | เห็นทุกอย่าง ตั้งค่าระบบ อนุมัติเอกสาร ดูการเงินทั้งหมด |
| ADMIN | จัดการ operation, order, supplier, fleet, documents |
| ACCOUNTANT | invoice, payment, debt, receipt, PV, PMT |
| PROCUREMENT | PO, supplier, cost, procurement |
| OPERATION | order, transport, delivery |
| CUSTOMER | order/document/payment ของตัวเอง |
| SUPPLIER | product และ PO ของตัวเอง |
| FLEET_OWNER | vehicle และ transport job ของตัวเอง |
| DRIVER | job ที่ได้รับมอบหมาย |
| VIEWER | อ่านอย่างเดียว |

Rules:

```txt
- Permission ต้องเช็กทั้ง application layer และ database RLS
- Financial actions ต้องมี audit log
- Approval actions ต้อง permission-gated
```

---

## 14. Dashboard Design

### Executive Dashboard

```txt
- ยอดขายวันนี้
- ยอดขายเดือนนี้
- จำนวน order ใหม่
- order รอดำเนินการ
- gross margin
- ลูกหนี้ค้างชำระ
- เจ้าหนี้ supplier
- งานขนส่งที่กำลังวิ่ง
- งานล่าช้า
- เอกสารรออนุมัติ
```

### Operation Dashboard

```txt
- order pipeline
- supplier PO status
- transport job status
- delivery proof missing
- supplier not confirmed
- truck not assigned
- delayed delivery
```

### Finance Dashboard

```txt
- invoice issued
- unpaid invoice
- paid invoice
- overdue invoice
- partial payment
- payment waiting reconcile
- supplier payable
- fleet payable
```

### Partner Dashboard

```txt
- PO ใหม่
- PO รอยืนยัน
- งานที่ต้องส่ง
- ยอดขาย
- ยอดรอรับเงิน
```

### Fleet Dashboard

```txt
- คิววันนี้
- รถที่เปิดรับงาน
- รถที่กำลังวิ่ง
- งานรอยืนยัน
- งานส่งสำเร็จ
- รายได้รอจ่าย
```

---

## 15. Storage Design

Use Supabase Storage

Buckets:

```txt
company-logos
document-pdfs
delivery-proofs
payment-slips
supplier-attachments
fleet-vehicle-docs
audit-exports
```

Files table:

```sql
create table files (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  path text not null,
  entity_type text,
  entity_id uuid,
  uploaded_by uuid references users(id),
  visibility text not null default 'private',
  created_at timestamptz not null default now()
);
```

Rules:

```txt
- เอกสาร PDF ต้อง private
- payment slip ต้อง private
- delivery proof ต้องเห็นเฉพาะฝ่ายเกี่ยวข้อง
- ใช้ signed URL หรือ storage policy
```

---

## 16. PDF Infrastructure

Workflow:

```txt
Document created
  ↓
Snapshot document data
  ↓
Generate HTML preview
  ↓
Generate PDF
  ↓
Upload to Supabase Storage
  ↓
Save pdf_url
  ↓
Create audit log
```

Rules:

```txt
- แก้เอกสารต้องเพิ่ม version
- PDF เดิมห้ามถูกทับแบบเงียบ
- ใบกำกับภาษี / ใบเสร็จต้องระวังเลขเอกสาร
- เอกสารที่ paid หรือ issued แล้วควร lock
```

---

## 17. Background Jobs

Use Inngest

Jobs:

```txt
daily.debt.snapshot
invoice.overdue.check
notification.line.send
payment.reconciliation.run
document.pdf.generate
supplier.po.reminder
fleet.job.reminder
dashboard.metrics.refresh
```

---

## 18. Realtime Design

Realtime events:

```txt
new_order
supplier_confirmed_po
fleet_accepted_job
transport_status_changed
payment_reconciled
document_approved
```

Pattern:

```txt
Database change
  ↓
Event log
  ↓
Realtime notification
  ↓
Dashboard refresh
```

---

## 19. Audit & Compliance

ต้อง log:

```txt
- ใครสร้าง order
- ใครแก้ราคา
- ใครเลือก supplier
- ใครสร้าง PO
- ใครอนุมัติเอกสาร
- ใครเปลี่ยนสถานะ invoice
- ใครบันทึก payment
- ใคร reconcile
- ใคร archive record
```

Audit payload:

```json
{
  "actorUserId": "uuid",
  "companyId": "uuid",
  "entityType": "document",
  "entityId": "uuid",
  "action": "status_changed",
  "field": "status",
  "oldValue": "pending",
  "newValue": "approved",
  "ipAddress": "127.0.0.1",
  "userAgent": "browser",
  "createdAt": "timestamp"
}
```

---

## 20. Security Rules

Authentication:

```txt
- Email/password
- Magic link
- Optional 2FA for admin/accountant
```

Authorization:

```txt
- Role-based access
- Company-based access
- Entity-based access
- Database RLS
```

Financial Safety:

```txt
- เปลี่ยนยอดเงินต้องมี audit
- invoice paid แล้วห้ามแก้ยอดโดยตรง
- receipt issued แล้วต้อง lock
- document number ห้ามซ้ำ
- payment ต้อง reconcile ก่อนปิด invoice อัตโนมัติ
```

Data Safety:

```txt
- ห้ามรับ companyId จาก frontend
- supplier เห็นเฉพาะ PO ของตัวเอง
- customer เห็นเฉพาะ order ของตัวเอง
- fleet เห็นเฉพาะ job ของตัวเอง
- ใช้ signed URL สำหรับเอกสาร
```

---

## 21. Monitoring

Tools:

```txt
Sentry
Application logs
System health events
Business metrics
```

System health event examples:

```txt
LINE send failed
PDF generation failed
payment reconcile failed
supplier PO stuck
truck job delayed
invoice overdue
storage upload failed
```

---

## 22. Deployment Infrastructure

```txt
Vercel
- Next.js app
- Server Actions
- Route Handlers
- Admin/customer/partner/fleet portals

Supabase
- PostgreSQL
- Auth
- Storage
- Realtime
- RLS
- backups

Inngest
- background jobs
- retries
- scheduled tasks

Sentry
- error monitoring

LINE
- notification channel

Bank Email/SMS Parser
- inbound parsing
- reconciliation
```

---

## 23. Environments

```txt
development
staging
production
```

Environment Variables:

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

---

## 24. Recommended Project Structure

```txt
src/
  app/
    customer/
      catalog/
      cart/
      checkout/
      orders/
      documents/

    partner/
      products/
      purchase-orders/
      payouts/

    fleet/
      vehicles/
      availability/
      jobs/
      earnings/

    admin/
      dashboard/
      orders/
      procurement/
      logistics/
      documents/
      payments/
      debt/
      reconciliation/
      reports/
      settings/

    api/
      webhooks/
        line/
        bank/
        inngest/
      pdf/
      documents/

  core/
    constants/
    engines/
      calculationEngine.ts
      documentEngine.ts
      workflowEngine.ts
      collectionEngine.ts
      paymentEngine.ts
      orderSplitEngine.ts
      pricingEngine.ts
      supplierSelectionEngine.ts
      fleetMatchingEngine.ts
      reconciliationEngine.ts
      settlementEngine.ts

    schemas/
      order.schema.ts
      product.schema.ts
      document.schema.ts
      payment.schema.ts

    permissions/
      roles.ts
      policies.ts

    utils/
      format.ts
      date.ts
      money.ts
      thaiTax.ts

  features/
    catalog/
    orders/
    procurement/
    logistics/
    documents/
    payments/
    debt/
    dashboard/
    partners/
    fleet/
    notifications/

  components/
    ui/
    layout/
    document/
    dashboard/

  server/
    db/
      prisma.ts
    actions/
    services/
    jobs/
    webhooks/

  prisma/
    schema.prisma
    migrations/
```

---

## 25. Development Roadmap

### Phase 1: MVP Core

Goal:

```txt
ลูกค้าสั่ง → คุณแตก supplier → ออกเอกสาร → บันทึก payment ได้
```

Build:

```txt
- Company profile
- Customer
- Product catalog
- Supplier
- Customer order
- Manual supplier split
- BOQ
- Quotation
- Invoice
- Receipt
- PDF export
- Basic dashboard
```

---

### Phase 2: Partner Portal

Goal:

```txt
พาร์ทเนอร์เข้ามาจัดการสินค้าและรับ PO เองได้
```

Build:

```txt
- Supplier login
- Supplier product
- Supplier price
- Supplier PO
- Supplier confirmation
- Supplier payout
```

---

### Phase 3: Fleet Portal

Goal:

```txt
รถร่วมเปิด-ปิดรับคิว และรับงานขนส่งผ่านระบบได้
```

Build:

```txt
- Fleet partner
- Vehicle type
- Vehicle availability
- Transport job
- Driver job status
- Delivery proof
```

---

### Phase 4: Automation

Build:

```txt
- LINE notification
- Overdue reminder
- PDF auto generation
- Bank transaction parser
- Auto reconciliation
- Daily debt snapshot
```

---

### Phase 5: Advanced Marketplace

Build:

```txt
- Auto supplier selection
- Auto fleet matching
- Dynamic pricing
- Partner rating
- Customer-specific price
- Margin optimization
- Advanced reports
```

---

## 26. Architecture Decision

Start with:

```txt
Next.js Modular Monolith
```

Do not start with microservices.

Why:

```txt
- พัฒนาเร็วกว่า
- debug ง่ายกว่า
- transaction ง่ายกว่า
- เหมาะกับทีมเล็ก
- แยก service ภายหลังได้
```

Can split later:

```txt
PDF service
Notification service
Reconciliation service
Fleet dispatch service
```

---

## 27. Coding Rules for Developers / AI Agents

```txt
1. Business logic must stay in engines.
2. React components should stay thin.
3. Do not calculate VAT directly in JSX.
4. Do not mutate document status directly.
5. Do not hard-delete financial records.
6. Do not accept companyId from UI.
7. Document numbers must be generated server-side.
8. Paid documents should be locked or versioned.
9. Payment reconciliation should be auditable.
10. Customer must not see supplier cost.
11. Supplier must not see other suppliers' PO.
12. Fleet partner must not see unrelated jobs.
13. All financial changes require audit logs.
14. Use TypeScript and Zod validation.
15. Add tests for engines before changing financial behavior.
```

---

## 28. Testing Plan

Unit tests:

```txt
calculationEngine
paymentEngine
pricingEngine
orderSplitEngine
supplierSelectionEngine
fleetMatchingEngine
documentEngine
collectionEngine
reconciliationEngine
idempotencyEngine
```

Integration tests:

```txt
Customer order creation
Order split to supplier POs
Document chain generation
Payment recording
Reconciliation matching
Transport job assignment
```

E2E tests:

```txt
Customer checkout flow
Admin creates quotation
Supplier confirms PO
Fleet accepts job
Invoice and receipt generation
Payment reconciliation
```

---

## 29. First Implementation Checklist

```txt
[ ] Create Next.js project
[ ] Install TypeScript
[ ] Install Tailwind CSS
[ ] Install shadcn/ui
[ ] Setup Supabase project
[ ] Setup Prisma
[ ] Create database schema
[ ] Setup Auth
[ ] Setup company/member model
[ ] Setup product catalog
[ ] Setup customer order
[ ] Setup supplier product
[ ] Setup order split engine
[ ] Setup document engine
[ ] Setup PDF generation
[ ] Setup payment model
[ ] Setup dashboard
```

---

## 30. Final Target Architecture

```txt
[Customer Storefront]
ลูกค้าสั่งสินค้า / ขอใบเสนอราคา / ติดตาม order

[Partner Portal]
พาร์ทเนอร์ลงสินค้า / รับ PO / ยืนยันสินค้า

[Fleet Portal]
รถร่วมลงรถ / เปิดปิดคิว / รับงานขนส่ง

[Admin Core]
คุณควบคุม order / supplier / fleet / document / finance

[Core Engines]
pricing, split, procurement, logistics, document, payment, debt, audit

[Database]
PostgreSQL + RLS + audit + document chain + payment records

[Storage]
PDF, payment slips, delivery proofs

[Jobs]
LINE, overdue, PDF generation, reconciliation, debt snapshot

[Dashboard]
operation, finance, partner, fleet, executive
```

---

## 31. Important Warnings

```txt
- อย่าให้ลูกค้าเห็นต้นทุน supplier
- อย่าให้ supplier เห็น order ทั้งหมด
- อย่าให้รถร่วมเห็นข้อมูลการเงินเกินจำเป็น
- อย่าแก้ invoice หลังออกใบเสร็จโดยไม่มี version
- อย่า hard delete
- อย่าคิด VAT หลายที่
- อย่าสร้างเลขเอกสารจาก frontend
- อย่าปิด invoice อัตโนมัติโดยไม่มี reconciliation หรือ confirmation
```

---

## 32. Suggested Repository Name

```txt
dna-os-construction-platform
```

---

## 33. Suggested App Name

```txt
DNA OS
Construction Commerce Operating System
```

---

## 34. Short Description

```txt
DNA OS is a construction commerce operating system for managing customer orders, supplier procurement, fleet dispatch, BOQ, quotation, invoice, receipt, payment, debt collection, and operational dashboards.
```



---

# 35. Additional Business-Critical Modules

ส่วนนี้คือข้อมูลที่ควรเพิ่มเพื่อให้ระบบพร้อมใช้งานจริงในธุรกิจรับเหมาก่อสร้าง / วัสดุก่อสร้าง / รถร่วม

---

## 35.1 Customer Site Module

ลูกค้า 1 รายอาจมีหลายไซต์งาน ดังนั้นไม่ควรเก็บแค่ `site_address` เป็น text ธรรมดา

### Purpose

```txt
ใช้จัดการสถานที่ส่งสินค้า / ไซต์งาน / จุดลงวัสดุ / ผู้ติดต่อหน้างาน
```

### Entity: CustomerSite

```sql
create table customer_sites (
  id uuid primary key default gen_random_uuid(),
  customer_company_id uuid not null references companies(id),
  site_name text not null,
  address text not null,
  province text,
  district text,
  subdistrict text,
  postal_code text,
  gps_lat numeric(10,7),
  gps_lng numeric(10,7),
  contact_name text,
  contact_phone text,
  delivery_note text,
  access_restriction text,
  preferred_delivery_time text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Example

```txt
Site: โครงการหมู่บ้าน ABC
Contact: คุณสมชาย / 081-xxx-xxxx
Note: รถสิบล้อเข้าได้เฉพาะประตู 2
Preferred Time: 08:00 - 11:00
```

### Rules

```txt
- Order ต้องอ้างอิง customer site
- Transport job ต้องใช้ site location จาก CustomerSite
- Delivery proof ควรผูกกับ site นี้
- ถ้าไซต์มีข้อจำกัดเรื่องรถ ต้องเอาไปใช้ตอน fleet matching
```

---

## 35.2 Credit Control Module

ลูกค้าบางรายอาจซื้อเงินเชื่อ ต้องมีระบบเครดิตและวงเงิน

### Purpose

```txt
ใช้ควบคุมวงเงิน เครดิตเทอม ยอดค้าง และการบล็อกคำสั่งซื้อ
```

### Entity: CustomerCreditProfile

```sql
create table customer_credit_profiles (
  id uuid primary key default gen_random_uuid(),
  customer_company_id uuid not null unique references companies(id),
  credit_limit numeric(14,2) not null default 0,
  credit_term_days int not null default 0,
  current_outstanding numeric(14,2) not null default 0,
  overdue_amount numeric(14,2) not null default 0,
  credit_status text not null default 'NORMAL',
  payment_behavior_score int not null default 100,
  updated_at timestamptz not null default now()
);
```

### Credit Status

```txt
NORMAL
WATCH
HOLD
BLOCKED
```

### Rules

```txt
- ถ้า current_outstanding > credit_limit → ต้องขออนุมัติ
- ถ้า overdue_amount > 0 → แสดง alert
- ถ้า credit_status = HOLD → order ใหม่ต้องให้ owner/admin อนุมัติ
- ถ้า credit_status = BLOCKED → ห้ามยืนยัน order ใหม่
- ลูกค้าที่จ่ายตรงเวลาควรมี payment_behavior_score สูงขึ้น
```

---

## 35.3 Supplier Contract Module

พาร์ทเนอร์ควรมีสัญญา ราคา และเงื่อนไขการซื้อขาย

### Purpose

```txt
ใช้เก็บข้อตกลงราคาซื้อ วงเงิน เงื่อนไขการจ่าย และช่วงเวลาที่ราคามีผล
```

### Entity: SupplierContract

```sql
create table supplier_contracts (
  id uuid primary key default gen_random_uuid(),
  supplier_company_id uuid not null references companies(id),
  contract_no text not null unique,
  start_date date not null,
  end_date date,
  payment_term_days int not null default 0,
  delivery_term text,
  price_validity text,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table supplier_contract_items (
  id uuid primary key default gen_random_uuid(),
  supplier_contract_id uuid not null references supplier_contracts(id),
  product_variant_id uuid not null references product_variants(id),
  unit_cost numeric(14,2) not null,
  min_qty numeric(14,3) not null default 0,
  max_qty numeric(14,3),
  service_area text,
  effective_from date not null,
  effective_to date,
  created_at timestamptz not null default now()
);
```

### Rules

```txt
- ระบบเลือกต้นทุนจาก contract ที่ active และ effective date ถูกต้อง
- ถ้าไม่มี contract ให้ใช้ supplier_products.price เป็น fallback
- ใบเสนอราคาต้อง snapshot ต้นทุน ณ วันที่ออกเอกสาร
```

---

## 35.4 Price History Module

ราคาวัสดุเปลี่ยนบ่อย ต้องเก็บประวัติราคา

### Purpose

```txt
ใช้ audit การเปลี่ยนราคาและตรวจสอบย้อนหลังว่า order หนึ่งใช้ราคาอะไร
```

### Entity: PriceHistory

```sql
create table price_histories (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  old_price numeric(14,2),
  new_price numeric(14,2) not null,
  changed_by uuid references users(id),
  reason text,
  effective_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
```

### Entity Types

```txt
SUPPLIER_PRICE
CUSTOMER_PRICE
TRANSPORT_RATE
MARGIN_RULE
```

### Rules

```txt
- ทุกครั้งที่แก้ supplier price ต้องสร้าง price history
- ทุกครั้งที่แก้ transport rate ต้องสร้าง price history
- ทุกครั้งที่แก้ customer price override ต้องสร้าง price history
- ห้ามแก้ราคาย้อนหลังโดยไม่มี audit reason
```

---

## 35.5 Transport Rate Card Module

ค่าขนส่งต้องมีโครงสร้าง ไม่ใช่กรอกใน job อย่างเดียว

### Purpose

```txt
ใช้คำนวณราคาขนส่งตามพื้นที่ ประเภทรถ ระยะทาง วัสดุ หรือรอบเที่ยว
```

### Entity: TransportRateCard

```sql
create table transport_rate_cards (
  id uuid primary key default gen_random_uuid(),
  fleet_partner_id uuid references fleet_partners(id),
  vehicle_type_id uuid references vehicle_types(id),
  from_area text,
  to_area text,
  product_type text,
  min_distance_km numeric(10,2),
  max_distance_km numeric(10,2),
  base_price numeric(14,2) not null default 0,
  price_per_km numeric(14,2) not null default 0,
  price_per_trip numeric(14,2) not null default 0,
  price_per_unit numeric(14,2) not null default 0,
  is_active boolean not null default true,
  effective_from date not null default current_date,
  effective_to date,
  created_at timestamptz not null default now()
);
```

### Pricing Modes

```txt
- ต่อเที่ยว
- ต่อกิโลเมตร
- ต่อคิว
- ตามพื้นที่
- ตามประเภทรถ
- ตามชนิดวัสดุ
```

---

## 35.6 Delivery Proof Checklist Module

หลักฐานการส่งของต้องครบเพื่อลดข้อโต้แย้ง

### Purpose

```txt
กำหนดว่า transport job แต่ละประเภทต้องใช้หลักฐานอะไรบ้าง
```

### Entity: ProofChecklist

```sql
create table proof_checklists (
  id uuid primary key default gen_random_uuid(),
  product_category_id uuid references product_categories(id),
  vehicle_type_id uuid references vehicle_types(id),
  require_photo_before_loading boolean not null default false,
  require_photo_after_loading boolean not null default false,
  require_photo_at_site boolean not null default true,
  require_scale_ticket boolean not null default false,
  require_delivery_note boolean not null default true,
  require_customer_signature boolean not null default false,
  require_gps_location boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
```

### Delivery Proof Types

```txt
PHOTO_BEFORE_LOADING
PHOTO_AFTER_LOADING
PHOTO_AT_SITE
SCALE_TICKET
DELIVERY_NOTE
CUSTOMER_SIGNATURE
GPS_LOCATION
OTHER
```

### Rules

```txt
- transport job จะ COMPLETED ไม่ได้ ถ้า proof ที่บังคับยังไม่ครบ
- ถ้ามี dispute ให้ใช้ proof เป็นหลักฐาน
- proof ต้องผูกกับ transport job และ uploaded_by
```

---

## 35.7 Dispute / Claim Module

งานก่อสร้างมักมีปัญหา เช่น ส่งช้า ของไม่ครบ ของผิดชนิด ลูกค้าไม่รับของ

### Purpose

```txt
ใช้เปิดเคสปัญหา ติดตามสถานะ ผลกระทบทางการเงิน และการแก้ไข
```

### Entity: Dispute

```sql
create table disputes (
  id uuid primary key default gen_random_uuid(),
  dispute_no text not null unique,
  order_id uuid references customer_orders(id),
  transport_job_id uuid references transport_jobs(id),
  supplier_po_id uuid references supplier_purchase_orders(id),
  raised_by uuid references users(id),
  type text not null,
  description text,
  status text not null default 'OPEN',
  resolution text,
  financial_impact numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
```

### Dispute Types

```txt
SHORT_DELIVERY
WRONG_MATERIAL
LATE_DELIVERY
DAMAGED_MATERIAL
PRICE_DISPUTE
PAYMENT_DISPUTE
CUSTOMER_REJECTED
TRANSPORT_FAILED
OTHER
```

### Dispute Status

```txt
OPEN
INVESTIGATING
WAITING_PARTNER
WAITING_CUSTOMER
RESOLVED
REJECTED
CLOSED
```

---

## 35.8 Settlement / Payout Module

ระบบคุณเป็นตัวกลาง ต้องมีการเคลียร์เงินให้ supplier และรถร่วม

### Purpose

```txt
ใช้รวมยอดจ่ายพาร์ทเนอร์ สร้าง PV / PMT และบันทึกการจ่าย
```

### Entity: SettlementBatch

```sql
create table settlement_batches (
  id uuid primary key default gen_random_uuid(),
  settlement_no text not null unique,
  partner_company_id uuid not null references companies(id),
  partner_type text not null check (partner_type in ('SUPPLIER', 'FLEET')),
  period_start date not null,
  period_end date not null,
  gross_amount numeric(14,2) not null default 0,
  deductions numeric(14,2) not null default 0,
  net_amount numeric(14,2) not null default 0,
  status text not null default 'DRAFT',
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  paid_at timestamptz
);

create table settlement_items (
  id uuid primary key default gen_random_uuid(),
  settlement_batch_id uuid not null references settlement_batches(id),
  source_type text not null,
  source_id uuid not null,
  amount numeric(14,2) not null,
  adjustment numeric(14,2) not null default 0,
  note text
);
```

### Settlement Status

```txt
DRAFT
PENDING_APPROVAL
APPROVED
PAYMENT_ORDERED
PAID
CANCELLED
```

### Rules

```txt
- supplier/fleet payout ต้องมาจาก settlement batch
- settlement ที่ approved แล้วห้ามแก้โดยตรง
- ถ้าต้องแก้ ให้ทำ adjustment item
- settlement ต้องเชื่อม PV / PMT
```

---

## 35.9 Margin Rule / Commission Module

ระบบต้องรู้ว่า order ไหนกำไรดีหรือเสี่ยงขาดทุน

### Purpose

```txt
ใช้กำหนดกำไรขั้นต่ำ กำไรตามหมวดสินค้า พื้นที่ ลูกค้า และชนิดงาน
```

### Entity: MarginRule

```sql
create table margin_rules (
  id uuid primary key default gen_random_uuid(),
  product_category_id uuid references product_categories(id),
  customer_type text,
  area text,
  margin_type text not null check (margin_type in ('PERCENT', 'FIXED')),
  margin_value numeric(14,2) not null,
  min_margin numeric(14,2) not null default 0,
  effective_from date not null default current_date,
  effective_to date,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
```

### Rules

```txt
- ถ้า margin ต่ำกว่า min_margin → ต้องขออนุมัติ
- dashboard ต้องแสดง order ที่ margin ต่ำ
- quotation ที่ margin ต่ำห้ามส่งลูกค้าโดยไม่มี approval
```

---

## 35.10 Approval Matrix Module

ต้องมี policy อนุมัติแยกตามมูลค่า ส่วนลด margin และความเสี่ยง

### Purpose

```txt
ใช้กำหนดว่าเอกสารหรือ order แบบใดต้องให้ใครอนุมัติ
```

### Entity: ApprovalPolicy

```sql
create table approval_policies (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  condition_type text not null,
  required_role text not null,
  min_amount numeric(14,2),
  max_amount numeric(14,2),
  min_margin numeric(14,2),
  max_discount_percent numeric(5,2),
  require_all boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
```

### Example Policies

```txt
Quotation < 50,000 → ADMIN
Quotation 50,000 - 200,000 → OWNER
Quotation > 200,000 → OWNER + ACCOUNTANT
Discount > 10% → OWNER
Margin < 8% → OWNER
Customer overdue → ACCOUNTANT
Customer credit blocked → OWNER
```

---

## 35.11 Alert Center Module

Dashboard ควรมีศูนย์แจ้งเตือนกลาง

### Purpose

```txt
รวมเหตุการณ์สำคัญที่ต้องให้ทีมงานแก้ไข
```

### Entity: Alert

```sql
create table alerts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id),
  type text not null,
  severity text not null default 'INFO',
  title text not null,
  message text,
  entity_type text,
  entity_id uuid,
  assigned_role text,
  assigned_user_id uuid references users(id),
  status text not null default 'OPEN',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
```

### Alert Types

```txt
NEW_ORDER
SUPPLIER_NOT_CONFIRMED
TRUCK_NOT_ASSIGNED
TRUCK_DELAYED
DOCUMENT_PENDING_APPROVAL
INVOICE_OVERDUE
PAYMENT_UNRECONCILED
LOW_MARGIN
CREDIT_LIMIT_EXCEEDED
DELIVERY_PROOF_MISSING
LINE_SEND_FAILED
PDF_GENERATION_FAILED
```

### Severity

```txt
INFO
WARNING
CRITICAL
```

---

## 35.12 Operational SLA Module

ควรกำหนด SLA เพื่อวัดการทำงาน

### Example SLA

```txt
Supplier ต้องยืนยัน PO ภายใน 2 ชั่วโมง
รถร่วมต้องรับงานภายใน 30 นาที
ส่งของต้องไม่เกินเวลานัดเกิน 60 นาที
ใบเสนอราคาต้องออกภายใน 1 ชั่วโมง
Payment slip ต้องตรวจภายใน 30 นาที
```

### Entity: SlaPolicy

```sql
create table sla_policies (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  event_type text not null,
  max_minutes int not null,
  severity_when_breached text not null default 'WARNING',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
```

---

# 36. Detailed Working Process

ส่วนนี้คือลำดับการทำงานของระบบแบบเป็นข้อ ๆ ตั้งแต่ต้นจนจบ

---

## 36.1 Master Data Setup Flow

ใช้สำหรับตั้งค่าข้อมูลเริ่มต้นก่อนเปิดใช้งาน

```txt
1. สร้างบริษัท Core ของคุณ
2. ตั้งค่า company profile
3. ตั้งค่าเลขผู้เสียภาษี
4. ตั้งค่าบัญชีธนาคาร
5. ตั้งค่าโลโก้เอกสาร
6. สร้าง user ทีมงาน
7. กำหนด role และ permission
8. เพิ่มหมวดหมู่สินค้า
9. เพิ่มสินค้า เช่น ทราย หิน ดิน ปูน เหล็ก
10. เพิ่มหน่วย เช่น คิว ตัน เที่ยว เมตร ตร.ม.
11. เพิ่มพาร์ทเนอร์ supplier
12. เพิ่มสินค้าและราคาของ supplier
13. เพิ่มสัญญาราคากับ supplier ถ้ามี
14. เพิ่มพาร์ทเนอร์รถร่วม
15. เพิ่มประเภทรถ
16. เพิ่มทะเบียนรถ
17. เพิ่ม rate card ขนส่ง
18. ตั้งค่า margin rule
19. ตั้งค่า approval policy
20. ตั้งค่า SLA
21. ตั้งค่า notification channel เช่น LINE
```

---

## 36.2 Customer Registration Flow

```txt
1. ลูกค้าสมัครสมาชิก
2. ระบบสร้าง user
3. ระบบสร้าง company type CUSTOMER
4. ลูกค้ากรอกข้อมูลบริษัท
5. ลูกค้าเพิ่มข้อมูลภาษี
6. ลูกค้าเพิ่มที่อยู่สำนักงาน
7. ลูกค้าเพิ่มไซต์งาน
8. ลูกค้าเพิ่มผู้ติดต่อหน้างาน
9. Admin ตรวจสอบข้อมูลลูกค้า
10. Admin ตั้งค่า credit profile
11. ระบบเปิดให้ลูกค้าสั่งซื้อได้
```

---

## 36.3 Supplier Registration Flow

```txt
1. Supplier สมัครเป็นพาร์ทเนอร์
2. ระบบสร้าง company type SUPPLIER
3. Supplier กรอกข้อมูลบริษัท
4. Supplier กรอกเลขผู้เสียภาษี
5. Supplier เพิ่มบัญชีรับเงิน
6. Supplier เพิ่มสินค้า
7. Supplier กำหนดราคา
8. Supplier กำหนดพื้นที่ให้บริการ
9. Supplier กำหนด lead time
10. Admin ตรวจสอบ supplier
11. Admin อนุมัติ supplier
12. Supplier เปิดสถานะพร้อมขาย
13. ระบบนำสินค้า supplier ไปใช้ใน supplier selection
```

---

## 36.4 Fleet Partner Registration Flow

```txt
1. รถร่วมสมัครเป็นพาร์ทเนอร์ขนส่ง
2. ระบบสร้าง company type FLEET
3. Fleet partner กรอกข้อมูลบริษัท
4. Fleet partner เพิ่มข้อมูลคนขับ
5. Fleet partner เพิ่มประเภทรถ
6. Fleet partner เพิ่มทะเบียนรถ
7. Fleet partner ระบุความจุรถ
8. Fleet partner เพิ่มพื้นที่ให้บริการ
9. Fleet partner ตั้งค่าเปิด-ปิดรับคิว
10. Admin ตรวจสอบเอกสารรถ
11. Admin อนุมัติรถร่วม
12. Fleet partner เปิดรับงาน
13. ระบบนำรถไปใช้ใน fleet matching
```

---

## 36.5 Customer Order Flow

```txt
1. ลูกค้าเข้าสู่หน้าร้าน
2. ลูกค้าเลือกไซต์งาน
3. ลูกค้าเลือกสินค้า
4. ลูกค้าระบุจำนวน เช่น ทราย 5 คิว
5. ลูกค้าเพิ่มสินค้าหลายรายการลงตะกร้า
6. ลูกค้าเลือกวันที่ต้องการส่ง
7. ลูกค้าใส่หมายเหตุเพิ่มเติม
8. ระบบตรวจสอบว่าสินค้าอยู่ในพื้นที่ให้บริการหรือไม่
9. ระบบคำนวณราคาประมาณการ
10. ลูกค้ากดยืนยันขอราคา / สั่งซื้อ
11. ระบบสร้าง CustomerOrder สถานะ SUBMITTED
12. ระบบสร้าง CustomerOrderItem ทุกบรรทัด
13. ระบบสร้าง alert ให้ทีม operation
14. ระบบส่ง notification ให้ admin
```

---

## 36.6 Pricing Flow

```txt
1. ระบบอ่าน CustomerOrder
2. ระบบอ่าน CustomerSite
3. ระบบอ่านรายการสินค้า
4. pricingEngine หา supplier cost
5. supplierSelectionEngine หา supplier ที่เหมาะสม
6. routeCostEngine / transportRateCard คำนวณค่าขนส่ง
7. pricingEngine คำนวณ margin
8. pricingEngine คำนวณ customer sell price
9. calculationEngine คำนวณ subtotal
10. calculationEngine คำนวณ VAT
11. calculationEngine คำนวณ total
12. ระบบสร้าง Internal Cost BOQ
13. ระบบสร้าง Customer BOQ
14. ถ้า margin ต่ำกว่า policy → สร้าง approval request
15. ถ้าลูกค้าเกิน credit limit → สร้าง approval request
16. ถ้าทุกอย่างผ่าน → order status เป็น PRICING_COMPLETED
```

---

## 36.7 Quotation Flow

```txt
1. Admin ตรวจ Customer BOQ
2. Admin ตรวจต้นทุนและ margin
3. Admin กดสร้างใบเสนอราคา
4. documentEngine สร้างเอกสาร QT
5. numberingEngine สร้างเลข QT จาก server
6. documentEngine snapshot รายการสินค้า
7. calculationEngine คำนวณยอดเอกสาร
8. workflowEngine ตรวจว่าต้องอนุมัติหรือไม่
9. ถ้าต้องอนุมัติ → QT status = pending
10. ถ้าไม่ต้องอนุมัติ → QT status = approved หรือ ready
11. PDF job ถูกส่งเข้า background queue
12. ระบบ generate PDF
13. PDF ถูก upload ไป storage
14. ระบบบันทึก pdf_url
15. ระบบส่ง quotation ให้ลูกค้า
16. auditEngine บันทึก log
```

---

## 36.8 Customer Confirmation Flow

```txt
1. ลูกค้าเปิดใบเสนอราคา
2. ลูกค้าตรวจรายการสินค้า
3. ลูกค้ากดยืนยัน quotation
4. ระบบเปลี่ยน CustomerOrder เป็น CONFIRMED
5. ระบบเปลี่ยน QT เป็น APPROVED
6. ระบบตรวจ credit อีกครั้ง
7. ถ้าติด credit hold → ส่งให้ admin อนุมัติ
8. ถ้าผ่าน → orderSplitEngine เริ่มทำงาน
```

---

## 36.9 Order Split Flow

```txt
1. orderSplitEngine อ่าน CustomerOrderItem ทั้งหมด
2. ระบบดู selected_supplier_id ถ้ามี
3. ถ้ายังไม่มี supplier → supplierSelectionEngine เลือก supplier
4. ระบบ group รายการตาม supplier
5. ระบบคำนวณยอดแต่ละ supplier
6. ระบบสร้าง SupplierPurchaseOrder ตามจำนวน supplier
7. ระบบสร้าง SupplierPurchaseOrderItem
8. ระบบสร้าง PO document สำหรับ supplier
9. ระบบส่ง notification ให้ supplier
10. ระบบสร้าง audit log
11. CustomerOrder status → PROCUREMENT
```

ตัวอย่าง:

```txt
CustomerOrder:
- ทราย 5 คิว
- หิน 30 คิว
- ดิน 4 คิว

Split:
Supplier A:
- ทราย 5 คิว

Supplier B:
- หิน 30 คิว
- ดิน 4 คิว
```

---

## 36.10 Supplier PO Confirmation Flow

```txt
1. Supplier login เข้า partner portal
2. Supplier เห็น PO ที่ส่งมาให้ตนเองเท่านั้น
3. Supplier เปิดดูรายละเอียด PO
4. Supplier ตรวจสินค้า ราคา และวันส่ง
5. Supplier กดยืนยัน
6. SupplierPurchaseOrder status → CONFIRMED
7. ระบบแจ้ง admin
8. ถ้า supplier ปฏิเสธ → PO status → REJECTED
9. ถ้าถูกปฏิเสธ → supplierSelectionEngine หา supplier ใหม่
10. auditEngine บันทึก log
```

---

## 36.11 Transport Requirement Flow

```txt
1. ระบบตรวจว่าสินค้าใดต้องใช้ขนส่ง
2. ระบบอ่าน CustomerSite
3. ระบบอ่าน pickup location จาก supplier
4. ระบบคำนวณความต้องการรถ
5. ระบบหา vehicle type ที่เหมาะกับสินค้าและปริมาณ
6. fleetMatchingEngine ค้นหารถที่เปิดรับคิว
7. ระบบตรวจ vehicle availability
8. ระบบตรวจ transport rate card
9. ระบบสร้าง TransportJob
10. TransportJob status → SEARCHING_TRUCK
11. ระบบแจ้ง fleet partner ที่เหมาะสม
```

---

## 36.12 Fleet Accept Job Flow

```txt
1. Fleet partner เข้า fleet portal
2. Fleet partner เห็นงานที่เสนอให้ตนเอง
3. Fleet partner ตรวจสินค้า จุดรับ จุดส่ง เวลา และราคา
4. Fleet partner กดรับงาน
5. TransportJob status → ACCEPTED
6. ระบบ assign vehicle
7. ระบบแจ้ง admin
8. ระบบแจ้ง supplier ว่ารถจะเข้ารับของ
9. ระบบแจ้งลูกค้าว่างานอยู่ระหว่างจัดส่ง
10. auditEngine บันทึก log
```

---

## 36.13 Delivery Execution Flow

```txt
1. คนขับเริ่มงาน
2. TransportJob status → GOING_TO_PICKUP
3. คนขับถึงจุดรับของ
4. TransportJob status → ARRIVED_PICKUP
5. คนขับ upload รูปก่อนขึ้นของ ถ้าบังคับ
6. Supplier โหลดสินค้า
7. คนขับ upload รูปหลังขึ้นของ / ใบชั่ง ถ้ามี
8. TransportJob status → LOADED
9. คนขับออกเดินทาง
10. TransportJob status → IN_TRANSIT
11. คนขับถึงไซต์งาน
12. TransportJob status → ARRIVED_SITE
13. ลูกค้าตรวจรับสินค้า
14. คนขับ upload รูปหน้างาน / ใบส่งของ / ลายเซ็น
15. ระบบตรวจ proof checklist
16. ถ้า proof ครบ → TransportJob status → COMPLETED
17. ถ้า proof ไม่ครบ → TransportJob status → PROOF_PENDING
18. ระบบแจ้ง admin
```

---

## 36.14 Delivery Problem / Dispute Flow

```txt
1. ลูกค้า / admin / supplier / fleet แจ้งปัญหา
2. ระบบสร้าง Dispute
3. Dispute status → OPEN
4. ระบบผูก dispute กับ order / PO / transport job
5. Admin ตรวจหลักฐาน delivery proof
6. Admin สอบถาม supplier หรือ fleet ถ้าจำเป็น
7. Dispute status → INVESTIGATING
8. Admin ระบุ financial impact
9. ถ้าต้องชดเชย → สร้าง adjustment
10. ถ้าแก้ไขได้ → Dispute status → RESOLVED
11. ถ้าปิดเคสแล้ว → Dispute status → CLOSED
12. auditEngine บันทึกทุกการเปลี่ยนแปลง
```

---

## 36.15 Invoice Flow

```txt
1. Order ส่งของครบหรือพร้อมวางบิล
2. Admin กดสร้าง invoice
3. documentEngine สร้าง INV หรือ INV3
4. numberingEngine สร้างเลข invoice จาก server
5. documentEngine snapshot รายการจาก order
6. calculationEngine คำนวณ VAT และ total
7. workflowEngine ตรวจ approval policy
8. ถ้าผ่าน → invoice status = approved
9. ระบบ generate PDF
10. ระบบส่ง invoice ให้ลูกค้า
11. CustomerOrder status → INVOICED
12. paymentEngine เริ่มติดตาม balance
13. collectionEngine เริ่มตรวจ due date
```

---

## 36.16 Customer Payment Flow

```txt
1. ลูกค้าชำระเงิน
2. ลูกค้า upload slip หรือระบบรับ bank transaction
3. ระบบสร้าง payment status PENDING
4. bankSMSEngine parse รายการถ้ามาจาก SMS/email
5. idempotencyEngine ตรวจว่าซ้ำหรือไม่
6. reconciliationEngine match payment กับ invoice
7. ถ้า confidence HIGH → เสนอ auto match
8. accountant ตรวจและยืนยัน
9. payment status → CONFIRMED
10. paymentEngine คำนวณ paid และ balance
11. ถ้า balance = 0 → invoice status → paid
12. documentEngine สร้าง receipt
13. ระบบ generate receipt PDF
14. ระบบส่งใบเสร็จให้ลูกค้า
15. auditEngine บันทึก log
```

---

## 36.17 Debt & Collection Flow

```txt
1. ระบบตรวจ invoice ที่ยังไม่ชำระ
2. ระบบเทียบ due date กับวันที่ปัจจุบัน
3. ถ้ายังไม่ครบกำหนด → CURRENT
4. ถ้าเกินกำหนด 1-7 วัน → OVERDUE
5. ถ้าเกิน 8-30 วัน → WARNING
6. ถ้าเกิน 31-90 วัน → COLLECTION
7. ถ้าเกิน 90 วัน → LEGAL
8. ถ้ามีการชำระบางส่วน → PARTIAL
9. ถ้าลูกค้านัดจ่าย → PROMISED
10. ถ้าชำระครบ → CLOSED
11. ระบบสร้าง alert ตาม state
12. ระบบส่ง LINE/email ตาม policy
13. debtSnapshotEngine เก็บ snapshot รายวัน
```

---

## 36.18 Supplier / Fleet Settlement Flow

```txt
1. งาน supplier หรือ fleet เสร็จสมบูรณ์
2. ระบบคำนวณยอดที่ต้องจ่าย
3. settlementEngine รวมรายการตาม partner
4. ระบบสร้าง SettlementBatch
5. Admin ตรวจ settlement
6. ถ้ามี adjustment ให้เพิ่ม settlement item
7. Admin ส่งอนุมัติ
8. workflowEngine ตรวจ approval policy
9. ถ้าอนุมัติแล้ว → สร้าง PV
10. สร้าง PMT
11. Accountant จ่ายเงิน
12. paymentEngine บันทึก outgoing payment
13. Settlement status → PAID
14. Supplier/Fleet เห็น payout ใน portal
15. auditEngine บันทึก log
```

---

## 36.19 Dashboard Update Flow

```txt
1. ทุก action สำคัญสร้าง event
2. event ถูกบันทึกใน event log
3. dashboard metrics refresh
4. alert center ตรวจ rule
5. realtime notification ส่งไปยังผู้เกี่ยวข้อง
6. dashboard แสดง KPI ล่าสุด
```

KPI ที่ควร update:

```txt
- จำนวน order ใหม่
- order รอดำเนินการ
- supplier PO รอยืนยัน
- transport job รอรถ
- transport job ล่าช้า
- invoice unpaid
- invoice overdue
- payment unreconciled
- gross margin
- supplier payable
- fleet payable
```

---

## 36.20 End-to-End Main Flow

นี่คือลำดับใหญ่ที่สุดของระบบตั้งแต่ต้นจนจบ

```txt
1. Admin ตั้งค่า master data
2. Supplier ลงสินค้าและราคา
3. Fleet partner ลงรถและเปิดรับคิว
4. Customer สมัครและเพิ่มไซต์งาน
5. Customer เลือกสินค้า
6. Customer ส่ง order
7. ระบบคำนวณราคา
8. ระบบสร้าง BOQ
9. Admin ตรวจต้นทุนและ margin
10. ระบบสร้าง quotation
11. Customer ยืนยัน quotation
12. ระบบ split order ตาม supplier
13. ระบบสร้าง supplier PO
14. Supplier ยืนยัน PO
15. ระบบสร้าง transport job
16. Fleet partner รับงาน
17. รถไปรับสินค้า
18. รถส่งสินค้า
19. คนขับ upload proof
20. ลูกค้าตรวจรับ
21. ระบบปิด transport job
22. ระบบออก invoice
23. ลูกค้าชำระเงิน
24. ระบบ reconcile payment
25. ระบบออก receipt
26. ระบบคำนวณยอดจ่าย supplier
27. ระบบคำนวณยอดจ่าย fleet
28. ระบบสร้าง settlement
29. ระบบสร้าง PV / PMT
30. Accountant จ่ายเงิน supplier/fleet
31. Dashboard สรุปยอดขาย ต้นทุน กำไร หนี้ และงานทั้งหมด
```

---

# 37. Updated Development Priority

ลำดับการพัฒนาที่แนะนำหลังเพิ่มโมดูลใหม่

## Phase 1: Foundation

```txt
1. Setup Next.js + TypeScript
2. Setup Supabase + PostgreSQL
3. Setup Prisma
4. Setup Auth
5. Setup Company / User / Role
6. Setup Customer Site
7. Setup Product Catalog
8. Setup Supplier Product
9. Setup Vehicle / Fleet Partner
10. Setup basic permission
```

## Phase 2: Order & Pricing

```txt
1. Customer order
2. Customer order items
3. Supplier selection
4. Transport rate card
5. Pricing engine
6. Margin rule
7. Internal BOQ
8. Customer BOQ
9. Credit control
10. Alert for low margin / credit issue
```

## Phase 3: Documents

```txt
1. Document counter
2. BOQ document
3. Quotation
4. Invoice
5. Receipt
6. PO
7. PV
8. PMT
9. PDF generation
10. Document versioning
```

## Phase 4: Procurement & Fleet

```txt
1. Order split engine
2. Supplier PO
3. Supplier confirmation
4. Fleet matching
5. Transport job
6. Vehicle availability
7. Delivery proof checklist
8. Transport status update
9. Dispute module
```

## Phase 5: Finance

```txt
1. Customer payment
2. Bank transaction
3. Reconciliation
4. Debt tracking
5. Credit status update
6. Settlement batch
7. Supplier payout
8. Fleet payout
9. Finance dashboard
```

## Phase 6: Automation & Control

```txt
1. LINE notification
2. Alert center
3. SLA monitor
4. Daily debt snapshot
5. Payment reconciliation job
6. Supplier PO reminder
7. Fleet job reminder
8. System health dashboard
```

---

# 38. Updated System Score

หลังเพิ่มโมดูลเหล่านี้ ระบบจะมีความครบถ้วนมากขึ้น

```txt
Original Score: 8.3 / 10
Updated Score: 9.2 / 10
```

สิ่งที่ทำให้คะแนนสูงขึ้น:

```txt
- มี customer site จริง
- มี credit control
- มี supplier contract
- มี price history
- มี transport rate card
- มี delivery proof checklist
- มี dispute handling
- มี settlement / payout
- มี margin rule
- มี approval matrix
- มี alert center
- มี SLA
- มีลำดับการทำงาน end-to-end ชัดเจน
```

สิ่งที่ยังควรเพิ่มในอนาคตเพื่อให้ใกล้ 9.5/10:

```txt
- Prisma schema แบบเต็ม
- RLS policy แบบเต็ม
- User stories
- Acceptance criteria
- Wireframe รายหน้า
- Test cases ราย engine
- Sequence diagram ราย workflow
```

---

# UPDATE — Workflow And LINE-First Agent Rules

AI agents must read `WORKFLOW_AND_ROLE_RULES.md` before implementing workflow, role, dashboard, LINE, product, inventory, debt, or document features.

Additional rules:

```txt
1. Admin UX must be desktop-first.
2. Partner/Customer/Fleet UX must be LINE-first and mobile-first.
3. Partner product submission is a core feature, not optional.
4. Admin approval is required before partner products become sellable.
5. Supplier inventory must track stockQty, reservedQty, availableQty.
6. Every stock update must create inventory movement.
7. Project and Document Group must be used for unified document control.
8. Document number must include project reference when available.
9. Admin must be able to search by any document/project reference.
10. Debt dashboard must be real-time and must allow detail drilldown.
```
