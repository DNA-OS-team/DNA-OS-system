# AI_STEP_PROMPTS.md

# DNA OS Construction Platform — Detailed AI Prompts by Development Step

ไฟล์นี้คือชุด Prompt แบบละเอียดสำหรับใช้สั่ง AI Coding Agent เช่น Cursor, Codex, Claude Code หรือ AI ใน VSCode ให้พัฒนาระบบ **DNA OS Construction Platform** ตามลำดับที่ถูกต้อง

ให้วางไฟล์นี้ไว้ที่ root ของโปรเจกต์:

```txt
/AI_STEP_PROMPTS.md
```

ควรใช้ร่วมกับ:

```txt
/AGENT.md
/PROJECT_PROGRESS.md
/DNA_OS_Construction_Platform_Blueprint.md
```

---

# วิธีใช้ไฟล์นี้

1. เปิด `PROJECT_PROGRESS.md`
2. ดูว่า `Current Step` คืออะไร
3. กลับมาที่ไฟล์นี้
4. คัดลอก prompt ของ phase หรือ step นั้นไปสั่ง AI
5. เมื่อ AI ทำเสร็จ ให้ตรวจงาน
6. อัปเดต checkbox ใน `PROJECT_PROGRESS.md`
7. ไป step ถัดไป

---

# กฎสำคัญสำหรับทุก Prompt

ทุกครั้งที่สั่ง AI ให้ใส่กฎนี้เสมอ:

```txt
อ่าน AGENT.md และ PROJECT_PROGRESS.md ก่อนเริ่มทำงาน
ทำเฉพาะ step ที่สั่งเท่านั้น
อย่าข้ามไปทำ feature อื่น
ห้ามสร้าง dashboard ขั้นสูงก่อน foundation เสร็จ
ห้ามสร้าง automation ก่อน core flow ทำงานได้
ห้ามสร้างเลขเอกสารจาก frontend
ห้ามรับ companyId จาก frontend
ห้าม hard delete ข้อมูลการเงิน
business logic ต้องอยู่ใน core/engines
React components ต้องบางและไม่มี business logic หนัก
ใช้ TypeScript และ Zod validation
เมื่อทำเสร็จให้อัปเดต PROJECT_PROGRESS.md
```

---

# MASTER PROMPT — ใช้ก่อนเริ่มโปรเจกต์

```txt
คุณคือ Senior Full-stack Engineer และ System Architect ที่กำลังพัฒนาระบบ DNA OS Construction Platform

ก่อนเริ่มเขียนโค้ด ให้คุณอ่านไฟล์ต่อไปนี้:
1. AGENT.md
2. PROJECT_PROGRESS.md
3. DNA_OS_Construction_Platform_Blueprint.md ถ้ามี
4. AI_STEP_PROMPTS.md

เป้าหมายของระบบ:
สร้างแพลตฟอร์มกลางสำหรับงานรับเหมาก่อสร้างและวัสดุก่อสร้าง โดยมีเจ้าของระบบเป็น core operator ระหว่างลูกค้า, supplier, รถร่วม, เอกสาร, การเงิน และ dashboard

หลักการสำคัญ:
ข้อมูลเกิดครั้งเดียว ถูกใช้ทั้งระบบ

Architecture:
- Next.js
- TypeScript
- Supabase
- PostgreSQL
- Prisma
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod
- Modular Monolith

กฎการทำงาน:
1. ทำเฉพาะ step ที่สั่ง
2. อย่าข้าม phase
3. business logic ต้องอยู่ใน core/engines
4. React components ต้องบาง
5. database schema ต้องรองรับ multi-tenant
6. companyId ต้องมาจาก session เท่านั้น
7. ห้าม hard delete
8. financial action ต้อง audit
9. document number ต้อง generate ฝั่ง server
10. ต้องอัปเดต PROJECT_PROGRESS.md เมื่อทำเสร็จ

ก่อนเริ่มเขียนโค้ด ให้สรุปให้ฉันก่อนว่า:
- ตอนนี้โปรเจกต์อยู่ phase ไหน
- คุณจะทำไฟล์อะไรบ้าง
- คุณจะไม่แตะไฟล์อะไร
- ผลลัพธ์หลังจบ step นี้คืออะไร

หลังจากนั้นจึงเริ่มทำงาน
```

---

# PHASE 0 — PROJECT SETUP

## Prompt 0.1 — สร้าง Next.js Project Foundation

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` first 

ตอนนี้เราจะเริ่ม Phase 0: Project Setup

เป้าหมาย:
สร้างโครงสร้างโปรเจกต์ Next.js + TypeScript สำหรับ DNA OS Construction Platform

สิ่งที่ต้องทำ:
1. ตรวจสอบว่าโปรเจกต์นี้เป็น Next.js หรือยัง
2. ถ้ายังไม่มี ให้สร้างโครงสร้าง Next.js App Router
3. เปิดใช้ TypeScript
4. สร้างโครงสร้างโฟลเดอร์หลัก:
   - src/app
   - src/core
   - src/core/constants
   - src/core/engines
   - src/core/schemas
   - src/core/utils
   - src/core/permissions
   - src/features
   - src/components
   - src/components/ui
   - src/components/layout
   - src/server
   - src/server/db
   - src/server/actions
   - src/server/services
   - prisma
5. สร้างหน้าแรกแบบ minimal ที่บอกว่า DNA OS Construction Platform
6. สร้าง layout หลัก
7. ตรวจว่า npm run dev ทำงานได้

ข้อห้าม:
- ห้ามสร้าง dashboard ขั้นสูง
- ห้ามสร้าง database table ใน step นี้
- ห้ามสร้าง business logic ซับซ้อน
- ห้ามสร้าง mock data จำนวนมาก

ผลลัพธ์ที่ต้องได้:
- โปรเจกต์รันได้
- มีโครงสร้าง folder พร้อมต่อยอด
- หน้าแรกเปิดได้
- อัปเดต PROJECT_PROGRESS.md:
  [x] Project created
  [x] Next.js installed

เมื่อทำเสร็จให้สรุป:
- ไฟล์ที่สร้าง
- วิธีรัน
- step ต่อไปที่ควรทำ
```

---

## Prompt 0.2 — ติดตั้ง Tailwind CSS และ shadcn/ui

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` first 

ตอนนี้เราจะทำ Phase 0 ต่อ: ติดตั้ง UI foundation

เป้าหมาย:
ติดตั้ง Tailwind CSS และ shadcn/ui เพื่อใช้เป็น UI system หลัก

สิ่งที่ต้องทำ:
1. ตรวจสอบ Tailwind CSS ว่าติดตั้งแล้วหรือไม่
2. ถ้ายังไม่ติดตั้ง ให้ติดตั้ง Tailwind CSS สำหรับ Next.js
3. ตั้งค่า globals.css
4. ตั้งค่า tailwind.config
5. ติดตั้ง shadcn/ui
6. เพิ่ม components พื้นฐาน:
   - Button
   - Card
   - Input
   - Label
   - Select
   - Textarea
   - Table
   - Badge
   - Dialog
   - Tabs
7. สร้างหน้า demo เล็ก ๆ ที่ใช้ Card และ Button
8. ตรวจว่า theme ทำงานได้

ข้อห้าม:
- ห้ามสร้าง business page จริงใน step นี้
- ห้ามสร้าง dashboard เต็ม
- ห้าม hardcode สีจำนวนมากใน component
- ห้ามเขียน inline style เป็นหลัก

ผลลัพธ์ที่ต้องได้:
- Tailwind ใช้งานได้
- shadcn/ui ใช้งานได้
- มี UI components พร้อมใช้
- อัปเดต PROJECT_PROGRESS.md:
  [x] Tailwind installed
  [x] shadcn/ui installed

เมื่อทำเสร็จให้สรุป:
- package ที่เพิ่ม
- components ที่สร้าง
- วิธีใช้งาน component
```

---

## Prompt 0.3 — ตั้งค่า Environment Variables

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` first 

ตอนนี้เราจะตั้งค่า environment variables สำหรับระบบ

เป้าหมาย:
สร้าง env structure ที่พร้อมสำหรับ Supabase, Prisma, Inngest, LINE, Sentry และ PDF

สิ่งที่ต้องทำ:
1. สร้างไฟล์ .env.example
2. ใส่ตัวแปรเหล่านี้:
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
3. สร้าง src/core/env.ts หรือ src/server/env.ts สำหรับ validate env ด้วย Zod
4. แยก public env และ server env ให้ชัดเจน
5. ห้าม expose service role key ไป client
6. เพิ่ม comment อธิบายแต่ละ env ใน .env.example

ข้อห้าม:
- ห้ามใส่ secret จริง
- ห้าม commit .env
- ห้ามใช้ SUPABASE_SERVICE_ROLE_KEY ใน client component
- ห้ามอ่าน process.env แบบกระจัดกระจายทุกที่

ผลลัพธ์ที่ต้องได้:
- มี .env.example
- มี env validation
- มีการแยก public/server env
- อัปเดต PROJECT_PROGRESS.md ถ้ามี checklist env

เมื่อทำเสร็จให้สรุป:
- env ที่ต้องกรอก
- env ไหนใช้ฝั่ง client
- env ไหนใช้ฝั่ง server เท่านั้น
```

---

# PHASE 1 — IDENTITY & TENANT FOUNDATION

