# PROJECT_RULES.md

# DNA OS Construction Platform — Project Rules

เอกสารนี้คือกฎบังคับของโปรเจกต์ **DNA OS Construction Platform**

AI Coding Agent, Developer, Cursor, Codex หรือผู้ร่วมพัฒนาทุกคนต้องอ่านไฟล์นี้ก่อนเริ่มเขียนโค้ด

ไฟล์นี้ควรวางไว้ที่ root ของโปรเจกต์:

```txt
/PROJECT_RULES.md
```

ใช้ร่วมกับ:

```txt
/AGENT.md
/PROJECT_PROGRESS.md
/TECH_STACK.md
/API_DESCRIPTION.md
/AI_STEP_PROMPTS.md
```

---

# 1. Core Rule Summary

กฎสำคัญที่สุดของระบบนี้:

```txt
ทุก user role ต้องเข้าสู่ระบบผ่านการเชื่อมบัญชีกับ LINE เท่านั้น
ห้ามมีระบบสมัครสมาชิกเอง
ห้ามมีหน้า login ทั่วไป
ห้าม login ด้วย email/password สำหรับ user ทั่วไป
ห้าม login ด้วย Google, Facebook, Apple หรือ provider อื่น
ยกเว้น Superadmin เพียง 1 บัญชีเท่านั้นที่มีหน้า login เฉพาะ
```

---

# 2. Authentication Policy

## 2.1 Allowed Login Method

ระบบอนุญาตให้ user ทั่วไปเข้าสู่ระบบได้เพียงวิธีเดียว:

```txt
LINE Account Connection / LINE Login
```

ผู้ใช้ทุก role ต่อไปนี้ต้องใช้ LINE เท่านั้น:

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

## 2.2 Disallowed Login Methods

ห้ามสร้างหรือเปิดใช้ login methods เหล่านี้สำหรับ user ทั่วไป:

```txt
Email/password login
Username/password login
Magic link login
OTP email login
Google login
Facebook login
Apple login
GitHub login
Phone/password login
Public registration form
Self-signup page
```

---

## 2.3 Superadmin Exception

มีข้อยกเว้นเพียงกรณีเดียว:

```txt
Superadmin 1 บัญชีเท่านั้นที่สามารถมีหน้า login เฉพาะได้
```

Superadmin ใช้สำหรับ:

```txt
- ตั้งค่าระบบเริ่มต้น
- กู้ระบบกรณี LINE integration มีปัญหา
- จัดการ tenant หลัก
- ตรวจสอบระบบระดับ platform
- ใช้เป็น break-glass account
```

Superadmin ไม่ใช่ user ปกติของธุรกิจ

---

# 3. User Registration Rule

## 3.1 No Self Registration

ห้ามมีหน้า:

```txt
/register
/signup
/create-account
/auth/register
/auth/signup
```

ห้ามมีปุ่ม:

```txt
สมัครสมาชิก
สร้างบัญชีใหม่
Register
Sign up
Create account
```

สำหรับผู้ใช้ทั่วไป

---

## 3.2 User Creation Flow

ผู้ใช้ใหม่ต้องถูกสร้างผ่านระบบ invitation / linking flow เท่านั้น

Flow ที่ถูกต้อง:

```txt
1. Admin / Owner สร้าง Company
2. Admin / Owner สร้างหรือเชิญ User
3. ระบบสร้าง invitation หรือ LINE linking token
4. User กดลิงก์เชื่อมบัญชี LINE
5. ระบบตรวจ LINE profile / LINE userId
6. ระบบผูก LINE account กับ User record
7. User เข้าระบบผ่าน LINE เท่านั้น
```

---

## 3.3 No Public Account Creation

ห้ามให้คนทั่วไปสร้างบัญชีเองโดยไม่ผ่านการอนุมัติจากระบบ

Customer / Supplier / Fleet partner ใหม่ต้องผ่าน flow เหล่านี้:

