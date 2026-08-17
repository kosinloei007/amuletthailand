"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/actions";
import { hashPassword } from "@/lib/auth/password";
import { getCurrentTenant } from "@/lib/tenant";

export type ActionState = { error?: string } | undefined;

const EDITABLE_ROLES = ["member", "tenant_admin", "super_admin"] as const;
type EditableRole = (typeof EDITABLE_ROLES)[number];

function fail(message: string): never {
  redirect("/admin/users?error=" + encodeURIComponent(message));
}

function readUserForm(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const role = String(formData.get("role") ?? "");

  if (!fullName) {
    return { error: "กรุณากรอกชื่อ-นามสกุล" } as const;
  }
  if (!email) {
    return { error: "กรุณากรอกอีเมล" } as const;
  }
  if (!EDITABLE_ROLES.includes(role as EditableRole)) {
    return { error: "สิทธิ์ที่เลือกไม่ถูกต้อง" } as const;
  }

  return {
    data: { fullName, email, phone: phone || null, role: role as EditableRole },
  } as const;
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

export async function createUserAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireSuperAdmin();
  const parsed = readUserForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const password = String(formData.get("password") ?? "");
  if (!password || password.length < 8) {
    return { error: "กรุณากรอกรหัสผ่านอย่างน้อย 8 ตัวอักษร" };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { error: "อีเมลนี้ถูกใช้งานแล้ว" };
  }

  const tenant = await getCurrentTenant();
  const passwordHash = await hashPassword(password);

  // role member ผูก default member tier ให้เหมือนตอนสมัครสมาชิกเอง (registerAction) กันสมาชิกที่แอดมิน
  // สร้างให้หลุด tier ไม่ได้รับสิทธิ์ส่วนลด/จัดส่งฟรีตามที่ร้านตั้งไว้
  const defaultTier =
    parsed.data.role === "member"
      ? await prisma.memberTier.findFirst({ where: { tenantId: tenant.tenantId, isDefault: true } })
      : null;

  await prisma.user.create({
    data: {
      tenantId: parsed.data.role === "super_admin" ? null : tenant.tenantId,
      email: parsed.data.email,
      phone: parsed.data.phone,
      passwordHash,
      fullName: parsed.data.fullName,
      role: parsed.data.role,
      memberTierId: defaultTier?.memberTierId,
    },
  });

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function updateUserAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireSuperAdmin();
  const userId = Number(formData.get("userId"));
  const parsed = readUserForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const existing = await prisma.user.findUnique({ where: { userId } });
  if (!existing) {
    return { error: "ไม่พบผู้ใช้นี้" };
  }
  if (existing.role === "vendor") {
    return { error: "จัดการบัญชีผู้ขายได้ที่หน้าผู้ขาย (Marketplace) เท่านั้น" };
  }
  if (userId === session.userId && parsed.data.role !== existing.role) {
    return { error: "ไม่สามารถเปลี่ยนสิทธิ์ของบัญชีตัวเองได้" };
  }

  const duplicate = await prisma.user.findFirst({
    where: { email: parsed.data.email, userId: { not: userId } },
  });
  if (duplicate) {
    return { error: "อีเมลนี้ถูกใช้งานแล้ว" };
  }

  const tenant = await getCurrentTenant();

  await prisma.user.update({
    where: { userId },
    data: {
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      role: parsed.data.role,
      tenantId: parsed.data.role === "super_admin" ? null : (existing.tenantId ?? tenant.tenantId),
    },
  });

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  const session = await requireSuperAdmin();
  const userId = Number(formData.get("userId"));

  if (userId === session.userId) {
    fail("ไม่สามารถลบบัญชีตัวเองได้");
  }

  const existing = await prisma.user.findUnique({ where: { userId } });
  if (!existing) {
    redirect("/admin/users");
  }
  if (existing.role === "vendor") {
    fail("จัดการบัญชีผู้ขายได้ที่หน้าผู้ขาย (Marketplace) เท่านั้น — ระงับผู้ขายแทนการลบ");
  }

  const orderCount = await prisma.order.count({ where: { userId } });
  if (orderCount > 0) {
    fail(`ผู้ใช้นี้มีคำสั่งซื้อ ${orderCount} รายการอยู่ในระบบ ลบไม่ได้ — ใช้ปุ่มระงับบัญชีแทน`);
  }

  await prisma.user.delete({ where: { userId } });

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
