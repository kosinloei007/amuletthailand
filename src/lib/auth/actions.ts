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
    role: user.role as "super_admin" | "tenant_admin" | "member",
    email: user.email,
    fullName: user.fullName,
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