```txt
Admin creates account
Admin invites user
User connects LINE account
Admin approves company or role
User can access portal
```

---

# 4. Required Auth Architecture

ระบบต้องแยก Auth เป็น 2 ส่วน:

```txt
1. LINE Identity
2. Internal User / Company / Role
```

---

## 4.1 LINE Identity

เก็บข้อมูลจาก LINE ไว้ในตารางหรือ field ที่ชัดเจน:

```txt
lineUserId
lineDisplayName
linePictureUrl
lineStatusMessage
lineLinkedAt
lineLastLoginAt
```

ตัวอย่าง model ที่ควรมี:

```txt
User
- id
- name
- email optional
- phone optional
- lineUserId unique
- lineDisplayName
- linePictureUrl
- lineLinkedAt
- lineLastLoginAt
- status
```

หรือแยกเป็น:

```txt
UserIdentity
- id
- userId
- provider = LINE
- providerUserId
- displayName
- pictureUrl
- linkedAt
- lastLoginAt
```

แนะนำให้ใช้แบบ `UserIdentity` ถ้าต้องการขยายในอนาคต แต่กฎปัจจุบันยังคงอนุญาตเฉพาะ LINE เท่านั้น

---

## 4.2 Internal Authorization

หลังจาก LINE login สำเร็จ ระบบต้อง map ไปยังข้อมูลภายใน:

```txt
User
CompanyMember
Company
Role
Permission
```

LINE ใช้ยืนยันตัวตนเท่านั้น  
สิทธิ์การใช้งานต้องมาจากระบบภายในเท่านั้น

ห้ามใช้ LINE profile เป็นตัวตัดสิน role โดยตรง

---

# 5. Route Rules

## 5.1 Public Routes Allowed

อนุญาตเฉพาะ public routes เหล่านี้:

```txt
/
 /line/connect
 /line/callback
 /line/error
 /superadmin/login
 /superadmin/callback
```

หมายเหตุ:

```txt
/superadmin/login ใช้ได้เฉพาะ superadmin 1 บัญชีเท่านั้น
```

---

## 5.2 Forbidden Routes

ห้ามสร้าง routes เหล่านี้:

```txt
/login
/register
/signup
/signin
/auth/login
/auth/register
/auth/signup
/auth/signin
/customer/login
/partner/login
/fleet/login
/admin/login
```

ถ้าจำเป็นต้องมี route สำหรับ redirect ให้ใช้:

```txt
/line/connect
```

ไม่ใช่ `/login`

---

## 5.3 Portal Entry Routes

ทุก portal ต้อง redirect ไป LINE connect หากยังไม่ authenticated:

```txt
/admin/*
/customer/*
/partner/*
/fleet/*
```

Flow:

```txt
User opens /customer/orders
If not authenticated:
  redirect to /line/connect?next=/customer/orders
After LINE success:
  redirect back to next
```

---

# 6. Superadmin Rules

## 6.1 Superadmin Account Limit

ระบบต้องมี superadmin ได้สูงสุด:

```txt
1 account only
```

ห้ามสร้าง superadmin หลายบัญชี

---

## 6.2 Superadmin Route

Superadmin login route ต้องแยกจาก user ปกติ:

```txt
/superadmin/login
```

ห้ามใช้:

```txt
/login
/admin/login
```

---

## 6.3 Superadmin Credential Storage

Superadmin credential ต้องเก็บอย่างปลอดภัย:

```txt
- hash password
- never store plain password
- use strong password policy
- optionally require 2FA later
```

---

## 6.4 Superadmin Scope

Superadmin ใช้สำหรับจัดการระบบระดับ platform เท่านั้น

ไม่ควรใช้ superadmin ทำงานประจำวัน เช่น:

```txt
สร้าง order
ออกใบเสนอราคา
สร้าง PO
บันทึก payment
อนุมัติเอกสารประจำวัน
```

