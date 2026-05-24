# API_DESCRIPTION.md

# DNA OS Construction Platform — API Description

เอกสารนี้อธิบาย API ทั้งหมดของระบบ **DNA OS Construction Platform** สำหรับใช้เป็นคู่มือให้ AI coding agent, developer และ backend/frontend ทำงานร่วมกัน

ควรวางไฟล์นี้ไว้ที่ root ของโปรเจกต์:

```txt
/API_DESCRIPTION.md
```

ใช้ร่วมกับ:

```txt
/AGENT.md
/PROJECT_PROGRESS.md
/AI_STEP_PROMPTS.md
/DNA_OS_Construction_Platform_Blueprint.md
```

---

# 1. API Design Principles

## 1.1 Core Principle

```txt
ข้อมูลเกิดครั้งเดียว ถูกใช้ทั้งระบบ
```

API ต้องออกแบบให้ข้อมูลไหลต่อกัน:

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

## 1.2 API Style

ระบบนี้ใช้ Next.js App Router ได้ทั้ง:

```txt
Server Actions
Route Handlers
API Routes
```

คำแนะนำ:

```txt
- ใช้ Server Actions สำหรับ form mutation ภายใน web app
- ใช้ Route Handlers สำหรับ external API / webhook / public client
- ใช้ Service Layer สำหรับ business logic
- ใช้ Engine Layer สำหรับ pure business calculation
```

---

## 1.3 Base URL

Development:

```txt
http://localhost:3000/api
```

Production:

```txt
https://your-domain.com/api
```

---

## 1.4 Authentication

ใช้ Supabase Auth หรือ auth provider ที่เลือก

ทุก protected API ต้องมี session

Header:

```http
Authorization: Bearer <access_token>
```

หรือใช้ cookie-based session ใน Next.js

---

## 1.5 Authorization

ทุก API ต้องตรวจ:

```txt
1. user login แล้วหรือไม่
2. user อยู่ company ไหน
3. user มี role อะไร
4. user มีสิทธิ์เข้าถึง resource นั้นหรือไม่
5. resource อยู่ใน company / tenant ที่ user เข้าถึงได้หรือไม่
```

ห้ามรับ `companyId` จาก frontend แล้วเชื่อทันที

```txt
companyId ต้องมาจาก session / membership เท่านั้น
```

---

## 1.6 Common Roles

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

---

## 1.7 Common Response Format

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

Paginated Response:

```json
{
  "ok": true,
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## 1.8 Common Status Codes

```txt
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Validation Error
500 Internal Server Error
```

---

## 1.9 Common Error Codes

```txt
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
VALIDATION_ERROR
DUPLICATE_RECORD
INVALID_STATUS_TRANSITION
INSUFFICIENT_PERMISSION
TENANT_MISMATCH
DOCUMENT_LOCKED
PAYMENT_MISMATCH
LOW_MARGIN_REQUIRES_APPROVAL
CREDIT_LIMIT_EXCEEDED
SUPPLIER_NOT_AVAILABLE
VEHICLE_NOT_AVAILABLE
PROOF_REQUIRED
```

---

# 2. API Module Overview

```txt
/api/auth
/api/me
/api/admin
/api/customer
/api/partner
/api/fleet
/api/catalog
/api/orders
/api/boq
/api/documents
/api/procurement
/api/logistics
/api/payments
/api/reconciliation
/api/debt
/api/settlements
/api/alerts
/api/dashboard
/api/files
/api/webhooks
```

---

# 3. Auth & Current User APIs

---

## 3.1 Get Current User

```http
GET /api/me
```

### Permission

```txt
Authenticated user
```

### Response

```json
{
  "ok": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "phone": "0812345678"
    },
    "memberships": [
      {
        "companyId": "uuid",
        "companyName": "DNA OS",
        "companyType": "CORE",
        "role": "OWNER"
      }
    ],
    "activeCompany": {
      "id": "uuid",
      "name": "DNA OS",
      "type": "CORE",
      "role": "OWNER"
    }
  }
}
```

---

## 3.2 Switch Active Company

```http
POST /api/me/switch-company
```

### Body

```json
{
  "companyId": "uuid"
}
```

### Permission

```txt
User must be a member of company
```

### Response

```json
{
  "ok": true,
  "data": {
    "activeCompanyId": "uuid"
  }
}
```

---

# 4. Admin Company APIs

---

## 4.1 List Companies

```http
GET /api/admin/companies
```

### Query

```txt
type=CORE|CUSTOMER|SUPPLIER|FLEET
status=ACTIVE|INACTIVE|SUSPENDED
search=keyword
page=1
pageSize=20
```

### Permission

```txt
OWNER, ADMIN
```

### Response

```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "name": "บริษัท ABC จำกัด",
      "taxId": "0105559999999",
      "type": "CUSTOMER",
      "status": "ACTIVE",
      "phone": "0812345678",
      "email": "contact@example.com",
      "createdAt": "2026-05-21T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

## 4.2 Create Company

```http
POST /api/admin/companies
```

### Permission

```txt
OWNER, ADMIN
```

### Body

```json
{
  "name": "บริษัท ABC จำกัด",
  "taxId": "0105559999999",
  "address": "123 ถนนสุขุมวิท",
  "phone": "0812345678",
  "email": "contact@example.com",
  "bankName": "KBank",
  "bankAccountNo": "1234567890",
  "type": "CUSTOMER"
}
```

### Response

```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "name": "บริษัท ABC จำกัด",
    "type": "CUSTOMER",
    "status": "ACTIVE"
  }
}
```

### Side Effects

```txt
- Create audit log
- If type CUSTOMER, optionally create CustomerCreditProfile
```

---

## 4.3 Get Company Detail

```http
GET /api/admin/companies/:companyId
```

### Permission

```txt
OWNER, ADMIN หรือ company member ที่มีสิทธิ์
```

### Response

```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "name": "บริษัท ABC จำกัด",
    "taxId": "0105559999999",
    "address": "123 ถนนสุขุมวิท",
    "phone": "0812345678",
    "email": "contact@example.com",
    "type": "CUSTOMER",
    "status": "ACTIVE",
    "members": [],
    "createdAt": "2026-05-21T00:00:00.000Z"
  }
}
```

---

## 4.4 Update Company

```http
PATCH /api/admin/companies/:companyId
```

### Permission

```txt
OWNER, ADMIN
```

### Body

```json
{
  "name": "บริษัท ABC จำกัด",
  "taxId": "0105559999999",
  "address": "123 ถนนสุขุมวิท",
  "phone": "0812345678",
  "email": "contact@example.com",
  "bankName": "KBank",
  "bankAccountNo": "1234567890",
  "status": "ACTIVE"
}
```

### Side Effects

```txt
- Create audit log for changed fields
```

---

# 5. Customer APIs

---

## 5.1 List Customers

```http
GET /api/admin/customers
```

### Permission

```txt
OWNER, ADMIN, OPERATION, ACCOUNTANT
```

### Query

```txt
search=keyword
creditStatus=NORMAL|WATCH|HOLD|BLOCKED
page=1
pageSize=20
```

### Response

```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "name": "บริษัทลูกค้า A",
      "taxId": "0105559999999",
      "phone": "0812345678",
      "creditStatus": "NORMAL",
      "creditLimit": 100000,
      "currentOutstanding": 25000,
      "siteCount": 2
    }
  ]
}
```

---

## 5.2 Create Customer

```http
POST /api/admin/customers
```

### Permission

```txt
OWNER, ADMIN, OPERATION
```

### Body

```json
{
  "name": "บริษัทลูกค้า A",
  "taxId": "0105559999999",
  "address": "กรุงเทพฯ",
  "phone": "0812345678",
  "email": "customer@example.com",
  "creditLimit": 100000,
  "creditTermDays": 30
}
```

### Response

