# ฐานข้อมูล (Data Model + SQL Server DDL)

> กลับไปหน้าหลัก: [../CLAUDE.md](../CLAUDE.md)

## โครงสร้างข้อมูลหลัก (Data model แบบ conceptual)

### Product (พระเครื่อง)
```
id, name, description,
costPrice,       // ราคาต้นทุน (แอดมินกรอก)
price,           // ราคาขาย — ค่าเริ่มต้น = costPrice * (1 + tenant.defaultMarkupPercent/100) แต่แก้ไขเป็นราคาอื่นเองได้เสมอ
stock,
provinceId,      // FK -> Province
monkId,          // FK -> Monk (หลวงพ่อ/หลวงปู่ผู้สร้าง)
templeName,      // ชื่อวัด
era,             // ปีสร้าง/ยุค เช่น "ปี 2517" หรือ "กรุเก่า"
category,        // เช่น พระสมเด็จ, เนื้อชิน, เหรียญปั๊ม, ล็อกเก็ต
images[],        // รูปพระ + รูปใบรับประกัน (แยกด้วย ProductImage.imageType — ดูด้านล่าง)
hasCertificate,  // true/false — พระองค์นี้มีใบรับประกันหรือไม่
certificateInfo, // ข้อความอธิบายใบรับรอง/สมาคมออกใบรับรอง (กรอกได้เฉพาะเมื่อ hasCertificate = true)
tenantId          // FK -> Tenant (ร้านไหนเป็นเจ้าของสินค้า)
```
ราคาขาย default: ตอนแอดมินกรอก `costPrice` ให้ระบบคำนวณ `price` เริ่มต้นให้อัตโนมัติจาก `defaultMarkupPercent` ของร้าน (ค่าเริ่มต้นระบบตั้งไว้ที่ 30%) แล้วให้แอดมินแก้ไขราคาที่คำนวณได้นี้เป็นตัวเลขอื่นก่อนบันทึกได้เสมอ — เป็นแค่ค่าเริ่มต้นเพื่อความสะดวก ไม่ใช่การบังคับราคา

### ProductImage (รูปสินค้า — รวมรูปพระและรูปใบรับประกัน)
```
id, productId,
imageUrl,
imageType,   // "product" | "certificate" — ใช้แยกรูปพระปกติกับรูปใบรับประกัน
sortOrder    // ลำดับการแสดงภายในกลุ่มเดียวกัน (product หรือ certificate)
```
กติกาการแสดงผล: เรียงรูปตาม `imageType` โดยให้ `"product"` ขึ้นก่อนเสมอ แล้วตามด้วย `"certificate"` ต่อท้าย (ภายในแต่ละกลุ่มเรียงตาม `sortOrder`) — ฟอร์มเพิ่ม/แก้ไขสินค้าฝั่ง admin ต้องมีช่องอัปโหลดรูปใบรับประกันแยกต่างหาก และ**แสดงเฉพาะเมื่อแอดมินติ๊กว่า `hasCertificate = true` เท่านั้น**

### Province (จังหวัด)
```
id, nameTh, nameEn, region   // ใช้ 77 จังหวัดของไทยเป็นชุดข้อมูลตั้งต้น
```

### Monk (หลวงพ่อ/หลวงปู่/พระเกจิ)
```
id, name,          // เช่น "หลวงพ่อคูณ ปริสุทฺโธ"
templeName,        // วัดประจำ
provinceId,        // จังหวัดที่วัดตั้งอยู่
bio                // ประวัติย่อ (ถ้ามี)
```

### Tenant (ร้านค้าแต่ละราย — สำหรับระบบ multi-theme)
```
id, shopName, slug, ownerContact,
themeId,               // FK -> Theme
paymentInfo,           // FK -> PaymentInfo (บัญชีรับโอนของร้านนี้)
notifyConfig,          // FK -> NotifyConfig (ตั้งค่าการแจ้งเตือนของร้านนี้)
defaultMarkupPercent   // เปอร์เซ็นต์บวกราคาขาย default จากต้นทุน (ค่าเริ่มต้นระบบ = 30) — แก้ไขได้จากหน้าตั้งค่าร้าน
```

