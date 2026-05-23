# WORKFLOW_AND_ROLE_RULES.md

# DNA OS Construction Platform — Workflow, Role Rules & LINE-First Operating Model

เอกสารนี้คือไฟล์หลักสำหรับ AI coding agent และ developer เพื่อเข้าใจ workflow, role, dashboard, เอกสาร, real-time debt, partner product submission และ LINE-first experience ของระบบ DNA OS Construction Platform

ให้วางไฟล์นี้ไว้ที่ root ของโปรเจกต์:

```txt
/WORKFLOW_AND_ROLE_RULES.md
```

ใช้ร่วมกับ:

```txt
/AGENT.md
/PROJECT_RULES.md
/PROJECT_PROGRESS.md
/TECH_STACK.md
/API_DESCRIPTION.md
/AI_STEP_PROMPTS.md
```

---

# 1. Core Operating Model

ระบบนี้คือ Construction Commerce Operating System โดยเจ้าของระบบเป็น Core Platform กลาง ระหว่าง:

```txt
ลูกค้า
พาร์ทเนอร์ร้านค้า / Supplier
รถร่วม / Fleet Partner / Driver
ทีมแอดมิน / ทีมปฏิบัติการ / บัญชี
ระบบเอกสาร
ระบบหนี้
ระบบ Dashboard
LINE Notification
```

หลักการสำคัญ:

```txt
ข้อมูลเกิดครั้งเดียว ถูกใช้ทั้งระบบ
```

Flow หลัก:

```txt
Customer Order
→ Project
→ Document Group
→ BOQ
→ Quotation
→ Supplier PO
→ Transport Job
→ Delivery Proof
→ Invoice
→ Payment
→ Receipt
→ Debt Dashboard
→ Settlement
→ Admin Dashboard
→ LINE Notification
```

---

# 2. Product Experience Strategy

## 2.1 Admin / Core Team

```txt
อุปกรณ์หลัก: Computer / Desktop / Laptop
Experience: Backoffice dashboard แบบเต็ม
UI: ตาราง, filter, search, detail page, document viewer, debt dashboard
เป้าหมาย: ควบคุมงานทั้งหมด เห็นภาพรวม เห็นหนี้ เห็นเอกสาร เห็นปัญหาแบบ real-time
```

Admin routes หลัก:

```txt
/admin/dashboard
/admin/debt
/admin/documents/search
/admin/projects
/admin/orders
/admin/partners
/admin/fleet
/admin/procurement
/admin/logistics
/admin/payments
/admin/settlements
/admin/alerts
```

## 2.2 Partner / Supplier

```txt
อุปกรณ์หลัก: LINE + Mobile Web
Experience: แจ้งเตือนผ่าน LINE เป็นหลัก เปิดเว็บเฉพาะตอนต้องกรอกข้อมูล
UI: ง่ายที่สุด ขั้นตอนน้อยที่สุด
เป้าหมาย: เพิ่มสินค้า, เพิ่มจำนวนสินค้า, อัปเดตราคา, รับ PO, ยืนยัน PO
```

Partner ควรทำงานผ่าน LINE ได้มากที่สุด:

```txt
- ได้รับแจ้งเตือน PO ใหม่ผ่าน LINE
- กดยืนยัน PO ผ่าน LINE action
- กดปฏิเสธ PO พร้อมเหตุผล
- เพิ่มสินค้าใหม่ผ่าน LINE form / LIFF / mobile web
- อัปเดต stock ผ่าน LINE quick action
- เปิด/ปิดสินค้า
- ดูยอดรอรับเงิน
```

## 2.3 Customer

```txt
อุปกรณ์หลัก: LINE + Mobile Web
Experience: รับแจ้งเตือนและดูสถานะผ่าน LINE เป็นหลัก
UI: ง่ายที่สุด เห็นเฉพาะข้อมูลของตัวเอง
เป้าหมาย: สั่งสินค้า, ดูใบเสนอราคา, ยืนยัน, ดูสถานะจัดส่ง, ดู invoice, แจ้งชำระเงิน
```

Customer LINE notifications:

```txt
- ใบเสนอราคาพร้อมแล้ว
- กรุณายืนยันใบเสนอราคา
- Supplier ยืนยันแล้ว
- รถกำลังไปรับสินค้า
- รถกำลังจัดส่ง
- ส่งของสำเร็จ
- มี invoice ใหม่
- ยืนยันรับเงินแล้ว
- ใบเสร็จพร้อมดาวน์โหลด
- ใกล้ครบกำหนดชำระ
```

## 2.4 Fleet / Truck Partner / Driver

```txt
อุปกรณ์หลัก: LINE + Mobile Web
Experience: รับงานและอัปเดตสถานะผ่าน LINE/mobile web เป็นหลัก
UI: ขั้นตอนน้อยที่สุด ปุ่มใหญ่ ใช้งานเร็ว
เป้าหมาย: รับงาน, อัปเดตสถานะ, แนบรูป, แนบใบส่งของ, ปิดงาน
```

Fleet / Driver LINE actions:

```txt
- ได้รับงานใหม่ผ่าน LINE
- กดรับงาน
- กดปฏิเสธงาน
- กดเริ่มงาน
- กดถึงจุดรับ
- กดโหลดของแล้ว
- กดถึงไซต์งาน
- อัปโหลดรูปส่งของ
- กดส่งสำเร็จ
```

---

# 3. Authentication Rule

ทุก role ปกติต้องเข้าสู่ระบบผ่าน LINE เท่านั้น:

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

ห้ามมี:

```txt
/login
/register
/signup
email/password login สำหรับ user ปกติ
Google login
Facebook login
Apple login
public self-signup
```

ข้อยกเว้น:

```txt
Superadmin 1 บัญชีเท่านั้น
มีหน้า /superadmin/login เฉพาะ
ใช้สำหรับกู้ระบบ / ตั้งค่าระดับ platform
```

---

# 4. Role Responsibilities

## Superadmin

ทำได้:

```txt
- เข้าระบบผ่าน /superadmin/login
- จัดการ platform config
- กู้ระบบกรณี LINE auth มีปัญหา
- ตรวจระบบระดับ platform
```