งานประจำวันต้องใช้ user role ปกติที่ login ผ่าน LINE

---

## 6.5 Superadmin Audit

ทุก action ของ superadmin ต้องบันทึก audit log

```txt
actorType = SUPERADMIN
actorId = superadmin id
entityType
entityId
action
oldValue
newValue
ipAddress
userAgent
createdAt
```

---

# 7. Database Rules For Authentication

## 7.1 Required Fields

User table หรือ identity table ต้องรองรับ LINE

ตัวเลือกที่ 1: เก็บใน User โดยตรง

```txt
users
- id
- name
- email nullable
- phone nullable
- line_user_id unique nullable
- line_display_name nullable
- line_picture_url nullable
- line_linked_at nullable
- line_last_login_at nullable
- status
- created_at
- updated_at
```

ตัวเลือกที่ 2: แยก UserIdentity

```txt
user_identities
- id
- user_id
- provider
- provider_user_id
- display_name
- picture_url
- linked_at
- last_login_at
- created_at
- updated_at
```

ค่า provider ที่อนุญาต:

```txt
LINE
```

ห้ามมี provider อื่นใน MVP

---

## 7.2 Unique Constraint

ต้องมี unique constraint:

```txt
line_user_id unique
```

หรือ:

```txt
unique(provider, provider_user_id)
```

เพื่อป้องกัน LINE account เดียวผูกหลาย user

---

## 7.3 User Status

User status ควรมี:

```txt
INVITED
LINE_LINKED
ACTIVE
SUSPENDED
INACTIVE
```

Flow:

```txt
INVITED
→ LINE_LINKED
→ ACTIVE
```

---

## 7.4 Company Member Status

CompanyMember status ควรมี:

```txt
PENDING
ACTIVE
SUSPENDED
REMOVED
```

---

# 8. LINE Linking Flow

## 8.1 Invite Existing User To Connect LINE

```txt
1. Admin creates user record
2. System creates lineLinkToken
3. User receives invite link
4. User opens /line/connect?token=xxx
5. User authenticates with LINE
6. LINE returns lineUserId
7. System validates token
8. System checks if lineUserId is already linked
9. System links lineUserId to user
10. User status becomes LINE_LINKED or ACTIVE
11. System creates audit log
12. User enters correct portal based on role
```

---

## 8.2 Returning User Login Flow

```txt
1. User opens portal route
2. System checks session
3. If no session, redirect to /line/connect
4. User authenticates with LINE
5. System receives lineUserId
6. System finds UserIdentity / User by lineUserId
7. System checks user status
8. System checks company member role
9. System creates app session
10. System redirects user to requested page
```

---

## 8.3 Unknown LINE User Flow

ถ้า LINE user ยังไม่ถูกเชื่อมกับ user ในระบบ:

```txt
1. LINE login success
2. System cannot find linked user
3. System shows access denied page
4. Message: กรุณาติดต่อผู้ดูแลระบบเพื่อเชื่อมบัญชี LINE
5. Do not create user automatically
6. Do not allow self registration
```

---

# 9. Session Rules

## 9.1 Session Must Include

App session ต้องมี:

```txt
userId
activeCompanyId
role
lineUserId
sessionType = LINE
```

Superadmin session ต้องมี:

```txt
superadminId
sessionType = SUPERADMIN
```

---

## 9.2 Session Separation

LINE user session และ superadmin session ต้องแยกกัน

```txt
LINE session cannot access /superadmin/*
SUPERADMIN session cannot be treated as normal company user
```

---

## 9.3 Session Expiry

แนะนำ:

```txt
LINE user session: normal app session
Superadmin session: shorter expiry
```

---

# 10. UI Rules

## 10.1 No Login UI For Normal Users

ห้ามมี UI:

```txt
Email input
Password input
Forgot password
Create account
Register form
Login with Google
Login with Facebook
Login with email
```

สำหรับ user ปกติ

---

## 10.2 Allowed Normal User Auth UI