## Prompt 1.1 — Setup Prisma และ Database Connection

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` first 

ตอนนี้เราจะเริ่ม Phase 1: Identity & Tenant Foundation

เป้าหมาย:
ตั้งค่า Prisma และเชื่อม PostgreSQL / Supabase database

สิ่งที่ต้องทำ:
1. ติดตั้ง Prisma และ Prisma Client
2. สร้าง prisma/schema.prisma
3. ตั้ง provider เป็น postgresql
4. อ่าน DATABASE_URL และ DIRECT_URL จาก env
5. สร้าง src/server/db/prisma.ts
6. ใช้ singleton PrismaClient เพื่อกัน connection ซ้ำใน dev
7. เพิ่ม script ใน package.json:
   - db:generate
   - db:push
   - db:migrate
   - db:studio
8. ทดสอบ prisma generate

ข้อห้าม:
- ห้ามสร้าง model เยอะใน step นี้
- ห้ามสร้าง business logic
- ห้ามใช้ Prisma ใน client component

ผลลัพธ์ที่ต้องได้:
- Prisma setup สำเร็จ
- Database connection พร้อม
- อัปเดต PROJECT_PROGRESS.md:
  [x] Prisma connected
  [x] Supabase connected ถ้าต่อสำเร็จ

เมื่อทำเสร็จให้สรุป:
- ไฟล์ที่สร้าง
- command ที่ต้องรัน
- วิธีเปิด Prisma Studio
```

---

## Prompt 1.2 — สร้าง Models: Company, User, CompanyMember

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` first 

ตอนนี้เราจะสร้าง database foundation ชุดแรก

เป้าหมาย:
สร้างตารางหลักสำหรับ multi-tenant:
- Company
- User
- CompanyMember

สิ่งที่ต้องทำ:
1. แก้ prisma/schema.prisma
2. เพิ่ม enum CompanyType:
   - CORE
   - CUSTOMER
   - SUPPLIER
   - FLEET
3. เพิ่ม enum CompanyStatus:
   - ACTIVE
   - INACTIVE
   - SUSPENDED
4. เพิ่ม enum UserStatus:
   - ACTIVE
   - INACTIVE
   - INVITED
5. เพิ่ม enum Role:
   - OWNER
   - ADMIN
   - ACCOUNTANT
   - PROCUREMENT
   - OPERATION
   - CUSTOMER
   - SUPPLIER
   - FLEET_OWNER
   - DRIVER
   - VIEWER
6. เพิ่ม model Company
7. เพิ่ม model User
8. เพิ่ม model CompanyMember
9. ใส่ relation ให้ถูกต้อง
10. ใส่ unique constraint:
   - User.email
   - CompanyMember(companyId, userId)
11. สร้าง migration หรือ db push
12. รัน prisma generate

Company fields:
- id
- name
- taxId
- address
- phone
- email
- bankName
- bankAccountNo
- type
- status
- createdAt
- updatedAt

User fields:
- id
- email
- name
- phone
- status
- createdAt
- updatedAt

CompanyMember fields:
- id
- companyId
- userId
- role
- status
- createdAt
- updatedAt

ข้อห้าม:
- ห้ามใช้ string role แบบไม่มี enum
- ห้ามรับ companyId จาก frontend ในอนาคต
- ห้ามสร้าง order/product ใน step นี้

ผลลัพธ์ที่ต้องได้:
- Prisma models ใช้งานได้
- Migration สำเร็จ
- อัปเดต PROJECT_PROGRESS.md:
  [x] companies table created
  [x] users table created
  [x] company_members table created

เมื่อทำเสร็จให้สรุป:
- model ที่สร้าง
- relation หลัก
- command migration ที่ใช้
```

---

## Prompt 1.3 — สร้าง Permission System เบื้องต้น

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` first 

เป้าหมาย:
สร้าง permission system เบื้องต้นสำหรับตรวจ role ใน application layer

สิ่งที่ต้องทำ:
1. สร้าง src/core/permissions/roles.ts
2. สร้าง src/core/permissions/policies.ts
3. สร้าง function:
   - hasRole(userRole, allowedRoles)
   - canAccessResource(role, resource, action)
   - assertPermission(role, resource, action)
4. กำหนด resource เบื้องต้น:
   - company
   - customer
   - product
   - supplier
   - fleet
   - order
   - document
   - payment
   - dashboard
5. กำหนด action:
   - read
   - create
   - update
   - delete
   - approve
   - manage
6. เขียน unit test ง่าย ๆ ถ้ามี test framework
7. เพิ่มตัวอย่างการใช้ใน comment

ข้อห้าม:
- ห้ามผูก permission ไว้ใน component โดยตรง
- ห้ามเช็ก role แบบกระจัดกระจาย
- ห้ามทำ RLS ใน step นี้ถ้ายังไม่พร้อม

ผลลัพธ์ที่ต้องได้:
- มี permission helper
- role สามารถตรวจ access ได้
- อัปเดต PROJECT_PROGRESS.md:
  [x] roles working

เมื่อทำเสร็จให้สรุป:
- role ไหนทำอะไรได้
- วิธีใช้ permission helper
```

---

## Prompt 1.4 — สร้าง Audit Log Model และ Audit Engine

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` first 

เป้าหมาย:
สร้าง audit log foundation สำหรับบันทึก action สำคัญ

สิ่งที่ต้องทำ:
1. เพิ่ม model AuditLog ใน Prisma
2. fields:
   - id
   - actorUserId
   - companyId
   - entityType
   - entityId
   - action
   - field
   - oldValue
   - newValue
   - ipAddress
   - userAgent
   - createdAt
3. สร้าง src/core/engines/auditEngine.ts
4. เพิ่ม function:
   - createAuditEntry(input)
   - formatAuditValue(value)
5. สร้าง src/server/services/auditService.ts
6. เพิ่ม function:
   - writeAuditLog(input)
7. auditService ต้องใช้ Prisma ฝั่ง server เท่านั้น
8. เพิ่ม type สำหรับ AuditAction

ข้อห้าม:
- ห้ามเขียน audit จาก client โดยตรง
- ห้าม hard delete audit log
- ห้ามบันทึกข้อมูลลับ เช่น password/token

ผลลัพธ์ที่ต้องได้:
- มี audit_logs table
- มี auditEngine
- มี auditService
- อัปเดต PROJECT_PROGRESS.md:
  [x] Basic audit log

เมื่อทำเสร็จให้สรุป:
- วิธีเรียกใช้ audit
- action ไหนควร audit
```

---

# PHASE 2 — CUSTOMER & SITE MODULE

## Prompt 2.1 — สร้าง Customer Site และ Credit Profile Models

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` first 

เป้าหมาย:
สร้าง database สำหรับ customer site และ credit profile

สิ่งที่ต้องทำ:
1. เพิ่ม enum CreditStatus:
   - NORMAL
   - WATCH
   - HOLD
   - BLOCKED
2. เพิ่ม model CustomerSite
3. เพิ่ม model CustomerCreditProfile
4. relation:
   - CustomerSite.customerCompany -> Company
   - CustomerCreditProfile.customerCompany -> Company
5. CustomerSite fields:
   - id
   - customerCompanyId
   - siteName
   - address
   - province
   - district
   - subdistrict
   - postalCode
   - gpsLat
   - gpsLng
   - contactName
   - contactPhone
   - deliveryNote
   - accessRestriction
   - preferredDeliveryTime
   - isActive
   - createdAt
   - updatedAt
6. CustomerCreditProfile fields:
   - id
   - customerCompanyId
   - creditLimit
   - creditTermDays
   - currentOutstanding
   - overdueAmount
   - creditStatus
   - paymentBehaviorScore
   - updatedAt
7. run migration
8. run prisma generate

ข้อห้าม:
- ห้ามเก็บ site address แค่ text ใน order โดยไม่มี relation
- ห้ามสร้าง order ใน step นี้
- ห้ามคิด credit logic ซับซ้อนใน step นี้

ผลลัพธ์ที่ต้องได้:
- customer_sites table
- customer_credit_profiles table
- อัปเดต PROJECT_PROGRESS.md:
  [x] customer site page created เฉพาะถ้าทำ page ใน step ถัดไป
  [x] customer credit model created
```

---

## Prompt 2.2 — สร้าง Customer Admin Pages

```txt
อ่าน AGENT.md ,PROJECT_RULES และ PROJECT_PROGRESS.md ก่อนเริ่มงาน

เป้าหมาย:
สร้างหน้า admin สำหรับจัดการลูกค้าและไซต์งาน

สิ่งที่ต้องทำ:
1. สร้าง route:
   - /admin/customers
   - /admin/customers/new
   - /admin/customers/[id]
   - /admin/customers/[id]/sites
   - /admin/customers/[id]/credit
2. สร้าง form ด้วย React Hook Form + Zod
3. Customer form ต้องสร้าง Company type CUSTOMER
4. Site form ต้องสร้าง CustomerSite
5. Credit form ต้องสร้าง/อัปเดต CustomerCreditProfile
6. ใช้ Server Actions หรือ Route Handlers สำหรับ mutation
7. ใส่ validation:
   - customer name required
   - site name required
   - address required
   - credit limit >= 0
   - credit term >= 0
8. ใช้ shadcn/ui components
9. เพิ่ม audit log เมื่อสร้าง/แก้ไข customer/site/credit

ข้อห้าม:
- ห้ามให้ user เลือก companyId เองจาก hidden input ที่ไม่น่าเชื่อถือ
- ห้ามสร้าง supplier ในหน้า customer
- ห้ามสร้าง order ใน step นี้

ผลลัพธ์ที่ต้องได้:
- Admin เพิ่มลูกค้าได้
- Admin เพิ่มไซต์งานได้
- Admin ตั้งค่าเครดิตได้
- อัปเดต PROJECT_PROGRESS.md:
  [x] customer page created
  [x] customer site page created

เมื่อทำเสร็จให้สรุป:
- routes ที่สร้าง
- forms ที่ทำ
- validation ที่เพิ่ม
```

---

# PHASE 3 — PRODUCT CATALOG MODULE

## Prompt 3.1 — สร้าง Product Catalog Models

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` first 

เป้าหมาย:
สร้าง master data สินค้ากลาง

สิ่งที่ต้องทำ:
1. เพิ่ม model ProductCategory
2. เพิ่ม model Product
3. เพิ่ม model ProductVariant
4. เพิ่ม model Unit ถ้าจำเป็น
5. ProductCategory fields:
   - id
   - name
   - description
   - sortOrder
   - createdAt
   - updatedAt
6. Product fields:
   - id
   - categoryId
   - name
   - description
   - defaultUnit
   - isActive
   - createdAt
   - updatedAt
7. ProductVariant fields:
   - id
   - productId
   - name
   - unit
   - specs json
   - isActive
   - createdAt
   - updatedAt
8. ใส่ relation ให้ครบ
9. run migration
10. run prisma generate

ข้อห้าม:
- ห้ามผูก Product กับ supplier โดยตรง
- ห้ามใส่ราคาใน Product master
- ราคาต้องอยู่ใน supplier_products หรือ price rules เท่านั้น

ผลลัพธ์ที่ต้องได้:
- product_categories table
- products table
- product_variants table
- อัปเดต PROJECT_PROGRESS.md ตาม checklist
```

