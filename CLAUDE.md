# CLAUDE.md — โปรเจกต์เว็บขายพระเครื่องออนไลน์

คู่มือนี้ใช้สำหรับให้ Claude (หรือ Claude Code) เข้าใจภาพรวม โครงสร้าง และแนวทางการพัฒนาโปรเจกต์นี้ ก่อนเริ่มเขียนโค้ดทุกครั้งให้อ่านไฟล์นี้ก่อน รายละเอียดเชิงลึกแยกไว้ในโฟลเดอร์ `docs/` ตามหัวข้อ — ลิงก์ไว้ในแต่ละส่วนด้านล่าง

## ภาพรวมโปรเจกต์

เว็บอีคอมเมิร์ซสำหรับขายพระเครื่อง จุดเด่นคือ:
1. **ค้นหา/กรองตามจังหวัด** — ผู้ใช้กรองพระเครื่องตามจังหวัดที่เป็นแหล่งกำเนิด (เช่น จ.พิษณุโลก, จ.ลำพูน, จ.กำแพงเพชร)
2. **ค้นหา/กรองตามหลวงพ่อ/พระเกจิ** — กรองตามชื่อหลวงพ่อ/หลวงปู่/วัดที่สร้างพระรุ่นนั้น
3. **ระบบเปลี่ยนธีม (Multi-theme / White-label)** — ตัวเว็บต้อง reusable ให้คนอื่นเอาโค้ดไปติดตั้งร้านของตัวเอง แล้วปรับสี โลโก้ ชื่อร้าน ได้โดยไม่ต้องแก้โค้ดหลัก
4. **ระบบ Login แยกสิทธิ์** — แยก Admin (จัดการร้าน), สมาชิก (Member ที่ล็อกอิน, มีหลายระดับ), และผู้เยี่ยมชมทั่วไป (Guest ที่ยังซื้อได้แต่ไม่ล็อกอิน) สมาชิกจะได้สิทธิ์พิเศษ เช่น ดึงที่อยู่จัดส่ง default อัตโนมัติ และส่วนลด/จัดส่งฟรีตามระดับที่ร้านตั้งค่าให้

เป้าหมาย: โค้ดหนึ่งชุด (one codebase) รองรับหลายร้าน (multi-tenant ระดับ config) แต่ละร้านมีไฟล์ theme config ของตัวเอง

## Tech stack ที่แนะนำ

- Frontend: Next.js (App Router) + TypeScript + Tailwind CSS
- Database: **Microsoft SQL Server** — ดู schema เต็มที่ [docs/database.md](./docs/database.md) — เชื่อมต่อผ่าน Prisma (`sqlserver` provider) หรือ Entity Framework Core ถ้า backend เป็น .NET

### SQL Server config (dev)

เครื่อง dev มี SQL Server instance พร้อม database ตั้งไว้แล้ว (instance ชื่อ `MSSQLSERVER2017` เปิด TCP/IP บน port 1433 ไว้แล้วสำหรับให้ Prisma/Node เชื่อมต่อได้ — เดิม TCP ปิดอยู่ ใช้ได้แค่ named pipe จึงเปิดเพิ่มเมื่อ 2026-08-12):

| Key | Value |
|---|---|
| Server (TCP, ใช้กับ Prisma/EF Core) | `127.0.0.1,1433` |
| Server name (สำหรับ SSMS/sqlcmd ผ่าน named pipe) | `DESKTOP-785IB33\MSSQLSERVER2017` |
| Login | `amulet_dev` |
| Password | ดูใน `.env` (ไม่ commit ลง git) |
| Database | `AmuletTK` |

Connection string เต็มเก็บไว้ที่ `DATABASE_URL` ใน `.env` แล้ว (ดูรูปแบบได้จาก `.env.example`) ห้าม hardcode password ลงไฟล์ที่ commit เข้า git เด็ดขาด