```json
{
  "ok": true,
  "data": {
    "companyId": "uuid",
    "creditProfileId": "uuid"
  }
}
```

### Side Effects

```txt
- Create Company type CUSTOMER
- Create CustomerCreditProfile
- Create audit log
```

---

## 5.3 List Customer Sites

```http
GET /api/admin/customers/:customerCompanyId/sites
```

### Permission

```txt
OWNER, ADMIN, OPERATION, CUSTOMER owner/member
```

### Response

```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "siteName": "ไซต์งานบางนา",
      "address": "บางนา กรุงเทพฯ",
      "province": "กรุงเทพมหานคร",
      "district": "บางนา",
      "contactName": "คุณสมชาย",
      "contactPhone": "0812345678",
      "preferredDeliveryTime": "08:00-11:00",
      "accessRestriction": "รถสิบล้อเข้าประตู 2",
      "isActive": true
    }
  ]
}
```

---

## 5.4 Create Customer Site

```http
POST /api/admin/customers/:customerCompanyId/sites
```

### Permission

```txt
OWNER, ADMIN, OPERATION, CUSTOMER owner/member
```

### Body

```json
{
  "siteName": "ไซต์งานบางนา",
  "address": "บางนา กรุงเทพฯ",
  "province": "กรุงเทพมหานคร",
  "district": "บางนา",
  "subdistrict": "บางนา",
  "postalCode": "10260",
  "gpsLat": 13.667,
  "gpsLng": 100.605,
  "contactName": "คุณสมชาย",
  "contactPhone": "0812345678",
  "deliveryNote": "โทรก่อนถึง 30 นาที",
  "accessRestriction": "รถสิบล้อเข้าประตู 2",
  "preferredDeliveryTime": "08:00-11:00"
}
```

### Side Effects

```txt
- Create audit log
```

---

## 5.5 Update Customer Credit Profile

```http
PATCH /api/admin/customers/:customerCompanyId/credit
```

### Permission

```txt
OWNER, ADMIN, ACCOUNTANT
```

### Body

```json
{
  "creditLimit": 100000,
  "creditTermDays": 30,
  "creditStatus": "NORMAL",
  "paymentBehaviorScore": 95
}
```

### Side Effects

```txt
- Create audit log
- If creditStatus changes to HOLD/BLOCKED, create alert
```

---

# 6. Catalog APIs

---

## 6.1 List Product Categories

```http
GET /api/catalog/categories
```

### Permission

```txt
Authenticated users
```

### Response

```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "name": "วัสดุถม",
      "description": "ทราย หิน ดิน",
      "sortOrder": 1
    }
  ]
}
```

---

## 6.2 Create Product Category

```http
POST /api/admin/catalog/categories
```

### Permission

```txt
OWNER, ADMIN
```

### Body

```json
{
  "name": "วัสดุถม",
  "description": "ทราย หิน ดิน",
  "sortOrder": 1
}
```

---

## 6.3 List Products

```http
GET /api/catalog/products
```

### Query

```txt
categoryId=uuid
search=ทราย
isActive=true
page=1
pageSize=20
```

### Response

```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "categoryId": "uuid",
      "categoryName": "วัสดุถม",
      "name": "ทราย",
      "description": "ทรายสำหรับงานก่อสร้าง",
      "defaultUnit": "คิว",
      "isActive": true,
      "variants": [
        {
          "id": "uuid",
          "name": "ทรายหยาบ",
          "unit": "คิว"
        }
      ]
    }
  ]
}
```

---

## 6.4 Create Product

```http
POST /api/admin/catalog/products
```

### Permission

```txt
OWNER, ADMIN
```

### Body

```json
{
  "categoryId": "uuid",
  "name": "ทราย",
  "description": "ทรายสำหรับงานก่อสร้าง",
  "defaultUnit": "คิว",
  "isActive": true
}
```

---

## 6.5 Create Product Variant

```http
POST /api/admin/catalog/products/:productId/variants
```

### Permission

```txt
OWNER, ADMIN
```

### Body

```json
{
  "name": "ทรายหยาบ",
  "unit": "คิว",
  "specs": {
    "grade": "หยาบ",
    "usage": "งานโครงสร้าง"
  },
  "isActive": true
}
```

---

# 7. Supplier / Partner APIs

---

## 7.1 List Suppliers

```http
GET /api/admin/suppliers
```

### Permission

```txt
OWNER, ADMIN, PROCUREMENT
```

### Query

```txt
search=keyword
status=ACTIVE
page=1
pageSize=20
```

### Response

```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "name": "บริษัท Supplier A",
      "taxId": "0105559999999",
      "phone": "0812345678",
      "productCount": 10,
      "status": "ACTIVE"
    }
  ]
}
```

---

## 7.2 Create Supplier

```http
POST /api/admin/suppliers
```

### Permission

```txt
OWNER, ADMIN, PROCUREMENT
```

### Body

```json
{
  "name": "บริษัท Supplier A",
  "taxId": "0105559999999",
  "address": "ชลบุรี",
  "phone": "0812345678",
  "email": "supplier@example.com",
  "bankName": "KBank",
  "bankAccountNo": "1234567890"
}
```

### Side Effects

```txt
- Create Company type SUPPLIER
- Create audit log
```

---

## 7.3 List Supplier Products

```http
GET /api/admin/suppliers/:supplierCompanyId/products
```

### Permission

```txt
OWNER, ADMIN, PROCUREMENT หรือ supplier owner เฉพาะของตัวเอง
```

### Response

```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "supplierCompanyId": "uuid",
      "productVariantId": "uuid",
      "productName": "ทราย",
      "variantName": "ทรายหยาบ",
      "sku": "SAND-ROUGH",
      "price": 450,
      "minQty": 5,
      "serviceArea": "ชลบุรี",
      "leadTimeHours": 4,
      "isAvailable": true
    }
  ]
}
```

---

## 7.4 Create Supplier Product

```http
POST /api/admin/suppliers/:supplierCompanyId/products
```

### Permission

```txt
OWNER, ADMIN, PROCUREMENT
```

### Body

```json
{
  "productVariantId": "uuid",
  "sku": "SAND-ROUGH",
  "price": 450,
  "minQty": 5,
  "serviceArea": "ชลบุรี",
  "leadTimeHours": 4,
  "isAvailable": true,
  "priceChangeReason": "Initial price"
}
```

### Side Effects

```txt
- Create SupplierProduct
- Create PriceHistory
- Create audit log
```

---

## 7.5 Update Supplier Product Price

```http
PATCH /api/admin/supplier-products/:supplierProductId/price
```

### Permission

```txt
OWNER, ADMIN, PROCUREMENT
```

### Body

```json
{
  "newPrice": 480,
  "reason": "ต้นทุนเพิ่ม"
}
```

### Response

```json
{
  "ok": true,
  "data": {
    "supplierProductId": "uuid",
    "oldPrice": 450,
    "newPrice": 480
  }
}
```

### Side Effects

```txt
- Create PriceHistory
- Create audit log
```

---

## 7.6 Partner List Own Products

```http
GET /api/partner/products
```

### Permission

```txt
SUPPLIER
```

### Response

```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "productName": "ทราย",
      "variantName": "ทรายหยาบ",
      "price": 450,
      "minQty": 5,
      "serviceArea": "ชลบุรี",
      "isAvailable": true
    }
  ]
}
```

---

## 7.7 Partner Toggle Product Availability

```http
PATCH /api/partner/products/:supplierProductId/availability
```

### Permission

```txt
SUPPLIER owns product
```

### Body

```json
{
  "isAvailable": false
}
```

---

# 8. Fleet APIs

---

## 8.1 List Fleet Partners

```http
GET /api/admin/fleet-partners
```

### Permission

```txt
OWNER, ADMIN, OPERATION
```

### Response

```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "companyId": "uuid",
      "companyName": "รถร่วม A",
      "status": "ACTIVE",
      "rating": 4.5,
      "vehicleCount": 5
    }
  ]
}
```

