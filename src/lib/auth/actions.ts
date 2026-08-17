"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { setSessionCookie, clearSessionCookie, getSession } from "@/lib/auth/session";

export type ActionState = { error?: string } | undefined;

function redirectForRole(role: string) {
  if (role === "tenant_admin" || role === "super_admin") {
    redirect("/admin");
  }
  if (role === "vendor") {
    redirect("/vendor");
  }
  redirect("/account");
}

export async function loginAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "กรุณากรอกอีเมลและรหัสผ่าน" };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);
  if (!passwordMatches) {
    return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
  }

  await setSessionCookie({
    userId: user.userId,
    tenantId: user.tenantId,
    role: user.role as "super_admin" | "tenant_admin" | "member" | "vendor",
    email: user.email,
    fullName: user.fullName,
    vendorId: user.vendorId,
  });

  redirectForRole(user.role);
}

export async function registerAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!fullName || !email || !password) {
    return { error: "กรุณากรอกชื่อ-นามสกุล อีเมล และรหัสผ่านให้ครบ" };
  }
  if (password.length < 8) {
    return { error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" };
  }
  if (password !== confirmPassword) {
    return { error: "รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "อีเมลนี้ถูกใช้งานแล้ว" };
  }

  const tenant = await getCurrentTenant();
  const defaultTier = await prisma.memberTier.findFirst({
    where: { tenantId: tenant.tenantId, isDefault: true },
  });

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      tenantId: tenant.tenantId,
      email,
      phone: phone || undefined,
      passwordHash,
      fullName,
      role: "member",
      memberTierId: defaultTier?.memberTierId,
    },
  });

  await setSessionCookie({
    userId: user.userId,
    tenantId: user.tenantId,
    role: "member",
    email: user.email,
    fullName: user.fullName,
    vendorId: null,
  });

  redirect("/account");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireVendor() {
  const session = await requireSession();
  if (session.role !== "vendor" || !session.vendorId) {
    redirect("/account");
  }
  return session as typeof session & { vendorId: number };
}

// ใช้กับหน้า/action ที่ tenant_admin และ super_admin เข้าได้เหมือนกัน (ผู้ขาย, บัญชีรับโอนเงิน,
// การแจ้งเตือน, หมวดหมู่สินค้า ฯลฯ) — super_admin ไม่มี tenantId ผูกตัวเอง (tenantId ใน session
// เป็น NULL) จึง fallback ไปใช้ tenant เดียวที่มีอยู่ตอนนี้ผ่าน getCurrentTenant() แทน
export async function requireShopAdmin() {
  const session = await requireSession();
  if (session.role !== "tenant_admin" && session.role !== "super_admin") {
    redirect("/admin");
  }
  const tenantId = session.tenantId ?? (await getCurrentTenant()).tenantId;
  return { ...session, tenantId };
}

// ใช้กับหน้า/action ที่เฉพาะ super_admin เท่านั้น (จัดการผู้ใช้/สิทธิ์ทั้งระบบ) — tenant_admin
// ห้ามเข้าถึงเพราะเป็นการเปลี่ยนสิทธิ์ผู้ใช้คนอื่นรวมถึง promote เป็น super_admin ได้
export async function requireSuperAdmin() {
  const session = await requireSession();
  if (session.role !== "super_admin") {
    redirect("/admin");
  }
  return session;
}

export async function changeVendorPasswordAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireVendor();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !newPassword) {
    return { error: "กรุณากรอกรหัสผ่านเดิมและรหัสผ่านใหม่" };
  }
  if (newPassword.length < 8) {
    return { error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร" };
  }
  if (newPassword !== confirmPassword) {
    return { error: "รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน" };
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { userId: session.userId } });
  const currentPasswordMatches = await verifyPassword(currentPassword, user.passwordHash);
  if (!currentPasswordMatches) {
    return { error: "รหัสผ่านเดิมไม่ถูกต้อง" };
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { userId: session.userId }, data: { passwordHash } });

  redirect("/vendor/settings?success=1");
}