**Prisma setup ที่ทำไว้แล้ว:**
- `prisma/schema.prisma` มี model ครบตาม DDL ใน [docs/database.md](./docs/database.md) (field เป็น camelCase, map กลับไปหาชื่อ table/column ตัวจริงด้วย `@map`/`@@map`)
- ใช้ Prisma **v7** ซึ่งบังคับต้องส่ง **driver adapter** เข้า `PrismaClient` เสมอ (ต่างจาก v5/v6 ที่ต่อ DB ตรงจาก `datasource.url` ได้เลย) — สำหรับ SQL Server ใช้ `@prisma/adapter-mssql` ห้ามลืม instantiate ด้วย adapter มิฉะนั้นจะได้ error `PrismaClientInitializationError`
- ใช้ Prisma client ผ่าน singleton ที่ `src/lib/prisma.ts` (`import { prisma } from "@/lib/prisma"`) ไม่ต้อง `new PrismaClient()` เองในแต่ละไฟล์
- Generated client อยู่ที่ `src/generated/prisma` (gitignored, รัน `npx prisma generate` ใหม่ได้เสมอ)
- Index บางตัวที่ DDL ต้องการเป็น filtered/partial index (`UX_MemberTiers_Tenant_Default`, `IX_Products_Tenant_Active_CreatedAt`) ซึ่ง Prisma schema ยังไม่รองรับบน SQL Server — สร้างด้วย raw SQL แยกไว้แล้วในฐาน dev แต่ **ถ้า reset/push schema ใหม่ในเครื่องอื่นต้องรัน SQL 2 statement นี้เพิ่มเอง** (ดูคอมเมนต์ในโมเดล `MemberTier`/`Product` ใน schema.prisma)
- ใช้ `npx prisma db push` สำหรับ dev sync (ยังไม่ตั้ง migration history อย่างเป็นทางการด้วย `prisma migrate dev` — ค่อยเริ่มเมื่อ schema เริ่มนิ่งแล้ว)

**Auth/สิทธิ์ผู้ใช้ที่ทำไว้แล้ว** (ดู [docs/auth-and-membership.md](./docs/auth-and-membership.md) ก่อนแก้ไขส่วนนี้เสมอ):
- ใช้ **custom session แบบ JWT** (`jose` + httpOnly cookie ชื่อ `session`) ไม่ได้ใช้ NextAuth.js — เหตุผล: schema `Users`/multi-tenant/role ในโปรเจกต์นี้ออกแบบเองทั้งหมด ไม่ fit กับ adapter ของ NextAuth ตรงๆ และตอนทำ (2026-08) Next.js เป็น v16 ซึ่งใหม่มาก ยังไม่อยากเสี่ยงเรื่อง compatibility กับ next-auth
- รหัสผ่าน hash ด้วย `bcryptjs` (`src/lib/auth/password.ts`) ตาม policy ใน docs/database.md
- Session helper อยู่ที่ `src/lib/auth/session.ts` (`getSession()`, `setSessionCookie()`, `clearSessionCookie()`, `verifySessionToken()`) ต้องมี `AUTH_SECRET` ใน `.env` เสมอ (generate ด้วย `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`)
- Server actions หลักอยู่ที่ `src/lib/auth/actions.ts`: `loginAction`, `registerAction`, `logoutAction`, `requireSession()` (helper เรียกใน server component เพื่อบังคับต้อง login แล้ว redirect กลับ `/login` ถ้ายัง)
- **Next.js 16 เปลี่ยนชื่อ convention จาก `middleware.ts` เป็น `proxy.ts`** (export ฟังก์ชันชื่อ `proxy` แทน `middleware`) — ใช้ `src/proxy.ts` ทำ route protection: บังคับ login ทุก path ใต้ `/admin/**` และ `/account/**`, เช็ก role `tenant_admin`/`super_admin` เพิ่มสำหรับ `/admin/**`
- Tenant resolution ยังเป็น placeholder อยู่ที่ `src/lib/tenant.ts` (`getCurrentTenant()` hardcode slug `amulet-thailand`, ห่อด้วย React `cache()` กัน query ซ้ำในการ render ครั้งเดียว) — **ยังไม่ได้ทำ resolve จาก subdomain/host จริง** แม้ระบบธีม (ข้อ 5) จะเสร็จแล้ว เพราะ multi-tenant ตอนนี้มีแค่ tenant เดียวจริงๆ ยังไม่คุ้มที่จะทำ routing แยกโดเมน — ทำตอนต้องรองรับหลายร้านจริง (roadmap ข้อ 8)
- Dev/test login (จาก `prisma/seed-data/users.ts`, รหัสผ่านเดียวกันหมด `Passw0rd!`): `superadmin@amulet-thailand.demo` (super_admin), `admin@amulet-thailand.demo` (tenant_admin), `member@amulet-thailand.demo` (member) — ทดสอบผ่านครบทุก role + register/login/logout/duplicate-email/wrong-password ใน browser จริงแล้ว (2026-08-12)
- **ที่อยู่จัดส่งสมาชิก** (`/account/addresses`): CRUD เต็ม, บังคับมี default ที่อยู่ได้แค่ 1 รายการต่อคนในระดับ application (DB ไม่มี unique constraint ตรงนี้) — logic อยู่ที่ `src/lib/addresses/actions.ts` ลบที่อยู่ default แล้วจะ auto-promote ที่อยู่ล่าสุดที่เหลือขึ้นเป็น default แทน
- **Admin ตั้งค่า MemberTier** (`/admin/member-tiers`, เฉพาะ role `tenant_admin`): CRUD เต็ม, logic อยู่ที่ `src/lib/member-tiers/actions.ts` — บังคับกฎ "ต้องมี default tier เดียวเสมอ" ในระดับ application: ห้ามลบ tier ที่เป็น default, ห้าม uncheck default โดยตรง (ต้องไปกด "ตั้งเป็นค่าเริ่มต้น" ที่ tier อื่นแทน), ห้ามลบ tier ที่ยังมีสมาชิกผูกอยู่ — ทดสอบ guard ทั้งหมดผ่านใน browser จริงแล้ว (2026-08-12)