---

## Prompt 3.2 — สร้าง Product Admin Pages

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` first 

เป้าหมาย:
สร้างหน้า admin สำหรับจัดการหมวดสินค้า สินค้า และ variant

สิ่งที่ต้องทำ:
1. สร้าง routes:
   - /admin/products
   - /admin/products/categories
   - /admin/products/new
   - /admin/products/[id]
   - /admin/products/[id]/variants
2. สร้าง forms ด้วย React Hook Form + Zod
3. ใช้ shadcn/ui
4. เพิ่ม validation:
   - category name required
   - product name required
   - default unit required
   - variant name required
   - variant unit required
5. เพิ่ม search/filter เบื้องต้น
6. เพิ่ม isActive toggle
7. เพิ่ม audit log เมื่อ create/update

ข้อห้าม:
- ห้ามใส่ supplier price ในหน้า Product master
- ห้ามสร้าง order ใน step นี้
- ห้ามสร้าง dashboard chart ใน step นี้

ผลลัพธ์ที่ต้องได้:
- Admin สร้าง category ได้
- Admin สร้าง product ได้
- Admin สร้าง variant ได้
- อัปเดต PROJECT_PROGRESS.md:
  [x] product catalog created
```

---

# PHASE 4 — SUPPLIER / PARTNER MODULE

## Prompt 4.1 — สร้าง Supplier Product, Contract และ Price History Models

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` first 

เป้าหมาย:
สร้าง data model สำหรับ supplier, ราคาสินค้า, สัญญาราคา และประวัติราคา

สิ่งที่ต้องทำ:
1. เพิ่ม model SupplierProduct
2. เพิ่ม model SupplierContract
3. เพิ่ม model SupplierContractItem
4. เพิ่ม model PriceHistory
5. SupplierProduct fields:
   - id
   - supplierCompanyId
   - productVariantId
   - sku
   - price
   - minQty
   - serviceArea
   - leadTimeHours
   - isAvailable
   - createdAt
   - updatedAt
6. SupplierContract fields:
   - id
   - supplierCompanyId
   - contractNo
   - startDate
   - endDate
   - paymentTermDays
   - deliveryTerm
   - priceValidity
   - status
   - createdAt
   - updatedAt
7. SupplierContractItem fields:
   - id
   - supplierContractId
   - productVariantId
   - unitCost
   - minQty
   - maxQty
   - serviceArea
   - effectiveFrom
   - effectiveTo
   - createdAt
8. PriceHistory fields:
   - id
   - entityType
   - entityId
   - oldPrice
   - newPrice
   - changedBy
   - reason
   - effectiveAt
   - createdAt
9. run migration
10. run prisma generate

ข้อห้าม:
- ห้ามแก้ supplier price โดยไม่มี price history
- ห้ามให้ supplier เห็นสินค้าของ supplier อื่น
- ห้ามใส่ราคาต้นทุนใน customer-facing pages

ผลลัพธ์ที่ต้องได้:
- supplier_products table
- supplier_contracts table
- supplier_contract_items table
- price_histories table
```

---

## Prompt 4.2 — สร้าง Supplier Admin และ Partner Product Pages

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` first 

เป้าหมาย:
สร้างหน้าจัดการ supplier และสินค้า supplier

สิ่งที่ต้องทำ:
1. สร้าง routes:
   - /admin/partners
   - /admin/partners/new
   - /admin/partners/[id]
   - /admin/partners/[id]/products
   - /admin/partners/[id]/contracts
   - /partner/products
   - /partner/pricing
2. Admin สามารถสร้าง Company type SUPPLIER ได้
3. Admin สามารถเพิ่ม supplier product ได้
4. Partner สามารถเห็นเฉพาะสินค้าของตัวเอง
5. เพิ่ม form supplier product:
   - productVariantId
   - sku
   - price
   - minQty
   - serviceArea
   - leadTimeHours
   - isAvailable
6. ทุกครั้งที่ price เปลี่ยน ให้สร้าง PriceHistory
7. เพิ่ม audit log
8. ใช้ permission check

ข้อห้าม:
- ห้ามให้ supplier แก้ product master
- ห้ามให้ supplier เห็น supplier รายอื่น
- ห้ามให้ customer เห็น supplier cost

ผลลัพธ์ที่ต้องได้:
- Admin สร้าง supplier ได้
- Supplier มีสินค้าและราคาได้
- Price history ทำงาน
- อัปเดต PROJECT_PROGRESS.md:
  [x] supplier product created
```

---

# PHASE 5 — FLEET / TRUCK PARTNER FOUNDATION

## Prompt 5.1 — สร้าง Fleet Models

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` first 

เป้าหมาย:
สร้าง database สำหรับรถร่วม

สิ่งที่ต้องทำ:
1. เพิ่ม model FleetPartner
2. เพิ่ม model VehicleType
3. เพิ่ม model Vehicle
4. เพิ่ม model VehicleAvailability
5. เพิ่ม model TransportRateCard
6. เพิ่ม enum VehicleStatus:
   - OPEN
   - BUSY
   - OFFLINE
   - MAINTENANCE
   - BLOCKED
7. Vehicle fields:
   - id
   - fleetPartnerId
   - vehicleTypeId
   - plateNo
   - capacityValue
   - capacityUnit
   - status
   - isAcceptingQueue
   - createdAt
   - updatedAt
8. TransportRateCard fields:
   - id
   - fleetPartnerId
   - vehicleTypeId
   - fromArea
   - toArea
   - productType
   - minDistanceKm
   - maxDistanceKm
   - basePrice
   - pricePerKm
   - pricePerTrip
   - pricePerUnit
   - isActive
   - effectiveFrom
   - effectiveTo
9. run migration
10. run prisma generate

ข้อห้าม:
- ห้ามสร้าง auto dispatch ซับซ้อนใน step นี้
- ห้ามสร้าง transport job ก่อน vehicle foundation พร้อม
- ห้ามให้ fleet เห็นข้อมูลการเงินที่ไม่เกี่ยวข้อง

ผลลัพธ์ที่ต้องได้:
- fleet_partners table
- vehicle_types table
- vehicles table
- vehicle_availability table
- transport_rate_cards table
```

---

## Prompt 5.2 — สร้าง Fleet Admin และ Fleet Portal Pages

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` first 

เป้าหมาย:
สร้างหน้า admin/fleet สำหรับจัดการรถร่วม

สิ่งที่ต้องทำ:
1. สร้าง routes:
   - /admin/fleet
   - /admin/fleet/vehicles
   - /admin/fleet/rate-cards
   - /fleet/vehicles
   - /fleet/availability
2. Admin สร้าง Company type FLEET ได้
3. Admin/Fleet เพิ่ม vehicle type ได้
4. Fleet เพิ่ม vehicle ได้
5. Fleet เปิด/ปิดรับคิวได้
6. Fleet ตั้ง availability ได้
7. Admin ตั้ง transport rate card ได้
8. ใช้ permission check
9. เพิ่ม audit log

ข้อห้าม:
- ห้ามสร้าง job matching อัตโนมัติ
- ห้ามสร้าง invoice/payment ใน step นี้
- ห้ามให้ fleet เห็น order ทั้งหมด

ผลลัพธ์ที่ต้องได้:
- Fleet partner เพิ่มรถได้
- Vehicle เปิด/ปิดรับคิวได้
- Rate card บันทึกได้
- อัปเดต PROJECT_PROGRESS.md ตาม checklist
```

---

# PHASE 6 — CUSTOMER ORDER MODULE

## Prompt 6.1 — สร้าง Customer Order Models

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` first 

เป้าหมาย:
สร้าง database สำหรับคำสั่งซื้อของลูกค้า

สิ่งที่ต้องทำ:
1. เพิ่ม enum CustomerOrderStatus:
   - DRAFT
   - SUBMITTED
   - PRICING
   - QUOTED
   - CONFIRMED
   - PROCUREMENT
   - DISPATCHING
   - PARTIALLY_DELIVERED
   - DELIVERED
   - INVOICED
   - PAID
   - CANCELLED
2. เพิ่ม model CustomerOrder
3. เพิ่ม model CustomerOrderItem
4. เพิ่ม model OrderStatusHistory
5. CustomerOrder fields:
   - id
   - orderNo
   - customerCompanyId
   - customerSiteId
   - requestedDeliveryDate
   - status
   - subtotal
   - vat
   - total
   - internalCost
   - grossMargin
   - createdBy
   - createdAt
   - updatedAt
6. CustomerOrderItem fields:
   - id
   - orderId
   - productVariantId
   - description
   - qty
   - unit
   - customerUnitPrice
   - customerAmount
   - selectedSupplierId
   - supplierUnitCost
   - supplierCostAmount
   - transportRequired
7. OrderStatusHistory fields:
   - id
   - orderId
   - fromStatus
   - toStatus
   - changedBy
   - note
   - createdAt
8. run migration
9. run prisma generate

ข้อห้าม:
- ห้ามสร้าง invoice ใน step นี้
- ห้ามสร้าง PO ใน step นี้
- ห้ามคำนวณราคาซับซ้อนใน model

ผลลัพธ์ที่ต้องได้:
- customer_orders table
- customer_order_items table
- order_status_history table
```

---