---

## 8.2 Create Fleet Partner

```http
POST /api/admin/fleet-partners
```

### Permission

```txt
OWNER, ADMIN, OPERATION
```

### Body

```json
{
  "name": "รถร่วม A",
  "taxId": "0105559999999",
  "address": "ชลบุรี",
  "phone": "0812345678",
  "email": "fleet@example.com",
  "bankName": "KBank",
  "bankAccountNo": "1234567890"
}
```

### Side Effects

```txt
- Create Company type FLEET
- Create FleetPartner
- Create audit log
```

---

## 8.3 List Vehicle Types

```http
GET /api/fleet/vehicle-types
```

### Permission

```txt
Authenticated users
```

### Response

```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "name": "รถสิบล้อ",
      "description": "บรรทุกวัสดุ 10 คิว"
    }
  ]
}
```

---

## 8.4 Create Vehicle Type

```http
POST /api/admin/fleet/vehicle-types
```

### Permission

```txt
OWNER, ADMIN
```

### Body

```json
{
  "name": "รถสิบล้อ",
  "description": "บรรทุกวัสดุ 10 คิว"
}
```

---

## 8.5 List Vehicles

```http
GET /api/fleet/vehicles
```

### Permission

```txt
FLEET_OWNER เห็นของตัวเอง, ADMIN เห็นทั้งหมด
```

### Response

```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "plateNo": "83-1234",
      "vehicleType": "รถสิบล้อ",
      "capacityValue": 10,
      "capacityUnit": "คิว",
      "status": "OPEN",
      "isAcceptingQueue": true
    }
  ]
}
```

---

## 8.6 Create Vehicle

```http
POST /api/fleet/vehicles
```

### Permission

```txt
FLEET_OWNER, ADMIN
```

### Body

```json
{
  "vehicleTypeId": "uuid",
  "plateNo": "83-1234",
  "capacityValue": 10,
  "capacityUnit": "คิว",
  "status": "OPEN",
  "isAcceptingQueue": true
}
```

---

## 8.7 Toggle Vehicle Queue

```http
PATCH /api/fleet/vehicles/:vehicleId/queue
```

### Permission

```txt
FLEET_OWNER owns vehicle, ADMIN
```

### Body

```json
{
  "isAcceptingQueue": false
}
```

---

## 8.8 Create Transport Rate Card

```http
POST /api/admin/fleet/rate-cards
```

### Permission

```txt
OWNER, ADMIN, OPERATION
```

### Body

```json
{
  "fleetPartnerId": "uuid",
  "vehicleTypeId": "uuid",
  "fromArea": "บ่อดิน ชลบุรี",
  "toArea": "บางนา",
  "productType": "ดิน",
  "minDistanceKm": 0,
  "maxDistanceKm": 50,
  "basePrice": 1000,
  "pricePerKm": 20,
  "pricePerTrip": 1500,
  "pricePerUnit": 0,
  "effectiveFrom": "2026-05-21",
  "effectiveTo": null
}
```

---

# 9. Customer Order APIs

---

## 9.1 List Orders

```http
GET /api/orders
```

### Permission

```txt
ADMIN/OPERATION เห็นทั้งหมด
CUSTOMER เห็นเฉพาะ order ของตัวเอง
```

### Query

```txt
status=SUBMITTED
customerCompanyId=uuid
dateFrom=2026-05-01
dateTo=2026-05-31
page=1
pageSize=20
```

### Response

```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "orderNo": "ORD-20260521-001",
      "customerName": "บริษัทลูกค้า A",
      "siteName": "ไซต์งานบางนา",
      "requestedDeliveryDate": "2026-05-25",
      "status": "SUBMITTED",
      "subtotal": 0,
      "vat": 0,
      "total": 0,
      "itemCount": 3,
      "createdAt": "2026-05-21T00:00:00.000Z"
    }
  ]
}
```

---

## 9.2 Create Order

```http
POST /api/orders
```

### Permission

```txt
OWNER, ADMIN, OPERATION, CUSTOMER
```

### Body

```json
{
  "customerCompanyId": "uuid",
  "customerSiteId": "uuid",
  "requestedDeliveryDate": "2026-05-25",
  "note": "ต้องการส่งช่วงเช้า",
  "items": [
    {
      "productVariantId": "uuid",
      "description": "ทรายหยาบ",
      "qty": 5,
      "unit": "คิว",
      "transportRequired": true
    },
    {
      "productVariantId": "uuid",
      "description": "หินคลุก",
      "qty": 30,
      "unit": "คิว",
      "transportRequired": true
    },
    {
      "productVariantId": "uuid",
      "description": "ดินถม",
      "qty": 4,
      "unit": "คิว",
      "transportRequired": true
    }
  ]
}
```

### Response

```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "orderNo": "ORD-20260521-001",
    "status": "SUBMITTED"
  }
}
```

### Side Effects

```txt
- Create CustomerOrder
- Create CustomerOrderItems
- Create OrderStatusHistory
- Create audit log
- Create alert NEW_ORDER
```

---

## 9.3 Get Order Detail

```http
GET /api/orders/:orderId
```

### Permission

```txt
ADMIN/OPERATION หรือ owner customer
```

### Response

```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "orderNo": "ORD-20260521-001",
    "status": "SUBMITTED",
    "customer": {
      "id": "uuid",
      "name": "บริษัทลูกค้า A"
    },
    "site": {
      "id": "uuid",
      "siteName": "ไซต์งานบางนา",
      "address": "บางนา"
    },
    "items": [
      {
        "id": "uuid",
        "description": "ทรายหยาบ",
        "qty": 5,
        "unit": "คิว",
        "customerUnitPrice": 650,
        "customerAmount": 3250,
        "transportRequired": true
      }
    ],
    "subtotal": 3250,
    "vat": 227.5,
    "total": 3477.5
  }
}
```

---

## 9.4 Update Order Status

```http
PATCH /api/orders/:orderId/status
```

### Permission

```txt
OWNER, ADMIN, OPERATION
```

### Body

```json
{
  "toStatus": "CONFIRMED",
  "note": "ลูกค้ายืนยันใบเสนอราคาแล้ว"
}
```

### Side Effects

```txt
- Validate status transition
- Create OrderStatusHistory
- Create audit log
```

---

# 10. Pricing & BOQ APIs

---

## 10.1 Price Order

```http
POST /api/orders/:orderId/price
```

### Permission

```txt
OWNER, ADMIN, OPERATION, PROCUREMENT
```

### Body

```json
{
  "pricingMode": "AUTO",
  "marginRuleId": "uuid",
  "manualOverrides": [
    {
      "orderItemId": "uuid",
      "customerUnitPrice": 650,
      "selectedSupplierId": "uuid"
    }
  ]
}
```

### Response

```json
{
  "ok": true,
  "data": {
    "orderId": "uuid",
    "subtotal": 26850,
    "vat": 1879.5,
    "total": 28729.5,
    "internalCost": 20550,
    "grossMargin": 6300,
    "grossMarginPercent": 23.46,
    "items": [
      {
        "orderItemId": "uuid",
        "description": "ทรายหยาบ",
        "qty": 5,
        "supplierUnitCost": 450,
        "transportCost": 500,
        "customerUnitPrice": 650,
        "customerAmount": 3250,
        "marginAmount": 500
      }
    ],
    "alerts": []
  }
}
```

### Side Effects

```txt
- Update CustomerOrder totals
- Update CustomerOrderItem pricing fields
- Create LOW_MARGIN alert if needed
- Create CREDIT_LIMIT_EXCEEDED alert if needed
- Create audit log
```

---

## 10.2 Create BOQ From Order

```http
POST /api/orders/:orderId/boq
```

### Permission

```txt
OWNER, ADMIN, OPERATION, PROCUREMENT
```

### Body

```json
{
  "type": "CUSTOMER"
}
```