### StorePromotion (ส่วนลดทั้งร้าน — ตามช่วงเวลา)
```
id, tenantId,
name,             // เช่น "โปรเดือนเกิดเจ้าของร้าน", "ลดต้อนรับปีใหม่"
discountType,     // "percentage" | "fixed_amount"
discountValue,    // เช่น 5 (%) หรือ 100 (บาท)
scheduleType,     // "recurring_month" (วนซ้ำทุกปีในเดือนที่กำหนด) | "date_range" (ช่วงวันที่ตายตัว)
recurringMonth,   // 1-12 — ใช้เมื่อ scheduleType = "recurring_month" เช่น เดือนเกิดเจ้าของร้าน
startDate, endDate, // ใช้เมื่อ scheduleType = "date_range"
isActive          // เปิด/ปิดโปรโมชั่นนี้ได้โดยไม่ต้องลบทิ้ง
```
ใช้สำหรับส่วนลดที่มีผลกับ**สินค้าทุกชิ้นในร้าน**พร้อมกัน (ต่างจาก `MemberTier` ที่เป็นส่วนลดเฉพาะสมาชิก) ระบบต้องเช็คทุกครั้งที่คำนวณราคา (หน้ารายการสินค้า, หน้ารายละเอียดสินค้า, checkout) ว่ามี `StorePromotion` ที่ `isActive = true` และอยู่ในช่วงเวลาที่กำหนดหรือไม่ — ถ้ามีมากกว่า 1 รายการพร้อมกัน ให้ใช้อันที่ให้ส่วนลดมากที่สุดเพียงรายการเดียว (ไม่ทบกัน) รายละเอียดการคำนวณตอน checkout ดูที่ [checkout-and-payment.md](./checkout-and-payment.md)

### PaymentInfo (บัญชีรับโอนของร้าน — ต่อ tenant)
```
id, tenantId,
bankName,          // เช่น "ธนาคารกสิกรไทย"
accountName,       // ชื่อบัญชี
accountNumber,     // เลขบัญชี
promptpayId,       // เบอร์/เลขที่ผูก PromptPay สำหรับ generate QR
qrImageUrl         // (ทางเลือก) รูป QR คงที่ ถ้าไม่ generate แบบไดนามิก
```
หมายเหตุ: เลขบัญชี/PromptPay ของแต่ละร้านเป็นข้อมูลที่เจ้าของร้านกรอกเองผ่านหน้าตั้งค่า ห้าม hardcode ในโค้ด

### NotifyConfig (ตั้งค่าการแจ้งเตือนออร์เดอร์ใหม่ — ต่อ tenant)
```
id, tenantId,
channels: {
  telegram: { enabled, botToken, chatId },
  email:    { enabled, toAddress }
}
```
ให้เจ้าของร้านเปิด/ปิดและกรอกค่าผ่านหน้า admin ได้เอง (อย่างน้อยต้องเลือกได้ว่าจะส่งไปช่องทางไหนบ้าง เปิดพร้อมกันหลายช่องทางได้)

### User (ผู้ใช้ระบบ — admin/สมาชิก)
```
id, tenantId,        // สมาชิก/แอดมินสังกัดร้านไหน (SuperAdmin อาจไม่ผูก tenant)
email, phone, passwordHash,
fullName,
role,                 // "super_admin" | "tenant_admin" | "member"
tierId,               // FK -> MemberTier (เฉพาะ role = "member", ถ้ายังไม่กำหนด = ระดับเริ่มต้นของร้าน)
isActive,
createdAt
```
หมายเหตุ: ลูกค้าทั่วไป (guest) ไม่ต้องมี record ใน `User` ก็สั่งซื้อได้ปกติ — guest checkout ยังคงเปิดไว้เสมอ รายละเอียดสิทธิ์แต่ละ role ดูที่ [auth-and-membership.md](./auth-and-membership.md)

### UserAddress (ที่อยู่จัดส่งของสมาชิก — ใช้เป็น default ตอน checkout)
```
id, userId,
fullName, phone, address, subDistrict, district, province, postalCode,
isDefault
```

### MemberTier (ระดับสมาชิก — ตั้งค่าได้หลายระดับต่อร้าน)
```
id, tenantId,
name,                 // เช่น "สมาชิกทั่วไป", "VIP", "VVIP"
sortOrder,            // ลำดับการแสดง/ลำดับขั้นของระดับ
discountType,         // "percentage" | "fixed_amount" | "none"
discountValue,        // เช่น 5 (%) หรือ 100 (บาท)
freeShippingEnabled,  // true/false
freeShippingMinAmount,// ยอดขั้นต่ำที่ได้จัดส่งฟรี (ถ้า null = ฟรีทุกยอด)
isDefault             // true = ระดับเริ่มต้นที่สมาชิกใหม่ทุกคนได้รับอัตโนมัติ (ต้องมี 1 ระดับต่อร้านเท่านั้น)
```
แต่ละร้านตั้งได้หลายระดับ (เช่น ทั่วไป/VIP/VVIP) แล้วผูกสมาชิกแต่ละคนเข้ากับระดับผ่าน `User.tierId` — การเลื่อนระดับ (เช่น อัตโนมัติตามยอดสั่งซื้อสะสม หรือแอดมินปรับเอง) เป็นเรื่อง business logic ที่ร้านกำหนดเอง ไม่ผูกไว้ตายตัวใน schema รายละเอียดดูที่ [auth-and-membership.md](./auth-and-membership.md)