มีได้เฉพาะปุ่ม:

```txt
เชื่อมต่อด้วย LINE
เข้าสู่ระบบด้วย LINE
Continue with LINE
```

---

## 10.3 Superadmin UI

หน้า superadmin login ต้อง:

```txt
- อยู่ที่ /superadmin/login เท่านั้น
- ไม่แสดงใน navigation ปกติ
- ไม่แสดงให้ user ทั่วไปเห็น
- ไม่ถูกลิงก์จากหน้า public ปกติ
```

---

## 10.4 Access Denied Page

ต้องมีหน้า:

```txt
/line/error
```

ข้อความตัวอย่าง:

```txt
บัญชี LINE นี้ยังไม่ได้รับสิทธิ์เข้าใช้งาน
กรุณาติดต่อผู้ดูแลระบบเพื่อเชื่อมบัญชีของคุณ
```

---

# 11. API Rules

## 11.1 Auth APIs Allowed

Allowed:

```txt
GET  /api/auth/line/start
GET  /api/auth/line/callback
POST /api/auth/line/link
POST /api/auth/logout

POST /api/superadmin/login
POST /api/superadmin/logout
```

---

## 11.2 Auth APIs Forbidden

Forbidden:

```txt
POST /api/auth/register
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/email-login
POST /api/auth/password-login
POST /api/auth/magic-link
POST /api/auth/google
POST /api/auth/facebook
```

---

## 11.3 User Creation API

User creation must be admin-only

Allowed:

```txt
POST /api/admin/users/invite
POST /api/admin/users/:userId/create-line-link
```

Forbidden:

```txt
POST /api/users/register
POST /api/users/signup
```

---

# 12. Permission Rules By Role

All roles below must authenticate via LINE only:

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

Superadmin is not part of normal role system.

---

## 12.1 OWNER

```txt
Login: LINE only
Can manage company
Can manage users
Can approve documents
Can view financial dashboards
```

---

## 12.2 ADMIN

```txt
Login: LINE only
Can manage operation
Can manage customers
Can manage suppliers
Can manage fleet
Can manage orders
```

---

## 12.3 ACCOUNTANT

```txt
Login: LINE only
Can manage invoice
Can manage payment
Can manage receipt
Can manage debt
Can manage settlement
```

---

## 12.4 PROCUREMENT

```txt
Login: LINE only
Can manage supplier products
Can manage PO
Can view supplier costs
Cannot access unrelated finance unless allowed
```

---

## 12.5 OPERATION

```txt
Login: LINE only
Can manage order and logistics
Can assign fleet job
Cannot see sensitive finance unless allowed
```

---

## 12.6 CUSTOMER

```txt
Login: LINE only
Can view own orders
Can confirm quotation
Can view own documents
Can upload payment slip
Cannot see supplier cost
Cannot see internal BOQ
```

---

## 12.7 SUPPLIER

```txt
Login: LINE only
Can view own products
Can view own PO
Can confirm/reject own PO
Can view own payout
Cannot see other suppliers
Cannot see customer sell margin
```

---

## 12.8 FLEET_OWNER

```txt
Login: LINE only
Can manage own vehicles
Can open/close queue
Can accept/reject own jobs
Can view own earnings
Cannot see unrelated transport jobs
```

---

## 12.9 DRIVER

```txt
Login: LINE only
Can view assigned jobs
Can update job status
Can upload delivery proof
Cannot manage fleet company settings
```

---

## 12.10 VIEWER

```txt
Login: LINE only
Read-only access
Scope depends on company membership
```

---

# 13. Middleware Rules

Middleware must enforce:

```txt
1. /superadmin/* requires SUPERADMIN session
2. /admin/* requires LINE session with internal role
3. /customer/* requires LINE session with CUSTOMER role or allowed internal role
4. /partner/* requires LINE session with SUPPLIER role
5. /fleet/* requires LINE session with FLEET_OWNER or DRIVER role
6. unauthenticated users redirect to /line/connect
7. unknown LINE users redirect to /line/error
8. no route should redirect normal users to /login
```