### Response

```json
{
  "ok": true,
  "data": {
    "boqId": "uuid",
    "boqNo": "BOQ-20260521-001",
    "type": "CUSTOMER",
    "subtotal": 26850,
    "vat": 1879.5,
    "total": 28729.5
  }
}
```

### Notes

```txt
type = CUSTOMER สำหรับลูกค้า
type = INTERNAL สำหรับต้นทุนภายใน
```

---

## 10.3 Get BOQ Detail

```http
GET /api/boq/:boqId
```

### Permission

```txt
CUSTOMER BOQ: customer owner, admin
INTERNAL BOQ: OWNER, ADMIN, ACCOUNTANT, PROCUREMENT
```

### Response

```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "boqNo": "BOQ-20260521-001",
    "type": "CUSTOMER",
    "items": [
      {
        "description": "ทรายหยาบ",
        "qty": 5,
        "unit": "คิว",
        "unitPrice": 650,
        "amount": 3250
      }
    ],
    "subtotal": 26850,
    "vat": 1879.5,
    "total": 28729.5
  }
}
```

---

# 11. Document APIs

---

## 11.1 List Documents

```http
GET /api/documents
```

### Permission

```txt
ADMIN sees all allowed
CUSTOMER sees own documents
SUPPLIER sees own PO/PV/PMT if relevant
FLEET sees own payout documents
```

### Query

```txt
docType=QT
status=APPROVED
customerOrderId=uuid
companyId=uuid
dateFrom=2026-05-01
dateTo=2026-05-31
page=1
pageSize=20
```

### Response

```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "docNo": "QT-20260521-001",
      "docType": "QT",
      "status": "APPROVED",
      "version": 1,
      "companyName": "DNA OS",
      "counterpartyName": "บริษัทลูกค้า A",
      "issueDate": "2026-05-21",
      "dueDate": "2026-06-20",
      "total": 28729.5,
      "pdfUrl": "signed-url-or-path"
    }
  ]
}
```

---

## 11.2 Create Quotation From Order

```http
POST /api/orders/:orderId/documents/quotation
```

### Permission

```txt
OWNER, ADMIN, OPERATION
```

### Body

```json
{
  "boqId": "uuid",
  "notes": "ราคานี้มีผล 7 วัน",
  "requiresApproval": false
}
```

### Response

```json
{
  "ok": true,
  "data": {
    "documentId": "uuid",
    "docNo": "QT-20260521-001",
    "docType": "QT",
    "status": "DRAFT",
    "total": 28729.5
  }
}
```

### Side Effects

```txt
- Generate document number server-side
- Snapshot BOQ items
- Create Document
- Create DocumentItems
- Create audit log
- Trigger PDF generation job if configured
```

---

## 11.3 Confirm Quotation

```http
POST /api/documents/:documentId/confirm-quotation
```

### Permission

```txt
CUSTOMER owner/member, ADMIN
```

### Body

```json
{
  "confirmedByName": "คุณสมชาย",
  "note": "ยืนยันสั่งซื้อตามใบเสนอราคา"
}
```

### Response

```json
{
  "ok": true,
  "data": {
    "documentId": "uuid",
    "orderId": "uuid",
    "documentStatus": "APPROVED",
    "orderStatus": "CONFIRMED"
  }
}
```

### Side Effects

```txt
- Update QT status APPROVED
- Update CustomerOrder status CONFIRMED
- Create OrderStatusHistory
- Create audit log
- If credit issue, block and create approval/alert
```

---

## 11.4 Create Invoice From Order

```http
POST /api/orders/:orderId/documents/invoice
```

### Permission

```txt
OWNER, ADMIN, ACCOUNTANT
```

### Body

```json
{
  "docType": "INV",
  "dueDate": "2026-06-20",
  "notes": "กรุณาชำระเงินภายในกำหนด"
}
```

### Response

```json
{
  "ok": true,
  "data": {
    "documentId": "uuid",
    "docNo": "INV-20260521-001",
    "docType": "INV",
    "status": "APPROVED",
    "total": 28729.5,
    "dueDate": "2026-06-20"
  }
}
```

### Side Effects

```txt
- Create invoice document
- Snapshot order items
- Update order status INVOICED
- Start debt tracking
- Trigger PDF generation
- Create audit log
```

---

## 11.5 Create Receipt From Payment

```http
POST /api/payments/:paymentId/documents/receipt
```

### Permission

```txt
OWNER, ADMIN, ACCOUNTANT
```

### Response

```json
{
  "ok": true,
  "data": {
    "documentId": "uuid",
    "docNo": "RCT-20260521-001",
    "docType": "RCT",
    "status": "APPROVED"
  }
}
```

### Rules

```txt
- Payment must be CONFIRMED
- Receipt total must not exceed confirmed payment / invoice balance rules
- Receipt must be locked after issue
```

---

## 11.6 Get Document Detail

```http
GET /api/documents/:documentId
```

### Response

```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "docNo": "QT-20260521-001",
    "docType": "QT",
    "status": "APPROVED",
    "version": 1,
    "issueDate": "2026-05-21",
    "dueDate": null,
    "company": {},
    "counterparty": {},
    "items": [],
    "subtotal": 26850,
    "vat": 1879.5,
    "total": 28729.5,
    "pdfUrl": null,
    "parentDocId": null,
    "children": []
  }
}
```

---

## 11.7 Generate Document PDF

```http
POST /api/documents/:documentId/generate-pdf
```

### Permission

```txt
OWNER, ADMIN, ACCOUNTANT, OPERATION
```

### Response

```json
{
  "ok": true,
  "data": {
    "documentId": "uuid",
    "pdfUrl": "storage/path/document.pdf",
    "version": 1
  }
}
```

### Rules

```txt
- Do not overwrite existing PDF silently
- If document changed, create new version
- Use server-side PDF generation only
```

---

## 11.8 Approve Document

```http
POST /api/documents/:documentId/approve
```

### Permission

```txt
Depends on approval policy
```

### Body

```json
{
  "comment": "อนุมัติ"
}
```

### Side Effects

```txt
- Update document status
- Update workflow step
- Create audit log
- Create notification
```

---

## 11.9 Reject Document

```http
POST /api/documents/:documentId/reject
```

### Body

```json
{
  "reason": "ต้องแก้ราคา"
}
```

---

## 11.10 Archive Document

```http
POST /api/documents/:documentId/archive
```

### Permission

```txt
OWNER, ADMIN
```

### Body

```json
{
  "reason": "สร้างผิดรายการ"
}
```

### Rules

```txt
- Soft delete only
- Cannot archive paid receipt without owner override
- Create audit log
```

---

# 12. Procurement APIs

---

## 12.1 Split Order To Supplier POs

```http
POST /api/orders/:orderId/split
```

### Permission

```txt
OWNER, ADMIN, PROCUREMENT
```

### Body

```json
{
  "mode": "AUTO",
  "manualSupplierAssignments": [
    {
      "orderItemId": "uuid",
      "supplierCompanyId": "uuid"
    }
  ]
}
```

### Response

```json
{
  "ok": true,
  "data": {
    "orderId": "uuid",
    "supplierPOs": [
      {
        "id": "uuid",
        "poNo": "PO-20260521-001",
        "supplierCompanyId": "uuid",
        "supplierName": "บริษัท Supplier A",
        "total": 2250,
        "status": "DRAFT"
      }
    ]
  }
}
```

### Side Effects

```txt
- Validate order status CONFIRMED
- Group items by supplier
- Create SupplierPurchaseOrder
- Create SupplierPurchaseOrderItems
- Create PO Document
- Update order status PROCUREMENT
- Create audit log
- Create notification to supplier
```

---

## 12.2 List Supplier POs

```http
GET /api/procurement/purchase-orders
```

### Permission

```txt
ADMIN/PROCUREMENT sees all
SUPPLIER sees own POs
```