## Prompt 6.2 — สร้าง Customer Order Pages และ Form

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` first 

เป้าหมาย:
สร้างหน้า admin/customer สำหรับสร้าง order

สิ่งที่ต้องทำ:
1. สร้าง routes:
   - /admin/orders
   - /admin/orders/new
   - /admin/orders/[id]
   - /customer/catalog
   - /customer/cart
   - /customer/checkout
   - /customer/orders
2. สำหรับ MVP ให้ admin สร้าง order ได้ก่อน
3. Order form ต้องมี:
   - customer
   - customer site
   - requested delivery date
   - product items
   - qty
   - unit
   - note
4. ใช้ React Hook Form + Zod
5. เมื่อ submit ให้สร้าง CustomerOrder status SUBMITTED
6. สร้าง CustomerOrderItem ตามรายการ
7. สร้าง OrderStatusHistory
8. สร้าง audit log
9. แสดงหน้า detail ของ order

ข้อห้าม:
- ห้ามสร้างใบเสนอราคาใน step นี้
- ห้ามสร้าง supplier PO ใน step นี้
- ห้ามคำนวณราคาสุดท้ายถ้า pricing engine ยังไม่พร้อม

ผลลัพธ์ที่ต้องได้:
- Admin สร้าง order ได้
- Order มี items ได้
- Order ผูก customer site ได้
- อัปเดต PROJECT_PROGRESS.md:
  [x] customer order created
```

---

# PHASE 7 — PRICING & BOQ MODULE

## Prompt 7.1 — สร้าง Pricing Engine MVP

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` first 

เป้าหมาย:
สร้าง pricingEngine เพื่อคำนวณต้นทุน ราคาขาย VAT และ margin

สิ่งที่ต้องทำ:
1. สร้าง src/core/engines/calculationEngine.ts
2. สร้าง src/core/engines/pricingEngine.ts
3. สร้าง src/core/engines/supplierSelectionEngine.ts
4. สร้าง src/core/engines/marginEngine.ts
5. calculationEngine ต้องมี:
   - calculateSubtotal(items)
   - calculateVat(amount, rate = 0.07)
   - calculateTotal(subtotal, vat)
   - roundMoney(value)
6. supplierSelectionEngine ต้องมี:
   - selectBestSupplier(productVariantId, qty, site)
   - filterAvailableSuppliers()
   - sortSuppliersByRule()
7. pricingEngine ต้องมี:
   - priceOrder(order, items, supplierProducts, rateCards)
   - priceOrderItem(item)
   - calculateCustomerPrice()
   - calculateInternalCost()
   - calculateGrossMargin()
8. แยก field เหล่านี้ให้ชัด:
   - supplierUnitCost
   - transportCost
   - platformMargin
   - customerUnitPrice
   - customerAmount
9. เขียน unit tests ถ้ามี test framework
10. เพิ่ม comment อธิบายสูตร

ข้อห้าม:
- ห้ามคำนวณ VAT ใน JSX
- ห้ามให้ customer เห็น supplierUnitCost
- ห้าม hardcode supplier แบบสุ่มโดยไม่มี rule
- ห้ามสร้าง document ใน step นี้

ผลลัพธ์ที่ต้องได้:
- pricingEngine ใช้งานได้
- คำนวณ order total ได้
- คำนวณ margin ได้
- อัปเดต PROJECT_PROGRESS.md:
  [x] pricing engine created
```

---

## Prompt 7.2 — สร้าง BOQ Models และ BOQ Generation

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` first 

เป้าหมาย:
สร้าง BOQ ทั้งแบบ internal และ customer

สิ่งที่ต้องทำ:
1. เพิ่ม enum BoqType:
   - INTERNAL
   - CUSTOMER
2. เพิ่ม model BOQ
3. เพิ่ม model BOQItem
4. เพิ่ม model BOQCostBreakdown
5. BOQ fields:
   - id
   - boqNo
   - orderId
   - type
   - subtotal
   - vat
   - total
   - internalCost
   - grossMargin
   - createdBy
   - createdAt
   - updatedAt
6. BOQItem fields:
   - id
   - boqId
   - seq
   - productVariantId
   - description
   - qty
   - unit
   - unitPrice
   - amount
7. BOQCostBreakdown fields:
   - id
   - boqId
   - boqItemId
   - supplierCost
   - transportCost
   - marginAmount
   - marginPercent
8. สร้าง src/server/services/boqService.ts
9. เพิ่ม function:
   - createInternalBOQFromOrder(orderId)
   - createCustomerBOQFromOrder(orderId)
10. ใช้ pricingEngine ในการคำนวณ
11. run migration
12. run prisma generate

ข้อห้าม:
- ห้าม customer เห็น Internal BOQ
- ห้ามแก้ไข BOQ ที่ถูกใช้สร้าง quotation แล้วโดยไม่ version
- ห้ามคำนวณยอดเงินหลายที่

ผลลัพธ์ที่ต้องได้:
- Internal BOQ สร้างได้
- Customer BOQ สร้างได้
- อัปเดต PROJECT_PROGRESS.md:
  [x] BOQ created
```

---

## Prompt 7.3 — สร้าง BOQ UI

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` first 

เป้าหมาย:
สร้าง UI สำหรับดู BOQ จาก order

สิ่งที่ต้องทำ:
1. เพิ่มใน /admin/orders/[id] ให้มี tab BOQ
2. แสดง Customer BOQ
3. แสดง Internal Cost BOQ เฉพาะ role:
   - OWNER
   - ADMIN
   - ACCOUNTANT
   - PROCUREMENT
4. แสดง:
   - รายการ
   - จำนวน
   - หน่วย
   - ราคาขาย
   - ต้นทุน supplier เฉพาะ internal
   - transport cost เฉพาะ internal
   - margin เฉพาะ internal
   - VAT
   - total
5. เพิ่มปุ่ม Generate BOQ
6. เพิ่ม alert ถ้า margin ต่ำ
7. ใช้ calculation/pricing result จาก server ไม่คำนวณซ้ำใน JSX

ข้อห้าม:
- ห้ามแสดง supplier cost ให้ CUSTOMER
- ห้ามคำนวณ VAT ใน component
- ห้ามสร้าง quotation อัตโนมัติใน step นี้

ผลลัพธ์ที่ต้องได้:
- Admin ดู BOQ ได้
- Internal BOQ แสดงเฉพาะ role ที่มีสิทธิ์
- Customer BOQ พร้อมใช้สร้าง quotation
```

---

# PHASE 8 — DOCUMENT FOUNDATION

## Prompt 8.1 — สร้าง Document Models และ Counters

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` first 

เป้าหมาย:
สร้างระบบเอกสารหลักและเลขเอกสาร

สิ่งที่ต้องทำ:
1. เพิ่ม enum DocumentType:
   - BOQ
   - QT
   - INV3
   - INV
   - RCT
   - PV
   - PMT
   - PO
2. เพิ่ม enum DocumentStatus:
   - DRAFT
   - PENDING
   - APPROVED
   - PAID
   - REJECTED
   - CANCELLED
3. เพิ่ม model Document
4. เพิ่ม model DocumentItem
5. เพิ่ม model DocumentCounter
6. เพิ่ม model DocumentVersion ถ้าจำเป็น
7. Document fields:
   - id
   - docNo
   - docType
   - status
   - version
   - parentDocId
   - customerOrderId
   - supplierPoId
   - projectId
   - companyId
   - counterpartyCompanyId
   - issueDate
   - dueDate
   - vatMode
   - subtotal
   - vat
   - total
   - notes
   - pdfUrl
   - createdBy
   - createdAt
   - updatedAt
   - isArchived
8. DocumentCounter fields:
   - id
   - companyId
   - prefix
   - year
   - month
   - currentSeq
   - updatedAt
9. run migration
10. run prisma generate

ข้อห้าม:
- ห้ามสร้าง docNo จาก frontend
- ห้ามแก้เลขเอกสารด้วยมือใน UI
- ห้าม hard delete document

ผลลัพธ์ที่ต้องได้:
- documents table
- document_items table
- document_counters table
- document number foundation พร้อม
```

---

## Prompt 8.2 — สร้าง Numbering Engine และ Document Engine

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` first 

เป้าหมาย:
สร้าง engine สำหรับเลขเอกสารและการสร้างเอกสาร

สิ่งที่ต้องทำ:
1. สร้าง src/core/engines/numberingEngine.ts
2. สร้าง src/core/engines/documentEngine.ts
3. สร้าง src/core/engines/documentRelationEngine.ts
4. สร้าง src/server/services/documentCounterService.ts
5. สร้าง src/server/services/documentService.ts
6. numberingEngine ต้องมี:
   - formatDocumentNo(prefix, date, seq)
   - getPrefixByDocType(docType)
7. documentCounterService ต้อง:
   - ใช้ transaction
   - lock หรือ update counter อย่างปลอดภัย
   - increment seq
   - return docNo
8. documentEngine ต้อง:
   - createDocumentSnapshot()
   - buildDocumentItems()
   - calculateDocumentTotals()
9. documentRelationEngine ต้อง:
   - allowedChildren(docType)
   - buildChain(documentId)
10. เพิ่ม tests สำหรับ numberingEngine

ข้อห้าม:
- ห้ามใช้ Math.random สำหรับ docNo production
- ห้ามสร้าง docNo ใน client
- ห้ามให้ UI เขียน document total เอง

ผลลัพธ์ที่ต้องได้:
- สร้างเลขเอกสาร server-side ได้
- สร้าง document snapshot ได้
- อัปเดต PROJECT_PROGRESS.md ถ้า document foundation complete
```

---