ไม่ควรทำ:

```txt
- ทำงานประจำวัน
- สร้าง order
- ออก invoice
- confirm payment
- รับงาน operation ปกติ
```

## Owner

ทำได้:

```txt
- ดู dashboard ทั้งหมด
- ดู margin / profit
- อนุมัติเอกสารมูลค่าสูง
- อนุมัติ margin ต่ำ
- อนุมัติลูกค้าที่ติด credit
- อนุมัติ settlement
- จัดการทีมและ role
```

## Admin

ทำได้:

```txt
- ดู Admin Dashboard บนคอมพิวเตอร์
- จัดการลูกค้า
- จัดการไซต์งาน
- จัดการสินค้า master
- อนุมัติสินค้าที่ partner เพิ่ม
- จัดการ supplier
- จัดการ fleet
- สร้าง order
- สร้าง quotation
- split order ไป supplier
- assign transport job
- ค้นหาเอกสารทั้งหมด
- ดู debt dashboard
```

## Accountant

ทำได้:

```txt
- ดู Finance Dashboard
- ดู Debt Dashboard แบบ real-time
- สร้าง invoice
- confirm payment
- ออก receipt
- ดู bank transaction
- reconcile payment
- ติดตามหนี้
- บันทึก collection note
- สร้าง settlement
- สร้าง PV / PMT
```

## Procurement

ทำได้:

```txt
- ดู supplier
- ดู supplier product
- ดูต้นทุน supplier
- ตรวจสินค้าที่ partner ส่งเข้ามา
- สร้าง PO
- split order ไป supplier
- ติดตาม supplier confirmation
```

## Operation

ทำได้:

```txt
- ดู order
- สร้าง order
- ตรวจไซต์งาน
- จัด transport job
- assign fleet
- ติดตาม delivery
- ตรวจ delivery proof
- เปิด dispute
- ดู operation dashboard
```

## Customer

ทำได้:

```txt
- เข้าระบบด้วย LINE
- ดูสินค้า
- สร้าง order / ขอราคา
- เลือกไซต์งาน
- ดู quotation
- ยืนยัน quotation
- ดูสถานะจัดส่ง
- ดู invoice / receipt
- อัปโหลด slip
- เปิด dispute ใน order ของตัวเอง
```

ทำไม่ได้:

```txt
- เห็น supplier cost
- เห็น internal BOQ
- เห็น margin
- เห็น supplier PO
- เห็นข้อมูลลูกค้ารายอื่น
- confirm payment เอง
- ออกเอกสารเอง
```

## Supplier / Partner

ทำได้:

```txt
- เข้าระบบด้วย LINE
- เพิ่มสินค้าเองเป็นหลัก
- ขอเพิ่ม product master ใหม่
- เพิ่มราคา
- เพิ่มจำนวนสินค้า / stock
- อัปเดต stock ผ่าน LINE หรือ mobile web
- เปิด/ปิด availability
- ส่งสินค้าให้ Admin ตรวจอนุมัติ
- ดู PO ของตัวเอง
- ยืนยัน / ปฏิเสธ PO
- ดูยอดรอรับเงินของตัวเอง
```

ทำไม่ได้:

```txt
- อนุมัติสินค้าของตัวเอง
- เห็น PO ของ supplier อื่น
- เห็น margin ของระบบ
- เห็นราคาขายลูกค้าถ้า policy ไม่อนุญาต
- เห็นข้อมูลลูกค้าทั้งหมด
- แก้ PO หลังยืนยันเอง
```

## Fleet Owner

ทำได้:

```txt
- เข้าระบบด้วย LINE
- เพิ่มรถ
- เปิด/ปิดรับคิว
- ดูงานขนส่งของตัวเอง
- รับงาน / ปฏิเสธงาน
- มอบหมายคนขับ
- ดูรายได้ของตัวเอง
```

## Driver

ทำได้:

```txt
- เข้าระบบด้วย LINE
- ดูงานที่ได้รับมอบหมาย
- อัปเดตสถานะงาน
- อัปโหลด delivery proof
- แนบรูป / ใบชั่ง / ใบส่งของ / GPS
```

---

# 5. LINE-First Workflow

LINE เป็นช่องทางหลักสำหรับ:

```txt
- แจ้งเตือน
- เปิด link ไป mobile web / LIFF
- quick action
- ยืนยันงาน
- อัปเดตสถานะ
- แจ้งเอกสาร
- แจ้งหนี้
```

Pattern:

```txt
LINE message → กดปุ่ม → เปิดหน้า mobile web เฉพาะ action นั้น → ทำเสร็จ
```

## LINE Rich Menu By Role

Customer:

```txt
- สั่งสินค้า
- คำสั่งซื้อของฉัน
- ใบเสนอราคา
- สถานะจัดส่ง
- แจ้งชำระเงิน
- ติดต่อแอดมิน
```

Supplier:

```txt
- เพิ่มสินค้า
- อัปเดตสต็อก
- PO ใหม่
- สินค้าของฉัน
- ยอดรอรับเงิน
- ติดต่อแอดมิน
```

Fleet:

```txt
- งานใหม่
- งานวันนี้
- เปิด/ปิดรับคิว
- อัปโหลดหลักฐาน
- รายได้ของฉัน
- ติดต่อแอดมิน
```

Admin:

```txt
- Dashboard
- Order ใหม่
- หนี้
- เอกสาร
- Alert
```

---

# 6. Partner Product Submission Workflow

Partner ต้องเพิ่มสินค้าเองเป็นหลัก

## Main Flow: Partner เพิ่มสินค้าผ่าน LINE / Mobile Web / LIFF

