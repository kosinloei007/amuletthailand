import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

// TODO: เมื่อทำระบบ resolve tenant จาก subdomain/path จริง (docs/theming.md ข้อ 4)
// ให้แทนที่ฟังก์ชันนี้ด้วยการ resolve จาก request host แทนการ hardcode slug เดียว
const DEMO_TENANT_SLUG = "amulet-thailand";

// ห่อด้วย React cache() กัน query tenant ซ้ำหลายรอบในการ render ครั้งเดียว
// (root layout + generateMetadata + แต่ละหน้าเรียกฟังก์ชันนี้แยกกัน)
export const getCurrentTenant = cache(async () => {
  return prisma.tenant.findUniqueOrThrow({
    where: { slug: DEMO_TENANT_SLUG },
    include: { theme: true },
  });
});