### Order (คำสั่งซื้อ)
```
id, tenantId, userId,   // userId เป็น null ได้ถ้าเป็น guest checkout
items[], subtotalAmount, discountAmount, shippingFee, totalAmount,
appliedTierId,             // เก็บ tier ที่ใช้คำนวณส่วนลด ณ ตอนสั่งซื้อ (กันปัญหาถ้าภายหลังเปลี่ยนระดับ/ปรับค่า tier)
appliedStorePromotionId,   // เก็บโปรโมชั่นทั้งร้านที่ใช้จริง ณ ตอนสั่งซื้อ (ถ้ามี)
shippingInfo: { fullName, phone, address, subDistrict, district, province, postalCode, note },
paymentSlipUrl,     // รูป slip ที่ลูกค้าอัปโหลด
status              // เช่น "pending_verify" | "verified" | "shipped" | "cancelled"
```
รายละเอียด flow การสั่งซื้อดูที่ [checkout-and-payment.md](./checkout-and-payment.md)

### Theme (ธีมของร้าน)
```
id, name,
colors: { primary, accent, background, surface, text },
logoUrl, fontFamily,
layoutStyle       // เช่น "classic" | "minimal" | "gold-temple"
```
รายละเอียดระบบธีมดูที่ [theming.md](./theming.md)

## ฐานข้อมูล (Database Design — SQL Server)

ใช้ Microsoft SQL Server เป็นฐานข้อมูลหลัก ด้านล่างคือ DDL (T-SQL) ที่ตรงกับ data model ด้านบน พร้อม index สำหรับ query ที่ใช้บ่อย (filter จังหวัด/หลวงพ่อ, สินค้าใหม่, แยกตาม tenant)

หลักการออกแบบ:
- ทุกตารางหลักมี `TenantId` เพื่อรองรับ multi-tenant ระดับข้อมูลในฐานเดียว (shared DB, shared schema)
- ใช้ `INT IDENTITY(1,1)` เป็น PK หลักเพื่อความง่ายและ performance ในการ join/index
- ข้อความภาษาไทยใช้ `NVARCHAR` เสมอ (ไม่ใช้ `VARCHAR`) เพื่อรองรับ Unicode
- เงินใช้ `DECIMAL(10,2)`, เวลาใช้ `DATETIME2`
- ตั้ง `CreatedAt`/`UpdatedAt` ทุกตารางเพื่อรองรับ audit และ query "สินค้าใหม่"