```txt
1. Supplier ได้รับสิทธิ์เข้าระบบผ่าน LINE
2. Supplier เปิด LINE Rich Menu
3. กด “เพิ่มสินค้า”
4. ระบบเปิด /partner/products/new หรือ LIFF form
5. Supplier เลือกสินค้า master ถ้ามีอยู่แล้ว
6. ถ้าไม่มีสินค้า master ให้เลือก “ขอเพิ่มสินค้าใหม่”
7. Supplier ใส่ชื่อสินค้า
8. Supplier ใส่หมวดหมู่
9. Supplier ใส่รายละเอียด
10. Supplier ใส่หน่วย เช่น คิว / ตัน / เที่ยว
11. Supplier ใส่ราคา
12. Supplier ใส่จำนวนสินค้าที่มี
13. Supplier ใส่ขั้นต่ำการขาย
14. Supplier ใส่พื้นที่ให้บริการ
15. Supplier กดส่งตรวจสอบ
16. สถานะ = PENDING_REVIEW
17. Admin ได้ alert
18. Admin ตรวจสอบบนคอม
19. ถ้าอนุมัติ → APPROVED และใช้ขายได้
20. ถ้าปฏิเสธ → REJECTED พร้อมเหตุผล ส่งกลับ LINE
```

## LINE Quick Stock Update Flow

```txt
1. Supplier เปิด LINE
2. กด “อัปเดตสต็อก”
3. ระบบแสดงรายการสินค้าของ supplier
4. Supplier เลือกสินค้า
5. กรอกจำนวนใหม่
6. กดยืนยัน
7. ระบบสร้าง inventory movement
8. ระบบแจ้งว่าอัปเดตสำเร็จ
9. Admin dashboard update real-time
```

## Product Status

```txt
DRAFT
PENDING_REVIEW
APPROVED
REJECTED
SUSPENDED
OUT_OF_STOCK
INACTIVE
```

## Inventory Fields

```txt
stockQty
reservedQty
availableQty
stockUnit
lowStockThreshold
stockUpdatedAt
```

สูตร:

```txt
availableQty = stockQty - reservedQty
```

## Inventory Movement Types

```txt
INITIAL
ADJUST
RESERVE
RELEASE
FULFILL
CANCEL
RETURN
```

ทุกการเปลี่ยน stock ต้องมี movement history

---

# 7. Admin Real-Time Dashboard

Admin Dashboard ต้องออกแบบเพื่อใช้งานบนคอมพิวเตอร์

```txt
Primary Device: Desktop / Laptop
Layout: Wide table + filters + cards + detail drilldown
Realtime: Yes
```

## Main Cards

```txt
ยอดขายวันนี้
ยอดขายเดือนนี้
Order ใหม่
Order รอดำเนินการ
Supplier PO รอยืนยัน
งานขนส่งรอรถ
งานขนส่งล่าช้า
สินค้า stock ต่ำ
Payment รอตรวจสอบ
Invoice รอชำระ
หนี้เกินกำหนด
Settlement รอจ่าย
Critical Alerts
```

## Realtime Events

```txt
order.created
order.priced
boq.created
quotation.created
quotation.confirmed
supplier_product.submitted
supplier_product.approved
supplier_product.stock_updated
supplier_po.created
supplier_po.confirmed
transport_job.created
transport_job.assigned
transport_job.status_changed
delivery_proof.uploaded
invoice.created
payment.pending
payment.confirmed
debt.overdue
settlement.created
alert.created
```

---

# 8. Real-Time Debt Dashboard

Debt Dashboard เป็นหน้าสำคัญที่สุดของฝั่ง Admin/Accountant

```txt
Route: /admin/debt
Primary Device: Desktop / Laptop
Realtime: Yes
Role: OWNER, ADMIN, ACCOUNTANT
```

## Summary

```txt
ยอดหนี้รวมทั้งหมด
ยอดหนี้ยังไม่ถึงกำหนด
ยอดหนี้ใกล้ครบกำหนด
ยอดหนี้เกินกำหนด
ยอดชำระบางส่วน
ยอด payment pending
ยอด payment unreconciled
ลูกหนี้ TOP 10
Invoice ที่เกินกำหนด
Promise to pay วันนี้
```

## Table Columns

```txt
เลขโปรเจค
เลขกลุ่มเอกสาร
เลข invoice
ชื่อลูกค้า
ไซต์งาน
วันที่ออกเอกสาร
วันครบกำหนด
จำนวนวันเกินกำหนด
ยอดรวม
ยอดชำระแล้ว
ยอดคงเหลือ
สถานะหนี้
สถานะ payment
ผู้รับผิดชอบ
ปุ่มดูรายละเอียด
```

## Detail Page

```txt
Route: /admin/debt/[documentId]
```

ต้องแสดง:

```txt
ข้อมูล invoice
เลข project
เลข order
เลข document group
ลูกค้า
ไซต์งาน
รายการสินค้าใน invoice
ยอดรวม
VAT
ยอดชำระแล้ว
ยอดคงเหลือ
payment history
slip / bank transaction
collection note
promise to pay
เอกสารที่เกี่ยวข้องทั้งหมด
timeline การเปลี่ยนสถานะ
ปุ่มออกใบเสร็จถ้าชำระครบ
```

---

# 9. Project & Unified Document Control

ระบบต้องมี Project และ Document Group เพื่อให้เอกสารทุกใบอ้างอิงกันได้

## Project Number

```txt
PRJ-YYYY-SEQ
```

ตัวอย่าง:

```txt
PRJ-2026-0001
```

## Document Number Format

ถ้ามี Project:

```txt
{PROJECT_NO}-{DOC_TYPE}-{YYYYMMDD}-{SEQ}
```

ตัวอย่าง:

```txt
PRJ-2026-0001-QT-20260522-001
PRJ-2026-0001-PO-20260522-001
PRJ-2026-0001-INV-20260523-001
PRJ-2026-0001-RCT-20260524-001
```

ถ้าไม่มี Project:

```txt
{DOC_TYPE}-{YYYYMMDD}-{SEQ}
```

## Document Prefixes

```txt
PRJ  = Project
GRP  = Document Group
ORD  = Customer Order
BOQ  = Bill of Quantities
QT   = Quotation
PO   = Purchase Order
TRK  = Transport Job
DN   = Delivery Note
INV  = Invoice
TAX  = Tax Invoice
INV3 = Invoice / Tax Invoice / Receipt
PAY  = Payment
RCT  = Receipt
PV   = Payment Voucher
PMT  = Payment Order
STM  = Settlement
DSP  = Dispute
```