## Prompt 8.3 — สร้าง PDF Preview Foundation

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` first 

เป้าหมาย:
สร้าง document preview foundation ก่อน generate PDF จริง

สิ่งที่ต้องทำ:
1. สร้าง components:
   - src/components/document/DocumentRenderer.tsx
   - src/components/document/QuotationDocument.tsx
   - src/components/document/InvoiceDocument.tsx
   - src/components/document/ReceiptDocument.tsx
   - src/components/document/PurchaseOrderDocument.tsx
2. สร้าง shared components:
   - DocumentHeader
   - DocumentPartySection
   - DocumentItemsTable
   - DocumentFinancialSummary
   - DocumentFooter
3. รับ document data ผ่าน props
4. ห้าม component คำนวณ VAT เอง
5. ใช้ totals จาก document record
6. ทำ layout A4
7. สร้าง route preview:
   - /admin/documents/[id]/preview
8. เพิ่มปุ่ม download placeholder แต่ยังไม่ต้อง generate PDF จริงก็ได้

ข้อห้าม:
- ห้ามให้ PDF component ดึง database เอง
- ห้ามคำนวณยอดเงินใน JSX
- ห้ามสร้างใบเสร็จใน step นี้

ผลลัพธ์ที่ต้องได้:
- เปิด preview เอกสารได้
- layout เอกสารอ่านได้
- พร้อมต่อ PDF generation
```

---

# PHASE 9 — QUOTATION FLOW

## Prompt 9.1 — สร้าง Quotation จาก BOQ / Order

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` first 

เป้าหมาย:
สร้างใบเสนอราคา QT จาก Customer BOQ หรือ Order

สิ่งที่ต้องทำ:
1. เพิ่ม action/service:
   - createQuotationFromOrder(orderId)
   - createQuotationFromBOQ(boqId)
2. ใช้ documentService
3. สร้าง docType = QT
4. สร้าง docNo ผ่าน documentCounterService
5. snapshot รายการจาก Customer BOQ
6. คำนวณ subtotal/vat/total จาก server
7. ตั้ง status:
   - DRAFT ถ้ายังไม่ส่ง
   - PENDING ถ้าต้อง approval
8. เช็ก approval policy:
   - amount สูง
   - margin ต่ำ
   - customer credit hold
9. สร้าง audit log
10. เพิ่มปุ่มใน /admin/orders/[id]:
   - Create Quotation

ข้อห้าม:
- ห้ามสร้าง quotation ถ้าไม่มี BOQ
- ห้ามสร้าง quotation ถ้า customer price ยังไม่ถูกคำนวณ
- ห้ามให้ลูกค้าเห็น internal cost
- ห้ามแก้ QT ที่ approved แล้วโดยตรง

ผลลัพธ์ที่ต้องได้:
- QT สร้างจาก order ได้
- QT มี document items
- QT มี docNo
- QT preview ได้
- อัปเดต PROJECT_PROGRESS.md:
  [x] quotation created
```

---

## Prompt 9.2 — ลูกค้ายืนยัน Quotation

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` first 

เป้าหมาย:
ให้ลูกค้าหรือ admin ยืนยัน quotation และเปลี่ยน order เป็น CONFIRMED

สิ่งที่ต้องทำ:
1. เพิ่ม route:
   - /customer/documents/[id]
   - /customer/quotations/[id]
2. เพิ่ม action:
   - confirmQuotation(documentId)
3. confirmQuotation ต้อง:
   - ตรวจว่า docType = QT
   - ตรวจว่า status เป็น APPROVED หรือพร้อมยืนยัน
   - ตรวจว่า customer มีสิทธิ์ดูเอกสารนี้
   - เปลี่ยน CustomerOrder status เป็น CONFIRMED
   - สร้าง OrderStatusHistory
   - สร้าง audit log
4. ถ้า customer credit BLOCKED หรือ HOLD:
   - ห้าม confirm อัตโนมัติ
   - สร้าง alert/approval request
5. เพิ่ม UI ปุ่ม Confirm Quotation

ข้อห้าม:
- ห้ามให้ customer confirm quotation ของบริษัทอื่น
- ห้ามข้าม credit check
- ห้ามสร้าง PO ซ้ำถ้า quotation ถูก confirm ไปแล้ว

ผลลัพธ์ที่ต้องได้:
- Customer ยืนยัน QT ได้
- Order status เป็น CONFIRMED
- พร้อมเข้าสู่ order split
```

---

# PHASE 10 — ORDER SPLIT & SUPPLIER PO

## Prompt 10.1 — สร้าง Order Split Engine

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` first 

เป้าหมาย:
สร้าง orderSplitEngine สำหรับแยก order item ตาม supplier

สิ่งที่ต้องทำ:
1. สร้าง src/core/engines/orderSplitEngine.ts
2. เพิ่ม function:
   - splitOrderBySupplier(orderItems)
   - groupItemsBySupplier(items)
   - validateAllItemsHaveSupplier(items)
3. logic:
   - ถ้า item มี selectedSupplierId ให้ใช้ค่านั้น
   - ถ้าไม่มี ให้เรียก supplierSelectionEngine
   - group item ตาม supplierCompanyId
   - return supplier groups
4. เขียน test:
   - 1 supplier
   - 2 suppliers
   - missing supplier
   - empty items
5. ห้าม engine เขียน database เอง
6. database write ต้องอยู่ใน procurementService

ข้อห้าม:
- ห้ามสร้าง PO ใน engine โดยตรง
- ห้ามเลือก supplier แบบ random
- ห้าม split order ที่ยังไม่ CONFIRMED

ผลลัพธ์ที่ต้องได้:
- orderSplitEngine test ผ่าน
- สามารถ group order item ตาม supplier ได้
```

---

## Prompt 10.2 — สร้าง Supplier PO Models / Service / UI

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` first 

เป้าหมาย:
สร้าง Supplier Purchase Order จาก order split

สิ่งที่ต้องทำ:
1. เพิ่ม models ถ้ายังไม่มี:
   - SupplierPurchaseOrder
   - SupplierPurchaseOrderItem
2. เพิ่ม enum SupplierPoStatus:
   - DRAFT
   - SENT
   - ACKNOWLEDGED
   - CONFIRMED
   - PARTIALLY_FULFILLED
   - FULFILLED
   - BILLED
   - PAID
   - CANCELLED
   - REJECTED
3. สร้าง src/server/services/procurementService.ts
4. เพิ่ม function:
   - createSupplierPOsFromOrder(orderId)
   - createSupplierPODocument(supplierPoId)
5. Flow:
   - ตรวจ order status CONFIRMED
   - เรียก orderSplitEngine
   - สร้าง SupplierPurchaseOrder ต่อ supplier
   - สร้าง item
   - สร้าง PO document
   - สร้าง audit log
   - update order status PROCUREMENT
6. สร้าง routes:
   - /admin/procurement
   - /admin/procurement/purchase-orders
   - /partner/purchase-orders
   - /partner/purchase-orders/[id]
7. Supplier เห็นเฉพาะ PO ของตัวเอง
8. เพิ่มปุ่ม supplier confirm/reject

ข้อห้าม:
- ห้ามสร้าง PO ซ้ำจาก order เดิมโดยไม่เช็ก existing
- ห้ามให้ supplier เห็นต้นทุนของ supplier อื่น
- ห้ามให้ customer เห็น supplier PO

ผลลัพธ์ที่ต้องได้:
- สร้าง PO แยก supplier ได้
- Supplier เห็น PO ตัวเอง
- Supplier confirm/reject ได้
- อัปเดต PROJECT_PROGRESS.md:
  [x] PO created
```

---

# PHASE 11 — TRANSPORT / FLEET JOB

## Prompt 11.1 — สร้าง Transport Job Models

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` first 

เป้าหมาย:
สร้าง database สำหรับงานขนส่ง

สิ่งที่ต้องทำ:
1. เพิ่ม enum TransportJobStatus:
   - CREATED
   - SEARCHING_TRUCK
   - ASSIGNED
   - ACCEPTED
   - GOING_TO_PICKUP
   - ARRIVED_PICKUP
   - LOADED
   - IN_TRANSIT
   - ARRIVED_SITE
   - DELIVERED
   - PROOF_UPLOADED
   - COMPLETED
   - CANCELLED
   - FAILED
2. เพิ่ม model TransportJob
3. เพิ่ม model TransportJobStop ถ้าต้องการหลายจุด
4. fields:
   - id
   - jobNo
   - customerOrderId
   - supplierPoId
   - assignedFleetPartnerId
   - assignedVehicleId
   - pickupAddress
   - dropoffAddress
   - status
   - scheduledPickupAt
   - scheduledDeliveryAt
   - transportCost
   - customerDeliveryFee
   - createdAt
   - updatedAt
5. run migration
6. run prisma generate

ข้อห้าม:
- ห้ามสร้าง GPS realtime ใน step นี้
- ห้ามสร้าง payment ให้ fleet ใน step นี้
- ห้ามปิด job โดยไม่มี proof ใน phase ถัดไป

ผลลัพธ์ที่ต้องได้:
- transport_jobs table
- status พร้อมใช้งาน
```

---

## Prompt 11.2 — สร้าง Fleet Matching และ Dispatch MVP

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` first 

เป้าหมาย:
สร้างระบบสร้าง transport job และ assign รถแบบ manual/MVP

สิ่งที่ต้องทำ:
1. สร้าง src/core/engines/fleetMatchingEngine.ts
2. สร้าง src/core/engines/dispatchEngine.ts
3. fleetMatchingEngine MVP:
   - filterAvailableVehicles()
   - matchByCapacity()
   - matchByServiceArea()
   - sortByAvailability()
4. dispatchEngine:
   - canTransitionTransportStatus(from, to)
   - nextTransportStatuses(status)
5. สร้าง src/server/services/transportService.ts
6. เพิ่ม function:
   - createTransportJobFromOrder(orderId)
   - assignVehicleToJob(jobId, vehicleId)
   - updateTransportJobStatus(jobId, status)
7. สร้าง routes:
   - /admin/logistics
   - /admin/logistics/jobs
   - /admin/logistics/jobs/[id]
   - /fleet/jobs
   - /fleet/jobs/[id]
8. Fleet รับงานได้:
   - ACCEPTED
   - REJECTED/CANCELLED ถ้าปฏิเสธ
9. สร้าง audit log ทุก status change

ข้อห้าม:
- ห้าม auto assign แบบเต็มก่อน manual ใช้งานได้
- ห้าม fleet เห็น job ของคนอื่น
- ห้ามข้าม status แบบไม่มี rule

ผลลัพธ์ที่ต้องได้:
- Admin สร้าง/assign transport job ได้
- Fleet เห็น job ของตัวเอง
- Fleet รับงานได้
```

