# แผนงาน: ฟีเจอร์เสริมฝั่ง vendor (Roadmap ข้อ 9)

> กลับไปหน้าหลัก: [../CLAUDE.md](../CLAUDE.md) · ที่มาของ requirement: [marketplace-vendors.md](./marketplace-vendors.md) หัวข้อ "แผนที่จะเพิ่ม"

เอกสารนี้แตกงาน 6 ข้อใน roadmap ข้อ 9 ออกเป็น step การทำงาน (requirement → ER diagram → migration → backend → UI → testing → docs) เพื่อใช้ตอนเริ่ม implement จริง ไม่ใช่ requirement ใหม่ — requirement ตัวเต็มยังอยู่ที่ [marketplace-vendors.md](./marketplace-vendors.md)

## ลำดับที่แนะนำ

เรียงจากงานที่ไม่มี dependency ไปหางานที่ต้องรองานอื่นก่อน:

1. รหัสสินค้า (SKU) — อิสระ ไม่ผูกกับข้อไหน
2. vendor เปลี่ยนรหัสผ่านเอง — อิสระ ไม่ผูกกับข้อไหน
3. แจ้งเตือน vendor เมื่อมีออร์เดอร์ใหม่ — ต้องมีช่องทางติดต่อต่อ vendor ก่อน (เพิ่ม field ใน `Vendor`)
4. หน้าแอดมินสรุป/ส่งรายการสั่งซื้อให้ vendor — ใช้ข้อมูลที่มีอยู่แล้ว (`OrderItem.VendorId`) แต่ยิงแจ้งเตือนต่อ vendor ได้ดีขึ้นถ้าทำข้อ 3 ก่อน
5. เลขพัสดุ/tracking number ต่อ vendor — ต้องมีตาราง `Shipment` ใหม่
6. ระบบ payout/commission — ผูกกับสถานะ shipped/tracking (ข้อ 5) ในทางตรรกะของ escrow ควรทำหลังสุด

## 1. รหัสสินค้า (SKU)

- **Requirement (ยืนยันแล้ว 2026-08-14, แก้ไขจากรอบก่อน):** **vendor กรอกเอง** ไม่ auto-generate, **บังคับกรอก (required)** — **unique ต่อ tenant** (ร้านเดียวกันห้ามซ้ำ ข้ามร้านซ้ำได้) — ต้อง validate ตอนบันทึกทั้งสองเงื่อนไข (ห้ามว่าง + ห้ามซ้ำในร้านเดียวกัน) ก่อน insert/update, มี unique index กันซ้ำระดับ DB ด้วยเป็น safety net
- **ER diagram / schema:** เพิ่ม `Products.Sku` — คอลัมน์เป็น nullable ระดับ DB (เพราะสินค้าเก่าที่ seed ไว้ยังไม่มีค่า ต้อง backward-compatible กับ data เดิม) แต่ฟอร์ม/action บังคับกรอกเสมอสำหรับสินค้าที่สร้าง/แก้ไขใหม่ทุกครั้ง (รวมถึงบังคับให้กรอกตอนแก้ไขสินค้าเก่าที่ยังไม่มี SKU ด้วย) — unique index ร่วมกับ `TenantId`
- **Migration:** แก้ `prisma/schema.prisma` → `npx prisma db push` (สินค้าเก่าที่มีอยู่แล้วปล่อย SKU เป็น null ไปก่อนได้ ไม่ทำ backfill — จะถูกบังคับกรอกเองตอน vendor เข้ามาแก้ไขสินค้านั้นครั้งถัดไป)
- **Backend:** เพิ่ม field `sku` (required) ในฟอร์ม `src/lib/vendor-products/actions.ts` — validate ห้ามว่างและ unique ต่อ `vendorId`'s tenant ก่อน insert/update, คืน error ที่ชัดเจนถ้าซ้ำ (เช่น "รหัสสินค้านี้มีอยู่แล้วในร้าน") หรือว่าง ("กรุณากรอกรหัสสินค้า")
- **UI:** ช่องกรอก SKU เป็น **required field** (มี `*` /validation แบบเดียวกับช่องอื่นที่บังคับกรอกในฟอร์มเดิม) ในฟอร์มสินค้า (`/vendor/products/new`, `/vendor/products/[id]/edit`) พร้อมข้อความ error ตอนกรอกซ้ำ/เว้นว่าง + แสดงในตะกร้า/รายละเอียดออร์เดอร์/หน้าสรุปส่งให้ vendor (ข้อ 4)
- **Testing:** สร้างสินค้าใหม่กรอก SKU → ลองกรอกซ้ำเช็ค error → เช็คว่า SKU โชว์ครบทุกจุดที่เกี่ยวกับคำสั่งซื้อ
- **Docs:** อัปเดต [database.md](./database.md) (DDL), [marketplace-vendors.md](./marketplace-vendors.md)