## Document Group

```txt
document_groups
- id
- groupNo
- projectId
- projectNo
- rootOrderId
- rootOrderNo
- customerCompanyId
- title
- status
- createdAt
```

Document Group example:

```txt
Document Group: GRP-2026-0001
Project: PRJ-2026-0001
Order: PRJ-2026-0001-ORD-20260522-001

Documents:
- BOQ
- QT
- PO Supplier A
- PO Supplier B
- TRK
- INV
- PAY
- RCT
- STM
- PV
- PMT
```

## Document Search

```txt
Route: /admin/documents/search
```

ค้นหาได้จาก:

```txt
เลขโปรเจค
เลข document group
เลข order
เลข BOQ
เลข quotation
เลข PO
เลข transport job
เลข invoice
เลข receipt
เลข payment
ชื่อลูกค้า
ชื่อไซต์งาน
```

ผลลัพธ์ต้องแสดง:

```txt
Project No
Document Group No
Customer
Site
Order No
Document Type
Document No
Document Date
Status
Total
Related Documents
Open Detail
```

## Project Documents Page

```txt
Route: /admin/projects/[projectNo]/documents
```

ต้องแสดง grouped by document type:

```txt
Project Summary
Order
BOQ
Quotation
Supplier PO
Transport Job
Delivery Proof
Invoice
Payment
Receipt
Settlement / PV / PMT
Dispute
Timeline
```

---

# 10. Document Items Rule

ทุกเอกสารต้องมีรายการของตัวเอง

```txt
document_items
- id
- documentId
- seq
- productVariantId
- description
- qty
- unit
- unitPrice
- amount
- sourceRefType
- sourceRefId
```

ตัวอย่าง:

Customer Quotation:

```txt
- ทรายหยาบ 5 คิว x 650
- หินคลุก 30 คิว x 720
- ดินถม 4 คิว x 500
```

Supplier PO A:

```txt
- ทรายหยาบ 5 คิว x 450
```

Supplier PO B:

```txt
- หินคลุก 30 คิว x 520
- ดินถม 4 คิว x 300
```

Invoice:

```txt
- ทรายหยาบ 5 คิว
- หินคลุก 30 คิว
- ดินถม 4 คิว
```

---

# 11. Main End-to-End Workflow

```txt
1. Admin ตั้งค่าระบบ
2. Admin เพิ่มลูกค้า / supplier / fleet หรือเชิญผ่าน LINE
3. Partner เพิ่มสินค้าเองผ่าน LINE/mobile web
4. Admin ตรวจและอนุมัติสินค้า partner
5. Partner อัปเดต stock ผ่าน LINE
6. Customer สั่งสินค้า / ขอราคา
7. ระบบสร้าง Project และ Document Group
8. ระบบสร้าง Order
9. ระบบคำนวณราคา / ต้นทุน / margin
10. ระบบสร้าง BOQ
11. Admin ตรวจ BOQ บนคอมพิวเตอร์
12. ระบบสร้าง Quotation
13. Customer ได้รับ LINE notification
14. Customer กดยืนยัน Quotation
15. ระบบแตก PO ตาม supplier
16. Supplier ได้รับ LINE notification
17. Supplier กดยืนยัน PO
18. ระบบสร้าง Transport Job
19. Fleet ได้รับ LINE notification
20. Fleet/Driver รับงาน
21. Driver อัปเดตสถานะผ่าน LINE/mobile web
22. Driver อัปโหลด delivery proof
23. Admin เห็นสถานะบน dashboard แบบ real-time
24. ระบบสร้าง Invoice
25. Customer ได้รับ LINE notification เรื่อง invoice
26. Customer ชำระเงิน / upload slip
27. Accountant เห็น payment pending บน dashboard
28. Accountant confirm payment
29. ระบบออก Receipt
30. Debt Dashboard update real-time
31. ระบบคำนวณ payable ให้ Supplier/Fleet
32. Accountant สร้าง settlement
33. Owner/Admin อนุมัติ settlement
34. Accountant จ่ายเงิน
35. Partner/Fleet ได้รับ LINE notification เรื่อง payout
```

---

# 12. Minimal UI Rule For Partner / Customer / Fleet

สำหรับ mobile web / LINE flow:

```txt
1 screen = 1 action
ไม่เกิน 3-5 fields ต่อขั้น
ใช้ปุ่มใหญ่
ใช้ภาษาไทยชัดเจน
ไม่แสดงข้อมูลที่ไม่จำเป็น
ไม่แสดง dashboard ซับซ้อน
ไม่ให้ผู้ใช้เลือกข้อมูลที่ระบบเลือกให้ได้
```

ตัวอย่าง Partner เพิ่ม stock:

```txt
หน้าที่ 1: เลือกสินค้า
หน้าที่ 2: ใส่จำนวนใหม่
หน้าที่ 3: ยืนยัน
```

ตัวอย่าง Driver ปิดงาน:

```txt
หน้าที่ 1: อัปโหลดรูป
หน้าที่ 2: เพิ่มหมายเหตุ
หน้าที่ 3: กดยืนยันส่งสำเร็จ
```

---

# 13. Required New Modules

```txt
Partner Product Submission
Supplier Inventory
Supplier Inventory Movement
Product Approval Flow
LINE Rich Menu
LINE Action Handler
LINE Notification Template
LINE LIFF / Mobile Action Pages
Admin Real-time Dashboard
Real-time Debt Dashboard
Project Model
Document Group Model
Document Reference Engine
Project Numbering Engine
Document Search
Project Document Timeline
```

---

# 14. Recommended Routes

## Admin Desktop Routes

```txt
/admin/dashboard
/admin/debt
/admin/debt/[documentId]
/admin/documents/search
/admin/document-groups/[groupNo]
/admin/projects
/admin/projects/[projectNo]
/admin/projects/[projectNo]/documents
/admin/partners/products/pending
/admin/partners/[id]/products
/admin/inventory
/admin/alerts
```

## Partner Mobile / LINE Routes

```txt
/partner/home
/partner/products
/partner/products/new
/partner/products/[id]/stock
/partner/purchase-orders
/partner/purchase-orders/[id]/confirm
/partner/payouts
```