---

# PHASE 12 — DELIVERY PROOF & DISPUTE

## Prompt 12.1 — สร้าง Delivery Proof Checklist และ Upload

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` first 

เป้าหมาย:
สร้างระบบหลักฐานการส่งของ

สิ่งที่ต้องทำ:
1. เพิ่ม enum DeliveryProofType:
   - PHOTO_BEFORE_LOADING
   - PHOTO_AFTER_LOADING
   - PHOTO_AT_SITE
   - SCALE_TICKET
   - DELIVERY_NOTE
   - CUSTOMER_SIGNATURE
   - GPS_LOCATION
   - OTHER
2. เพิ่ม model ProofChecklist
3. เพิ่ม model DeliveryProof
4. DeliveryProof fields:
   - id
   - transportJobId
   - proofType
   - fileUrl
   - note
   - gpsLat
   - gpsLng
   - uploadedBy
   - uploadedAt
5. สร้าง deliveryProofEngine:
   - getRequiredProofs(job)
   - validateProofCompleteness(job, proofs)
   - canCompleteJob(job, proofs)
6. สร้าง upload UI ใน /fleet/jobs/[id]
7. ใช้ Supabase Storage bucket delivery-proofs
8. ห้าม job COMPLETED ถ้า required proof ไม่ครบ

ข้อห้าม:
- ห้ามใช้ public URL สำหรับ proof ที่ private
- ห้ามปิดงานโดยไม่ตรวจ proof checklist
- ห้ามลบ proof ถ้า job completed แล้ว

ผลลัพธ์ที่ต้องได้:
- Driver/Fleet upload proof ได้
- ระบบตรวจ proof ครบ/ไม่ครบได้
- Transport job complete ได้เมื่อ proof ครบ
```

---

## Prompt 12.2 — สร้าง Dispute Module

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` first 

เป้าหมาย:
สร้างระบบแจ้งปัญหา / claim / dispute

สิ่งที่ต้องทำ:
1. เพิ่ม enum DisputeType:
   - SHORT_DELIVERY
   - WRONG_MATERIAL
   - LATE_DELIVERY
   - DAMAGED_MATERIAL
   - PRICE_DISPUTE
   - PAYMENT_DISPUTE
   - CUSTOMER_REJECTED
   - TRANSPORT_FAILED
   - OTHER
2. เพิ่ม enum DisputeStatus:
   - OPEN
   - INVESTIGATING
   - WAITING_PARTNER
   - WAITING_CUSTOMER
   - RESOLVED
   - REJECTED
   - CLOSED
3. เพิ่ม model Dispute
4. สร้าง routes:
   - /admin/disputes
   - /admin/disputes/[id]
   - /customer/disputes
   - /partner/disputes
   - /fleet/disputes
5. สร้าง disputeService:
   - createDispute()
   - updateDisputeStatus()
   - resolveDispute()
6. Dispute ต้องผูกกับ:
   - orderId
   - transportJobId
   - supplierPoId
7. เพิ่ม audit log
8. ถ้ามี financial impact ให้แสดงชัดเจน แต่ยังไม่ต้องทำ adjustment accounting ใน step นี้

ข้อห้าม:
- ห้ามให้ supplier/fleet เห็น dispute ที่ไม่เกี่ยวข้อง
- ห้ามปิด dispute โดยไม่มี resolution
- ห้ามลบ dispute

ผลลัพธ์ที่ต้องได้:
- เปิด dispute ได้
- ติดตามสถานะได้
- ปิด dispute ได้พร้อม resolution
```

---

# PHASE 13 — INVOICE, PAYMENT, RECEIPT

## Prompt 13.1 — สร้าง Payment Models และ Payment Engine

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` first 

เป้าหมาย:
สร้างระบบ payment foundation

สิ่งที่ต้องทำ:
1. เพิ่ม enum PaymentDirection:
   - IN
   - OUT
2. เพิ่ม enum PaymentStatus:
   - PENDING
   - CONFIRMED
   - REJECTED
   - CANCELLED
3. เพิ่ม model Payment
4. เพิ่ม model BankTransaction
5. เพิ่ม model ReconciliationMatch
6. สร้าง paymentEngine:
   - totalPaid(payments)
   - balance(total, payments)
   - paymentStatus(total, payments)
   - isFullyPaid(total, payments)
7. สร้าง bankSMSEngine:
   - parseBankText(text)
   - hashTransaction(bank, amount, date)
8. สร้าง idempotencyEngine:
   - isDuplicate(hash)
9. สร้าง reconciliationEngine:
   - scoreTransactionToDocument(tx, doc)
   - matchTransactions(transactions, documents)
10. run migration
11. run prisma generate

ข้อห้าม:
- ห้าม mark invoice paid โดยไม่ตรวจยอด
- ห้ามรับ transaction ซ้ำ
- ห้าม auto confirm payment ถ้า confidence ต่ำ

ผลลัพธ์ที่ต้องได้:
- payment models พร้อม
- paymentEngine พร้อม
- reconciliation foundation พร้อม
```

---

## Prompt 13.2 — สร้าง Invoice จาก Delivered Order

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` first 

เป้าหมาย:
สร้าง invoice / tax invoice จาก order

สิ่งที่ต้องทำ:
1. เพิ่ม function:
   - createInvoiceFromOrder(orderId, invoiceType)
2. invoiceType:
   - INV
   - INV3
3. ตรวจว่า order status เหมาะสม:
   - DELIVERED
   - PARTIALLY_DELIVERED ถ้าอนุญาต
   - CONFIRMED กรณีวางบิลล่วงหน้า ถ้า policy อนุญาต
4. สร้าง Document docType INV หรือ INV3
5. snapshot order items
6. คำนวณ VAT/total server-side
7. ตั้ง dueDate จาก customer credit term
8. generate preview/PDF
9. update order status INVOICED
10. audit log

ข้อห้าม:
- ห้ามสร้าง invoice ซ้ำโดยไม่เตือน
- ห้าม invoice ถ้า quotation ยังไม่ confirmed
- ห้ามแก้ invoice paid โดยตรง

ผลลัพธ์ที่ต้องได้:
- Invoice สร้างจาก order ได้
- Invoice มี due date
- Invoice มี PDF preview
- อัปเดต PROJECT_PROGRESS.md:
  [x] invoice created
```

---

## Prompt 13.3 — บันทึก Payment และออก Receipt

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` first 

เป้าหมาย:
รับชำระเงิน, match invoice, และออกใบเสร็จ

สิ่งที่ต้องทำ:
1. สร้าง routes:
   - /admin/payments
   - /admin/payments/new
   - /admin/reconciliation
   - /customer/payments
2. เพิ่ม action:
   - recordPayment()
   - confirmPayment()
   - matchPaymentToInvoice()
   - createReceiptFromPayment()
3. Flow:
   - payment created status PENDING
   - accountant confirms
   - paymentEngine calculates balance
   - if balance = 0 update invoice PAID
   - create RCT document
   - generate receipt PDF
4. รองรับ partial payment
5. เพิ่ม audit log
6. เพิ่ม payment history ใน document detail

ข้อห้าม:
- ห้ามออก receipt ก่อน payment confirmed
- ห้ามปิด invoice paid ถ้าจ่ายไม่ครบ
- ห้ามลบ payment ที่ confirmed แล้ว

ผลลัพธ์ที่ต้องได้:
- Payment บันทึกได้
- Payment confirm ได้
- Invoice balance update
- Receipt สร้างได้
- อัปเดต PROJECT_PROGRESS.md:
  [x] payment created
  [x] receipt created
```

---

# PHASE 14 — DEBT & COLLECTION

## Prompt 14.1 — สร้าง Debt Tracking และ Collection Engine

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` and `WORKFLOW_AND_ROLE_RULES.md` (Section 20-21) first.

เป้าหมาย:
ติดตามหนี้จาก invoice unpaid/overdue ตาม business rules จริง

Business rules ที่ต้อง implement ให้ถูกต้อง:

Debt Timer Rule (24h after first contact):
- เมื่อมีการติดต่อลูกค้าครั้งแรก (first contact) → บันทึก firstContactAt
- ถ้าไม่ชำระเงินภายใน 24 ชม. หลัง firstContactAt → เริ่มนับ debt period (debtStartAt)
- CollectionState transitions: CURRENT → OVERDUE → WARNING → COLLECTION

Auto-Invoice Rule (multiple delivery trips):
- Order item ที่ส่งหลายเที่ยว (เช่น ดิน 10 รอบ) ต้องติดตาม deliveredTrips vs totalTrips
- เมื่อ deliveredTrips >= totalTrips → trigger auto-invoice ไม่ต้องรอ admin กด

Invoice State Machine:
- ส่งสินค้าเสร็จ → ออก Invoice
- ถ้าลูกค้าจ่ายแล้วก่อน Invoice ออก → Invoice issued, RCT ออกทันที
- ถ้ายังไม่จ่าย → UNPAID, เริ่ม debt monitoring
- ลูกค้า upload slip → PAYMENT = COMPLETED → RCT → PAID

สิ่งที่ต้องทำ:
1. เพิ่ม enum CollectionState:
   - CURRENT
   - OVERDUE
   - WARNING
   - COLLECTION
   - PROMISED
   - PARTIAL
   - LEGAL
   - CLOSED
2. เพิ่ม model DebtSnapshot (เพิ่ม firstContactAt, debtStartAt fields)
3. เพิ่ม model CollectionNote (บันทึกการติดต่อแต่ละครั้ง)
4. สร้าง collectionEngine:
   - autoState(overdueDays, paid, total)
   - canTransition(from, to)
   - nextActions(state)
   - calculateDebtStartDate(firstContactAt) — returns firstContactAt + 24h
   - isDebtStarted(invoice, now)
5. สร้าง debtService:
   - calculateInvoiceDebt(documentId)
   - updateCollectionState(documentId)
   - createDailySnapshot()
   - recordFirstContact(documentId, contactedBy) — บันทึก firstContactAt
   - checkAutoInvoiceTrigger(orderId) — ตรวจว่าครบเที่ยวหรือยัง
   - createInvoiceFromCompletedTrips(orderId)
6. สร้าง routes:
   - /admin/debt (real-time debt dashboard)
   - /admin/debt/[documentId]
7. /admin/debt แสดง:
   - invoice, customer, due date, overdue days
   - firstContactAt, debtStartAt (timer)
   - paid, balance, collection state
   - ปุ่ม "บันทึกการติดต่อ" ที่ตั้ง firstContactAt
8. เพิ่ม collection note ต่อ invoice
9. อัปเดต TransportJobItem: deliveredTrips, totalTrips fields

ข้อห้าม:
- ห้ามคิดดอกเบี้ยซ้ำหลายที่
- ห้ามปิดหนี้ถ้ายังมียอดค้าง
- ห้ามลบ collection history
- ห้ามออก invoice ซ้ำจาก order เดิม

ผลลัพธ์ที่ต้องได้:
- ดูลูกหนี้ได้ พร้อม first contact timer
- Auto-invoice เมื่อครบจำนวนเที่ยว
- State เปลี่ยนตาม 24h debt rule
- อัปเดต PROJECT_PROGRESS.md: [x] debt tracking created
```