## 2. vendor เปลี่ยนรหัสผ่านเอง

- **Requirement:** ไม่มีจุดคลุมเครือ — ใช้ `verifyPassword()`/`hashPassword()` ที่มีอยู่แล้ว (`src/lib/auth/password.ts`) ตาม pattern เดียวกับ register/login
- **ER diagram / schema:** ไม่ต้องแก้ schema (ใช้ `Users.PasswordHash` เดิม)
- **Migration:** ไม่มี
- **Backend:** action ใหม่ `changeVendorPasswordAction` ใน `src/lib/auth/actions.ts` หรือไฟล์แยก — เช็ครหัสผ่านเดิมถูกต้องก่อน hash รหัสใหม่
- **UI:** หน้าใหม่ `/vendor/settings` (ฟอร์ม รหัสผ่านเดิม/รหัสผ่านใหม่/ยืนยันรหัสผ่านใหม่) + ลิงก์จาก `/vendor` dashboard
- **Testing:** เปลี่ยนรหัสผ่านสำเร็จ → logout → login ด้วยรหัสใหม่จริง, ทดสอบกรอกรหัสผ่านเดิมผิด
- **Docs:** ลบข้อจำกัดนี้ออกจาก [marketplace-vendors.md](./marketplace-vendors.md) หัวข้อ "ขอบเขตที่ยังไม่ทำ"

## 3. แจ้งเตือน vendor เมื่อมีออร์เดอร์ใหม่

- **Requirement (ยืนยันแล้ว 2026-08-14):** config ช่องทาง (Telegram chat id) ให้ **tenant_admin กรอกให้ vendor ก่อน** ผ่าน `/admin/vendors/[id]/edit` — ไม่รอข้อ 2 (vendor self-service settings), อีเมลใช้ `Users.Email` เดิมของ user ที่ผูก vendor นั้นอยู่แล้วไม่ต้องกรอกเพิ่ม
- **ER diagram / schema:** เพิ่ม `Vendors.TelegramChatId` (nullable), ใช้ `Users.Email` เดิมของ user ที่ผูก vendor นั้นสำหรับอีเมล (ไม่ต้องเพิ่ม field ใหม่), เพิ่ม `Vendors.NotifyTelegramEnabled`/`NotifyEmailEnabled` (bool)
- **Migration:** `npx prisma db push`
- **Backend:** ฟังก์ชันใหม่ `notifyVendorNewOrder()` (คู่กับ `notifyNewOrder()` เดิมใน `src/lib/notifications/notifyOrder.ts`) — เรียกแบบ fire-and-forget เหมือนเดิม ไม่ block response ลูกค้า ส่งเฉพาะเนื้อหาสั้นๆ ("มีออร์เดอร์ใหม่ เข้าไปดูที่ /vendor/orders")
- **UI:** เพิ่มช่องกรอก Telegram chat id + checkbox เปิด/ปิดช่องทางใน `/admin/vendors/[id]/edit`
- **Testing:** สร้าง order ที่มีสินค้าของ vendor → เช็ค Telegram message ส่งถึงจริง (อีเมลยังเป็น stub log เหมือนฝั่งแอดมิน)
- **Docs:** อัปเดต [checkout-and-payment.md](./checkout-and-payment.md) (เพิ่ม flow นี้ต่อจาก `notifyNewOrder()` เดิม) และ [marketplace-vendors.md](./marketplace-vendors.md)

## 4. หน้าแอดมินสรุป/ส่งรายการสั่งซื้อให้ vendor