### Query

```txt
status=SENT
supplierCompanyId=uuid
orderId=uuid
page=1
pageSize=20
```

### Response

```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "poNo": "PO-20260521-001",
      "customerOrderNo": "ORD-20260521-001",
      "supplierName": "บริษัท Supplier A",
      "status": "SENT",
      "subtotal": 2250,
      "vat": 157.5,
      "total": 2407.5,
      "createdAt": "2026-05-21T00:00:00.000Z"
    }
  ]
}
```

---

## 12.3 Get Supplier PO Detail

```http
GET /api/procurement/purchase-orders/:supplierPoId
```

### Response

```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "poNo": "PO-20260521-001",
    "status": "SENT",
    "supplier": {},
    "items": [
      {
        "description": "ทรายหยาบ",
        "qty": 5,
        "unit": "คิว",
        "unitCost": 450,
        "amount": 2250
      }
    ],
    "subtotal": 2250,
    "vat": 157.5,
    "total": 2407.5
  }
}
```

---

## 12.4 Supplier Confirm PO

```http
POST /api/partner/purchase-orders/:supplierPoId/confirm
```

### Permission

```txt
SUPPLIER owns PO
```

### Body

```json
{
  "confirmedDeliveryDate": "2026-05-25",
  "note": "ยืนยันจัดส่งได้"
}
```

### Side Effects

```txt
- Update Supplier PO status CONFIRMED
- Create audit log
- Notify admin
```

---

## 12.5 Supplier Reject PO

```http
POST /api/partner/purchase-orders/:supplierPoId/reject
```

### Permission

```txt
SUPPLIER owns PO
```

### Body

```json
{
  "reason": "สินค้าไม่พอ"
}
```

### Side Effects

```txt
- Update Supplier PO status REJECTED/CANCELLED
- Create alert
- Admin must select new supplier
```

---

# 13. Logistics APIs

---

## 13.1 Create Transport Job From Order

```http
POST /api/orders/:orderId/transport-jobs
```

### Permission

```txt
OWNER, ADMIN, OPERATION
```

### Body

```json
{
  "supplierPoId": "uuid",
  "pickupAddress": "บ่อดิน ชลบุรี",
  "dropoffAddress": "ไซต์งานบางนา",
  "scheduledPickupAt": "2026-05-25T08:00:00.000Z",
  "scheduledDeliveryAt": "2026-05-25T11:00:00.000Z",
  "vehicleTypeId": "uuid"
}
```

### Response

```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "jobNo": "TRK-20260521-001",
    "status": "SEARCHING_TRUCK"
  }
}
```

---

## 13.2 List Transport Jobs

```http
GET /api/logistics/transport-jobs
```

### Permission

```txt
ADMIN sees all
FLEET sees own assigned jobs
CUSTOMER sees jobs for own orders
```

### Query

```txt
status=ASSIGNED
fleetPartnerId=uuid
orderId=uuid
date=2026-05-25
page=1
pageSize=20
```

### Response

```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "jobNo": "TRK-20260521-001",
      "orderNo": "ORD-20260521-001",
      "status": "ASSIGNED",
      "pickupAddress": "บ่อดิน ชลบุรี",
      "dropoffAddress": "ไซต์งานบางนา",
      "scheduledPickupAt": "2026-05-25T08:00:00.000Z",
      "vehiclePlateNo": "83-1234"
    }
  ]
}
```

---

## 13.3 Assign Vehicle To Transport Job

```http
POST /api/logistics/transport-jobs/:jobId/assign
```

### Permission

```txt
OWNER, ADMIN, OPERATION
```

### Body

```json
{
  "fleetPartnerId": "uuid",
  "vehicleId": "uuid"
}
```

### Side Effects

```txt
- Validate vehicle availability
- Update job status ASSIGNED
- Notify fleet partner
- Create audit log
```

---

## 13.4 Fleet Accept Job

```http
POST /api/fleet/jobs/:jobId/accept
```

### Permission

```txt
FLEET_OWNER owns assigned job
```

### Body

```json
{
  "note": "รับงาน"
}
```

### Side Effects

```txt
- Update job status ACCEPTED
- Set vehicle BUSY
- Notify admin
```

---

## 13.5 Fleet Reject Job

```http
POST /api/fleet/jobs/:jobId/reject
```

### Body

```json
{
  "reason": "รถไม่ว่าง"
}
```

### Side Effects

```txt
- Update job status SEARCHING_TRUCK or CANCELLED depending policy
- Clear assigned vehicle
- Create alert TRUCK_NOT_ASSIGNED
```

---

## 13.6 Update Transport Job Status

```http
PATCH /api/fleet/jobs/:jobId/status
```

### Permission

```txt
FLEET_OWNER / DRIVER assigned to job, ADMIN
```

### Body

```json
{
  "toStatus": "GOING_TO_PICKUP",
  "note": "ออกเดินทางไปรับของ"
}
```

### Valid Flow

```txt
ASSIGNED
→ ACCEPTED
→ GOING_TO_PICKUP
→ ARRIVED_PICKUP
→ LOADED
→ IN_TRANSIT
→ ARRIVED_SITE
→ DELIVERED
→ PROOF_UPLOADED
→ COMPLETED
```

### Side Effects

```txt
- Create audit log
- Create status history if implemented
- Notify related parties
```

---

# 14. Delivery Proof APIs

---

## 14.1 Upload Delivery Proof

```http
POST /api/logistics/transport-jobs/:jobId/proofs
```

### Permission

```txt
FLEET_OWNER / DRIVER assigned to job, ADMIN
```

### Content Type

```txt
multipart/form-data
```

### Fields

```txt
proofType=PHOTO_AT_SITE
file=<binary>
note=ส่งของเรียบร้อย
gpsLat=13.667
gpsLng=100.605
```

### Response

```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "proofType": "PHOTO_AT_SITE",
    "fileUrl": "storage/path/file.jpg",
    "uploadedAt": "2026-05-25T10:30:00.000Z"
  }
}
```

---

## 14.2 List Delivery Proofs

```http
GET /api/logistics/transport-jobs/:jobId/proofs
```

### Response

```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "proofType": "PHOTO_AT_SITE",
      "fileUrl": "signed-url",
      "note": "ส่งของเรียบร้อย",
      "uploadedBy": "uuid",
      "uploadedAt": "2026-05-25T10:30:00.000Z"
    }
  ]
}
```

---

## 14.3 Validate Proof Completeness

```http
GET /api/logistics/transport-jobs/:jobId/proofs/validate
```

### Response

```json
{
  "ok": true,
  "data": {
    "complete": false,
    "required": [
      "PHOTO_AT_SITE",
      "DELIVERY_NOTE",
      "GPS_LOCATION"
    ],
    "uploaded": [
      "PHOTO_AT_SITE"
    ],
    "missing": [
      "DELIVERY_NOTE",
      "GPS_LOCATION"
    ]
  }
}
```

---

# 15. Dispute APIs

---

## 15.1 Create Dispute

```http
POST /api/disputes
```

### Permission

```txt
ADMIN, CUSTOMER owner, SUPPLIER related, FLEET related
```

### Body

```json
{
  "orderId": "uuid",
  "transportJobId": "uuid",
  "supplierPoId": "uuid",
  "type": "LATE_DELIVERY",
  "description": "รถส่งช้ากว่ากำหนด 2 ชั่วโมง"
}
```

### Response

```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "disputeNo": "DSP-20260521-001",
    "status": "OPEN"
  }
}
```

---

## 15.2 List Disputes

```http
GET /api/disputes
```

### Query

```txt
status=OPEN
type=LATE_DELIVERY
orderId=uuid
page=1
pageSize=20
```

---

## 15.3 Resolve Dispute

```http
POST /api/disputes/:disputeId/resolve
```

### Permission

```txt
OWNER, ADMIN, OPERATION
```

### Body

