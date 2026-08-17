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
    - Index บางตัวที่ DDL ต้องการเป็น filtered/partial index (`UX_MemberTiers_Tenant_Default`, `IX_Products_Tenant_Active_CreatedAt`, `UX_Products_Tenant_Sku`) ซึ่ง Prisma schema ยังไม่รองรับบน SQL Server — สร้างด้วย raw SQL แยกไว้แล้วในฐาน dev แต่ **ถ้า reset/push schema ใหม่ในเครื่องอื่นต้องรัน SQL 3 statement นี้เพิ่มเอง** (ดูคอมเมนต์ในโมเดล `MemberTier`/`Product` ใน schema.prisma)
    - ใช้ `npx prisma db push` สำหรับ dev sync (ยังไม่ตั้ง migration history อย่างเป็นทางการด้วย `prisma migrate dev` — ค่อยเริ่มเมื่อ schema เริ่มนิ่งแล้ว)

    **Auth/สิทธิ์ผู้ใช้ที่ทำไว้แล้ว** (ดู [docs/auth-and-membership.md](./docs/auth-and-membership.md) ก่อนแก้ไขส่วนนี้เสมอ):
    - ใช้ **custom session แบบ JWT** (`jose` + httpOnly cookie ชื่อ `session`) ไม่ได้ใช้ NextAuth.js — เหตุผล: schema `Users`/multi-tenant/role ในโปรเจกต์นี้ออกแบบเองทั้งหมด ไม่ fit กับ adapter ของ NextAuth ตรงๆ และตอนทำ (2026-08) Next.js เป็น v16 ซึ่งใหม่มาก ยังไม่อยากเสี่ยงเรื่อง compatibility กับ next-auth
    - รหัสผ่าน hash ด้วย `bcryptjs` (`src/lib/auth/password.ts`) ตาม policy ใน docs/database.md
    - Session helper อยู่ที่ `src/lib/auth/session.ts` (`getSession()`, `setSessionCookie()`, `clearSessionCookie()`, `verifySessionToken()`) ต้องมี `AUTH_SECRET` ใน `.env` เสมอ (generate ด้วย `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`)
    - Server actions หลักอยู่ที่ `src/lib/auth/actions.ts`: `loginAction`, `registerAction`, `logoutAction`, `requireSession()` (helper เรียกใน server component เพื่อบังคับต้อง login แล้ว redirect กลับ `/login` ถ้ายัง)
    - **Next.js 16 เปลี่ยนชื่อ convention จาก `middleware.ts` เป็น `proxy.ts`** (export ฟังก์ชันชื่อ `proxy` แทน `middleware`) — ใช้ `src/proxy.ts` ทำ route protection: บังคับ login ทุก path ใต้ `/admin/**` และ `/account/**`, เช็ก role `tenant_admin`/`super_admin` เพิ่มสำหรับ `/admin/**`
    - **`tenant_admin` กับ `super_admin` ตอนนี้แทบไม่ต่างกันในทางปฏิบัติ** — `src/proxy.ts` เช็กสิทธิ์เข้า `/admin/**` ด้วย `ADMIN_ROLES = new Set(["tenant_admin", "super_admin"])` รวมกัน ไม่มีหน้าไหนที่แยกสิทธิ์ระหว่างสอง role นี้จริงจัง ต่างกันแค่ label ทักทายที่ `/admin` ("ผู้ดูแลระบบสูงสุด" vs "แอดมินร้าน", `src/app/admin/page.tsx`) เจตนาการออกแบบคือ `super_admin` = แอดมินระดับแพลตฟอร์ม (`User.tenantId = NULL` ได้ ไม่ผูกร้านใดร้านหนึ่ง ดู `prisma/seed-data/users.ts`) ส่วน `tenant_admin` = แอดมินของร้านเดียว แต่ยังไม่มีโค้ดจุดไหนใช้ประโยชน์จากความต่างนี้จริง เพราะ tenant resolution ยังเป็น placeholder เดี่ยว (บรรทัดถัดไป) — ถ้าจะแยกสิทธิ์จริงต้องรอตอนทำ multi-tenant ข้ามร้านเต็มรูป
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
    - Root layout มี header กลางๆ แสดงโลโก้ (ถ้ามี)/ชื่อร้าน + ลิงก์ไปหน้าสินค้า — **ไม่อ่าน session ตรงใน root layout** (จะบังคับให้ทุกหน้ากลายเป็น dynamic เต็มรูป เสีย ISR ของหน้า public เช่น home/products) แต่มีลิงก์เข้าสู่ระบบ/บัญชีของฉันที่สลับได้ผ่าน **client component แยก** แทน (ดูหัวข้อถัดไป)
    - ลิงก์เข้าสู่ระบบใน header คือ `AccountLink` (`src/components/auth/AccountLink.tsx`) — client component ที่ fetch สถานะ session จาก `GET /api/session` (route ใหม่, อ่าน httpOnly cookie ฝั่ง server แล้วคืนแค่ loggedIn/role/fullName) เพื่อไม่ต้องอ่าน session ตรงในหน้า/layout ที่เป็น server component (คง ISR ของหน้า public ไว้ได้) — refetch ทุกครั้งที่ `usePathname()` เปลี่ยน (ไม่ใช่แค่ mount ครั้งเดียว) เพราะ login/logout redirect ผ่าน server action ไม่ทำให้ component นี้ remount เอง ถ้า refetch แค่ตอน mount ลิงก์จะค้างสถานะเดิมหลัง login/logout จนกว่าจะ refresh หน้าเอง
    - ตำแหน่งใน header ตั้งใจวาง `AccountLink` เป็นตัวสุดท้าย (หลัง "ตะกร้า") เสมอ — ถ้ายังไม่ login แสดงแค่ลิงก์ "เข้าสู่ระบบ" ไปหน้า `/login`; ถ้า login แล้วแสดง 2 อย่างคู่กัน: (1) ลิงก์ "สวัสดี, {fullName}" ที่พาไปหน้าโปรไฟล์ตาม role (`tenant_admin`/`super_admin` → `/admin`, `vendor` → `/vendor`, `member` → `/account`) และ (2) ปุ่ม "ออกจากระบบ" — เรียก `logoutAction` (`src/lib/auth/actions.ts`) ตรงๆ ผ่าน `<form action={logoutAction}>` แบบเดียวกับปุ่มออกจากระบบในหน้า `/account`/`/admin`/`/vendor` (import server action เข้า client component ได้ปกติเพราะไฟล์นั้นมี `"use server"` อยู่แล้ว ไม่ต้องเพิ่ม API route แยก) ทดสอบผ่านแล้วทั้ง login/logout สลับสถานะทันทีโดยไม่ต้อง refresh หน้า (2026-08-13)

    **ตะกร้า/checkout ที่ทำไว้แล้ว** (ดู [docs/checkout-and-payment.md](./docs/checkout-and-payment.md) ก่อนแก้ไขส่วนนี้เสมอ):
    - **ตะกร้าเป็น client-side ล้วนๆ** เก็บใน localStorage (`src/lib/cart/CartContext.tsx`, key `amulet-cart`) — สคีมาไม่มีตาราง Cart ตะกร้าจะกลายเป็น `Order`/`OrderItem` จริงก็ต่อเมื่อกดยืนยันคำสั่งซื้อสำเร็จเท่านั้น อย่าไปหาตาราง cart ใน DB เพราะไม่มี
    - ราคา/สต็อกที่ใช้คำนวณตอนสร้างออร์เดอร์ **ดึงจาก DB สดเสมอ** ไม่เชื่อค่าที่ client ส่งมาใน `cartItems` JSON (กัน manipulate ราคา) — ดู `createOrderAction` ใน `src/lib/checkout/actions.ts`
    - คำนวณราคาแบบ pure function ล้วนอยู่ที่ `src/lib/checkout/pricing.ts` (`calculatePricing`, `pickBestPromotion` — ไม่มี `"server-only"` เพราะต้อง import ไปใช้ preview ราคาฝั่ง client ใน `CheckoutForm` ได้ด้วย) ส่วน query DB (หา promotion ที่ active ตอนนี้) แยกไว้คนละไฟล์ที่ `src/lib/checkout/promotionQueries.ts` (มี `"server-only"`) — ลำดับคำนวณตรงตาม docs เป๊ะ: Subtotal → ส่วนลดร้าน (เลือกตัวลดเยอะสุดถ้ามีหลายโปร ไม่ทบกัน) → ส่วนลดสมาชิกจากยอดที่เหลือ → ค่าส่ง → ยอดรวม
    - **ไม่มี field ค่าส่งมาตรฐานในสคีมา** (มีแค่ `MemberTier.freeShippingEnabled`/`freeShippingMinAmount` ว่า "ฟรีไหม") ใช้ค่าคงที่ `FLAT_SHIPPING_FEE = 50` บาทแทนไปก่อนใน `pricing.ts` — ถ้าต้องให้ร้านตั้งค่าส่งเองต้องเพิ่ม field ใหม่ในสคีมา
    - QR PromptPay generate จริงด้วย `promptpay-qr` + `qrcode` ผ่าน `GET /api/checkout/qr?amount=X` (เพราะต้องรู้ยอดสุทธิที่คำนวณแล้วฝั่ง client ก่อน) fallback ไปใช้ `PaymentInfo.qrImageUrl` ถ้าร้านไม่มี PromptPay
    - **สลิปเก็บไว้ที่ `public/uploads/slips/` บนดิสก์เครื่อง dev เอง** (gitignored) ผ่าน `src/lib/checkout/uploadSlip.ts` — เป็นทางลัดสำหรับ dev ตาม CLAUDE.md ("ใช้ placeholder ก่อน") **โปรดักชันจริงต้องเปลี่ยนไปใช้ object storage (S3)** เพราะไฟล์บนดิสก์แบบนี้หายเมื่อ deploy ใหม่/scale หลาย instance
    - แจ้งเตือนออร์เดอร์ใหม่ตั้งค่าได้ที่ `/admin/notifications`: **Telegram ต่อ Bot API จริง** (`src/lib/notifications/telegram.ts`, ทดสอบแล้วว่า error handling ถูกต้องเมื่อ token ผิด) **ส่วนอีเมลยังเป็น stub** (`src/lib/notifications/email.ts` แค่ log ไม่ได้ส่งจริง เพราะไม่มี API key ของผู้ให้บริการ เช่น Resend/SendGrid) — เรียกจาก `notifyNewOrder()` แบบไม่ `await` ตอนสร้างออร์เดอร์สำเร็จ (fire-and-forget ตาม docs ว่าห้าม block response ลูกค้า)
    - **ไม่มี OCR ตรวจสลิปอัตโนมัติจริง** (ต้องใช้ API แบบ SlipOK/ธนาคารที่มีค่าใช้จ่าย/ต้องสมัครบัญชี ไม่มีให้ตอนนี้) — มีแค่ `Order.slipVerifyStatus` (pending/matched/mismatched/unreadable) ให้ admin กดยืนยันด้วยมือที่ `/admin/orders/[id]` ตามที่ docs บอกว่าต้องมีปุ่มสำรองอยู่แล้ว ถ้าจะต่อ OCR จริงในอนาคต จุดที่ต้องแก้คือหลังบรรทัด `uploadSlipFile()` สำเร็จใน `createOrderAction`
    - Order tracking (`/track-order`, ไม่ต้อง login) และ order confirmation (`/order-confirmation/[orderNumber]`) เคลียร์ตะกร้าฝั่ง client ผ่าน `<CartClearer />` (เพราะ server ไม่รู้จัก localStorage)
    - ทดสอบ end-to-end จริงแล้ว (2026-08-12): guest checkout, member checkout (ยืนยันว่าส่วนลดสมาชิก+ที่อยู่ default ทำงานถูกต้อง), admin ยืนยันสลิป/เปลี่ยนสถานะออร์เดอร์, ทดสอบส่ง Telegram/อีเมลจากหน้า admin

    **Payment gateway (จำลอง) ที่ทำไว้แล้ว** (roadmap ข้อ 7, เสร็จแล้ว 2026-08-12):
    - **เป็น mock gateway ล้วนๆ ไม่ได้ต่อ Omise/2C2P จริง** — ตามคำสั่งชัดเจนของผู้ใช้ว่า "payment gateway ไม่ต้องใช้ให้ confirm ด้วยปุ่มที่หน้าจอเอา" ห้ามเข้าใจผิดว่ายังต้องไปหา API key จริงมาต่อ ปุ่ม "ยืนยันการชำระเงิน" บนหน้า checkout คือ implementation ที่ต้องการแล้ว
    - Schema เพิ่ม `PaymentInfo.gatewayEnabled` (toggle เปิด/ปิดต่อร้าน) และ model `PaymentTransaction` (`Order` 1-to-many, เก็บ `gatewayName`/`transactionRef`/`gatewayStatus`) ตามที่ [docs/database.md](./docs/database.md) แนะนำไว้ล่วงหน้าให้ออกแบบตารางแยกรองรับ gateway ในอนาคต — **ถ้าจะเปลี่ยนไปต่อ gateway จริงในอนาคต จุดเดียวที่ต้องแก้คือ `src/lib/checkout/mockGateway.ts`** ไม่ต้องแก้ schema หรือ checkout flow
    - Toggle เปิดใช้งานที่ `/admin/payment-info` (checkbox "เปิดใช้งาน Payment Gateway (จำลอง)") — ถ้าร้านไม่เปิด ลูกค้าจะเห็นแค่ตัวเลือกโอนเงิน+แนบสลิปเหมือนเดิม ไม่มี UI เปลี่ยนแปลง
    - ตอนเปิดใช้งาน หน้า checkout (`CheckoutForm.tsx`) จะโชว์ radio ให้เลือก "โอนเงิน+แนบสลิป" หรือ "ชำระผ่าน Payment Gateway (ยืนยันทันที)" — เลือก gateway แล้วไม่ต้องแนบสลิป กดปุ่มเดียวจบ
    - `createOrderAction` (`src/lib/checkout/actions.ts`) แยก flow ตาม `paymentMethod`: ฝั่ง gateway จะสร้าง order ด้วย `status: "verified"` ทันที (ข้าม `pending_verify`) และสร้างแถว `PaymentTransaction` คู่กันในทรานแซกชันเดียวกับการสร้างออร์เดอร์/ตัดสต็อก — เช็คซ้ำฝั่ง server เสมอว่า `paymentInfo.gatewayEnabled` เป็น true ก่อนยอมให้ใช้ (กัน client ปลอม `paymentMethod=gateway` ทั้งที่ร้านไม่ได้เปิด)
    - `/admin/orders/[id]` แสดง section "การชำระผ่าน Payment Gateway (จำลอง)" (gatewayName/ref/status/เวลา) แทนที่ section สลิปโดยอัตโนมัติเมื่อออร์เดอร์นั้นมี `PaymentTransaction` ผูกอยู่ — admin ไม่ต้องกดยืนยันสลิปเองสำหรับออร์เดอร์ที่จ่ายผ่าน gateway เพราะยืนยันไปแล้วตอนสร้างออร์เดอร์
    - ทดสอบ end-to-end จริงแล้วใน browser (2026-08-12): เปิด toggle → checkout เลือก gateway → ยืนยันทันทีไม่ต้องรอตรวจสลิป → เช็คใน `/admin/orders` เห็นสถานะ "ยืนยันแล้ว" ทันที → เปิดดู detail เห็น transaction ref/status ถูกต้อง; flow โอนเงิน+แนบสลิปเดิมยังทำงานปกติไม่มี regression

    **ระบบผู้ขายหลายราย (marketplace) ที่ทำไว้แล้ว** (roadmap ข้อ 8, เสร็จแล้ว 2026-08-12, ดู [docs/marketplace-vendors.md](./docs/marketplace-vendors.md) ก่อนแก้ไขส่วนนี้เสมอ):
    - เลือก implement เป็น **"หลายผู้ขายในร้านเดียว"** ตามที่ผู้ใช้ระบุ (คล้าย Shopee/Lazada ที่มีร้านย่อยหลายร้านในแพลตฟอร์มเดียว) — ไม่ใช่การขยาย multi-tenant เดิม และไม่ใช่แค่เพิ่ม role staff กลางๆ
    - Schema เพิ่ม model `Vendor` (ผูก tenant, มี `status` active/suspended, เก็บข้อมูลบัญชีธนาคารไว้อ้างอิงจ่ายเงิน manual) + `Products.VendorId`/`Users.VendorId`/`OrderItems.VendorId` (nullable ทั้งหมด — `NULL` = ของร้านเอง)
    - Role ใหม่ `vendor` ใน `Users.Role`, session payload เพิ่ม `vendorId`, ป้องกันเส้นทาง `/vendor/**` ด้วย `src/proxy.ts` (ต้อง login และเป็น role `vendor` เท่านั้น), มี `requireVendor()` helper ใน `src/lib/auth/actions.ts`
    - **แอดมิน tenant สร้างบัญชี vendor เองเท่านั้น** ที่ `/admin/vendors` (ไม่มี public signup กันสแปม) — สร้าง `Vendor` + `User` พร้อมกันในทรานแซกชันเดียว, ปุ่มระงับ/เปิดใช้งานแทนการลบถาวร
    - Vendor **เพิ่มพระเครื่องเองได้** ที่ `/vendor/products` (มีปุ่มเพิ่มพระเครื่องใหม่ที่ `/vendor/products/new`) และ**เห็น/จัดการได้เฉพาะของตัวเองเท่านั้น** — ทั้งหน้า list (`src/app/vendor/products/page.tsx` query ด้วย `where: { vendorId: session.vendorId }`) และทุก action แก้/ลบ (`src/lib/vendor-products/actions.ts` เช็ค `vendorId` ซ้ำอีกชั้นกันไม่ให้แก้/เดา productId ของ vendor อื่น) ฟอร์มใช้คำว่า "พระเครื่อง" แทน "สินค้า" ทั้งหมด (แก้ตามที่ผู้ใช้ระบุ 2026-08-17), เรียงฟิลด์ SKU ไว้ก่อนชื่อ, field ที่บังคับกรอกมีดอกจันทร์สีแดงกำกับ, SKU จำกัดไม่เกิน 10 ตัวอักษร — รูปพระเครื่องรองรับ**อัปโหลดไฟล์โดยตรงและหลายรูปแล้ว** (เปลี่ยนจาก URL เดิม, เก็บที่ `public/uploads/products/` เหมือน pattern เดียวกับสลิปโอนเงิน) **บังคับอัปโหลดอย่างน้อย 1 รูป ไม่เกิน 10 รูป** — ถ้าติ๊ก "มีใบรับประกัน" จะโชว์ช่องอัปโหลด**รูปใบรับประกันแยกต่างหาก บังคับอย่างน้อย 1 รูป ไม่เกิน 3 รูป** (เก็บเป็น `ProductImage.imageType = "certificate"` เหมือน pattern เดิมของสินค้าที่ seed ไว้) — **หน้าที่ลูกค้าสั่งซื้อ (`/products/[id]`, `/cart`) ไม่แสดงรหัส SKU ให้ลูกค้าเห็นอีกต่อไป** (กันลูกค้าสับสนถ้าเห็นรหัสคล้ายกัน) SKU ยังโชว์ปกติในหน้าฝั่งแอดมิน/vendor เอง (`/admin/orders/[id]`, `/vendor/orders`, `/vendor/products`)
    - **Vendor แก้ theme ร้านและเลขบัญชีธนาคารรับเงินของตัวเองไม่ได้** — พอร์ทัล `/vendor/*` มีแค่ dashboard/products/orders ไม่มีหน้า settings ให้แก้เอง ทั้งสองอย่างต้องให้ `tenant_admin` แก้ให้: **theme** เป็นระดับ tenant ทั้งร้าน แก้ได้ที่ `/admin/settings` เท่านั้น (`/vendor/**` ถูกบล็อกไม่ให้เข้า `/admin/**` โดย `src/proxy.ts`) ส่วน **เลขบัญชี/ชื่อบัญชี/ธนาคาร** (`Vendor.bankName/accountName/accountNumber`) แก้ได้ที่ `/admin/vendors/[id]/edit` เท่านั้น (`src/lib/vendors/actions.ts`) — เหมือนข้อจำกัดเรื่องรหัสผ่านที่ vendor เปลี่ยนเองไม่ได้เช่นกัน (ต้องให้ tenant_admin แก้ให้ผ่าน DB โดยตรง)
    - **ฝั่งแอดมิน (`tenant_admin`) ยังไม่มีหน้าจัดการสินค้าของร้านเอง** (สินค้าที่ `Products.VendorId = NULL`) — ต่างจาก vendor ที่มีหน้า CRUD ให้แล้ว สินค้าของร้านเองยังต้องแก้ผ่าน DB/seed script โดยตรง (ดูรายละเอียดที่ roadmap ข้อ "ราคาขาย default จากต้นทุน" ด้านล่าง)
    - **สินค้าของ vendor ที่ถูกระงับจะถูกซ่อนจากหน้าร้านทันที** ผ่าน `visibleVendorFilter` (export จาก `src/lib/products/queries.ts`) — ต้อง spread เข้า `where` ของทุก query สินค้าฝั่ง storefront เสมอ (`products/queries.ts`, `home/queries.ts`, `provinces/queries.ts`, `monks/queries.ts` ใช้ครบแล้ว) ถ้าเพิ่ม query สินค้าฝั่ง storefront ใหม่ห้ามลืมใส่
    - **ไม่มีการแยกออร์เดอร์ตาม vendor** — cart ที่มีสินค้าหลาย vendor ปนกันยังสร้างเป็น `Order` เดียว จ่ายเงิน/จัดส่งเป็นก้อนเดียวเหมือนเดิม; `OrderItems.VendorId` แค่ snapshot ผู้ขาย ณ เวลาซื้อไว้ (เหมือน `ProductName`) ให้ vendor ดูออร์เดอร์ย้อนหลังของตัวเองได้ที่ `/vendor/orders` (อ่านอย่างเดียว กรอง item เฉพาะของตัวเอง แก้สถานะออร์เดอร์ไม่ได้ — ยังเป็นหน้าที่ tenant_admin เหมือนเดิม)
    - **ไม่มีระบบคอมมิชชั่น/payout อัตโนมัติ** — เก็บแค่บัญชีธนาคาร vendor ไว้ให้แอดมินโอนเงินเอง manual ตามที่ระบุไว้ใน docs ว่าเป็นขอบเขตที่ตัดออกตอนสร้างฟีเจอร์นี้
    - Seed ผู้ขาย demo ไว้แล้วที่ `prisma/seed-data/vendors.ts` (รัน `npx prisma db seed` เพื่อ apply — ต้องรันผ่าน `prisma db seed` ไม่ใช่ `tsx prisma/seed.ts` ตรงๆ เพราะ `.env` ถูกโหลดผ่าน `prisma.config.ts` ที่ผูกกับคำสั่งนี้เท่านั้น): login `vendor@amulet-thailand.demo` / `Passw0rd!` (ร้าน "ร้านพระเครื่องสมชาย" มีสินค้า 2 ชิ้น)
    - ทดสอบ end-to-end จริงแล้วใน browser (2026-08-12): แอดมินสร้าง vendor ใหม่ → vendor login เพิ่มสินค้า → สินค้าโชว์หน้าร้านพร้อมป้าย "ขายโดย" → ลูกค้าซื้อสินค้าผสม (ของร้าน+ของ vendor) ในออร์เดอร์เดียว → vendor เห็นเฉพาะรายการของตัวเองที่ `/vendor/orders` (990 บาท) ส่วนแอดมินเห็นออร์เดอร์เต็มทั้ง 2 รายการที่ `/admin/orders/[id]` → แอดมินระงับ vendor → จำนวนสินค้าหน้า `/products` ลดจาก 20 เหลือ 17 ทันที (สินค้าของ vendor ที่ถูกระงับหายหมด สินค้าของร้านเองไม่กระทบ)

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
    | [docs/marketplace-vendors.md](./docs/marketplace-vendors.md) | ระบบผู้ขายหลายรายในร้านเดียว (marketplace): บทบาท vendor, การจัดการสินค้า/ผู้ขาย, การมองเห็นสินค้าบนหน้าร้าน, ขอบเขตที่ยังไม่ทำ |
    | [docs/vendor-enhancements-plan.md](./docs/vendor-enhancements-plan.md) | แผนงาน roadmap ข้อ 9 (เสร็จครบ 6 ข้อแล้ว 2026-08-17): แตกฟีเจอร์เสริมฝั่ง vendor ทั้ง 6 ข้อเป็น step (requirement → ER diagram → migration → backend → UI → testing → docs) |

    เวลาทำงานในหัวข้อไหน ให้เปิดไฟล์ docs ที่เกี่ยวข้องอ่านก่อนเริ่มเขียนโค้ดเสมอ

    ## ฟีเจอร์หลักที่ต้องมี

    - [x] หน้าหลัก (Home) — ดู [docs/home-and-catalog.md](./docs/home-and-catalog.md) (เสร็จแล้ว 2026-08-12 — hero, แถบ filter ด่วน, พระเครื่องเข้ามาใหม่ (ซ่อนถ้าว่าง), สินค้าขายดี (ซ่อนถ้าว่าง — ยังไม่มี order จริงจนกว่าจะทำ checkout), แนะนำตามจังหวัด/หลวงพ่อ; หน้านี้ตั้ง `export const revalidate = 60` เพราะ Next.js จะ static-prerender ทิ้งไว้เฉยๆ ถ้าไม่ตั้ง ทำให้สินค้าใหม่ไม่อัปเดต; มี `GET /api/products?sort=newest&days=N` แยกไว้ตามที่ docs ขอ)
    - [x] หน้ารายการสินค้า พร้อม filter แบบ multi-select: จังหวัด, หลวงพ่อ/วัด, หมวดหมู่, ช่วงราคา — ดู [docs/home-and-catalog.md](./docs/home-and-catalog.md) (`/products` เสร็จแล้ว 2026-08-12 — filter เป็น plain GET form สะท้อนใน URL query string ตรงตาม convention)
    - [x] หน้ารายละเอียดสินค้า, หน้าโปรไฟล์หลวงพ่อ/วัด (`/monks/[slug]`), หน้าตามจังหวัด (`/provinces/[slug]`) (เสร็จแล้ว 2026-08-12 — gallery เรียงรูปพระก่อนแล้วตามด้วยรูปใบรับประกันตาม docs/database.md, การ์ดสินค้าใช้ shared component `ProductCard` ร่วมกันทั้ง 3 หน้า)
    - [x] ตะกร้าสินค้า + checkout + ตรวจสลิปอัตโนมัติ + ติดตามสถานะออร์เดอร์ + payment gateway — ดู [docs/checkout-and-payment.md](./docs/checkout-and-payment.md) (เสร็จแล้ว 2026-08-12 — payment gateway เป็น **mock/จำลองตามที่ผู้ใช้ระบุชัดเจน** ไม่ได้ต่อ Omise/2C2P จริง ดูรายละเอียดที่ section "Payment gateway (จำลอง)" ด้านล่าง; **OCR ตรวจสลิปอัตโนมัติ (SlipOK ฯลฯ) ยังไม่ได้ทำ** เพราะต้องใช้ API key ของผู้ให้บริการจริงซึ่งไม่มีให้ตอนนี้ — มีปุ่ม "ยืนยันด้วยมือ" ที่ admin ใช้แทนได้เต็มรูปแบบ)
    - [x] ระบบ Login แยก Admin/สมาชิก/Guest + ที่อยู่ default + ระดับสมาชิก (MemberTier) พร้อมส่วนลด/จัดส่งฟรีตามระดับ — ดู [docs/auth-and-membership.md](./docs/auth-and-membership.md) (ครบทั้งหมดแล้ว 2026-08-12 รวมส่วนลด/จัดส่งฟรีที่ใช้จริงตอน checkout)
    - [x] ราคาขาย default จากต้นทุน (ปรับ % ได้) + โปรโมชั่นส่วนลดทั้งร้านตามช่วงเวลา — ดู [docs/checkout-and-payment.md](./docs/checkout-and-payment.md) (โปรโมชั่นทั้งร้าน + `Tenant.defaultMarkupPercent` แก้ได้จาก `/admin/settings` เสร็จแล้ว 2026-08-12 — **แต่ยังไม่มีหน้า admin เพิ่ม/แก้สินค้า** ดังนั้น "คำนวณราคาขาย default อัตโนมัติตอนกรอกต้นทุน" ยังไม่มีจุดให้ใช้งานจริง เพราะสินค้าตอนนี้มาจาก seed script เท่านั้น รอทำตอนมีหน้าจัดการสินค้า)
    - [x] ระบบเปลี่ยนธีมร้าน — ดู [docs/theming.md](./docs/theming.md) (เสร็จแล้ว 2026-08-12 — ดูรายละเอียดที่ section "ระบบธีม" ด้านล่าง)
    - [x] ระบบผู้ขายหลายราย — ดู [docs/marketplace-vendors.md](./docs/marketplace-vendors.md) (เสร็จแล้ว 2026-08-12 — เลือก implement เป็น "หลายผู้ขายในร้านเดียว" ตามที่ผู้ใช้ระบุ ไม่ใช่ role คั่นกลางแบบ staff ดูรายละเอียดที่ section "ระบบผู้ขายหลายราย" ด้านล่าง)

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
    6. ✅ ตะกร้า + checkout (รวมส่วนลด/จัดส่งฟรีสมาชิก) + ตรวจสลิปอัตโนมัติ + ติดตามสถานะออร์เดอร์ — [docs/checkout-and-payment.md](./docs/checkout-and-payment.md)
    7. ✅ เชื่อมต่อ payment gateway — เป็น **mock/จำลอง** ตามที่ผู้ใช้ระบุ ("payment gateway ไม่ต้องใช้ให้ confirm ด้วยปุ่มที่หน้าจอเอา") ไม่ได้ต่อ Omise/2C2P จริง — ดูรายละเอียดที่ [docs/checkout-and-payment.md](./docs/checkout-and-payment.md)
    8. ✅ ระบบผู้ขายหลายราย — เลือก implement เป็น "หลายผู้ขายในร้านเดียว" (marketplace ภายใน tenant เดียว คล้าย Shopee/Lazada) ตามที่ผู้ใช้ระบุ — ดูรายละเอียดที่ [docs/marketplace-vendors.md](./docs/marketplace-vendors.md)
    9. ✅ ฟีเจอร์เสริมฝั่ง vendor (เสร็จครบ 6 ข้อแล้ว 2026-08-17) — รหัสสินค้า (SKU), vendor เปลี่ยนรหัสผ่านเอง, แจ้งเตือน vendor เมื่อมีออร์เดอร์ใหม่, หน้าแอดมินสรุป/ส่งรายการสั่งซื้อให้ vendor พร้อมปุ่ม Send Notify, เลขพัสดุ/tracking number ต่อ vendor (ลิงก์ 17TRACK), ระบบ payout/commission (escrow + รอบจ่าย + หักค่าคอมมิชชั่น, ไม่มี cron จริง ใช้ manual trigger) — ดูรายละเอียดที่ [docs/marketplace-vendors.md](./docs/marketplace-vendors.md) หัวข้อ "ฟีเจอร์เสริมฝั่ง vendor ที่ทำแล้ว" และ [docs/vendor-enhancements-plan.md](./docs/vendor-enhancements-plan.md)
