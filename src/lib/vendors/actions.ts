"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/actions";
import { hashPassword } from "@/lib/auth/password";

export type ActionState = { error?: string } | undefined;

async function requireTenantAdmin() {
  const session = await requireSession();
  if (session.role !== "tenant_admin" || !session.tenantId) {
    redirect("/admin");
  }
  return { tenantId: session.tenantId };
}

function readShopFields(formData: FormData) {
  const shopName = String(formData.get("shopName") ?? "").trim();
  const contactName = String(formData.get("contactName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const bankName = String(formData.get("bankName") ?? "").trim();
  const accountName = String(formData.get("accountName") ?? "").trim();
  const accountNumber = String(formData.get("accountNumber") ?? "").trim();

  if (!shopName || !contactName) {
    return { error: "กรุณากรอกชื่อร้านและชื่อผู้ติดต่อ" } as const;
  }

  return {
    data: {
      shopName,
      contactName,
      phone: phone || null,
      bankName: bankName || null,
      accountName: accountName || null,
      accountNumber: accountNumber || null,
    },
  } as const;
}

export async function createVendorAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { tenantId } = await requireTenantAdmin();
  const parsed = readShopFields(formData);
  if ("error" in parsed) return { error: parsed.error };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "กรุณากรอกอีเมลและรหัสผ่านสำหรับเข้าสู่ระบบของผู้ขาย" };
  }
  if (password.length < 8) {
    return { error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: "อีเมลนี้ถูกใช้งานแล้ว" };
  }

  const passwordHash = await hashPassword(password);

  await prisma.$transaction(async (tx) => {
    const vendor = await tx.vendor.create({ data: { ...parsed.data, tenantId } });
    await tx.user.create({
      data: {
        tenantId,
        email,
        passwordHash,
        fullName: parsed.data.contactName,
        phone: parsed.data.phone ?? undefined,
        role: "vendor",
        vendorId: vendor.vendorId,
      },
    });
  });

  revalidatePath("/admin/vendors");
  redirect("/admin/vendors");
}

export async function updateVendorAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { tenantId } = await requireTenantAdmin();
  const vendorId = Number(formData.get("vendorId"));
  const parsed = readShopFields(formData);
  if ("error" in parsed) return { error: parsed.error };

  const existing = await prisma.vendor.findFirst({ where: { vendorId, tenantId } });
  if (!existing) {
    return { error: "ไม่พบผู้ขายรายนี้" };
  }

  await prisma.vendor.update({ where: { vendorId }, data: parsed.data });

  revalidatePath("/admin/vendors");
  redirect("/admin/vendors");
}

export async function toggleVendorStatusAction(formData: FormData): Promise<void> {
  const { tenantId } = await requireTenantAdmin();
  const vendorId = Number(formData.get("vendorId"));

  const existing = await prisma.vendor.findFirst({ where: { vendorId, tenantId } });
  if (!existing) {
    redirect("/admin/vendors");
  }

  await prisma.vendor.update({
    where: { vendorId },
    data: { status: existing.status === "active" ? "suspended" : "active" },
  });

  revalidatePath("/admin/vendors");
  redirect("/admin/vendors");
}