```json
{
  "resolution": "ให้ส่วนลดค่าขนส่ง 500 บาท",
  "financialImpact": 500
}
```

### Side Effects

```txt
- Update dispute RESOLVED
- Create audit log
- Create adjustment if implemented
```

---

# 16. Payment APIs

---

## 16.1 List Payments

```http
GET /api/payments
```

### Permission

```txt
ADMIN/ACCOUNTANT sees all
CUSTOMER sees own payments
SUPPLIER/FLEET sees own payouts if relevant
```

### Query

```txt
direction=IN
status=PENDING
documentId=uuid
dateFrom=2026-05-01
dateTo=2026-05-31
page=1
pageSize=20
```

---

## 16.2 Record Incoming Payment

```http
POST /api/payments
```

### Permission

```txt
OWNER, ADMIN, ACCOUNTANT, CUSTOMER upload slip
```

### Body

```json
{
  "direction": "IN",
  "documentId": "uuid",
  "orderId": "uuid",
  "amount": 28729.5,
  "method": "โอนเงิน",
  "paidAt": "2026-05-25T12:00:00.000Z",
  "reference": "SLIP-001",
  "note": "ลูกค้าแจ้งโอน"
}
```

### Response

```json
{
  "ok": true,
  "data": {
    "paymentId": "uuid",
    "paymentNo": "PAY-20260525-001",
    "status": "PENDING"
  }
}
```

---

## 16.3 Confirm Payment

```http
POST /api/payments/:paymentId/confirm
```

### Permission

```txt
OWNER, ADMIN, ACCOUNTANT
```

### Body

```json
{
  "note": "ตรวจสอบยอดเข้าแล้ว"
}
```

### Side Effects

```txt
- Payment status CONFIRMED
- Update invoice paid/balance
- If fully paid, mark invoice PAID
- Create receipt if requested
- Create audit log
```

---

## 16.4 Reject Payment

```http
POST /api/payments/:paymentId/reject
```

### Body

```json
{
  "reason": "ยอดเงินไม่ตรง"
}
```

---

## 16.5 Upload Payment Slip

```http
POST /api/payments/:paymentId/slip
```

### Content Type

```txt
multipart/form-data
```

### Fields

```txt
file=<binary>
note=สลิปโอนเงิน
```

---

# 17. Bank Transaction & Reconciliation APIs

---

## 17.1 Parse Bank Transaction Text

```http
POST /api/reconciliation/bank-transactions/parse
```

### Permission

```txt
OWNER, ADMIN, ACCOUNTANT
```

### Body

```json
{
  "rawText": "รับโอน 28,729.50 บาท จาก บริษัทลูกค้า A 25/05/2026"
}
```

### Response

```json
{
  "ok": true,
  "data": {
    "bank": "Generic",
    "amount": 28729.5,
    "sender": "บริษัทลูกค้า A",
    "txDate": "2026-05-25",
    "hash": "ABC123",
    "parsed": true
  }
}
```

---

## 17.2 Create Bank Transaction

```http
POST /api/reconciliation/bank-transactions
```

### Body

```json
{
  "bank": "KBank",
  "amount": 28729.5,
  "sender": "บริษัทลูกค้า A",
  "txDate": "2026-05-25",
  "rawText": "รับโอน 28,729.50 บาท",
  "hash": "ABC123"
}
```

### Rules

```txt
- hash must be unique
- duplicate hash returns 409
```

---

## 17.3 Match Bank Transactions

```http
POST /api/reconciliation/match
```

### Permission

```txt
OWNER, ADMIN, ACCOUNTANT
```

### Body

```json
{
  "bankTransactionIds": ["uuid"],
  "documentIds": ["uuid"]
}
```

### Response

```json
{
  "ok": true,
  "data": [
    {
      "bankTransactionId": "uuid",
      "bestMatchDocumentId": "uuid",
      "score": 90,
      "confidence": "HIGH",
      "amount": 28729.5,
      "documentTotal": 28729.5
    }
  ]
}
```

---

## 17.4 Confirm Reconciliation Match

```http
POST /api/reconciliation/matches/:matchId/confirm
```

### Permission

```txt
OWNER, ADMIN, ACCOUNTANT
```

### Body

```json
{
  "createPayment": true,
  "note": "ยืนยัน match ถูกต้อง"
}
```

### Side Effects

```txt
- Mark match CONFIRMED
- Create or link Payment
- Confirm Payment if policy allows
- Update invoice balance
- Create audit log
```

---

# 18. Debt & Collection APIs

---

## 18.1 List Debts

```http
GET /api/debt
```

### Permission

```txt
OWNER, ADMIN, ACCOUNTANT
```

### Query

```txt
state=OVERDUE
customerCompanyId=uuid
minOverdueDays=1
page=1
pageSize=20
```

### Response

```json
{
  "ok": true,
  "data": [
    {
      "documentId": "uuid",
      "docNo": "INV-20260521-001",
      "customerName": "บริษัทลูกค้า A",
      "dueDate": "2026-06-20",
      "overdueDays": 5,
      "total": 28729.5,
      "paid": 10000,
      "balance": 18729.5,
      "collectionState": "OVERDUE"
    }
  ]
}
```

---

## 18.2 Get Debt Detail

```http
GET /api/debt/:documentId
```

### Response

```json
{
  "ok": true,
  "data": {
    "document": {},
    "customer": {},
    "payments": [],
    "balance": 18729.5,
    "collectionState": "OVERDUE",
    "snapshots": [],
    "notes": []
  }
}
```

---

## 18.3 Add Collection Note

```http
POST /api/debt/:documentId/notes
```

### Body

```json
{
  "state": "PROMISED",
  "note": "ลูกค้ารับปากชำระวันที่ 30/06/2026",
  "promisedPayDate": "2026-06-30"
}
```

### Side Effects

```txt
- Create collection note
- Update collection state if needed
- Create audit log
```

---

## 18.4 Update Collection State

```http
PATCH /api/debt/:documentId/state
```

### Permission

```txt
OWNER, ADMIN, ACCOUNTANT
```

### Body

```json
{
  "state": "COLLECTION",
  "note": "เริ่มติดตามหนี้"
}
```

---

# 19. Settlement / Payout APIs

---

## 19.1 Create Settlement Batch

```http
POST /api/settlements
```

### Permission

```txt
OWNER, ADMIN, ACCOUNTANT
```

### Body

```json
{
  "partnerCompanyId": "uuid",
  "partnerType": "SUPPLIER",
  "periodStart": "2026-05-01",
  "periodEnd": "2026-05-31",
  "sourceItems": [
    {
      "sourceType": "SUPPLIER_PO",
      "sourceId": "uuid",
      "amount": 2407.5,
      "adjustment": 0,
      "note": ""
    }
  ]
}
```

### Response

```json
{
  "ok": true,
  "data": {
    "settlementId": "uuid",
    "settlementNo": "STM-20260531-001",
    "grossAmount": 2407.5,
    "deductions": 0,
    "netAmount": 2407.5,
    "status": "DRAFT"
  }
}
```

---

## 19.2 List Settlements

```http
GET /api/settlements
```

### Query

```txt
partnerType=SUPPLIER
status=DRAFT
partnerCompanyId=uuid
page=1
pageSize=20
```

---

## 19.3 Approve Settlement

```http
POST /api/settlements/:settlementId/approve
```

### Permission

```txt
OWNER, ADMIN, ACCOUNTANT ตาม policy
```

### Body

```json
{
  "comment": "อนุมัติจ่าย"
}
```

---

## 19.4 Create PV From Settlement

```http
POST /api/settlements/:settlementId/documents/payment-voucher
```

### Permission

```txt
OWNER, ADMIN, ACCOUNTANT
```

### Response

```json
{
  "ok": true,
  "data": {
    "documentId": "uuid",
    "docNo": "PV-20260531-001"
  }
}
```

---

