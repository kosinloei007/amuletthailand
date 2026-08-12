// บัญชีทดสอบสำหรับ dev — รหัสผ่านเดียวกันหมดเพื่อความง่ายตอนทดสอบ (ห้ามใช้ค่านี้กับ production)

export const DEV_PASSWORD = "Passw0rd!";

export type UserSeed = {
  email: string;
  phone?: string;
  fullName: string;
  role: "super_admin" | "tenant_admin" | "member";
  belongsToTenant: boolean; // false = super_admin ไม่ผูก tenant
  memberTierName?: string; // เฉพาะ role = "member"
};

export const users: UserSeed[] = [
  {
    email: "superadmin@amulet-thailand.demo",
    fullName: "ผู้ดูแลระบบสูงสุด",
    role: "super_admin",
    belongsToTenant: false,
  },
  {
    email: "admin@amulet-thailand.demo",
    phone: "0800000001",
    fullName: "แอดมินร้านอมูเล็ตไทยแลนด์",
    role: "tenant_admin",
    belongsToTenant: true,
  },
  {
    email: "member@amulet-thailand.demo",
    phone: "0800000002",
    fullName: "สมาชิกทดสอบ",
    role: "member",
    belongsToTenant: true,
    memberTierName: "สมาชิกทั่วไป",
  },
];