---

# 14. Navigation Rules

## 14.1 Normal Navigation

Navigation must show auth action as:

```txt
เชื่อมต่อด้วย LINE
```

or

```txt
เข้าสู่ระบบด้วย LINE
```

---

## 14.2 No Login Menu

Do not show:

```txt
Login
Sign in
Register
Sign up
Email Login
Password Login
```

---

## 14.3 Superadmin Hidden Entry

Superadmin login route must not appear in normal UI navigation

```txt
/superadmin/login
```

Only direct access is allowed

---

# 15. Supabase Auth Rules

If using Supabase Auth:

```txt
Only LINE OAuth/OIDC provider should be enabled for normal users if supported
Disable email/password signup
Disable email signup
Disable magic link for normal users
Disable other OAuth providers
```

If Supabase does not support the exact LINE flow directly in current implementation, use custom LINE OAuth flow and create app session after callback.

Regardless of implementation:

```txt
Normal users must authenticate via LINE only
```

---

# 16. Security Rules

```txt
1. Never expose LINE secret to client.
2. Never expose Supabase service role key to client.
3. Validate LINE callback server-side.
4. Validate state parameter to prevent CSRF.
5. Validate lineLinkToken before linking account.
6. One LINE account can link to only one user.
7. One user can have only one active LINE identity in MVP.
8. Unknown LINE users cannot self-register.
9. Superadmin login must be rate limited.
10. Superadmin actions must be fully audited.
```

---

# 17. Audit Rules

Audit log required for:

```txt
LINE account linked
LINE account unlinked
User invited
User activated
User suspended
Role changed
Company member changed
Superadmin login
Superadmin failed login
Superadmin action
Auth provider config changed
```

Audit payload should include:

```txt
actorType
actorId
targetUserId
companyId
action
oldValue
newValue
ipAddress
userAgent
createdAt
```

---

# 18. Forbidden Implementation Patterns

AI / Developer must not create:

```txt
/login page
/register page
/signup page
email/password form for normal users
magic link login for normal users
Google/Facebook/Apple login
public registration API
auto-create user from unknown LINE account
customer self-signup without admin approval
supplier self-signup without admin approval
fleet self-signup without admin approval
```

---

# 19. Required Implementation Files

Recommended auth files:

```txt
src/app/line/connect/page.tsx
src/app/line/callback/route.ts
src/app/line/error/page.tsx

src/app/superadmin/login/page.tsx
src/app/api/superadmin/login/route.ts
src/app/api/superadmin/logout/route.ts

src/app/api/auth/line/start/route.ts
src/app/api/auth/line/callback/route.ts
src/app/api/auth/line/link/route.ts
src/app/api/auth/logout/route.ts

src/server/services/authService.ts
src/server/services/lineAuthService.ts
src/server/services/superadminService.ts
src/server/services/sessionService.ts

src/core/schemas/auth.schema.ts
src/core/permissions/authPolicy.ts
middleware.ts
```

---

# 20. Required Environment Variables

```env
LINE_CHANNEL_ID=
LINE_CHANNEL_SECRET=
LINE_CALLBACK_URL=

SUPERADMIN_USERNAME=
SUPERADMIN_PASSWORD_HASH=

SESSION_SECRET=
APP_URL=
```

Optional:

```env
LINE_LIFF_ID=
```

Do not store:

```txt
SUPERADMIN_PASSWORD plain text
```

---

# 21. Auth Data Model Recommendation

## Option A: Add LINE fields to User

เหมาะกับ MVP

```txt
User
- id
- email nullable
- name
- phone
- lineUserId unique nullable
- lineDisplayName nullable
- linePictureUrl nullable
- lineLinkedAt nullable
- lineLastLoginAt nullable
- status
```

