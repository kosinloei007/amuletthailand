import "server-only";
import { prisma } from "@/lib/prisma";

// TODO: เมื่อทำระบบ resolve tenant จาก subdomain/path จริง (docs/theming.md ข้อ 4)
// ให้แทนที่ฟังก์ชันนี้ด้วยการ resolve จาก request host แทนการ hardcode slug เดียว
const DEMO_TENANT_SLUG = "amulet-thailand";

export async function getCurrentTenant() {
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { slug: DEMO_TENANT_SLUG },
  });
  return tenant;
}