```sql
-- ===== Tenants (ร้านค้าแต่ละราย) =====
CREATE TABLE Tenants (
    TenantId            INT IDENTITY(1,1) PRIMARY KEY,
    ShopName            NVARCHAR(200)   NOT NULL,
    Slug                NVARCHAR(100)   NOT NULL UNIQUE,
    OwnerContact        NVARCHAR(200)   NULL,
    ThemeId             INT             NULL,
    DefaultMarkupPercent DECIMAL(5,2)   NOT NULL DEFAULT 30.00, -- % บวกราคาขาย default จากต้นทุน แก้ไขได้
    EscrowDays          INT             NOT NULL DEFAULT 7,  -- จำนวนวันหลัง order เป็น shipped ก่อนยอดของ vendor พร้อมจัดเข้ารอบจ่าย (เพิ่มตอนทำ roadmap ข้อ 9.6)
    PayoutCycleDays     INT             NOT NULL DEFAULT 15, -- ข้อมูลอ้างอิงรอบจ่าย (ไม่มี cron อัตโนมัติ แอดมินกดสร้างรอบเอง)
    CreatedAt           DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt           DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME()
);

-- ===== Themes (ธีมของร้าน) =====
CREATE TABLE Themes (
    ThemeId         INT IDENTITY(1,1) PRIMARY KEY,
    Name            NVARCHAR(100)   NOT NULL,
    PrimaryColor    NVARCHAR(20)    NOT NULL,
    AccentColor     NVARCHAR(20)    NOT NULL,
    BackgroundColor NVARCHAR(20)    NOT NULL,
    SurfaceColor    NVARCHAR(20)    NOT NULL,
    TextColor       NVARCHAR(20)    NOT NULL,
    LogoUrl         NVARCHAR(500)   NULL,
    FontFamily      NVARCHAR(100)   NULL,
    LayoutStyle     NVARCHAR(50)    NOT NULL DEFAULT 'classic',
    CreatedAt       DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME()
);

ALTER TABLE Tenants
    ADD CONSTRAINT FK_Tenants_Themes FOREIGN KEY (ThemeId) REFERENCES Themes(ThemeId);

-- ===== Provinces (จังหวัด — seed 77 จังหวัด) =====
CREATE TABLE Provinces (
    ProvinceId      INT IDENTITY(1,1) PRIMARY KEY,
    NameTh          NVARCHAR(100)   NOT NULL,
    NameEn          NVARCHAR(100)   NOT NULL,
    Slug            NVARCHAR(100)   NOT NULL UNIQUE,
    Region          NVARCHAR(50)    NULL
);

-- ===== Monks (หลวงพ่อ/หลวงปู่/พระเกจิ) =====
CREATE TABLE Monks (
    MonkId          INT IDENTITY(1,1) PRIMARY KEY,
    Name            NVARCHAR(200)   NOT NULL,
    Slug            NVARCHAR(150)   NOT NULL UNIQUE,
    TempleName      NVARCHAR(200)   NULL,
    ProvinceId      INT             NULL,
    Bio             NVARCHAR(MAX)   NULL,
    CreatedAt       DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Monks_Provinces FOREIGN KEY (ProvinceId) REFERENCES Provinces(ProvinceId)
);

-- ===== Categories (หมวดหมู่พระ) =====
CREATE TABLE Categories (
    CategoryId      INT IDENTITY(1,1) PRIMARY KEY,
    Name            NVARCHAR(100)   NOT NULL,
    Slug            NVARCHAR(100)   NOT NULL UNIQUE
);

-- ===== MemberTiers (ระดับสมาชิก — หลายระดับต่อร้าน) =====
CREATE TABLE MemberTiers (
    MemberTierId            INT IDENTITY(1,1) PRIMARY KEY,
    TenantId                 INT            NOT NULL,
    Name                     NVARCHAR(100)  NOT NULL,   -- เช่น "สมาชิกทั่วไป", "VIP", "VVIP"
    SortOrder                INT            NOT NULL DEFAULT 0,
    DiscountType             NVARCHAR(20)   NOT NULL DEFAULT 'none', -- percentage | fixed_amount | none
    DiscountValue             DECIMAL(10,2)  NOT NULL DEFAULT 0,
    FreeShippingEnabled       BIT            NOT NULL DEFAULT 0,
    FreeShippingMinAmount     DECIMAL(10,2)  NULL,
    IsDefault                 BIT            NOT NULL DEFAULT 0,   -- ระดับเริ่มต้นของสมาชิกใหม่ (ต้องมี 1 แถวต่อ tenant)
    CONSTRAINT FK_MemberTiers_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId)
);

CREATE INDEX IX_MemberTiers_Tenant ON MemberTiers(TenantId);
-- บังคับให้แต่ละร้านมี default tier ได้แค่ระดับเดียว
CREATE UNIQUE INDEX UX_MemberTiers_Tenant_Default ON MemberTiers(TenantId) WHERE IsDefault = 1;

-- ===== StorePromotions (ส่วนลดทั้งร้านตามช่วงเวลา เช่น เดือนเกิดเจ้าของร้าน) =====
CREATE TABLE StorePromotions (
    StorePromotionId   INT IDENTITY(1,1) PRIMARY KEY,
    TenantId            INT            NOT NULL,
    Name                NVARCHAR(200)  NOT NULL,   -- เช่น "โปรเดือนเกิดเจ้าของร้าน"
    DiscountType        NVARCHAR(20)   NOT NULL,   -- percentage | fixed_amount
    DiscountValue       DECIMAL(10,2)  NOT NULL,
    ScheduleType         NVARCHAR(20)   NOT NULL,   -- recurring_month | date_range
    RecurringMonth       TINYINT        NULL,       -- 1-12 ใช้เมื่อ ScheduleType = 'recurring_month'
    StartDate            DATE           NULL,        -- ใช้เมื่อ ScheduleType = 'date_range'
    EndDate               DATE           NULL,
    IsActive              BIT            NOT NULL DEFAULT 1,
    CreatedAt             DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt             DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_StorePromotions_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId),
    CONSTRAINT CK_StorePromotions_ScheduleType CHECK (ScheduleType IN ('recurring_month', 'date_range')),
    CONSTRAINT CK_StorePromotions_RecurringMonth CHECK (RecurringMonth IS NULL OR RecurringMonth BETWEEN 1 AND 12)
);

CREATE INDEX IX_StorePromotions_Tenant_Active ON StorePromotions(TenantId, IsActive);

-- ===== Users (แอดมิน/สมาชิก) =====
CREATE TABLE Users (
    UserId          INT IDENTITY(1,1) PRIMARY KEY,
    TenantId        INT             NULL,   -- NULL ได้สำหรับ SuperAdmin ที่ไม่ผูกร้านใดร้านหนึ่ง
    Email           NVARCHAR(200)   NOT NULL UNIQUE,
    Phone           NVARCHAR(20)    NULL,
    PasswordHash    NVARCHAR(300)   NOT NULL,
    FullName        NVARCHAR(200)   NOT NULL,
    Role            NVARCHAR(20)    NOT NULL DEFAULT 'member', -- super_admin | tenant_admin | member
    MemberTierId    INT             NULL,   -- ใช้เฉพาะ Role = 'member'
    IsActive        BIT             NOT NULL DEFAULT 1,
    CreatedAt       DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt       DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Users_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId),
    CONSTRAINT FK_Users_MemberTiers FOREIGN KEY (MemberTierId) REFERENCES MemberTiers(MemberTierId)
);

CREATE INDEX IX_Users_Tenant_Role ON Users(TenantId, Role);
CREATE INDEX IX_Users_MemberTier ON Users(MemberTierId);

-- ===== UserAddresses (ที่อยู่จัดส่ง default ของสมาชิก) =====
CREATE TABLE UserAddresses (
    UserAddressId   INT IDENTITY(1,1) PRIMARY KEY,
    UserId          INT             NOT NULL,
    FullName        NVARCHAR(200)   NOT NULL,
    Phone           NVARCHAR(20)    NOT NULL,
    Address         NVARCHAR(500)   NOT NULL,
    SubDistrict     NVARCHAR(100)   NULL,
    District        NVARCHAR(100)   NULL,
    Province        NVARCHAR(100)   NULL,
    PostalCode      NVARCHAR(10)    NULL,
    IsDefault       BIT             NOT NULL DEFAULT 1,
    CONSTRAINT FK_UserAddresses_Users FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE
);

CREATE INDEX IX_UserAddresses_User_Default ON UserAddresses(UserId, IsDefault);

-- ===== Products (พระเครื่อง) =====
CREATE TABLE Products (
    ProductId       INT IDENTITY(1,1) PRIMARY KEY,
    TenantId        INT             NOT NULL,
    Name            NVARCHAR(300)   NOT NULL,
    Sku             NVARCHAR(100)   NULL,   -- รหัสสินค้า, vendor กรอกเอง, unique ต่อ TenantId (ดู index ด้านล่าง) — NULL ได้เฉพาะสินค้าเก่าที่ยังไม่ถูกแก้ไขหลังเพิ่มฟีเจอร์นี้
    Description     NVARCHAR(MAX)   NULL,
    CostPrice       DECIMAL(10,2)   NULL,   -- ราคาต้นทุน ใช้คำนวณราคาขาย default (ไม่บังคับกรอก)
    Price           DECIMAL(10,2)   NOT NULL, -- ราคาขาย: default = CostPrice * (1 + Tenant.DefaultMarkupPercent/100) แก้ไขเองได้เสมอ
    Stock           INT             NOT NULL DEFAULT 0,
    ProvinceId      INT             NULL,
    MonkId          INT             NULL,
    CategoryId      INT             NULL,
    TempleName      NVARCHAR(200)   NULL,
    Era             NVARCHAR(100)   NULL,
    HasCertificate  BIT             NOT NULL DEFAULT 0,   -- มีใบรับประกันหรือไม่
    CertificateInfo NVARCHAR(500)   NULL,                 -- กรอกเฉพาะเมื่อ HasCertificate = 1
    IsActive        BIT             NOT NULL DEFAULT 1,
    CreatedAt       DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt       DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Products_Tenants   FOREIGN KEY (TenantId)   REFERENCES Tenants(TenantId),
    CONSTRAINT FK_Products_Provinces FOREIGN KEY (ProvinceId) REFERENCES Provinces(ProvinceId),
    CONSTRAINT FK_Products_Monks     FOREIGN KEY (MonkId)     REFERENCES Monks(MonkId),
    CONSTRAINT FK_Products_Categories FOREIGN KEY (CategoryId) REFERENCES Categories(CategoryId)
);

-- index สำหรับหน้า "พระเครื่องเข้ามาใหม่" และ filter หลัก
CREATE INDEX IX_Products_Tenant_CreatedAt ON Products(TenantId, CreatedAt DESC) WHERE IsActive = 1;
CREATE INDEX IX_Products_Province ON Products(ProvinceId);
CREATE INDEX IX_Products_Monk ON Products(MonkId);
CREATE INDEX IX_Products_Category ON Products(CategoryId);
-- SKU ไม่ซ้ำกันภายในร้านเดียวกัน (ข้ามร้านซ้ำได้) — filtered เพราะ Sku เป็น NULL ได้สำหรับสินค้าเก่า
CREATE UNIQUE INDEX UX_Products_Tenant_Sku ON Products(TenantId, Sku) WHERE Sku IS NOT NULL;

-- ===== ProductImages (รูปสินค้าหลายรูป — รวมรูปพระและรูปใบรับประกัน) =====
CREATE TABLE ProductImages (
    ProductImageId  INT IDENTITY(1,1) PRIMARY KEY,
    ProductId       INT             NOT NULL,
    ImageUrl        NVARCHAR(500)   NOT NULL,
    ImageType       NVARCHAR(20)    NOT NULL DEFAULT 'product', -- 'product' | 'certificate'
    SortOrder       INT             NOT NULL DEFAULT 0,
    CONSTRAINT FK_ProductImages_Products FOREIGN KEY (ProductId) REFERENCES Products(ProductId) ON DELETE CASCADE,
    CONSTRAINT CK_ProductImages_ImageType CHECK (ImageType IN ('product', 'certificate'))
);

-- ดึงรูปเรียงลำดับให้ 'product' ขึ้นก่อนเสมอ แล้วตามด้วย 'certificate' ต่อท้าย:
-- SELECT * FROM ProductImages WHERE ProductId = @ProductId
-- ORDER BY CASE ImageType WHEN 'product' THEN 0 ELSE 1 END, SortOrder;
CREATE INDEX IX_ProductImages_Product_Type_Sort ON ProductImages(ProductId, ImageType, SortOrder);


-- ===== PaymentInfos (บัญชีรับโอนต่อร้าน) =====
CREATE TABLE PaymentInfos (
    PaymentInfoId   INT IDENTITY(1,1) PRIMARY KEY,
    TenantId        INT             NOT NULL UNIQUE,
    BankName        NVARCHAR(100)   NOT NULL,
    AccountName     NVARCHAR(200)   NOT NULL,
    AccountNumber   NVARCHAR(50)    NOT NULL,
    PromptPayId     NVARCHAR(50)    NULL,
    QrImageUrl      NVARCHAR(500)   NULL,
    CONSTRAINT FK_PaymentInfos_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId)
);

-- ===== NotifyConfigs (ตั้งค่าแจ้งเตือนต่อร้าน) =====
CREATE TABLE NotifyConfigs (
    NotifyConfigId      INT IDENTITY(1,1) PRIMARY KEY,
    TenantId             INT            NOT NULL UNIQUE,
    TelegramEnabled      BIT            NOT NULL DEFAULT 0,
    TelegramBotToken     NVARCHAR(200)  NULL,
    TelegramChatId       NVARCHAR(100)  NULL,
    EmailEnabled         BIT            NOT NULL DEFAULT 0,
    EmailToAddress       NVARCHAR(200)  NULL,
    CONSTRAINT FK_NotifyConfigs_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId)
);

-- ===== Orders (คำสั่งซื้อ) =====
CREATE TABLE Orders (
    OrderId             INT IDENTITY(1,1) PRIMARY KEY,
    TenantId            INT             NOT NULL,
    UserId              INT             NULL,      -- NULL = guest checkout, ไม่ NULL = สมาชิกที่ล็อกอิน
    OrderNumber         NVARCHAR(50)    NOT NULL UNIQUE,   -- เลขออร์เดอร์ให้ลูกค้าใช้ track
    SubtotalAmount      DECIMAL(10,2)   NOT NULL,
    DiscountAmount      DECIMAL(10,2)   NOT NULL DEFAULT 0,
    ShippingFee         DECIMAL(10,2)   NOT NULL DEFAULT 0,
    TotalAmount         DECIMAL(10,2)   NOT NULL,
    AppliedMemberTierId INT             NULL,   -- เก็บ tier ที่ใช้คำนวณส่วนลด ณ ตอนสั่งซื้อ กันปัญหาถ้าภายหลังเปลี่ยนระดับ/ปรับค่า tier
    AppliedStorePromotionId INT         NULL,   -- เก็บโปรโมชั่นทั้งร้านที่ใช้จริง ณ ตอนสั่งซื้อ (ถ้ามี)
    FullName            NVARCHAR(200)   NOT NULL,
    Phone               NVARCHAR(20)    NOT NULL,
    Address             NVARCHAR(500)   NOT NULL,
    SubDistrict         NVARCHAR(100)   NULL,
    District            NVARCHAR(100)   NULL,
    Province            NVARCHAR(100)   NULL,
    PostalCode          NVARCHAR(10)    NULL,
    Note                NVARCHAR(500)   NULL,
    PaymentSlipUrl      NVARCHAR(500)   NULL,
    SlipVerifyStatus    NVARCHAR(20)    NOT NULL DEFAULT 'pending', -- pending | matched | mismatched | unreadable
    Status              NVARCHAR(20)    NOT NULL DEFAULT 'pending_verify', -- pending_verify | verified | shipped | cancelled
    CreatedAt           DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt           DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Orders_Tenants FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId),
    CONSTRAINT FK_Orders_Users   FOREIGN KEY (UserId)   REFERENCES Users(UserId),
    CONSTRAINT FK_Orders_MemberTiers FOREIGN KEY (AppliedMemberTierId) REFERENCES MemberTiers(MemberTierId),
    CONSTRAINT FK_Orders_StorePromotions FOREIGN KEY (AppliedStorePromotionId) REFERENCES StorePromotions(StorePromotionId)
);

CREATE INDEX IX_Orders_Tenant_Status ON Orders(TenantId, Status);
CREATE INDEX IX_Orders_Phone_OrderNumber ON Orders(Phone, OrderNumber); -- สำหรับหน้าติดตามสถานะ

-- ===== OrderItems (รายการสินค้าในออร์เดอร์) =====
CREATE TABLE OrderItems (
    OrderItemId     INT IDENTITY(1,1) PRIMARY KEY,
    OrderId         INT             NOT NULL,
    ProductId       INT             NOT NULL,
    ProductName     NVARCHAR(300)   NOT NULL,   -- เก็บชื่อ ณ เวลาซื้อ กันสินค้าถูกแก้ชื่อทีหลัง
    UnitPrice       DECIMAL(10,2)   NOT NULL,
    Quantity        INT             NOT NULL DEFAULT 1,
    -- สถานะ payout ต่อ vendor (เพิ่มตอนทำ roadmap ข้อ 9.6) — เฉพาะรายการที่มี VendorId ไม่ NULL
    PayoutStatus     NVARCHAR(20)   NOT NULL DEFAULT 'pending', -- pending | eligible | paid
    PayoutEligibleAt DATETIME2      NULL,   -- = Order.ShippedAt + Tenant.EscrowDays, ตั้งตอน order เปลี่ยนเป็น shipped
    PayoutBatchId    INT            NULL,   -- FK -> VendorPayoutBatches, NULL จนกว่าจะถูกจัดเข้ารอบ
    CONSTRAINT FK_OrderItems_Orders   FOREIGN KEY (OrderId)   REFERENCES Orders(OrderId) ON DELETE CASCADE,
    CONSTRAINT FK_OrderItems_Products FOREIGN KEY (ProductId) REFERENCES Products(ProductId)
);

-- ===== Shipments (เลขพัสดุต่อ order/ผู้ขาย — เพิ่มตอนทำ roadmap ข้อ 9.5) =====
-- 1 order อาจมีหลายแถวถ้าแต่ละ vendor แพ็คส่งแยกกัน (VendorId ผูกกับตาราง Vendors ที่เพิ่มไว้ตอนทำ marketplace, ดู docs/marketplace-vendors.md)
CREATE TABLE Shipments (
    ShipmentId      INT IDENTITY(1,1) PRIMARY KEY,
    OrderId         INT             NOT NULL,
    VendorId        INT             NULL,   -- NULL = สินค้าของร้านเอง (tenant_admin กรอกแทน vendor)
    CarrierName     NVARCHAR(100)   NOT NULL,   -- เก็บไว้แสดงผล/อ้างอิงเท่านั้น ไม่ได้ใช้คำนวณลิงก์ติดตาม
    TrackingNumber  NVARCHAR(100)   NOT NULL,
    ShippedAt       DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedAt       DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Shipments_Orders  FOREIGN KEY (OrderId)  REFERENCES Orders(OrderId) ON DELETE CASCADE,
    CONSTRAINT FK_Shipments_Vendors FOREIGN KEY (VendorId) REFERENCES Vendors(VendorId)
);

CREATE INDEX IX_Shipments_Order ON Shipments(OrderId);
CREATE INDEX IX_Shipments_Vendor ON Shipments(VendorId);

-- ===== VendorPayoutBatches (รอบจ่ายเงินผู้ขาย — escrow + commission, เพิ่มตอนทำ roadmap ข้อ 9.6) =====
-- ไม่มีการโอนเงินอัตโนมัติจริง เก็บไว้แค่คำนวณ/สรุปยอดที่ต้องจ่ายให้ถูกต้องต่อรอบ ให้แอดมินโอนเองนอกระบบแล้วมาติ๊กว่า "จ่ายแล้ว"
CREATE TABLE VendorPayoutBatches (
    PayoutBatchId    INT IDENTITY(1,1) PRIMARY KEY,
    VendorId         INT             NOT NULL,
    PeriodStart      DATETIME2       NOT NULL,
    PeriodEnd        DATETIME2       NOT NULL,
    GrossAmount      DECIMAL(10,2)   NOT NULL,
    CommissionAmount DECIMAL(10,2)   NOT NULL,   -- = GrossAmount * Vendor.CommissionPercent/100 ณ เวลาที่สร้างรอบ (ไม่ recalculate ย้อนหลังถ้า commission % เปลี่ยนทีหลัง)
    GatewayFeeAmount DECIMAL(10,2)   NOT NULL DEFAULT 0, -- เตรียมไว้เฉยๆ ยังไม่มี logic คำนวณจริง (payment gateway ปัจจุบันเป็น mock)
    NetAmount        DECIMAL(10,2)   NOT NULL,   -- = GrossAmount - CommissionAmount - GatewayFeeAmount
    Status           NVARCHAR(20)    NOT NULL DEFAULT 'pending', -- pending | paid
    PaidAt           DATETIME2       NULL,
    CreatedAt        DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_VendorPayoutBatches_Vendors FOREIGN KEY (VendorId) REFERENCES Vendors(VendorId)
);

CREATE INDEX IX_VendorPayoutBatches_Vendor ON VendorPayoutBatches(VendorId);

ALTER TABLE OrderItems
    ADD CONSTRAINT FK_OrderItems_PayoutBatch FOREIGN KEY (PayoutBatchId) REFERENCES VendorPayoutBatches(PayoutBatchId);
```