## Option B: Separate UserIdentity

เหมาะกับระบบที่ยืดหยุ่นกว่า

```txt
UserIdentity
- id
- userId
- provider
- providerUserId
- displayName
- pictureUrl
- linkedAt
- lastLoginAt
```

For this project:

```txt
Recommended: Option B
Allowed provider in MVP: LINE only
```

---

# 22. Updated User Lifecycle

```txt
1. Admin creates user
2. User status = INVITED
3. System creates LINE link token
4. User opens LINE connect link
5. User authorizes LINE
6. System links lineUserId
7. User status = LINE_LINKED
8. Admin or system activates user
9. User status = ACTIVE
10. User logs in through LINE only
```

---

# 23. Updated PROJECT_PROGRESS Checklist

เพิ่ม checklist นี้ใน PROJECT_PROGRESS.md:

```txt
[ ] LINE auth route created
[ ] LINE callback route created
[ ] LINE account linking created
[ ] Unknown LINE user blocked
[ ] No public login page exists
[ ] No public register page exists
[ ] Superadmin login page created
[ ] Superadmin limited to one account
[ ] Normal users cannot use password login
[ ] Middleware redirects unauthenticated users to LINE connect
[ ] Auth audit logs created
```

---

# 24. AI Coding Agent Instruction

When AI works on auth:

```txt
Read PROJECT_RULES.md first.
Do not create /login.
Do not create /register.
Do not create email/password auth for normal users.
Create LINE-only auth for all normal roles.
Create /superadmin/login only for one superadmin account.
Block unknown LINE users.
Do not auto-create users from LINE profile.
Require admin invitation/linking.
Update PROJECT_PROGRESS.md after implementation.
```

---

# 25. Final Auth Rule

The final rule is:

```txt
All normal users must authenticate only by connecting their LINE account.
There is no public signup.
There is no normal login page.
Only one superadmin account may use a separate hidden login page.
```

---

# END OF PROJECT RULES

---

# UPDATE — Admin Password Login Exception

Human owner updated the authentication policy:

```txt
ADMIN role may sign in with username/password at /admin/login.
All other normal roles must still authenticate through LINE only.
Do not allow customer, supplier, fleet owner, driver, viewer, accountant, procurement, or operation roles to use username/password login.
Admin password session must be separate from LINE session.
/customer/*, /partner/*, and /fleet/* must continue to redirect unauthenticated users to /line/connect.
```

Allowed additional public route:

```txt
/admin/login
```

Allowed additional API:

```txt
POST /api/auth/admin/login
```

Implementation note:

```txt
Only records in the admins table with role = ADMIN and status = ACTIVE may use admin username/password login.
```

---

# UPDATE — LINE-First Experience Rules

## Admin Desktop First

```txt
Admin / Core team uses desktop-first dashboard.
Admin pages may be table-heavy and detailed.
Admin must be able to drill down into orders, debts, documents, project groups, and alerts.
```

## Partner / Customer / Fleet LINE First

```txt
Partner, Customer, Fleet Owner, and Driver must use LINE as the primary entry point.
Web pages for these roles must be simple, mobile-first, and action-specific.
Avoid complex dashboards for mobile roles.
```

## Required LINE Actions

```txt
Partner:
- Submit product
- Update stock
- Confirm PO
- Reject PO
- View payout

Customer:
- View quotation
- Confirm quotation
- View delivery status
- Upload payment slip
- View receipt

Fleet / Driver:
- Accept job
- Reject job
- Update job status
- Upload delivery proof
```

## Partner Product Rule

```txt
Partner can submit products and stock.
Admin can add product for partner.
Partner product must be approved by Admin before it becomes sellable.
Partner cannot approve their own product.
Every stock update must create inventory movement.
```

## Document Reference Rule

```txt
Every document should belong to a project/document group when applicable.
Document number must include projectNo if project exists.
Admin must be able to search by any reference number and see all related documents.
```