## 19.5 Create PMT From Settlement

```http
POST /api/settlements/:settlementId/documents/payment-order
```

### Response

```json
{
  "ok": true,
  "data": {
    "documentId": "uuid",
    "docNo": "PMT-20260531-001"
  }
}
```

---

## 19.6 Mark Settlement Paid

```http
POST /api/settlements/:settlementId/mark-paid
```

### Body

```json
{
  "paymentId": "uuid",
  "paidAt": "2026-05-31T15:00:00.000Z",
  "note": "โอนเรียบร้อย"
}
```

---

# 20. Alert APIs

---

## 20.1 List Alerts

```http
GET /api/alerts
```

### Permission

```txt
Authenticated, filtered by role/company
```

### Query

```txt
status=OPEN
severity=CRITICAL
type=LOW_MARGIN
assignedRole=ACCOUNTANT
page=1
pageSize=20
```

### Response

```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "type": "LOW_MARGIN",
      "severity": "WARNING",
      "title": "Order margin ต่ำกว่ากำหนด",
      "message": "Order ORD-001 margin 5%",
      "entityType": "CustomerOrder",
      "entityId": "uuid",
      "status": "OPEN",
      "createdAt": "2026-05-21T00:00:00.000Z"
    }
  ]
}
```

---

## 20.2 Resolve Alert

```http
POST /api/alerts/:alertId/resolve
```

### Body

```json
{
  "note": "ตรวจสอบแล้ว"
}
```

---

# 21. Dashboard APIs

---

## 21.1 Admin Dashboard Metrics

```http
GET /api/dashboard/admin
```

### Permission

```txt
OWNER, ADMIN
```

### Response

```json
{
  "ok": true,
  "data": {
    "salesToday": 50000,
    "salesThisMonth": 500000,
    "newOrders": 5,
    "pendingOrders": 8,
    "grossMargin": 120000,
    "unpaidInvoices": 10,
    "overdueInvoices": 3,
    "supplierPayable": 80000,
    "fleetPayable": 20000,
    "activeTransportJobs": 6,
    "openAlerts": 12
  }
}
```

---

## 21.2 Operation Dashboard

```http
GET /api/dashboard/operation
```

### Response

```json
{
  "ok": true,
  "data": {
    "ordersByStatus": {
      "SUBMITTED": 3,
      "PRICING": 2,
      "PROCUREMENT": 5,
      "DISPATCHING": 4
    },
    "supplierPoPending": 5,
    "truckNotAssigned": 2,
    "transportDelayed": 1,
    "deliveryProofMissing": 3
  }
}
```

---

## 21.3 Finance Dashboard

```http
GET /api/dashboard/finance
```

### Permission

```txt
OWNER, ADMIN, ACCOUNTANT
```

### Response

```json
{
  "ok": true,
  "data": {
    "invoiceIssued": 20,
    "invoiceUnpaid": 10,
    "invoicePaid": 8,
    "invoiceOverdue": 3,
    "partialPayments": 2,
    "paymentUnreconciled": 4,
    "supplierPayable": 80000,
    "fleetPayable": 20000
  }
}
```

---

## 21.4 Partner Dashboard

```http
GET /api/dashboard/partner
```

### Permission

```txt
SUPPLIER
```

### Response

```json
{
  "ok": true,
  "data": {
    "newPOs": 2,
    "pendingConfirmation": 1,
    "confirmedPOs": 5,
    "fulfilledPOs": 10,
    "pendingPayout": 35000
  }
}
```

---

## 21.5 Fleet Dashboard

```http
GET /api/dashboard/fleet
```

### Permission

```txt
FLEET_OWNER, DRIVER
```

### Response

```json
{
  "ok": true,
  "data": {
    "jobsToday": 3,
    "pendingJobs": 1,
    "activeJobs": 1,
    "completedJobs": 10,
    "pendingEarnings": 12000,
    "availableVehicles": 4
  }
}
```

---

# 22. File APIs

---

## 22.1 Upload File

```http
POST /api/files/upload
```

### Permission

```txt
Authenticated
```

### Content Type

```txt
multipart/form-data
```

### Fields

```txt
bucket=document-pdfs
entityType=Document
entityId=uuid
file=<binary>
visibility=private
```

### Response

```json
{
  "ok": true,
  "data": {
    "fileId": "uuid",
    "bucket": "document-pdfs",
    "path": "document-pdfs/company/document.pdf",
    "url": "signed-or-private-path"
  }
}
```

---

## 22.2 Get Signed File URL

```http
GET /api/files/:fileId/signed-url
```

### Permission

```txt
User must have access to entity
```

### Response

```json
{
  "ok": true,
  "data": {
    "url": "https://signed-url",
    "expiresIn": 3600
  }
}
```

---

# 23. Notification APIs

---

## 23.1 List Notifications

```http
GET /api/notifications
```

### Permission

```txt
Authenticated user
```

### Query

```txt
status=queued|sent|failed|read
type=order.created
page=1
pageSize=20
```

---

## 23.2 Mark Notification Read

```http
POST /api/notifications/:notificationId/read
```

---

## 23.3 Send Manual Notification

```http
POST /api/admin/notifications/send
```

### Permission

```txt
OWNER, ADMIN
```

### Body

```json
{
  "channel": "LINE",
  "userId": "uuid",
  "type": "custom",
  "title": "แจ้งเตือน",
  "message": "ข้อความทดสอบ"
}
```

---

# 24. Webhook APIs

---

## 24.1 LINE Webhook

```http
POST /api/webhooks/line
```

### Source

```txt
LINE Platform
```

### Purpose

```txt
รับ event จาก LINE ถ้าใช้ LINE Messaging API
```

### Security

```txt
Verify LINE signature
```

---

## 24.2 Bank Email / SMS Webhook

```http
POST /api/webhooks/bank
```

### Purpose

```txt
รับข้อความธนาคารจาก email parser หรือ integration
```

### Body

```json
{
  "source": "email",
  "bank": "KBank",
  "rawText": "รับโอน 28,729.50 บาท จาก บริษัทลูกค้า A",
  "receivedAt": "2026-05-25T12:00:00.000Z"
}
```

### Side Effects

```txt
- Parse bank transaction
- Check duplicate by hash
- Create BankTransaction
- Trigger reconciliation job
```

---

## 24.3 Inngest Webhook

```http
POST /api/webhooks/inngest
```

### Purpose

```txt
Background jobs:
- PDF generation
- Overdue checking
- Debt snapshot
- Reconciliation
- Notifications
```

---

# 25. System Health APIs

---

## 25.1 List System Health Events

```http
GET /api/admin/system-health
```

### Permission

```txt
OWNER, ADMIN
```

### Query

```txt
resolved=false
type=PDF_GENERATION_FAILED
page=1
pageSize=20
```

---

## 25.2 Resolve System Health Event

```http
POST /api/admin/system-health/:eventId/resolve
```

### Body

```json
{
  "note": "แก้ไขแล้ว"
}
```

---

# 26. Approval APIs

---

## 26.1 List Approval Requests

```http
GET /api/approvals
```

### Permission

```txt
User with approval role
```

### Query

```txt
status=PENDING
entityType=Document
page=1
pageSize=20
```

---

## 26.2 Approve Request

```http
POST /api/approvals/:approvalId/approve
```

### Body

```json
{
  "comment": "อนุมัติ"
}
```

---

## 26.3 Reject Request

```http
POST /api/approvals/:approvalId/reject
```

### Body

```json
{
  "reason": "margin ต่ำเกินไป"
}
```

---

# 27. API Workflow Examples

---

## 27.1 Main Customer Order To Quotation Flow

```txt
1. POST /api/orders
2. POST /api/orders/:orderId/price
3. POST /api/orders/:orderId/boq
4. POST /api/orders/:orderId/documents/quotation
5. GET  /api/documents/:documentId
6. POST /api/documents/:documentId/generate-pdf
7. POST /api/documents/:documentId/confirm-quotation
```