**ระบบธีม/หน้าตั้งค่าร้านที่ทำไว้แล้ว** (ดู [docs/theming.md](./docs/theming.md) ก่อนแก้ไขส่วนนี้เสมอ):
- Theme ถูก inject เป็น **CSS custom properties** บน `<html>` (inline style) ใน `src/app/layout.tsx` จาก tenant ปัจจุบัน (`tenant.theme` — fallback เป็น `DEFAULT_THEME` ใน `src/lib/theme/resolve.ts` ถ้า tenant ยังไม่ได้ตั้ง theme) แล้ว `globals.css` map เป็น Tailwind v4 token ผ่าน `@theme inline` (`--color-primary`, `--color-accent`, `--color-surface`, `--color-background`, `--color-foreground`) — component เรียกใช้ผ่าน class ปกติ เช่น `bg-primary`, `text-accent`, `bg-surface` **ห้าม hardcode hex สีในไฟล์ component เด็ดขาด** ตาม convention เดิม
- **ลบ Tailwind `dark:` variant ออกทั้งโปรเจกต์แล้ว** (2026-08-12) — เดิม `dark:` ผูกกับ `prefers-color-scheme` ของ OS ซึ่งขัดกับระบบธีมที่ควบคุมสีทั้งหมดจาก DB ต่อ tenant (ธีมของร้านไม่ควรถูก OS dark mode override) ถ้าจะเพิ่ม dark variant ของธีมในอนาคตต้องออกแบบเป็นส่วนหนึ่งของ theme model เอง ไม่ใช่พึ่ง Tailwind `dark:` เฉยๆ
- ฟอนต์: โหลดจาก Google Fonts แบบ dynamic ผ่าน `<link>` ใน root layout โดยใช้ `theme.fontFamily` ตรงๆ (เช่น "Noto Serif Thai") — ไม่ใช้ `next/font` เพราะต้อง static-known ฟอนต์ตอน build ซึ่งขัดกับ per-tenant font ที่เปลี่ยนได้จาก DB
- `Theme.isPreset` (เพิ่มเข้า schema ตอนทำ feature นี้) แยก "ธีมสำเร็จรูป" (3 แบบที่ seed ไว้: ทองวัด/มินิมอลขาว-ดำ/แดง-มงคล) ออกจาก "ธีมที่ร้านปรับแต่งเอง" — สำคัญเพราะ `Theme` ไม่ได้ผูกกับ tenant ตรงๆ (`tenants Theme[]` เป็นได้หลายร้านต่อหนึ่งธีม) ถ้าให้แก้ preset ตรงๆ จะกระทบทุกร้านที่ใช้ preset นั้นร่วมกัน
- **Clone-on-write** ที่ `customizeThemeAction` (`src/lib/settings/actions.ts`): แก้ธีมเองได้จากหน้า `/admin/settings` — ถ้าธีมปัจจุบันเป็น preset (`isPreset=true`) หรือร้านอื่นใช้ theme เดียวกันอยู่ ระบบจะ **สร้าง Theme แถวใหม่** แล้วเปลี่ยน `tenant.themeId` ไปแถวใหม่แทนการแก้ของเดิม; ถ้าเป็นธีม custom ที่ร้านนี้ใช้อยู่คนเดียวอยู่แล้วจะ update in-place — ทดสอบผ่าน DB จริงแล้วว่า preset ไม่โดนกระทบและไม่สร้างแถวซ้ำซ้อนเมื่อแก้ธีม custom เดิมต่อ (2026-08-12)
- หน้า `/admin/settings` (เฉพาะ `tenant_admin`): แก้ shopName/ownerContact, เลือก preset (มี swatch preview), ปรับแต่งสี (color picker) + logoUrl + fontFamily + layoutStyle เอง
- Root layout มี header กลางๆ แสดงโลโก้ (ถ้ามี)/ชื่อร้าน + ลิงก์ไปหน้าสินค้า — ตั้งใจไม่ใส่ session-dependent UI (เช่น "เข้าสู่ระบบ"/"บัญชีของฉัน") ในนี้ เพราะจะบังคับให้ทุกหน้ากลายเป็น dynamic เต็มรูป (เสีย ISR ของหน้า public เช่น home/products)