---

# PHASE 15 — SETTLEMENT / PAYOUT

## Prompt 15.1 — สร้าง Settlement Models และ Engine

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` first 

เป้าหมาย:
คำนวณและจ่ายเงินให้ supplier / fleet

สิ่งที่ต้องทำ:
1. เพิ่ม enum SettlementPartnerType:
   - SUPPLIER
   - FLEET
2. เพิ่ม enum SettlementStatus:
   - DRAFT
   - PENDING_APPROVAL
   - APPROVED
   - PAYMENT_ORDERED
   - PAID
   - CANCELLED
3. เพิ่ม model SettlementBatch
4. เพิ่ม model SettlementItem
5. สร้าง settlementEngine:
   - calculateSupplierPayable()
   - calculateFleetPayable()
   - buildSettlementItems()
   - calculateNetAmount()
6. สร้าง settlementService:
   - createSettlementBatch()
   - approveSettlement()
   - createPVFromSettlement()
   - createPMTFromSettlement()
   - markSettlementPaid()
7. สร้าง routes:
   - /admin/settlements
   - /admin/settlements/[id]
   - /partner/payouts
   - /fleet/earnings

ข้อห้าม:
- ห้ามจ่าย supplier/fleet โดยไม่มี settlement
- ห้ามแก้ approved settlement โดยตรง
- ใช้ adjustment item ถ้าต้องแก้ยอด
- ห้ามให้ partner เห็น payout ของคนอื่น

ผลลัพธ์ที่ต้องได้:
- Settlement batch สร้างได้
- Supplier/Fleet payable คำนวณได้
- PV/PMT สร้างได้
```

---

# PHASE 16 — DASHBOARD & ALERT CENTER

## Prompt 16.1 — สร้าง Alert Center

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` first 

เป้าหมาย:
สร้างระบบ alert กลางสำหรับสิ่งที่ต้องจัดการ

สิ่งที่ต้องทำ:
1. เพิ่ม enum AlertType:
   - NEW_ORDER
   - SUPPLIER_NOT_CONFIRMED
   - TRUCK_NOT_ASSIGNED
   - TRUCK_DELAYED
   - DOCUMENT_PENDING_APPROVAL
   - INVOICE_OVERDUE
   - PAYMENT_UNRECONCILED
   - LOW_MARGIN
   - CREDIT_LIMIT_EXCEEDED
   - DELIVERY_PROOF_MISSING
   - LINE_SEND_FAILED
   - PDF_GENERATION_FAILED
2. เพิ่ม enum AlertSeverity:
   - INFO
   - WARNING
   - CRITICAL
3. เพิ่ม model Alert
4. สร้าง alertService:
   - createAlert()
   - resolveAlert()
   - listOpenAlerts()
5. สร้าง UI:
   - /admin/alerts
   - alert widget ใน dashboard
6. Alerts ต้อง link ไป entity ที่เกี่ยวข้อง

ข้อห้าม:
- ห้ามสร้าง alert ซ้ำจำนวนมากโดยไม่มี dedupe
- ห้าม resolve alert โดยไม่มี user
- ห้ามแสดง alert ให้ role ที่ไม่เกี่ยวข้อง

ผลลัพธ์ที่ต้องได้:
- Alert center ใช้งานได้
- Dashboard แสดง open alerts ได้
```

---

## Prompt 16.2 — สร้าง Dashboard MVP

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` first 

เป้าหมาย:
สร้าง dashboard MVP ที่แสดงตัวเลขจริงจาก database

สิ่งที่ต้องทำ:
1. สร้าง /admin/dashboard
2. สร้าง dashboardService:
   - getExecutiveMetrics()
   - getOperationMetrics()
   - getFinanceMetrics()
3. แสดง KPI:
   - new orders
   - pending orders
   - supplier PO pending
   - truck not assigned
   - invoice unpaid
   - invoice overdue
   - payment unreconciled
   - gross margin
   - supplier payable
   - fleet payable
4. ใช้ Card จาก shadcn/ui
5. แสดงรายการ alert ล่าสุด
6. เพิ่ม link ไปหน้าที่เกี่ยวข้อง

ข้อห้าม:
- ห้ามใช้ mock data ถ้ามี database จริงแล้ว
- ห้ามคำนวณ metrics ใน JSX
- ห้าม dashboard เรียกข้อมูลที่ user ไม่มีสิทธิ์

ผลลัพธ์ที่ต้องได้:
- Dashboard เห็นภาพรวมระบบ
- Metrics มาจาก database
- อัปเดต PROJECT_PROGRESS.md:
  [x] dashboard created
```

---

# PHASE 17 — AUTOMATION

## Prompt 17.1 — Setup Inngest และ Background Jobs

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` first 

เป้าหมาย:
ตั้งค่า background jobs สำหรับ automation

สิ่งที่ต้องทำ:
1. ติดตั้ง Inngest
2. สร้าง src/server/jobs/inngest.ts
3. สร้าง route handler:
   - /api/webhooks/inngest
4. สร้าง jobs:
   - document.pdf.generate
   - invoice.overdue.check
   - daily.debt.snapshot
   - supplier.po.reminder
   - fleet.job.reminder
   - payment.reconciliation.run
5. jobs ต้องเรียก service layer ไม่เขียน logic ซ้ำ
6. เพิ่ม system health event เมื่อ job fail

ข้อห้าม:
- ห้ามให้ job ข้าม permission/data boundary
- ห้ามส่ง LINE ซ้ำโดยไม่มี idempotency
- ห้าม generate PDF ซ้ำโดยไม่เช็ก version

ผลลัพธ์ที่ต้องได้:
- Inngest setup ได้
- มี jobs foundation
- system health รับ error ได้
```

---

## Prompt 17.2 — LINE Notification Automation

```txt
Before doing any task, read `AGENT_TOKEN_SAVING_RULES.md` first 

เป้าหมาย:
ส่ง notification ผ่าน LINE หรือ channel ที่ตั้งค่าไว้

สิ่งที่ต้องทำ:
1. สร้าง notificationEngine
2. สร้าง notificationService
3. สร้าง model Notification ถ้ายังไม่มี
4. notification types:
   - order.created
   - supplier_po.created
   - supplier_po.confirmed
   - transport_job.assigned
   - transport_job.delivered
   - invoice.created
   - payment.confirmed
   - debt.overdue
5. สร้าง template registry
6. ส่ง LINE ผ่าน server เท่านั้น
7. บันทึก status:
   - queued
   - sent
   - failed
8. failed ต้องสร้าง system health event

ข้อห้าม:
- ห้าม expose LINE token ฝั่ง client
- ห้ามส่ง notification ซ้ำโดยไม่มี event id
- ห้าม hardcode template ใน UI

ผลลัพธ์ที่ต้องได้:
- notification queue ทำงาน
- LINE ส่งได้จาก server
- failure ถูก log
```

---

# PROMPT สำหรับให้ AI ตรวจว่าโปรเจกต์ทำถึงไหนแล้ว

```txt
อ่านไฟล์ต่อไปนี้:
1. AGENT.md
2. PROJECT_PROGRESS.md
3. AI_STEP_PROMPTS.md

จากนั้นตรวจโปรเจกต์ปัจจุบันว่า:
- มีไฟล์อะไรแล้ว
- มี database models อะไรแล้ว
- มี routes อะไรแล้ว
- มี engines อะไรแล้ว
- checklist ใน PROJECT_PROGRESS.md ตรงกับของจริงหรือไม่

ให้สรุปเป็นตาราง:
1. Completed
2. Partially Completed
3. Missing
4. Recommended Next Step

ห้ามแก้โค้ดก่อนสรุป
เมื่อสรุปเสร็จ ให้เสนอ step ถัดไปเพียง 1 step เท่านั้น
```

---

# PROMPT สำหรับให้ AI อัปเดต PROJECT_PROGRESS.md

```txt
อ่าน PROJECT_PROGRESS.md แล้วอัปเดตสถานะตามงานที่ทำเสร็จจริง

กฎ:
1. ติ๊ก [x] เฉพาะสิ่งที่มีอยู่จริงใน codebase
2. อย่าติ๊กงานที่ยังไม่มี implementation
3. อัปเดต Current Step ให้ตรงกับสถานะจริง
4. อัปเดต Next Step เป็นงานถัดไปเพียง 1 อย่าง
5. เพิ่ม Notes สั้น ๆ ถ้ามีข้อจำกัดหรือ technical debt

หลังอัปเดต ให้สรุป:
- มีอะไรเสร็จแล้ว
- ยังขาดอะไร
- ควรทำอะไรต่อ
```

---

# PROMPT สำหรับ Refactor โค้ดเดิม DNA OS Prototype