---

## 27.2 Quotation To Supplier PO Flow

```txt
1. POST /api/documents/:documentId/confirm-quotation
2. POST /api/orders/:orderId/split
3. GET  /api/procurement/purchase-orders
4. POST /api/partner/purchase-orders/:supplierPoId/confirm
```

---

## 27.3 Supplier PO To Transport Flow

```txt
1. POST /api/orders/:orderId/transport-jobs
2. POST /api/logistics/transport-jobs/:jobId/assign
3. POST /api/fleet/jobs/:jobId/accept
4. PATCH /api/fleet/jobs/:jobId/status
5. POST /api/logistics/transport-jobs/:jobId/proofs
6. GET  /api/logistics/transport-jobs/:jobId/proofs/validate
7. PATCH /api/fleet/jobs/:jobId/status
```

---

## 27.4 Invoice To Receipt Flow

```txt
1. POST /api/orders/:orderId/documents/invoice
2. GET  /api/documents/:documentId
3. POST /api/payments
4. POST /api/payments/:paymentId/confirm
5. POST /api/payments/:paymentId/documents/receipt
6. POST /api/documents/:receiptId/generate-pdf
```

---

## 27.5 Bank Reconciliation Flow

```txt
1. POST /api/reconciliation/bank-transactions/parse
2. POST /api/reconciliation/bank-transactions
3. POST /api/reconciliation/match
4. POST /api/reconciliation/matches/:matchId/confirm
5. POST /api/payments/:paymentId/documents/receipt
```

---

## 27.6 Settlement Flow

```txt
1. POST /api/settlements
2. POST /api/settlements/:settlementId/approve
3. POST /api/settlements/:settlementId/documents/payment-voucher
4. POST /api/settlements/:settlementId/documents/payment-order
5. POST /api/payments
6. POST /api/settlements/:settlementId/mark-paid
```

---

# 28. Validation Rules Summary

---

## 28.1 Order Validation

```txt
- customerCompanyId required
- customerSiteId required
- at least 1 item required
- qty > 0
- productVariantId required
- requestedDeliveryDate should not be invalid
```

---

## 28.2 Pricing Validation

```txt
- supplier must be available
- supplier product must cover area
- qty >= supplier minQty unless override
- customerUnitPrice >= 0
- margin cannot be below policy unless approval
```

---

## 28.3 Document Validation

```txt
- docNo server-side only
- docType required
- document total from server calculation
- approved/paid document locked
- receipt requires confirmed payment
```

---

## 28.4 Payment Validation

```txt
- amount > 0
- payment cannot exceed invoice balance unless overpayment policy
- confirmed payment cannot be deleted
- duplicate bank transaction hash not allowed
```

---

## 28.5 Transport Validation

```txt
- vehicle must be available
- vehicle must be accepting queue
- status transition must be valid
- required proof must be uploaded before complete
```

---

# 29. Security Requirements

```txt
1. All protected APIs require authentication.
2. companyId must come from session.
3. RLS should be enforced at database level.
4. Customer cannot access supplier cost.
5. Supplier cannot access other supplier POs.
6. Fleet cannot access unrelated jobs.
7. Service role key must never be exposed to client.
8. Signed URL required for private files.
9. Financial mutations require audit logs.
10. Document number generation must be server-side.
```

---

# 30. Recommended API Implementation Pattern

For each mutation:

```txt
1. Parse request
2. Validate Zod schema
3. Get current user/session
4. Resolve active company
5. Check permission
6. Load target resource
7. Check tenant access
8. Run domain service
9. Domain service calls engine if needed
10. Write database transaction
11. Create audit log
12. Trigger event/notification if needed
13. Return response
```

Example structure:

```txt
src/app/api/orders/route.ts
src/server/services/orderService.ts
src/core/engines/pricingEngine.ts
src/core/schemas/order.schema.ts
src/core/permissions/policies.ts
```

---

# 31. API Implementation Checklist

For every API endpoint:

```txt
[ ] Has Zod request schema
[ ] Has typed response
[ ] Checks authentication
[ ] Checks authorization
[ ] Checks tenant access
[ ] Uses service layer
[ ] Uses engine layer for business logic
[ ] Creates audit log for mutation
[ ] Handles errors consistently
[ ] Does not expose internal cost to customer
[ ] Has tests or at least test plan
```

---

# 32. First API Endpoints To Build

สร้าง endpoints ชุดแรกนี้ก่อน:

```txt
1. GET  /api/me
2. GET  /api/admin/companies
3. POST /api/admin/companies
4. GET  /api/admin/customers
5. POST /api/admin/customers
6. GET  /api/admin/customers/:id/sites
7. POST /api/admin/customers/:id/sites
8. GET  /api/catalog/products
9. POST /api/admin/catalog/products
10. POST /api/admin/catalog/products/:id/variants
11. GET  /api/admin/suppliers
12. POST /api/admin/suppliers
13. POST /api/admin/suppliers/:id/products
14. POST /api/orders
15. GET  /api/orders/:id
16. POST /api/orders/:id/price
17. POST /api/orders/:id/boq
18. POST /api/orders/:id/documents/quotation
```

ยังไม่ต้องสร้าง API ขั้นสูงก่อน เช่น:

```txt
- auto reconciliation
- LINE webhook
- settlement
- fleet auto matching
- advanced dashboard
```

---

# 33. Notes For AI Coding Agent

```txt
อ่าน API_DESCRIPTION.md ก่อนสร้าง endpoint
สร้าง endpoint ตามลำดับ
อย่าสร้าง endpoint ขั้นสูงก่อน foundation
ทุก endpoint ต้องมี permission
ทุก mutation ต้อง audit
ทุก financial calculation ต้องอยู่ใน engine
ทุก request body ต้อง validate ด้วย Zod
ทุก response ควรใช้ common response format
```

---

# END OF API DESCRIPTION

---

# UPDATE — New APIs For LINE-First Workflow, Partner Products, Inventory, Project Documents

## Partner Product Submission APIs

```http
POST /api/partner/products/submit
GET  /api/partner/products
GET  /api/partner/products/:id
PATCH /api/partner/products/:id
PATCH /api/partner/products/:id/stock
POST /api/admin/partner-products/:id/approve
POST /api/admin/partner-products/:id/reject
GET  /api/admin/partner-products/pending
```

## Inventory APIs

```http
GET  /api/admin/inventory
GET  /api/partner/inventory
POST /api/partner/inventory/:supplierProductId/adjust
GET  /api/supplier-products/:id/movements
```

## Project / Document Group APIs

```http
POST /api/projects
GET  /api/projects
GET  /api/projects/:projectNo
GET  /api/projects/:projectNo/documents
GET  /api/document-groups/:groupNo
GET  /api/documents/search?q=
GET  /api/documents/:documentId/references
```

## LINE Action APIs

```http
POST /api/line/actions/product-submit
POST /api/line/actions/stock-update
POST /api/line/actions/po-confirm
POST /api/line/actions/po-reject
POST /api/line/actions/job-accept
POST /api/line/actions/job-status
POST /api/line/actions/proof-upload
POST /api/webhooks/line
```

## Admin Dashboard APIs

```http
GET /api/dashboard/admin/realtime-summary
GET /api/dashboard/admin/debt-summary
GET /api/debt
GET /api/debt/:documentId
GET /api/debt/:documentId/timeline
GET /api/debt/:documentId/related-documents
```

## API Rules Added

```txt
- Partner product submission must create PENDING_REVIEW status.
- Admin approval is required before a partner product becomes sellable.
- Stock update must create supplier_inventory_movements.
- LINE actions must use line_action_tokens.
- Document search must support projectNo, groupNo, orderNo, documentNo, invoiceNo, receiptNo.
- Debt dashboard must support drilldown by invoice/documentId.
```