- Image: เก็บ path รูปใน object storage (S3-compatible) — ตอน dev ใช้ placeholder ก่อน
- State/filter: URL query params เป็นหลัก (เช่น `/products?province=phitsanulok&monk=luang-pho-koon`) เพื่อให้แชร์ลิงก์กรองได้และ SEO friendly

หากผู้ใช้ระบุ stack อื่น (เช่น Vue, Laravel) ให้ยึดตามที่ผู้ใช้ระบุแทน โครงสร้างข้อมูลใน docs ยังใช้แนวคิดเดียวกันได้

## เอกสารแยกตามหัวข้อ (docs/)

| ไฟล์ | เนื้อหา |
|---|---|
| [docs/database.md](./docs/database.md) | โครงสร้างข้อมูลทั้งหมด (conceptual) + DDL (T-SQL) เต็มรูปแบบสำหรับ SQL Server |
| [docs/auth-and-membership.md](./docs/auth-and-membership.md) | ระบบ Login, สิทธิ์ Admin/สมาชิก/Guest, ระบบระดับสมาชิก (MemberTier) และส่วนลด/จัดส่งฟรี |
| [docs/checkout-and-payment.md](./docs/checkout-and-payment.md) | Flow หน้า checkout, การแสดงบัญชี/QR โอนเงิน, แนบสลิป, ระบบแจ้งเตือน Telegram/Email, ตรวจสลิปอัตโนมัติ, ติดตามสถานะออร์เดอร์, payment gateway |
| [docs/theming.md](./docs/theming.md) | ระบบธีม/white-label ให้แต่ละร้านปรับสี โลโก้ ได้เอง |
| [docs/home-and-catalog.md](./docs/home-and-catalog.md) | หน้าหลัก (รวม "พระเครื่องเข้ามาใหม่"), หน้ารายการสินค้า, หน้าโปรไฟล์หลวงพ่อ/จังหวัด |

เวลาทำงานในหัวข้อไหน ให้เปิดไฟล์ docs ที่เกี่ยวข้องอ่านก่อนเริ่มเขียนโค้ดเสมอ

## ฟีเจอร์หลักที่ต้องมี

