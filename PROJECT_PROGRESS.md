# PROJECT_PROGRESS.md

# DNA OS Construction Platform — Development Progress & AI Handoff

เอกสารนี้ใช้สำหรับวางไว้ในโปรเจกต์ เพื่อบอก AI coding agent, developer หรือผู้ร่วมงานว่า:

- ระบบนี้คืออะไร
- ต้องสร้างอะไรบ้าง
- ควรเริ่มจากอะไร
- ลำดับงานที่ถูกต้องคืออะไร
- ตอนนี้ควรทำถึงขั้นตอนไหน
- ห้ามข้ามขั้นตอนไหน
- ไฟล์ / module / database ที่ควรสร้างมีอะไรบ้าง

เอกสารนี้ควรอยู่ที่ root ของโปรเจกต์:

```txt
/PROJECT_PROGRESS.md
```

หรือใช้ร่วมกับ:

```txt
/AGENT.md
/README.md
/docs/system-blueprint.md
```

---

## 1. Project Name

```txt
DNA OS Construction Platform
```

---

## 2. Project Goal

สร้างระบบกลางสำหรับควบคุมธุรกิจรับเหมาก่อสร้างและวัสดุก่อสร้าง โดยเจ้าของระบบเป็น **Core Platform / Operator กลาง** ระหว่าง:

```txt
ลูกค้า
พาร์ทเนอร์ขายวัสดุ
รถร่วม / พาร์ทเนอร์ขนส่ง
ระบบเอกสาร
ระบบจัดซื้อ
ระบบการเงิน
Dashboard ควบคุมงาน
```

ระบบต้องรองรับ:

```txt
- ลูกค้าเลือกสินค้าและสั่งซื้อผ่านระบบ
- พาร์ทเนอร์ลงสินค้าและราคาขาย
- ระบบแตกคำสั่งซื้อไปยัง supplier แต่ละราย
- ระบบสร้าง PO ให้ supplier
- ระบบเชื่อมรถร่วมเพื่อขนส่ง
- ระบบออก BOQ
- ระบบออกใบเสนอราคา
- ระบบออกใบแจ้งหนี้ / ใบกำกับ / ใบเสร็จ
- ระบบออกใบเสร็จรับเงิน
- ระบบออกใบสำคัญจ่าย
- ระบบออกใบสั่งจ่าย
- ระบบออกใบจัดซื้อ / ใบสั่งซื้อ
- ระบบบันทึก payment
- ระบบติดตามหนี้
- ระบบ settlement / payout ให้ supplier และรถร่วม
- Dashboard แสดงการทำงานทั้งหมด
```

---

## 3. Core Business Principle

```txt
ข้อมูลเกิดครั้งเดียว ถูกใช้ทั้งระบบ
```

ตัวอย่าง:

```txt
ลูกค้าสั่งสินค้า 1 ครั้ง
→ ใช้สร้าง order
→ ใช้สร้าง BOQ
→ ใช้สร้าง quotation
→ ใช้สร้าง supplier PO
→ ใช้สร้าง transport job
→ ใช้สร้าง invoice
→ ใช้สร้าง receipt
→ ใช้คำนวณ dashboard
```

ห้ามกรอกข้อมูลซ้ำโดยไม่จำเป็น

---

## 4. Recommended Stack