### หมายเหตุการใช้งานกับ SQL Server

- แนะนำใช้ **Entity Framework Core** (ถ้า backend เป็น .NET) หรือ **Prisma + `sqlserver` provider** (ถ้าเป็น Node.js/Next.js) เพื่อ generate migration จาก schema นี้แทนการรัน SQL มือทุกครั้ง
- คอลัมน์ `OrderNumber` และช่อง `Phone` ใน `Orders` มี index รวมกันไว้รองรับหน้าติดตามสถานะออร์เดอร์ (ค้นด้วยเลขออร์เดอร์ + เบอร์โทร)
- ฟิลด์ `SlipVerifyStatus` ไว้เก็บผลจากระบบตรวจสลิปอัตโนมัติ แยกจาก `Status` ที่เป็นสถานะออร์เดอร์โดยรวม
- ถ้าต้องรองรับ payment gateway ในอนาคต ให้เพิ่มตาราง `PaymentTransactions` แยกต่างหาก (เก็บ `GatewayName`, `TransactionRef`, `GatewayStatus`) ผูกกับ `OrderId` แทนการเพิ่มคอลัมน์ใน `Orders` ตรงๆ เพื่อรองรับหลาย gateway ในอนาคต
- `Shipments.TrackingNumber` ไม่เก็บลิงก์ติดตามพัสดุไว้ในตาราง — generate ลิงก์ 17TRACK (`https://t.17track.net/en#nums={TrackingNumber}`) ตอน query ด้วย helper function เดียว (ดู [checkout-and-payment.md](./checkout-and-payment.md)) เพราะ 17TRACK auto-detect ขนส่งจากเลขพัสดุเองได้ ไม่ต้องเก็บ URL หรือแยก logic ต่อขนส่ง
- `Vendors.CommissionPercent DECIMAL(5,2) NOT NULL DEFAULT 10.00` (เพิ่มตอนทำ roadmap ข้อ 9.6, แก้ต่อ vendor ได้ที่ `/admin/vendors/[id]/edit`) — ตาราง `Vendors` เต็มไม่ได้ซ้ำไว้ในไฟล์นี้ ดู [marketplace-vendors.md](./marketplace-vendors.md) และ `prisma/schema.prisma` เป็นแหล่งอ้างอิงหลัก
- `PasswordHash` ใน `Users` ต้อง hash ด้วย bcrypt/argon2 เท่านั้น ห้ามเก็บรหัสผ่านแบบ plain text หรือ hash เอง