- **Requirement (ยืนยันแล้ว 2026-08-14):** "แยกกลุ่มตามที่อยู่ลูกค้า" = แยกตาม **order** (1 order = 1 ที่อยู่จัดส่งอยู่แล้วตาม checkout เดิม ไม่มี multi-address ต่อ order) ไม่ใช่การรวมหลาย order ของลูกค้าคนเดียวกันเข้าด้วยกัน สเปกเต็มจากตัวอย่างที่ผู้ใช้ให้ (order เดียวมี 5 รายการ มาจาก 3 vendor):
  - **ฝั่งแอดมิน:** ต่อ 1 order แสดง "ที่อยู่ลูกค้า XXX มี 5 รายการ" แล้ว breakdown แยกต่อ vendor (เช่น vendor A 2 รายการ, vendor B 2 รายการ, vendor C 1 รายการ) — มีปุ่ม **Send Notify แยกต่อ vendor แต่ละราย** ในหน้าเดียวกัน (กดของ vendor A ก็แจ้งเฉพาะ vendor A ไม่กระทบ vendor อื่น)
  - **ฝั่ง vendor:** หลังกด Send Notify แล้ว vendor login เข้ามาต้องเห็นหน้า **"รอการจัดส่ง"** สรุปเฉพาะของตัวเอง ต่อ order/ที่อยู่ — เช่น vendor A เห็น "ที่อยู่ลูกค้า XXX ต้องส่งสินค้า 2 รายการ", vendor C เห็น "ที่อยู่ลูกค้า XXX ต้องส่งสินค้า 1 รายการ" (ไม่เห็นเลขรวม 5 รายการหรือของ vendor อื่นเลย)
  - หน้า `/vendor/orders` เดิมที่มีอยู่แล้ว (group `OrderItem` ตาม `orderId`, กรองเฉพาะของ vendor ตัวเอง) ใกล้เคียงกับที่ต้องการอยู่แล้ว — สิ่งที่ต้องเพิ่มคือ **เช็คว่าหน้านี้โชว์ที่อยู่จัดส่งของ order ด้วยหรือยัง** ถ้ายังไม่มีต้องเพิ่ม และอาจต้อง reframe เป็นมุมมอง "รอการจัดส่ง" (badge ใหม่/ยังไม่ส่ง vs ส่งแล้ว — ผูกกับ field tracking ในข้อ 5 ถ้าทำคู่กัน)
- **ER diagram / schema:** ไม่ต้องเพิ่มตารางใหม่ ใช้ข้อมูลจาก `Order` + `OrderItem` + `Vendor` ที่มีอยู่แล้ว (join ผ่าน `OrderItems.VendorId`)
- **Migration:** ไม่มี (ยกเว้นทำร่วมกับข้อ 3 ที่ต้องเพิ่ม field ใน `Vendor`)
- **Backend:** query ฝั่งแอดมินใหม่ — ต่อ order, group `OrderItem` ตาม `vendorId` นับจำนวนรายการต่อ vendor — action ปุ่ม Send Notify ต่อ vendor เรียก `notifyVendorNewOrder()` จากข้อ 3 (ระบุ orderId ให้ vendor รู้ว่า order ไหน)
- **UI:** เพิ่มใน `/admin/orders/[id]` (order เดียวอยู่แล้วในระบบ) ส่วน breakdown ต่อ vendor + ปุ่ม Send Notify ต่อแถว (ไม่ต้องทำหน้าแยกใหม่ เพราะ scope คือ "ต่อ order" ไม่ใช่ "รวมทุก order ของ vendor" — อันหลังคือหน้า `/vendor/orders` ที่ vendor เห็นเองอยู่แล้ว), ปรับ `/vendor/orders` ให้โชว์ที่อยู่จัดส่งชัดเจนต่อ order ถ้ายังไม่มี
- **Testing:** สร้าง order ผสมหลาย vendor → กด Send Notify ของ vendor A → เช็คว่า vendor B/C ไม่ได้รับแจ้งเตือน และ vendor A login เข้ามาเห็นแค่จำนวนรายการของตัวเอง ไม่เห็นยอดรวม/ของ vendor อื่น
- **Docs:** อัปเดต [marketplace-vendors.md](./marketplace-vendors.md)

## 5. เลขพัสดุ/tracking number ต่อ vendor