ใช้ stack นี้เป็นค่าเริ่มต้น:

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
Puppeteer / Playwright PDF
Inngest
Supabase Storage
Supabase Realtime
Sentry
Vercel
```

---

## 5. Architecture Style

ให้เริ่มด้วย:

```txt
Modular Monolith
```

ยังไม่ต้องทำ microservices

เหตุผล:

```txt
- พัฒนาเร็วกว่า
- debug ง่ายกว่า
- transaction ง่ายกว่า
- เหมาะกับทีมเล็ก
- แยก service ภายหลังได้
```

---

## 6. Folder Structure Target

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
    customers/
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

# 7. Current Development Status

## Current Status

```txt
PLANNING / SYSTEM DESIGN
```

ยังไม่ได้ถือว่า production-ready

ตอนนี้มี:

```txt
[x] แนวคิดระบบ
[x] Infrastructure blueprint
[x] Module design
[x] Database design draft
[x] Workflow design
[x] Development priority
[x] AI agent instruction draft
```

ยังต้องสร้างจริง:

```txt
[ ] Next.js project
[ ] Database schema
[ ] Auth
[ ] Company/User/Role system
[ ] Product catalog
[ ] Customer order
[ ] BOQ
[ ] Documents
[ ] Supplier PO
[ ] Fleet job
[ ] Payment
[ ] Dashboard
```

---

# 8. What Must Be Built First

## Do First

อันดับแรกที่สุดต้องสร้าง foundation ก่อน:

```txt
1. Company
2. User
3. Company Member
4. Role / Permission
5. Customer
6. Customer Site
7. Product Catalog
8. Supplier
9. Supplier Product / Supplier Price
10. Customer Order
```

## Do Not Start With

ห้ามเริ่มจากสิ่งเหล่านี้ก่อน foundation:

```txt
- Dashboard
- PDF
- รถร่วมแบบ auto matching
- LINE automation
- Auto reconciliation
- Advanced analytics
- Mobile app
```

เหตุผล:

```txt
ระบบนี้ต้องมีฐานข้อมูลตัวตน ลูกค้า สินค้า supplier และ order ก่อน
ถ้าเริ่มจาก dashboard หรือ PDF ก่อน จะไม่มีข้อมูลจริงให้ระบบใช้
```

---

# 9. Development Phases

---

## Phase 0: Project Setup

### Goal

สร้างโปรเจกต์เปล่าที่รันได้ใน VSCode

### Tasks

```txt
[x] Create Next.js project
[x] Enable TypeScript
[x] Setup Tailwind CSS
[x] Install shadcn/ui
[ ] Setup Supabase project
[ ] Setup Prisma
[ ] Connect PostgreSQL
[x] Setup environment variables
[x] Create base layout
[ ] Create basic admin route
```

### Done When

```txt
[x] npm run dev works
[x] Homepage opens
[ ] Database connection works
[ ] Prisma migration runs
[ ] Supabase credentials configured
```

---

## Phase 1: Identity & Tenant Foundation

### Goal

สร้างฐานตัวตนของระบบ

### Build These Tables

```txt
companies
users
company_members
roles / permissions
audit_logs
```

### Build These Features

```txt
[ ] User login
[ ] Company profile
[ ] Company type
[ ] Role assignment
[ ] Permission check
[ ] Basic audit log
```

### Company Types

```txt
CORE
CUSTOMER
SUPPLIER
FLEET
```

### Roles

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

### Rules

```txt
- companyId must come from session
- never accept companyId from frontend form
- every financial/action record should have audit log
- all modules must respect role permission
```

### Done When

```txt
[ ] Admin can create company
[ ] Admin can create user
[ ] User can belong to company
[ ] User has role
[ ] App can check permission
```

---

## Phase 2: Customer & Site Module

### Goal

จัดการลูกค้าและไซต์งาน

### Build These Tables

```txt
companies type CUSTOMER
customer_sites
customer_credit_profiles
```

### Build These Pages

```txt
/admin/customers
/admin/customers/[id]
/admin/customers/[id]/sites
/admin/customers/[id]/credit
```

### Customer Site Fields

```txt
site_name
address
province
district
subdistrict
postal_code
gps_lat
gps_lng
contact_name
contact_phone
delivery_note
access_restriction
preferred_delivery_time
```

### Credit Profile Fields

```txt
credit_limit
credit_term_days
current_outstanding
overdue_amount
credit_status
payment_behavior_score
```

### Credit Status

```txt
NORMAL
WATCH
HOLD
BLOCKED
```

### Done When

```txt
[ ] Admin can create customer
[ ] Admin can create customer site
[ ] Admin can set customer credit
[ ] Order can reference customer site
```

---

## Phase 3: Product Catalog Module

### Goal

สร้าง master data สินค้า

### Build These Tables

```txt
product_categories
products
product_variants
units
```

### Build These Pages

```txt
/admin/products
/admin/products/categories
/admin/products/variants
```

### Example Data

```txt
Category: วัสดุถม
Product: ทราย
Variant: ทรายหยาบ
Unit: คิว

Product: หิน
Variant: หินคลุก
Unit: คิว