## Customer Mobile / LINE Routes

```txt
/customer/home
/customer/order/new
/customer/orders
/customer/quotations/[id]
/customer/shipments/[id]
/customer/invoices/[id]
/customer/payments/upload
```

## Fleet Mobile / LINE Routes

```txt
/fleet/home
/fleet/jobs
/fleet/jobs/[id]
/fleet/jobs/[id]/status
/fleet/jobs/[id]/proof
/fleet/availability
/fleet/earnings
```

## LINE API Routes

```txt
/api/webhooks/line
/api/line/actions/product-submit
/api/line/actions/stock-update
/api/line/actions/po-confirm
/api/line/actions/job-accept
/api/line/actions/job-status
/api/line/actions/payment-upload
```

---

# 15. API Requirements To Add

## Partner Product Submission

```txt
POST /api/partner/products/submit
GET  /api/partner/products
PATCH /api/partner/products/:id
PATCH /api/partner/products/:id/stock
POST /api/admin/partner-products/:id/approve
POST /api/admin/partner-products/:id/reject
```

## Inventory

```txt
GET  /api/admin/inventory
GET  /api/partner/inventory
POST /api/partner/inventory/:supplierProductId/adjust
GET  /api/supplier-products/:id/movements
```

## Project / Document Group

```txt
POST /api/projects
GET  /api/projects
GET  /api/projects/:projectNo
GET  /api/projects/:projectNo/documents
GET  /api/document-groups/:groupNo
GET  /api/documents/search?q=
```

## LINE Actions

```txt
POST /api/line/actions/stock-update
POST /api/line/actions/product-submit
POST /api/line/actions/po-confirm
POST /api/line/actions/po-reject
POST /api/line/actions/job-accept
POST /api/line/actions/job-status
POST /api/line/actions/proof-upload
```

---

# 16. Database Requirements To Add

เพิ่มตารางเหล่านี้:

```txt
projects
document_groups
document_references
supplier_inventory
supplier_inventory_movements
partner_product_submissions
line_action_tokens
line_notification_logs
event_logs
```

## projects

```txt
id
projectNo
customerCompanyId
customerSiteId
title
status
createdAt
updatedAt
```

## document_groups

```txt
id
groupNo
projectId
projectNo
rootOrderId
rootOrderNo
customerCompanyId
title
status
createdAt
updatedAt
```

## document_references

```txt
id
documentId
relatedDocumentId
relationType
createdAt
```

Relation types:

```txt
SOURCE
PARENT
CHILD
GENERATED_FROM
PAID_BY
SETTLED_BY
```

## partner_product_submissions

```txt
id
supplierCompanyId
productVariantId nullable
requestedProductName
requestedCategoryName
description
unit
price
stockQty
minQty
serviceArea
status
adminReviewNote
reviewedBy
reviewedAt
createdAt
updatedAt
```

## supplier_inventory

```txt
id
supplierProductId
stockQty
reservedQty
availableQty
unit
lowStockThreshold
updatedBy
updatedAt
```

## supplier_inventory_movements

```txt
id
supplierProductId
movementType
qty
beforeQty
afterQty
sourceType
sourceId
note
createdBy
createdAt
```

## line_action_tokens

```txt
id
lineUserId
userId
actionType
entityType
entityId
token
expiresAt
usedAt
createdAt
```

## line_notification_logs

```txt
id
userId
lineUserId
eventType
entityType
entityId
messagePayload
status
sentAt
failedReason
createdAt
```

---

# 17. AI Implementation Rules

AI must follow these rules:

```txt
1. Admin dashboard is desktop-first.
2. Partner/customer/fleet are LINE-first and mobile-first.
3. Do not build complex mobile dashboards.
4. Partner product submission is required.
5. Partner stock update is required.
6. Admin approval is required before partner product becomes sellable.
7. Debt dashboard must be real-time and drilldown-able.
8. Every document must belong to project/document group when applicable.
9. Document number must include project number if project exists.
10. Document search must support reference number search.
11. All LINE actions must be tokenized and verified.
12. Unknown LINE users must not be auto-created.
13. All financial/document changes must be audited.
```

---

# 18. MVP Rule

MVP แรกต้องยังไม่ซับซ้อนเกินไป แต่ต้องวางฐานถูก

```txt
1. LINE-only auth foundation
2. Admin desktop dashboard shell
3. Customer / Supplier / Fleet simple LINE-linked portals
4. Project + Document Group
5. Partner product submission
6. Admin product approval
7. Supplier inventory update
8. Customer order
9. BOQ
10. Quotation
11. Supplier PO
12. Invoice
13. Payment
14. Real-time debt dashboard basic
```

ทำหลัง MVP:

```txt
- Full LIFF experience
- Advanced stock reservation
- Auto supplier ranking
- Auto fleet matching
- Advanced realtime analytics
- Map tracking
```

---

# 19. Platform Intermediary Document Flow Rule