- **Requirement:** ยืนยัน list ขนส่งที่ต้องมีใน dropdown (ไปรษณีย์ไทย, Kerry, Flash, J&T, Ninja Van, DHL ตามที่ระบุไว้ + free-text สำรอง) และ URL template ต่อขนส่งสำหรับ auto-generate ลิงก์ tracking
- **ER diagram / schema:** ตารางใหม่ `Shipment` — `Id, OrderId (FK Orders), VendorId (FK Vendors, nullable สำหรับสินค้าร้านเอง), CarrierName, TrackingNumber, ShippedAt, CreatedAt` (1 order อาจมีหลาย shipment ถ้าแต่ละ vendor แพ็คแยกกัน)
- **Migration:** เพิ่ม model `Shipment` ใน `prisma/schema.prisma` → `npx prisma db push`
- **Backend:** action ใหม่ให้ vendor (หรือ tenant_admin) กรอก carrier + tracking number ต่อ order ของตัวเอง — auto-generate tracking URL จาก template ตอน query ไม่ต้องเก็บ URL ใน DB
- **UI:** ฟอร์มกรอก tracking ใน `/vendor/orders` (per order-vendor group), แสดงลิงก์ tracking กดได้ใน `/track-order` (ฝั่งลูกค้า) และ `/admin/orders/[id]`
- **Testing:** กรอก tracking number → เช็คว่าโชว์ลิงก์ถูก carrier ใน `/track-order` จริง
- **Docs:** อัปเดต [database.md](./database.md) (DDL ตาราง `Shipment`), [checkout-and-payment.md](./checkout-and-payment.md), [marketplace-vendors.md](./marketplace-vendors.md)
- **หมายเหตุ:** ส่วน "แจ้งเตือนลูกค้าอัตโนมัติทันทีที่กรอกเลขพัสดุ" ตาม requirement เดิมให้เตรียม field/hook ไว้แต่ **ปิดใช้งานไว้ก่อน** (ไม่ต่อ SMS/email จริง) — ไม่ต้องต่อ API ขนส่งเพื่อดึงสถานะเรียลไทม์

## 6. ระบบ payout/commission

- **Requirement:** ยืนยันตัวเลข: ระยะเวลา escrow กี่วันหลัง `shipped` (ตัวอย่างในเอกสาร 3-7 วัน), รอบจ่ายกี่วัน (ตัวอย่าง 7/15 วัน), ตั้งได้ต่อร้านหรือ fix ค่าเดียว, `commissionPercent` default เท่าไหร่ตอนสร้าง vendor ใหม่
- **ER diagram / schema:**
  - เพิ่ม `Vendors.CommissionPercent` (decimal)
  - เพิ่ม `OrderItems.PayoutStatus` (`pending | eligible | paid`) + `OrderItems.PayoutEligibleAt`
  - ตารางใหม่ `VendorPayoutBatch` — `Id, VendorId, PeriodStart, PeriodEnd, GrossAmount, CommissionAmount, GatewayFeeAmount, NetAmount, Status (pending|paid), PaidAt`
  - ความสัมพันธ์: `OrderItem` ผูกเข้า batch ผ่าน field `PayoutBatchId` (nullable จนกว่าจะถูกจัดเข้ารอบ)
- **Migration:** เพิ่ม model ใหม่ + field ใหม่ → `npx prisma db push`
- **Backend:**
  - job/คำสั่งคำนวณ `payoutEligibleAt` เมื่อ order เปลี่ยนเป็น `shipped` (eligible = shippedAt + escrow days)
  - job/action รวมยอด `OrderItem` ที่ `payoutStatus = eligible` ของแต่ละ vendor เข้า `VendorPayoutBatch` ตามรอบ — คำนวณ commission และ gateway fee (เฉพาะ order ที่จ่ายผ่าน `PaymentTransaction`) หักออกจากยอดขายก่อนได้ `NetAmount`
  - action ให้ tenant_admin กดติ๊ก "จ่ายแล้ว" → อัปเดต `VendorPayoutBatch.Status = paid` + `OrderItems.PayoutStatus = paid`
- **UI:** หน้า `/admin/vendors/[id]/payouts` แสดงยอดรอจ่าย/ประวัติจ่ายแล้ว, ปุ่ม "ทำเครื่องหมายว่าจ่ายแล้ว" (ไม่มีการโอนเงินอัตโนมัติจริง)
- **Testing:** จำลอง order ผ่าน gateway + order โอนเงิน → เช็ค commission/gateway fee คำนวณถูกต้อง แยกกันตามประเภทการจ่าย, เช็คว่า order ที่ยังไม่พ้น escrow ไม่ถูกจัดเข้ารอบ
- **Docs:** อัปเดต [database.md](./database.md) (DDL `VendorPayoutBatch` + field ใหม่), [marketplace-vendors.md](./marketplace-vendors.md)
- **ขอบเขตที่ยังตัดออก (ตาม requirement เดิม):** ไม่ต่อ bank API/PromptPay transfer API จริง, ไม่มี instant payout

## หลังทำเสร็จแต่ละข้อ

- ย้าย bullet ของข้อนั้นจาก "แผนที่จะเพิ่ม" ไปเป็นหัวข้อ "ทำแล้ว" ใน [marketplace-vendors.md](./marketplace-vendors.md)
- ติ๊ก roadmap ข้อ 9 ใน [../CLAUDE.md](../CLAUDE.md) เป็น ✅ เมื่อครบทั้ง 6 ข้อ (หรือแตกเป็นข้อย่อย 9.1–9.6 ถ้าต้องการ track ทีละข้อ)