Product: ดิน
Variant: ดินถม
Unit: คิว
```

### Rules

```txt
- Product is master data
- Supplier price is separate
- Do not bind product directly to one supplier only
```

### Done When

```txt
[ ] Admin can create category
[ ] Admin can create product
[ ] Admin can create variant
[ ] Product can be selected in order item
```

---

## Phase 4: Supplier / Partner Module

### Goal

ให้ supplier ลงสินค้าและราคาได้

### Build These Tables

```txt
companies type SUPPLIER
supplier_products
supplier_contracts
supplier_contract_items
price_histories
```

### Build These Pages

```txt
/admin/partners
/admin/partners/[id]
/partner/products
/partner/pricing
/partner/purchase-orders
```

### Supplier Product Fields

```txt
supplier_company_id
product_variant_id
sku
price
min_qty
service_area
lead_time_hours
is_available
```

### Rules

```txt
- every price change creates price history
- supplier can only see its own products and PO
- admin can see all supplier data
```

### Done When

```txt
[ ] Admin can create supplier
[ ] Supplier can have products
[ ] Supplier price can be created
[ ] Price history is recorded
[ ] Supplier product can be used in pricing engine
```

---

## Phase 5: Fleet / Truck Partner Foundation

### Goal

สร้างข้อมูลรถร่วมพื้นฐาน

### Build These Tables

```txt
companies type FLEET
fleet_partners
vehicle_types
vehicles
vehicle_availability
transport_rate_cards
```

### Build These Pages

```txt
/admin/fleet
/admin/fleet/vehicles
/fleet/vehicles
/fleet/availability
```

### Vehicle Fields

```txt
fleet_partner_id
vehicle_type_id
plate_no
capacity_value
capacity_unit
status
is_accepting_queue
```

### Vehicle Status

```txt
OPEN
BUSY
OFFLINE
MAINTENANCE
BLOCKED
```

### Done When

```txt
[ ] Admin can create fleet partner
[ ] Fleet partner can add vehicle
[ ] Vehicle can open/close queue
[ ] Transport rate can be configured
```

---

## Phase 6: Customer Order Module

### Goal

สร้างคำสั่งซื้อจากลูกค้า

### Build These Tables

```txt
customer_orders
customer_order_items
order_status_history
```

### Build These Pages

```txt
/admin/orders
/admin/orders/new
/admin/orders/[id]
/customer/catalog
/customer/cart
/customer/checkout
/customer/orders
```

### Order Status

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

### Order Creation Flow

```txt
1. Select customer
2. Select customer site
3. Add product items
4. Input quantity
5. Select requested delivery date
6. Submit order
7. Create CustomerOrder
8. Create CustomerOrderItem
9. Status = SUBMITTED
```

### Done When

```txt
[ ] Admin can create order
[ ] Customer can create order or request quote
[ ] Order has items
[ ] Order references customer site
[ ] Order status can be tracked
```

---

## Phase 7: Pricing & BOQ Module

### Goal

คำนวณราคา ต้นทุน กำไร และ BOQ

### Build These Engines

```txt
pricingEngine
supplierSelectionEngine
routeCostEngine
calculationEngine
marginEngine
```

### Build These Tables

```txt
boqs
boq_items
boq_cost_breakdowns
margin_rules
```

### Pricing Flow

```txt
1. Read customer order
2. Read customer site
3. Read order items
4. Find available suppliers
5. Select supplier
6. Get supplier cost
7. Calculate transport cost
8. Apply margin rule
9. Calculate customer price
10. Calculate VAT
11. Create internal cost BOQ
12. Create customer BOQ
```

### Must Separate

```txt
supplier_unit_cost
transport_cost
platform_margin
customer_unit_price
customer_amount
```

### Done When

```txt
[ ] Order can calculate supplier cost
[ ] Order can calculate customer price
[ ] VAT is calculated
[ ] Internal BOQ exists
[ ] Customer BOQ exists
[ ] Low margin creates alert or approval request
```

---

## Phase 8: Document Foundation

### Goal

สร้างระบบเอกสารหลัก

### Build These Tables

```txt
documents
document_items
document_counters
document_versions
files
```

### Document Types

```txt
BOQ
QT
INV3
INV
RCT
PV
PMT
PO
```

### Build These Engines

```txt
numberingEngine
documentEngine
documentRelationEngine
workflowEngine
pdfEngine
```

### Document Flow

```txt
BOQ
  ↓
Quotation
  ↓
Invoice / Tax Invoice
  ↓