- [x] หน้าหลัก (Home) — ดู [docs/home-and-catalog.md](./docs/home-and-catalog.md) (เสร็จแล้ว 2026-08-12 — hero, แถบ filter ด่วน, พระเครื่องเข้ามาใหม่ (ซ่อนถ้าว่าง), สินค้าขายดี (ซ่อนถ้าว่าง — ยังไม่มี order จริงจนกว่าจะทำ checkout), แนะนำตามจังหวัด/หลวงพ่อ; หน้านี้ตั้ง `export const revalidate = 60` เพราะ Next.js จะ static-prerender ทิ้งไว้เฉยๆ ถ้าไม่ตั้ง ทำให้สินค้าใหม่ไม่อัปเดต; มี `GET /api/products?sort=newest&days=N` แยกไว้ตามที่ docs ขอ)
- [x] หน้ารายการสินค้า พร้อม filter แบบ multi-select: จังหวัด, หลวงพ่อ/วัด, หมวดหมู่, ช่วงราคา — ดู [docs/home-and-catalog.md](./docs/home-and-catalog.md) (`/products` เสร็จแล้ว 2026-08-12 — filter เป็น plain GET form สะท้อนใน URL query string ตรงตาม convention)
- [x] หน้ารายละเอียดสินค้า, หน้าโปรไฟล์หลวงพ่อ/วัด (`/monks/[slug]`), หน้าตามจังหวัด (`/provinces/[slug]`) (เสร็จแล้ว 2026-08-12 — gallery เรียงรูปพระก่อนแล้วตามด้วยรูปใบรับประกันตาม docs/database.md, การ์ดสินค้าใช้ shared component `ProductCard` ร่วมกันทั้ง 3 หน้า)
- [ ] ตะกร้าสินค้า + checkout + ตรวจสลิปอัตโนมัติ + ติดตามสถานะออร์เดอร์ + payment gateway — ดู [docs/checkout-and-payment.md](./docs/checkout-and-payment.md)
- [x] ระบบ Login แยก Admin/สมาชิก/Guest + ที่อยู่ default + ระดับสมาชิก (MemberTier) พร้อมส่วนลด/จัดส่งฟรีตามระดับ — ดู [docs/auth-and-membership.md](./docs/auth-and-membership.md) (ทำ auth + จัดการที่อยู่สมาชิก + admin ตั้งค่า MemberTier เสร็จแล้ว 2026-08-12 — ส่วนที่เหลือคือ**เอาส่วนลด/จัดส่งฟรีไปใช้จริงตอน checkout** ซึ่งอยู่ใน roadmap ข้อ 6/บรรทัดถัดไปแล้ว)
- [ ] ราคาขาย default จากต้นทุน (ปรับ % ได้) + โปรโมชั่นส่วนลดทั้งร้านตามช่วงเวลา — ดู [docs/checkout-and-payment.md](./docs/checkout-and-payment.md)
- [x] ระบบเปลี่ยนธีมร้าน — ดู [docs/theming.md](./docs/theming.md) (เสร็จแล้ว 2026-08-12 — ดูรายละเอียดที่ section "ระบบธีม" ด้านล่าง)
- [ ] ระบบผู้ขายหลายราย (ถ้าต้องการรองรับ marketplace ไม่ใช่แค่ร้านเดียว)

## Conventions

- ใช้ URL slug ภาษาอังกฤษ (เช่น `luang-pho-koon`, `phitsanulok`) แต่แสดงผล UI เป็นภาษาไทย
- Component ต้องรับค่าธีมผ่าน CSS variables เท่านั้น ห้าม hardcode hex สีในไฟล์ component
- ชื่อไฟล์/โฟลเดอร์เป็นภาษาอังกฤษ, ข้อความ UI เป็นภาษาไทย
- ทุก filter (จังหวัด, หลวงพ่อ, หมวดหมู่) ต้องสะท้อนใน URL query string เสมอ

## Roadmap แนะนำ

1. ✅ Setup โปรเจกต์ + data model + seed ข้อมูลตัวอย่าง (จังหวัด, หลวงพ่อ, สินค้า) — [docs/database.md](./docs/database.md)
2. ✅ ระบบ Login/สิทธิ์ผู้ใช้ (Admin/สมาชิก/Guest) + หน้าจัดการที่อยู่สมาชิก + ตั้งค่าระดับสมาชิก (MemberTier) — [docs/auth-and-membership.md](./docs/auth-and-membership.md)
3. ✅ หน้ารายการสินค้า + ระบบ filter จังหวัด/หลวงพ่อ — [docs/home-and-catalog.md](./docs/home-and-catalog.md)
4. ✅ หน้ารายละเอียดสินค้า + หน้าโปรไฟล์หลวงพ่อ/จังหวัด
5. ✅ ระบบธีม + หน้าตั้งค่าร้าน — [docs/theming.md](./docs/theming.md)
6. ตะกร้า + checkout (รวมส่วนลด/จัดส่งฟรีสมาชิก) + ตรวจสลิปอัตโนมัติ + ติดตามสถานะออร์เดอร์ — [docs/checkout-and-payment.md](./docs/checkout-and-payment.md)
7. เชื่อมต่อ payment gateway (ถ้าต้องการ)
8. ระบบผู้ขายหลายราย (ถ้าต้องการ)
