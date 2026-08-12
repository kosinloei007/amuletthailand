// ระดับสมาชิกตั้งต้นของร้าน demo — ต้องมี isDefault=true เพียงระดับเดียว (ตามข้อบังคับใน docs/database.md)

export type MemberTierSeed = {
  name: string;
  sortOrder: number;
  discountType: "percentage" | "fixed_amount" | "none";
  discountValue: number;
  freeShippingEnabled: boolean;
  freeShippingMinAmount?: number;
  isDefault: boolean;
};

export const memberTiers: MemberTierSeed[] = [
  {
    name: "สมาชิกทั่วไป",
    sortOrder: 1,
    discountType: "percentage",
    discountValue: 3,
    freeShippingEnabled: false,
    isDefault: true,
  },
  {
    name: "VIP",
    sortOrder: 2,
    discountType: "percentage",
    discountValue: 8,
    freeShippingEnabled: true,
    isDefault: false,
  },
];