Receipt
```

### Production Rule

```txt
Document number must be generated server-side only.
Do not generate document number on frontend.
```

### Done When

```txt
[ ] Can create document counter
[ ] Can create quotation
[ ] Can create document items
[ ] Can generate document number
[ ] Can preview document
[ ] Can store PDF URL
```

---

## Phase 9: Quotation Flow

### Goal

ออกใบเสนอราคาให้ลูกค้า

### Flow

```txt
1. Admin opens customer order
2. Admin reviews BOQ
3. Admin reviews cost and margin
4. Admin clicks create quotation
5. System creates QT document
6. System snapshots order items
7. System calculates VAT and total
8. System checks approval policy
9. System generates PDF
10. System sends quotation to customer
11. Customer can confirm
```

### Done When

```txt
[ ] QT can be created from order
[ ] QT has PDF
[ ] Customer can view QT
[ ] Customer can confirm QT
[ ] Confirmed QT updates order status
```

---

## Phase 10: Order Split & Supplier PO

### Goal

แตก order ไปหา supplier และออก PO

### Build These Engines

```txt
orderSplitEngine
procurementEngine
supplierSelectionEngine
```

### Build These Tables

```txt
supplier_purchase_orders
supplier_purchase_order_items
```

### Flow

```txt
1. Customer confirms quotation
2. Order status = CONFIRMED
3. orderSplitEngine reads order items
4. Group items by supplier
5. Create SupplierPurchaseOrder per supplier
6. Create SupplierPurchaseOrderItem
7. Create PO document
8. Send notification to supplier
9. Order status = PROCUREMENT
```

### Example

```txt
Customer Order:
- ทราย 5 คิว
- หิน 30 คิว
- ดิน 4 คิว

Supplier PO A:
- ทราย 5 คิว

Supplier PO B:
- หิน 30 คิว
- ดิน 4 คิว
```

### Done When

```txt
[ ] Order can split by supplier
[ ] Supplier PO can be created
[ ] PO document can be generated
[ ] Supplier can view own PO
[ ] Supplier can confirm or reject PO
```

---

## Phase 11: Transport / Fleet Job

### Goal

สร้างงานขนส่งและมอบหมายรถร่วม

### Build These Tables

```txt
transport_jobs
transport_job_stops
delivery_proofs
proof_checklists
```

### Build These Engines

```txt
fleetMatchingEngine
dispatchEngine
deliveryProofEngine
```

### Transport Job Status

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

### Flow

```txt
1. System checks which items require transport
2. Read pickup location from supplier
3. Read delivery location from customer site
4. Select vehicle type
5. Find available vehicle
6. Calculate transport cost
7. Create TransportJob
8. Notify fleet partner
9. Fleet accepts job
10. Driver updates status
```

### Done When

```txt
[ ] Transport job can be created
[ ] Fleet can see assigned job
[ ] Fleet can accept job
[ ] Status can be updated
[ ] Delivery proof can be uploaded
```

---

## Phase 12: Delivery Proof & Dispute

### Goal

ปิดงานส่งของด้วยหลักฐาน และรองรับเคสปัญหา

### Build These Tables

```txt
delivery_proofs
proof_checklists
disputes
```

### Required Proof Types

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

### Rule

```txt
Transport job cannot be COMPLETED if required proof is missing.
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

### Done When

```txt
[ ] Proof checklist can be configured
[ ] Driver can upload proof
[ ] System validates proof completeness
[ ] Admin can open dispute
[ ] Dispute can be resolved
```

---

## Phase 13: Invoice, Payment, Receipt

### Goal

ออก invoice รับเงิน และออกใบเสร็จ

### Build These Engines

```txt
paymentEngine
reconciliationEngine
bankSMSEngine
idempotencyEngine
collectionEngine
```

### Build These Tables

```txt
payments
bank_transactions
reconciliation_matches
```

### Flow

```txt
1. Order delivered or ready to bill
2. Admin creates invoice
3. System creates INV or INV3
4. System generates PDF
5. Customer pays
6. Customer uploads slip or bank transaction enters system
7. System creates payment PENDING
8. Reconciliation engine matches payment to invoice
9. Accountant confirms payment
10. Invoice status = PAID if fully paid
11. System creates receipt
12. Receipt PDF is generated
```

### Done When

```txt
[ ] Invoice can be created
[ ] Payment can be recorded
[ ] Payment can be matched to invoice
[ ] Invoice balance updates
[ ] Receipt can be generated
```

---

## Phase 14: Debt & Collection

### Goal

ติดตามหนี้ลูกค้า

### Build These Tables

```txt
debt_snapshots
collection_notes
alerts
```

### Collection States

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

### Flow