```txt
DNA OS เป็นตัวกลางกลางของธุรกรรม ไม่ใช่ผู้ขายปลีกธรรมดาและไม่ใช่ marketplace ที่ปล่อยให้เงินวิ่งตรงโดยไร้การควบคุม

ลำดับเอกสารหลัก:
Customer Order / ORD
→ BOQ ที่สร้างจาก order และ pricing snapshot
→ Quotation / QT ที่สร้างจาก BOQ
→ Supplier PO ที่แตกตามบริษัทพาร์ทเนอร์จริง
→ Transport Job
→ Invoice / Payment / Receipt / Settlement

กฎที่ต้องรักษา:
1. BOQ ต้องยึดจากวัสดุ/สินค้า/stock ที่พาร์ทเนอร์มีจริงใน SupplierProduct และ SupplierInventory
2. Partner product ต้อง APPROVED และ isAvailable = true ก่อนถูกเลือกเข้า pricing/BOQ/PO
3. availableQty ต้องเพียงพอต่อ quantity ของ order item ก่อนสร้าง BOQ
4. Supplier PO ต้องแยกตาม supplierCompanyId และแต่ละใบห้ามมีรายการของพาร์ทเนอร์อื่น
5. เอกสารทุกใบต้องอยู่ใน DocumentGroup เดียวกันเมื่อเกี่ยวกับ order เดียวกัน
6. DocumentReference ต้องทำให้ trace ได้ว่าเอกสารนี้สร้างจากเอกสารไหน เช่น PO → QT และ PO → BOQ
7. ฝั่งลูกค้าเห็นเฉพาะเอกสารขาย/บริการที่เกี่ยวข้องกับตนเอง ห้ามเห็น internal cost, margin, supplier cost หรือ internal BOQ
8. ฝั่งพาร์ทเนอร์เห็นเฉพาะ PO/งาน/ยอดรับของบริษัทตนเอง ห้ามเห็น customer margin หรือ supplier อื่น
9. เงินจาก customer ต้องเข้าบริษัทกลาง/Core Platform ก่อน แล้วค่อย settlement/payout ไป partner/fleet
10. เอกสารเชิงพาณิชย์ที่ส่งออกภายนอกต้องสะท้อนว่าการซื้อขายเกี่ยวกับลูกค้าและพาร์ทเนอร์ของระบบ แต่ payment clearing อยู่ใต้บริษัทกลาง
```

---

---

# 20. Detailed Role Workflow Reference

เอกสารนี้ระบุ workflow ละเอียดตามบทบาทแต่ละฝ่าย **ให้ AI agent ยึดตามนี้เป็นหลัก**

---

## 21.1 Fleet Partner Workflow

### STEP 1: ลงทะเบียนและตั้งค่า

```txt
สร้างบัญชี Fleet Partner
  ↓
เชื่อม LINE account
  ↓
Fleet เพิ่มรถเข้าระบบ (ประเภท / ความจุ / ทะเบียน)
  ↓
เปิดรับงาน (Vehicle status = OPEN) / ว่างรับงาน / กำลังส่งของ
```

### STEP 2: รับงาน

```txt
มีออร์เดอร์เข้ามา รอรถร่วม
  ↓
fleetMatchingEngine หา Fleet ที่พร้อม
  ↓
การเลือกออร์เดอร์และมอบหมาย Fleet
  ↓
Fleet รับแจ้งเตือนผ่าน LINE
  "มีงานขนส่งใหม่: รับราย 5 คิว งาน A → เส้น B"
  ↓
Fleet เปิดดูรายละเอียดงาน (ชื่อผู้ติดต่อ, ออร์เดอร์, วันที่, เงินที่จะได้รับ/เที่ยว)
  ↓
ตอบรับงาน → status = ACCEPTED
```

### STEP 3: ดำเนินงาน

```txt
Driver ออกเดินทางไปรับสินค้า
  ↓
Driver ถึงจุดรับวัสดุ
  ↓ กด "ถึงแล้ว" ในหน้า Admin Order
  status = ARRIVED_PICKUP
  ↓ กด "โหลดสำเร็จแล้ว" ในหน้าลงของ Admin
  status = LOADED

ออกเดินทางไปไซต์งาน
  ↓ กด "กำลังเดินทาง" ในหน้า Admin
  status = IN_TRANSIT
  ↓
ถึงไซต์งาน
  ↓ กด "ถึงไซต์แล้ว" ในหน้า Admin
  status = ARRIVED_SITE
  ↓
ส่งสินค้าเรียบร้อย
  ↓ กด "ส่งเสร็จแล้ว" พร้อมแสดงรายจ่ายสุทธิแต่ละครั้ง
  status = DELIVERED
```

**หมายเหตุสำคัญ:** ถ้าออร์เดอร์มีรายการส่งสินค้าหลายเที่ยว (เช่น ดิน 10 รอบ) ต้องอัปเดตออร์เดอร์เดียวกันใน real-time และปิดออร์เดอร์เมื่อรายการสุดท้ายส่งครบ

### STEP 4: ปิดงาน

```txt
บันทึกจำนวนออร์เดอร์ตามจำนวนที่ส่งจริง (ตามเที่ยวสุดท้าย) → status = COMPLETED
แต่ละออร์เดอร์ที่ส่งจะได้รับเครดิตตามจำนวนที่ส่ง
ค่าแรงขนส่งอยู่ในระบบสัญญา สูงสุด 6 เดือน
  ↓
ยอดค้างจ่ายที่ต้องจ่ายให้ fleet จากทุกเที่ยวสะสม
```

### STEP 5: รับเงิน

```txt
Admin อนุมัติและออก PMT
  ↓
Accountant จ่ายเงินให้ Fleet
  ↓
Fleet ดูยอดรับใน portal
```

---

## 21.2 Admin Workflow

### STEP 1: ตั้งค่าระบบครั้งแรก

```txt
Login ที่ /admin/login ด้วยรหัส
  ↓
เพิ่มข้อมูล master data:
  - สร้างลูกค้าและเส้นทางเดินทาง
  - สร้างสินค้าและหมวดหมู่
  - เพิ่ม supplier และราคา
  - เพิ่ม fleet partner และรถ
  - ตั้งค่า margin rules
```

### STEP 2: รับและดำเนินการ Order

```txt
รับคำสั่งซื้อจากลูกค้า
  ↓
รับ order (เลือกลูกค้า + เส้น + สินค้า)
  ↓
สร้างการ "คิดราคา" → pricingEngine รับ
  ↓
ตรวจสอบ:
  - ต้นทุนต่อรายการ
  - ราคาขาย = ต้นทุน + กำไร
  - margin %
  - VAT 7%
  ↓
สร้างใบเสนอราคา (QT) → ส่งลูกค้า
  ↓
รอลูกค้ายืนยัน
```

### STEP 3: จัดซื้อและจัดส่ง

```txt
ลูกค้ายืนยัน QT
  ↓
ระบบสร้าง PO → orderSplitEngine แยกตาม supplier
  ↓
ส่ง PO ให้แต่ละ supplier ทาง LINE
  ↓
รอ supplier ยืนยัน PO
  (ถ้าปฏิเสธ: รอยืนยันใหม่ 30 นาที → Admin หา supplier ใหม่)
  ↓
สร้างงานขนส่ง → ระบบ assign fleet ที่พร้อม → มอบหมาย
  ↓
Fleet รับงาน → ส่งของ → upload หลักฐาน
```