```txt
อ่าน AGENT.md, PROJECT_PROGRESS.md และโค้ด prototype เดิม

เป้าหมาย:
Refactor โค้ด DNA OS prototype จาก single file ให้เป็น architecture ใหม่

ลำดับการ refactor:
1. Extract constants ไปที่ src/core/constants
2. Extract pure engines ไปที่ src/core/engines
3. Extract utils ไปที่ src/core/utils
4. Extract schemas ไปที่ src/core/schemas
5. Extract UI primitives ไปที่ src/components/ui หรือ components เฉพาะ
6. Extract document components ไปที่ src/components/document
7. Extract pages ไปที่ src/features หรือ src/app
8. เพิ่ม tests ให้ engines ก่อนแก้ behavior

กฎ:
- ห้ามเปลี่ยน behavior การคำนวณโดยไม่ตั้งใจ
- ห้ามย้าย business logic เข้า JSX
- ห้ามลบ Thai labels
- ห้าม hard delete logic
- ห้ามแก้ document flow โดยไม่อธิบาย

ทำทีละส่วนเท่านั้น เริ่มจาก constants และ engines ก่อน
```

---

# PROMPT สำหรับสร้าง Test ให้ Engines

```txt
สร้าง unit tests สำหรับ core engines

เริ่มจาก engines เหล่านี้:
1. calculationEngine
2. paymentEngine
3. pricingEngine
4. supplierSelectionEngine
5. orderSplitEngine
6. numberingEngine
7. documentEngine
8. collectionEngine
9. reconciliationEngine
10. idempotencyEngine

Test cases ที่ต้องมี:
- VAT exclusive
- VAT inclusive
- empty items
- decimal rounding
- partial payment
- full payment
- supplier split 1 supplier
- supplier split multiple suppliers
- missing supplier
- duplicate bank transaction
- low confidence reconciliation
- high confidence reconciliation

กฎ:
- ห้ามแก้ engine behavior เพื่อให้ test ผ่านโดยไม่อธิบาย
- ถ้าเจอบั๊ก ให้รายงานก่อนแก้
- tests ต้องอ่านง่าย
```

---

# PROMPT สำหรับสร้าง Prisma Schema แบบเต็ม

```txt
สร้าง Prisma schema สำหรับ DNA OS Construction Platform ตาม blueprint

ต้องรวม modules:
1. Identity
2. Company
3. Customer Site
4. Credit Profile
5. Product Catalog
6. Supplier Products
7. Supplier Contracts
8. Price History
9. Fleet / Vehicle
10. Transport Rate Card
11. Customer Orders
12. BOQ
13. Documents
14. Supplier PO
15. Transport Jobs
16. Delivery Proof
17. Dispute
18. Payment
19. Bank Transaction
20. Reconciliation
21. Debt Snapshot
22. Settlement
23. Alert
24. Audit Log
25. Notification

กฎ:
- ใช้ enums ให้ชัดเจน
- ใส่ relations ให้ครบ
- ใส่ indexes สำหรับ foreign keys และ query สำคัญ
- ใส่ unique constraints สำหรับเลขเอกสาร เลข order เลข PO
- ใช้ Decimal สำหรับเงิน
- ใช้ DateTime สำหรับ timestamp
- ห้ามใช้ Float สำหรับเงิน
- ห้ามใช้ String แทน enum ใน status สำคัญ

หลังสร้าง schema ให้สรุป:
- models ทั้งหมด
- relations สำคัญ
- indexes สำคัญ
- migration command
```

---

# PROMPT สำหรับสร้าง MVP Full Flow

```txt
สร้าง MVP flow แรกของ DNA OS

Scope:
Admin สร้างลูกค้า → สร้างไซต์งาน → เพิ่มสินค้า → เพิ่ม supplier price → สร้าง order → คำนวณ BOQ → สร้าง quotation → confirm quotation → split supplier PO

ต้องทำ:
1. ตรวจว่า foundation tables มีแล้ว
2. สร้างหน้าที่ขาดใน flow นี้
3. สร้าง server actions ที่จำเป็น
4. ใช้ engines ที่มีอยู่
5. เพิ่ม audit log
6. อัปเดต PROJECT_PROGRESS.md

ห้ามทำ:
- payment
- fleet auto matching
- settlement
- advanced dashboard
- LINE notification

ผลลัพธ์ที่ต้องได้:
- flow นี้ทำงานได้จริงจาก UI
- มีข้อมูลใน database
- มีเอกสาร QT หรือ PO ตามขั้นตอน
```

---

# END OF FILE

ให้ใช้ prompt นี้สำหรับ Phase 14 (Debt & Collection) โดยเพิ่ม business rules จริงจาก operational flows:

```txt
Read AGENT.md, PROJECT_RULES.md, WORKFLOW_AND_ROLE_RULES.md (Section 20-21) before implementing Phase 14.

Business rules ที่ต้อง implement ให้ถูกต้อง:

1. Debt Timer Rule (24h after first contact):
   - เมื่อมีการติดต่อลูกค้าครั้งแรก (first contact) → บันทึก firstContactAt
   - ถ้าไม่ชำระเงินภายใน 24 ชั่วโมงหลัง firstContactAt → เริ่มนับ debt period
   - CollectionState transitions: CURRENT → OVERDUE → WARNING → COLLECTION

2. Auto-Invoice Rule (multiple delivery trips):
   - Order item ที่ต้องการส่งหลายเที่ยว (เช่น ดิน 10 รอบ) ต้องติดตาม deliveredTrips vs totalTrips
   - เมื่อ deliveredTrips >= totalTrips → trigger auto-invoice
   - ระบบออก Invoice อัตโนมัติโดยไม่ต้องรอ admin

3. Fleet Payment Credit (6 months):
   - Fleet ได้รับเครดิตสูงสุด 6 เดือนหลังส่งงานสำเร็จ (COMPLETED)
   - Settlement batch สำหรับ fleet ต้องคำนวณจาก transport jobs ที่ COMPLETED ในช่วง credit period
   - ค่าแรงบันทึกตามจำนวนเที่ยวที่ส่งจริง

4. Supplier Payment Credit (6 months):
   - Supplier รอรับเงินหลัง PO status = FULFILLED
   - วงเงินเครดิต supplier สูงสุด 6 เดือน
   - ถ้า Supplier เป็นบุคคลธรรมดา หัก WHT 3% ก่อนจ่าย

5. Invoice State Machine:
   - ส่งสินค้าเสร็จ (DELIVERED/COMPLETED) → ออก Invoice
   - ถ้าลูกค้าจ่ายแล้วก่อน Invoice ถูกออก → Invoice issued, RCT ออกทันที
   - ถ้ายังไม่จ่าย → Invoice status = UNPAID, เริ่ม debt monitoring
   - ลูกค้า upload slip → PAYMENT = COMPLETED → ออก RCT → PAID

6. Supplier PO Rejection:
   - Supplier ปฏิเสธ PO ต้องระบุเหตุผล
   - รอ Admin ดำเนินการภายใน 30 นาที
   - Admin ต้องหา Supplier ใหม่ หรือ confirm เหตุผล

7. GPS Tracking Requirement:
   - Transport job ที่ ACCEPTED ต้องเริ่ม GPS tracking
   - Customer เห็นสถานะ real-time เมื่อ status = IN_TRANSIT และ ARRIVED_SITE
   - GPS coordinate บันทึกใน delivery proof

Models ที่ต้องเพิ่ม/อัปเดต:
- DebtSnapshot: เพิ่ม firstContactAt, debtStartAt fields
- CollectionNote: บันทึกการติดต่อแต่ละครั้ง
- TransportJobItem: tracking deliveredTrips, totalTrips ต่อ order item
- SupplierPurchaseOrder: creditTermDays, paymentDueAt
- Vehicle: เพิ่ม gpsEnabled field

collectionEngine ต้องมี:
   - calculateDebtStartDate(firstContactAt) — returns firstContactAt + 24h
   - isDebtStarted(invoice, now) — ตรวจว่าเริ่มนับหนี้แล้วหรือยัง
   - autoTransitionState(invoice) — transition state ตาม business rules ข้างต้น

debtService ต้องมี:
   - recordFirstContact(documentId, contactedBy) — บันทึก firstContactAt
   - checkAutoInvoiceTrigger(orderId) — ตรวจว่าครบเที่ยวหรือยัง
   - createInvoiceFromCompletedTrips(orderId) — auto-invoice

UI ที่ต้องมี:
   - /admin/debt แสดง: invoice, customer, due date, overdue days, firstContactAt, debtStartAt
   - ปุ่ม "บันทึกการติดต่อ" ที่ตั้ง firstContactAt
   - แสดง timer ว่า debt เริ่มนับเมื่อไหร่
```

---

# UPDATE PROMPT — Add LINE-First Workflow & Document Control

Use this prompt when implementing the new workflow requirements:

```txt
Read AGENT.md, PROJECT_RULES.md, PROJECT_PROGRESS.md, TECH_STACK.md, API_DESCRIPTION.md, and WORKFLOW_AND_ROLE_RULES.md first.

Implement the system with these updated rules:
1. Admin dashboard is desktop-first.
2. Partner, Customer, Fleet, and Driver are LINE-first and mobile-first.
3. Partner can submit products and stock through LINE/mobile web.
4. Admin can also add products for partner.
5. Partner product requires Admin approval before it is sellable.
6. Supplier inventory and inventory movements are required.
7. Every important document must belong to Project and DocumentGroup when applicable.
8. Document number must include projectNo if project exists.
9. Admin can search any reference number and see the full document group.
10. Debt dashboard must be real-time and drilldown-able.
11. LINE actions must be tokenized and verified.
12. Unknown LINE users must never be auto-created.
13. Do not build complex mobile dashboards for partner/customer/fleet.
14. Use one-screen-one-action design for mobile/LINE flows.

Start by implementing:
- Project model
- DocumentGroup model
- DocumentReference model
- PartnerProductSubmission model
- SupplierInventory model
- SupplierInventoryMovement model
- lineActionToken model
- lineNotificationLog model
```
