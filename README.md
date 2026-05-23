# DNA OS — Construction Commerce Platform

ระบบกลางสำหรับควบคุมธุรกิจรับเหมาก่อสร้างและวัสดุก่อสร้าง

## Overview

DNA OS เชื่อมสามฝั่งหลักเข้าด้วยกัน:

- **ลูกค้า** — สั่งสินค้า ยืนยันราคา ติดตามสถานะ
- **พาร์ทเนอร์ / Supplier** — รับ PO ยืนยันสินค้า รับเงิน
- **รถร่วม / Fleet** — รับงานขนส่ง อัปเดตสถานะ รับค่าขนส่ง

## Core Modules

| Module | Description |
|---|---|
| Customer Orders | BOQ → Quotation → Order confirmation |
| Procurement | Supplier PO creation and management |
| Logistics / Fleet | Transport job dispatch and tracking |
| Documents | QT, INV, RCT, PO — server-side PDF generation |
| Payments | Slip upload, reconciliation, debt tracking |
| Dashboard | Real-time overview for admin |

## Tech Stack

- **Frontend**: Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui
- **Backend**: Fastify · Prisma · PostgreSQL
- **Auth**: LINE Login only (no public registration)
- **Package manager**: pnpm

## Getting Started

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env

# Run database migrations
cd dnaos-backend
pnpm db:migrate

# Start development servers
pnpm dev
```

## Documentation

| File | Purpose |
|---|---|
| [AGENT.md](AGENT.md) | AI coding agent rules and system blueprint |
| [PROJECT_RULES.md](PROJECT_RULES.md) | Auth policy, route rules, permission rules |
| [TECH_STACK.md](TECH_STACK.md) | Full stack reference and build order |
| [AI_STEP_PROMPTS.md](AI_STEP_PROMPTS.md) | Step-by-step prompts for each dev phase |
| [PROJECT_PROGRESS.md](PROJECT_PROGRESS.md) | Current build progress tracker |
| [API_DESCRIPTION.md](API_DESCRIPTION.md) | API endpoint reference |