### STEP 4: ออกเอกสารและรับชำระ

```txt
ส่งสินค้าเรียบร้อย (รถเที่ยวสุดท้าย, ส่งวัสดุ)
  ↓
ระบบออก Invoice (INV / INV3):
  - กรณีจ่ายแล้ว   → ออกใบเสร็จรับเงิน (RCT) สถานะ: จ่ายแล้ว
  - ยังไม่จ่าย      → เป็นหนี้
    - ยังไม่จ่ายครบ 24 ชม. หลังจากติดต่อกันครั้งแรก → เริ่มระยะเวลาเป็นหนี้
  ↓
ส่ง invoice ให้ลูกค้าทาง LINE
  ↓
ลูกค้าจ่ายเงิน + upload สลิป
  ↓
ระบบดึงข้อมูลจากอีเมลรับเงินของฝ่ายบัญชี → เปลี่ยนสถานะ PAYMENT = COMPLETED
  ↓
ระบบออกใบเสร็จ (RCT)
  ↓
ลูกค้าได้รับใบเสร็จจาก LINE
  ↓
Order status = PAID
```

### STEP 5: ติดตามและ settlement

```txt
Dashboard แสดงยอดรวมทั้งหมด
  ↓
ตรวจ alert ที่ค้างอยู่
  ↓
สร้าง settlement batch จ่าย supplier + fleet
  ↓
จ่ายเงินและบันทึก
```

---

## 21.3 Supplier / Material Partner Workflow

### STEP 1: เพิ่มสินค้าเข้าระบบ

```txt
สร้างบัญชี supplier + เชื่อม LINE
  ↓
Supplier เพิ่ม:
  - เลือกประเภทสินค้า
  - เพิ่มข้อมูลรายการสินค้า ชื่อสินค้า
  - ระบุราคา ตั้งตามจัน และต่อคิว / สต็อกจำนวน / พื้นที่ (ตามแผนที่/ตามที่อยู่/ตามตำบลอำเภอ) คอนข้าง
  ↓
สินค้าที่ถูกเพิ่มจะถูก pricing engine ใช้แล้ว → แสดงสินค้าที่หน้าให้ลูกค้า (ชื่อวัสดุ/ราคา)
```

**หมายเหตุ:** เอกสารที่ระบบส่งให้ supplier เรียกว่า PO (Purchase Order) ไม่ใช่ QT

### STEP 2: รับ PO (ใบสั่งซื้อ)

```txt
ลูกค้ายืนยัน order
  ↓
ระบบสร้าง PO
  ↓
orderSplitEngine แยกสินค้าตาม supplier
  ↓
ระบบส่ง PO ให้ supplier ทาง LINE
  "มีใบสั่งซื้อใหม่: ทราย 5 คิว วันส่ง 25 ก.พ."
  ↓
Supplier เปิดดูรายละเอียด PO (ชื่อผู้ติดต่อ, ออร์เดอร์, วันที่, เงินที่จะได้รับ/เที่ยว)
  ↓
กดยืนยัน PO → PO status = CONFIRMED
  ↓
(ถ้าปฏิเสธ → Supplier ต้องให้เหตุผล, Admin หา supplier ใหม่)
```

### STEP 3: จัดส่งสินค้า

```txt
Fleet เข้ามาตามแผนที่ตั้ง กด "เหล" รับสินค้าจาก supplier
  ↓
Supplier update สต็อก (OUT movement) โดยระบบ
  ↓
บันทึกการโหลดวัสดุที่เที่ยวสุดท้าย
ระบบยืนยันการจ่ายสินค้า → PO status = FULFILLED
  → ระบบออกสั่งจ่ายให้ Supplier รอ 6 เดือน
```

### STEP 4: รับเงิน

```txt
ระบบรอครบ 6 เดือน
  ↓
คำนวณยอดจ่าย:
  ยอด PO ที่ FULFILLED × ราคาต่อหน่วย
  ↓
Admin อนุมัติ → ออก PV + PMT
  (ถ้า Supplier เป็นบุคคลธรรมดา ให้หัก WHT 3%)
  ↓
Accountant จ่ายเงินให้ supplier
  ↓
Supplier ดูยอดรับใน portal
```

---

## 21.4 Customer Workflow

### STEP 1: เริ่มใช้งานครั้งแรก

```txt
เข้าสู่ระบบ
  ↓
ระบบสร้าง LINE linking token
  ↓
Admin ส่งลิงก์เชื่อมต่อให้ลูกค้า (ผ่าน LINE ส่วนตัว)
  ↓
ลูกค้ากดลิงก์ → เปิดหน้า /line/connect
  ↓
ลูกค้า login LINE → ระบบผูก LINE account
  ↓
ลูกค้าเข้าได้จาก LINE เป็นบัญชี
```

### STEP 2: สั่งสินค้า

```txt
ลูกค้าเปิด LINE → กด menu / ส่ง message
  ↓
เลือกดูรายการสินค้า (ระบบแนะนำ วัสดุ ดิน หิน ทราย)
  ↓
เลือกสินค้าและระบุจำนวน
  ↓
เลือกไซต์งาน, ชื่อผู้ติดต่อ, เลือกวิธีชำระเงิน (จ่ายเลย / ชำระหน้างาน)
  ↓
ระบุวันที่ต้องการ, เวลา
  → ระบบแสดงว่าวันไหนมีรถว่าง ไม่ต้องยืนยันรถล่วงหน้าก่อนสำหรับวันว่าง
  ↓
ยืนยันส่ง order → ระบบสร้าง CustomerOrder (SUBMITTED)
  → ส่งออร์เดอร์ไปที่แอดมิน พร้อมรายการสินค้าและเส้นทาง รถร่วม
  ↓
ลูกค้าได้รับการยืนยันจาก LINE
```

### STEP 3: รอและยืนยันใบเสนอราคา