```txt
1. System checks unpaid invoices
2. Compare due date
3. Assign collection state
4. Create alert if overdue
5. Send reminder if needed
6. Record promise to pay
7. Update state when partial payment occurs
8. Close when paid
```

### Done When

```txt
[ ] Overdue invoice is detected
[ ] Collection state is calculated
[ ] Alert is created
[ ] Payment updates debt status
```

---

## Phase 15: Settlement / Payout

### Goal

จ่ายเงินให้ supplier และรถร่วม

### Build These Tables

```txt
settlement_batches
settlement_items
```

### Flow

```txt
1. Supplier job fulfilled
2. Fleet job completed
3. settlementEngine calculates payable
4. Create settlement batch
5. Admin reviews
6. Approval if needed
7. Create PV
8. Create PMT
9. Accountant pays
10. Settlement status = PAID
```

### Done When

```txt
[ ] Supplier payable can be calculated
[ ] Fleet payable can be calculated
[ ] Settlement batch can be created
[ ] PV/PMT can be generated
[ ] Outgoing payment can be recorded
```

---

## Phase 16: Dashboard & Alert Center

### Goal

ให้ผู้ดูแลเห็นภาพรวมทั้งหมด

### Build These Dashboards

```txt
Executive Dashboard
Operation Dashboard
Finance Dashboard
Partner Dashboard
Fleet Dashboard
```

### KPI

