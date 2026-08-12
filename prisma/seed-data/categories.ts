// หมวดหมู่พระเครื่องตั้งต้น

export type CategorySeed = {
  name: string;
  slug: string;
};

export const categories: CategorySeed[] = [
  { name: "พระสมเด็จ", slug: "phra-somdej" },
  { name: "เนื้อชิน", slug: "nuea-chin" },
  { name: "เหรียญปั๊ม", slug: "rian-pum" },
  { name: "เหรียญหล่อ", slug: "rian-lo" },
  { name: "ล็อกเก็ต", slug: "locket" },
  { name: "รูปหล่อ/รูปเหมือน", slug: "rup-lo" },
  { name: "ตะกรุด", slug: "takrut" },
  { name: "พระผง", slug: "phra-phong" },
];
