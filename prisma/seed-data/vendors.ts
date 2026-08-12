// ผู้ขาย demo สำหรับทดสอบระบบ marketplace (roadmap ข้อ 8) — รหัสผ่านเดียวกับ DEV_PASSWORD ใน users.ts

export type VendorProductSeed = {
  name: string;
  description: string;
  costPrice: number;
  price: number;
  stock: number;
  monkSlug: string;
  provinceSlug: string;
  categorySlug: string;
  templeName: string;
  era: string;
  imageUrl: string;
};

export type VendorSeed = {
  shopName: string;
  contactName: string;
  phone: string;
  email: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  products: VendorProductSeed[];
};

function placeholder(label: string, bg: string) {
  return `https://placehold.co/600x600/${bg}/ffffff?text=${encodeURIComponent(label)}`;
}

export const vendors: VendorSeed[] = [
  {
    shopName: "ร้านพระเครื่องสมชาย",
    contactName: "สมชาย ใจดี",
    phone: "0811111111",
    email: "vendor@amulet-thailand.demo",
    bankName: "ธนาคารไทยพาณิชย์",
    accountName: "สมชาย ใจดี",
    accountNumber: "111-2-22222-3",
    products: [
      {
        name: "เหรียญครูบาศรีวิชัย รุ่นสอง วัดบ้านปาง",
        description: "เหรียญครูบาศรีวิชัย รุ่นสอง เนื้อทองแดง สภาพสวย จากร้านผู้ขายอิสระ",
        costPrice: 1500,
        price: 2500,
        stock: 4,
        monkSlug: "kruba-srivichai",
        provinceSlug: "lamphun",
        categorySlug: "rian-pum",
        templeName: "วัดบ้านปาง",
        era: "ปี 2482",
        imageUrl: placeholder("เหรียญครูบาศรีวิชัย รุ่นสอง", "5a7a4a"),
      },
      {
        name: "ล็อกเก็ตหลวงพ่อคูณ รุ่นพิเศษ (ร้านสมชาย)",
        description: "ล็อกเก็ตหลวงพ่อคูณ รุ่นพิเศษ สร้างจำนวนจำกัด จำหน่ายโดยผู้ขายอิสระ",
        costPrice: 900,
        price: 1500,
        stock: 6,
        monkSlug: "luang-pho-koon",
        provinceSlug: "nakhon-ratchasima",
        categorySlug: "locket",
        templeName: "วัดบ้านไร่",
        era: "ปี 2538",
        imageUrl: placeholder("ล็อกเก็ตหลวงพ่อคูณ", "6b4a2b"),
      },
    ],
  },
];