```txt
new orders
pending orders
supplier PO pending
truck not assigned
transport delayed
invoice unpaid
invoice overdue
payment unreconciled
gross margin
supplier payable
fleet payable
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

### Done When

```txt
[ ] Admin dashboard shows orders
[ ] Finance dashboard shows invoices/payments
[ ] Operation dashboard shows logistics
[ ] Alert center lists actionable issues
```

---

## Phase 17: Automation

### Goal

ลดงาน manual หลังระบบหลักนิ่งแล้ว

### Jobs

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

### Done When

```txt
[ ] Inngest is configured
[ ] PDF generation job works
[ ] Overdue job works
[ ] LINE notification job works
[ ] Reconciliation job works
```

---

# 10. 30-Day Build Plan

## Week 1: Foundation

```txt
[ ] Create Next.js project
[ ] Setup TypeScript
[ ] Setup Tailwind CSS
[ ] Setup shadcn/ui
[ ] Setup Supabase
[ ] Setup Prisma
[ ] Create companies table
[ ] Create users table
[ ] Create company_members table
[ ] Create login
[ ] Create basic role system
```

## Week 2: Master Data

```txt
[ ] Company profile page
[ ] Customer page
[ ] Customer site page
[ ] Product category page
[ ] Product page
[ ] Product variant page
[ ] Supplier page
[ ] Supplier product page
[ ] Supplier price page
[ ] Vehicle type page
[ ] Vehicle page
```

## Week 3: Order + Pricing + BOQ

```txt
[ ] Customer order page
[ ] Order item editor
[ ] Select customer site
[ ] Select product and quantity
[ ] Build pricingEngine MVP
[ ] Calculate supplier cost
[ ] Calculate customer price
[ ] Calculate VAT
[ ] Create internal BOQ
[ ] Create customer BOQ
```

## Week 4: Document MVP

```txt
[ ] Document counter
[ ] Quotation document
[ ] Invoice document
[ ] Receipt document
[ ] PO document
[ ] PDF preview
[ ] PDF generation
[ ] Basic payment recording
[ ] Basic dashboard
[ ] Test full flow from order to quotation
```

---

# 11. MVP Definition

MVP แรกต้องทำให้ได้แค่นี้ก่อน:

```txt
[ ] Admin เพิ่มสินค้าได้
[ ] Admin เพิ่ม supplier และราคาสินค้าได้
[ ] Admin เพิ่มลูกค้าและไซต์งานได้
[ ] ลูกค้าหรือ admin สร้าง order ได้
[ ] ระบบคำนวณ BOQ ได้
[ ] ระบบสร้างใบเสนอราคาได้
[ ] ลูกค้ายืนยันใบเสนอราคาได้
[ ] ระบบสร้าง PO แยก supplier ได้
[ ] ระบบสร้าง invoice ได้
[ ] ระบบบันทึกรับชำระเงินได้
[ ] ระบบออกใบเสร็จได้
[ ] Dashboard เห็นยอดขายและ order ได้
```

---

# 12. Main End-to-End Workflow

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

# 13. Coding Rules for AI Agent

AI agent must follow these rules:

```txt
1. Start with foundation tables before dashboard or automation.
2. Do not create dashboard before real entities exist.
3. Business logic must stay in core/engines.
4. React components must stay thin.
5. Do not calculate VAT inside JSX.
6. Do not generate document number on frontend.
7. Do not accept companyId from frontend.
8. Do not hard-delete financial records.
9. Do not expose supplier cost to customer.
10. Supplier must only see its own PO.
11. Fleet partner must only see its own jobs.
12. Paid invoice must not be edited directly.
13. Receipt must be locked after issue.
14. All financial changes need audit log.
15. Every price change needs price history.
16. Every status change should create status history or audit log.
17. Use Zod schemas for validation.
18. Use TypeScript types for all entities.
19. Add unit tests for engines.
20. Keep Thai labels and construction terms consistent.
```

---

# 14. First Tables to Create

Create these tables first, in this order:

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

Do not create advanced transport/payment tables before these are working.

---

# 15. First Pages to Create

Create these pages first:

```txt
1. /admin/dashboard
2. /admin/settings/company
3. /admin/customers
4. /admin/customers/[id]
5. /admin/customers/[id]/sites
6. /admin/products
7. /admin/partners
8. /admin/partners/[id]/products
9. /admin/orders
10. /admin/orders/new
11. /admin/orders/[id]
```

Dashboard can be simple at first. It should not be advanced until real data exists.

---

# 16. First Engines to Create

Create these engines first:

```txt
1. calculationEngine
2. pricingEngine
3. supplierSelectionEngine
4. orderSplitEngine
5. numberingEngine
6. documentEngine
7. paymentEngine
8. auditEngine
```

Do not create automation engine first.

---

# 17. Status Tracking

Use this section to tell AI what has already been completed.

## Completed

```txt
[x] Project created
[x] Next.js installed
[x] Tailwind installed
[x] shadcn/ui installed
[ ] Supabase connected
[ ] Prisma connected
[ ] companies table created
[ ] users table created
[ ] company_members table created
[ ] login working
[ ] roles working
[ ] customer page created
[ ] customer site page created
[ ] product catalog created
[ ] supplier product created
[ ] customer order created
[ ] pricing engine created
[ ] BOQ created
[ ] quotation created
[ ] PO created
[ ] invoice created
[ ] receipt created
[ ] payment created
[ ] dashboard created
```

## Current Step

```txt
Current Step: Phase 0 — Project Setup
```

## Next Step

```txt
Next Step: Setup backend Supabase + Prisma connection and create basic admin route
```

---

# 18. Notes for Future AI

When continuing work:

```txt
1. Read this file first.
2. Check Current Step.
3. Check Completed list.
4. Continue only the next unfinished item.
5. Do not jump to advanced features.
6. Do not create unrelated features.
7. Keep architecture modular.
8. Ask only if required information is missing.
9. Prefer completing small working modules.
10. Update this file after each completed step.
```

---

# 19. Final Priority Summary

The correct build order is:

```txt
Foundation
→ Customer / Site
→ Product
→ Supplier / Price
→ Order
→ Pricing
→ BOQ
→ Quotation
→ Supplier PO
→ Transport Job
→ Delivery Proof
→ Invoice
→ Payment
→ Receipt
→ Debt
→ Settlement
→ Dashboard
→ Automation
```

The first real feature to complete is:

```txt
Customer Order → Pricing → BOQ → Quotation
```

Do not build the full marketplace before this basic flow works.

---

# 20. Human Owner Decision Notes

Before coding advanced features, the human owner should decide:

```txt
1. Will customer see supplier name or not?
2. Will supplier set price directly or admin approves price first?
3. Will truck partner accept job manually or auto assign?
4. Is VAT always 7%?
5. Will invoice be issued before or after delivery?
6. Will receipt issue only after confirmed payment?
7. Will customers have credit terms?
8. Can supplier/fleet see payout amount before admin approval?
9. Should quotation require approval above a certain amount?
10. Should low margin block quotation automatically?
```

Default assumption for MVP:

```txt
- Customer does not see supplier cost
- Admin approves supplier price
- Truck assignment is manual first
- VAT is 7%
- Invoice after delivery
- Receipt after confirmed payment
- Credit terms are optional but data model is prepared
- Supplier/fleet payout requires admin approval
- Quotation approval required for high amount or low margin
- Low margin creates alert
```
