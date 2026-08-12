# ระบบธีม (Multi-theme / White-label)

> กลับไปหน้าหลัก: [../CLAUDE.md](../CLAUDE.md) · โครงสร้างตาราง `Themes` ดูที่ [database.md](./database.md)

หลักการ: **แยก content/logic ออกจาก presentation อย่างเด็ดขาด**

1. ธีมทั้งหมดเก็บเป็นไฟล์ config แยก เช่น `themes/*.json` หรือใน DB ตาราง `Theme`
2. ทุกค่าสี ฟอนต์ โลโก้ ต้องดึงจาก theme config ผ่าน CSS variables — ห้าม hardcode สีในคอมโพเนนต์
3. ตัวอย่างโครงสร้างไฟล์ธีม:
```json
{
  "id": "gold-temple",
  "name": "ทองวัด",
  "colors": {
    "primary": "#8a5a2b",
    "accent": "#c9a227",
    "background": "#faf6ee",
    "surface": "#ffffff",
    "text": "#2b2118"
  },
  "logoUrl": "/tenants/wat-thong/logo.png",
  "fontFamily": "Noto Serif Thai",
  "layoutStyle": "classic"
}
```
4. เวลา build/serve หน้าเว็บ ให้ resolve tenant จาก subdomain หรือ path (เช่น `รานA.เว็บ.com` หรือ `เว็บ.com/shop/รานA`) แล้วโหลดธีมของ tenant นั้นมา inject เป็น CSS variables ที่ root
5. ให้มีหน้า "ตั้งค่าร้าน" (admin) ที่เจ้าของร้านปรับสี/โลโก้/ชื่อร้านได้เอง โดยไม่ต้องแก้โค้ด
6. เตรียม theme ตั้งต้นไว้อย่างน้อย 2-3 แบบให้เลือกใช้ทันที (เช่น ธีมทอง-วัด, ธีมมินิมอลขาว-ดำ, ธีมแดง-มงคล)