```txt
ระบบสร้างใบเสนอราคา (QT)
  ↓
ระบบส่ง QT ให้ลูกค้าทาง LINE (PDF)
  ↓
ลูกค้าเปิด PDF ตรวจรายการและราคา
  ↓
กรณีตกลงราคา: กดยืนยัน QT
  ↓
  Order status = CONFIRMED, ออกใบแจ้งหนี้/ใบกำกับภาษี/ใบเสร็จรับเงิน
  ↓
กรณีไม่ตกลง: ยกเลิก QT ให้แจ้งไปที่ QT และล้างรหัสอ้างอิง QT
```

### STEP 4: ติดตาม Order

```txt
ลูกค้ารับแจ้งเตือนจาก LINE เมื่อสถานะเปลี่ยน:
  - ระบบสั่งซื้อจาก supplier แล้ว
  - รถออกรับสินค้าแล้ว
  ***** - รถกำลังเดินทางมา (IN_TRANSIT) *****
  ***** - รถถึงไซต์งานแล้ว (ARRIVED_SITE) *****
  ↓
***** ลูกค้าตรวจรับสินค้าที่ไซต์ *****

หมายเหตุ GPS:
  - รถที่รับงานต้องมี GPS tracking
  - ระบบเริ่มคิดค่าขนส่งเมื่อมีการขนส่งแต่ละครั้ง
  - เริ่มนับ 24 ชม. หลังจากมีการติดต่อกันครั้งแรก เพื่อเริ่มระยะเวลาเป็นหนี้

กรณีออร์เดอร์มีการส่งหลายเที่ยว (เช่น ดิน 10 รอบ):
  - ระบบติดตามจำนวนเที่ยวที่ส่งแล้วต่อ order item
  - เมื่อครบจำนวนเที่ยวที่กำหนด → ออก INVOICE อัตโนมัติ
  ↓
***** ยืนยันรับสินค้า → Transport status = COMPLETED *****
```

### STEP 5: ชำระเงิน

```txt
ระบบออก Invoice (INV / INV3):
  - กรณีจ่ายแล้ว   → ออกใบเสร็จรับเงิน (RCT) สถานะ: จ่ายแล้ว
  - ยังไม่จ่าย      → เป็นหนี้
    - ยังไม่จ่ายครบ 24 ชม. หลังจากติดต่อกันครั้งแรก → เริ่มระยะเวลาเป็นหนี้
  ↓
ระบบส่ง invoice ให้ลูกค้าทาง LINE
  ↓
ลูกค้าจ่ายตามจำนวน
  ↓
ลูกค้า upload สลิป (ผ่าน LINE / web)
  ↓
ระบบดึงข้อมูลจากอีเมลรับเงินของฝ่ายบัญชี → เปลี่ยนสถานะ PAYMENT = COMPLETED
  ↓
ระบบออกใบเสร็จ (RCT)
  ↓
ลูกค้าได้รับใบเสร็จจาก LINE
  ↓
Order status = PAID
```

---

# 21. Business Rules From Operational Flows

กฎเชิงธุรกิจที่สำคัญจากโฟลว์จริง — **AI agent ต้องยึดตามนี้เมื่อ implement**

---

## 22.1 Fleet Payment Rules

```txt
- ค่าแรงขนส่งบันทึกตามจำนวนที่ส่งจริงต่อเที่ยว
- วงเงินเครดิต fleet สูงสุด 6 เดือนตามสัญญา
- จ่ายผ่าน PMT ที่ Admin อนุมัติ
- Fleet ดูยอดรับได้ใน portal
```

## 22.2 Supplier Payment Rules

```txt
- Supplier รอรับเงินหลัง PO status = FULFILLED
- วงเงินเครดิต supplier สูงสุด 6 เดือน
- Admin อนุมัติ PV + PMT
- ถ้า Supplier เป็นบุคคลธรรมดา หัก WHT 3%
- Accountant จ่ายผ่านระบบบัญชี
- Supplier ดูยอดใน portal
```

## 22.3 Auto-Invoice Rules

```txt
- ถ้า order item มีการส่งสินค้าหลายเที่ยว (เช่น ดิน 10 รอบ)
- ระบบติดตามจำนวนเที่ยวที่ส่งแล้วต่อ order item
- เมื่อครบจำนวนเที่ยวที่กำหนด → ออก Invoice อัตโนมัติ
- ไม่ต้องรอ admin กดออก invoice ด้วยตัวเอง
```

## 22.4 Debt Collection Rules

```txt
- นับ 24 ชั่วโมงหลังจากมีการติดต่อกันครั้งแรก (first contact)
- ถ้าไม่จ่ายภายใน 24 ชม. → เริ่มระยะเวลาเป็นหนี้ (debt timer เริ่มนับ)
- แจ้งเตือนลูกค้าทาง LINE เมื่อใกล้ครบกำหนด
- Admin/Accountant เห็นบน Debt Dashboard แบบ real-time
```

## 22.5 Supplier PO Rejection Rules

```txt
- ถ้า Supplier ปฏิเสธ: ต้องระบุเหตุผลปฏิเสธ
- รอยืนยันใหม่ 30 นาที
- ถ้า Admin ไม่ดำเนินการ → Admin ต้องหา Supplier ใหม่
```

## 22.6 GPS Delivery Tracking Rules

```txt
- รถที่รับงานต้องมี GPS tracking
- ลูกค้าเห็นสถานะรถแบบ real-time (IN_TRANSIT, ARRIVED_SITE)
- ระบบเริ่มคิดค่าขนส่งเมื่อมีการขนส่งแต่ละครั้ง
- GPS เป็นส่วนหนึ่งของ delivery proof
```

## 22.7 Document Naming Rules (PO vs QT)

```txt
- QT (ใบเสนอราคา) = ส่งให้ลูกค้าเท่านั้น
- PO (ใบสั่งซื้อ) = ส่งให้ supplier เท่านั้น
- ห้ามเรียก PO ว่า QT ในระบบ
- ในโฟลว์ supplier ที่บางครั้งเรียกว่า QT หมายถึงเอกสาร PO นั้นเอง
```

---

# END OF WORKFLOW_AND_ROLE_RULES
