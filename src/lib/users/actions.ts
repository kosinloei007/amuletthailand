"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/actions";

const EDITABLE_ROLES = ["member", "tenant_admin", "super_admin"] as const;

function fail(message: string): never {
  redirect("/admin/users?error=" + encodeURIComponent(message));
}

// จัดการ role ได้เฉพาะ member/tenant_admin/super_admin — role "vendor" ต้องผูกกับ Vendor row เสมอ
// (สร้าง/แก้ไขคู่กันที่ /admin/vendors) เปลี่ยน role ตรงนี้จะทำให้ Vendor row กับ User หลุดกัน จึงห้ามไว้
export async function updateUserRoleAction(formData: FormData): Promise<void> {
  const session = await requireSuperAdmin();
  const userId = Number(formData.get("userId"));
  const role = String(formData.get("role") ?? "");

  if (userId === session.userId) {
    fail("ไม่สามารถเปลี่ยนสิทธิ์ของบัญชีตัวเองได้");
  }

  const existing = await prisma.user.findUnique({ where: { userId } });
  if (!existing) {
    redirect("/admin/users");
  }
  if (existing.role === "vendor") {
    fail("จัดการสิทธิ์ผู้ขายได้ที่หน้าผู้ขาย (Marketplace) เท่านั้น");
  }
  if (!EDITABLE_ROLES.includes(role as (typeof EDITABLE_ROLES)[number])) {
    fail("สิทธิ์ที่เลือกไม่ถูกต้อง");
  }

  await prisma.user.update({ where: { userId }, data: { role } });

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function toggleUserActiveAction(formData: FormData): Promise<void> {
  const session = await requireSuperAdmin();
  const userId = Number(formData.get("userId"));

  if (userId === session.userId) {
    fail("ไม่สามารถระงับบัญชีตัวเองได้");
  }

  const existing = await prisma.user.findUnique({ where: { userId } });
  if (!existing) {
    redirect("/admin/users");
  }

  await prisma.user.update({ where: { userId }, data: { isActive: !existing.isActive } });

  revalidatePath("/admin/users");
  redirect("/admin/users");
}
