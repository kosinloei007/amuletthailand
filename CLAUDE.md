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
| Password | ดูใน `.env.local` (ไม่ commit ลง git) |
| Database | `AmuletTK` |

Connection string เต็มเก็บไว้ที่ `DATABASE_URL` ใน `.env.local` แล้ว (ดูรูปแบบได้จาก `.env.example`) ห้าม hardcode password ลงไฟล์ที่ commit เข้า git เด็ดขาด

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

- [ ] หน้าหลัก (Home) — ดู [docs/home-and-catalog.md](./docs/home-and-catalog.md)
- [ ] หน้ารายการสินค้า พร้อม filter แบบ multi-select: จังหวัด, หลวงพ่อ/วัด, หมวดหมู่, ช่วงราคา — ดู [docs/home-and-catalog.md](./docs/home-and-catalog.md)
- [ ] หน้ารายละเอียดสินค้า, หน้าโปรไฟล์หลวงพ่อ/วัด (`/monks/[slug]`), หน้าตามจังหวัด (`/provinces/[slug]`)
- [ ] ตะกร้าสินค้า + checkout + ตรวจสลิปอัตโนมัติ + ติดตามสถานะออร์เดอร์ + payment gateway — ดู [docs/checkout-and-payment.md](./docs/checkout-and-payment.md)
- [ ] ระบบ Login แยก Admin/สมาชิก/Guest + ที่อยู่ default + ระดับสมาชิก (MemberTier) พร้อมส่วนลด/จัดส่งฟรีตามระดับ — ดู [docs/auth-and-membership.md](./docs/auth-and-membership.md)
- [ ] ราคาขาย default จากต้นทุน (ปรับ % ได้) + โปรโมชั่นส่วนลดทั้งร้านตามช่วงเวลา — ดู [docs/checkout-and-payment.md](./docs/checkout-and-payment.md)
- [ ] ระบบเปลี่ยนธีมร้าน — ดู [docs/theming.md](./docs/theming.md)
- [ ] ระบบผู้ขายหลายราย (ถ้าต้องการรองรับ marketplace ไม่ใช่แค่ร้านเดียว)

## Conventions

- ใช้ URL slug ภาษาอังกฤษ (เช่น `luang-pho-koon`, `phitsanulok`) แต่แสดงผล UI เป็นภาษาไทย
- Component ต้องรับค่าธีมผ่าน CSS variables เท่านั้น ห้าม hardcode hex สีในไฟล์ component
- ชื่อไฟล์/โฟลเดอร์เป็นภาษาอังกฤษ, ข้อความ UI เป็นภาษาไทย
- ทุก filter (จังหวัด, หลวงพ่อ, หมวดหมู่) ต้องสะท้อนใน URL query string เสมอ

## Roadmap แนะนำ

1. Setup โปรเจกต์ + data model + seed ข้อมูลตัวอย่าง (จังหวัด, หลวงพ่อ, สินค้า) — [docs/database.md](./docs/database.md)
2. ระบบ Login/สิทธิ์ผู้ใช้ (Admin/สมาชิก/Guest) + หน้าจัดการที่อยู่สมาชิก + ตั้งค่าระดับสมาชิก (MemberTier) — [docs/auth-and-membership.md](./docs/auth-and-membership.md)
3. หน้ารายการสินค้า + ระบบ filter จังหวัด/หลวงพ่อ — [docs/home-and-catalog.md](./docs/home-and-catalog.md)
4. หน้ารายละเอียดสินค้า + หน้าโปรไฟล์หลวงพ่อ/จังหวัด
5. ระบบธีม + หน้าตั้งค่าร้าน — [docs/theming.md](./docs/theming.md)
6. ตะกร้า + checkout (รวมส่วนลด/จัดส่งฟรีสมาชิก) + ตรวจสลิปอัตโนมัติ + ติดตามสถานะออร์เดอร์ — [docs/checkout-and-payment.md](./docs/checkout-and-payment.md)
7. เชื่อมต่อ payment gateway (ถ้าต้องการ)
8. ระบบผู้ขายหลายราย (ถ้าต้องการ)
