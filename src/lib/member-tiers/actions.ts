"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/actions";

export type ActionState = { error?: string } | undefined;

async function requireTenantAdmin() {
  const session = await requireSession();
  if (session.role !== "tenant_admin" || !session.tenantId) {
    redirect("/admin");
  }
  return { session, tenantId: session.tenantId };
}

type DiscountType = "percentage" | "fixed_amount" | "none";

function readTierForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const discountType = String(formData.get("discountType") ?? "none") as DiscountType;
  const discountValue = Number(formData.get("discountValue") ?? 0);
  const freeShippingEnabled = formData.get("freeShippingEnabled") === "on";
  const freeShippingMinAmountRaw = String(formData.get("freeShippingMinAmount") ?? "").trim();
  const freeShippingMinAmount = freeShippingMinAmountRaw ? Number(freeShippingMinAmountRaw) : undefined;
  const isDefault = formData.get("isDefault") === "on";

  if (!name) {
    return { error: "กรุณากรอกชื่อระดับสมาชิก" } as const;
  }
  if (!["percentage", "fixed_amount", "none"].includes(discountType)) {
    return { error: "ประเภทส่วนลดไม่ถูกต้อง" } as const;
  }
  if (Number.isNaN(discountValue) || discountValue < 0) {
    return { error: "จำนวนส่วนลดต้องเป็นตัวเลขไม่ติดลบ" } as const;
  }
  if (freeShippingMinAmount !== undefined && (Number.isNaN(freeShippingMinAmount) || freeShippingMinAmount < 0)) {
    return { error: "ยอดขั้นต่ำจัดส่งฟรีต้องเป็นตัวเลขไม่ติดลบ" } as const;
  }

  return {
    data: {
      name,
      sortOrder: Number.isNaN(sortOrder) ? 0 : sortOrder,
      discountType,
      discountValue,
      freeShippingEnabled,
      freeShippingMinAmount,
      isDefault,
    },
  } as const;
}

export async function createMemberTierAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { tenantId } = await requireTenantAdmin();
  const parsed = readTierForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const existingCount = await prisma.memberTier.count({ where: { tenantId } });
  const shouldBeDefault = parsed.data.isDefault || existingCount === 0;

  await prisma.$transaction(async (tx) => {
    if (shouldBeDefault) {
      await tx.memberTier.updateMany({ where: { tenantId }, data: { isDefault: false } });
    }
    await tx.memberTier.create({
      data: { ...parsed.data, tenantId, isDefault: shouldBeDefault },
    });
  });

  revalidatePath("/admin/member-tiers");
  redirect("/admin/member-tiers");
}

export async function updateMemberTierAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { tenantId } = await requireTenantAdmin();
  const memberTierId = Number(formData.get("memberTierId"));
  const parsed = readTierForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const existing = await prisma.memberTier.findFirst({ where: { memberTierId, tenantId } });
  if (!existing) {
    return { error: "ไม่พบระดับสมาชิกนี้" };
  }
  if (existing.isDefault && !parsed.data.isDefault) {
    return { error: "ระดับนี้เป็นระดับเริ่มต้นอยู่ ให้ไปตั้งระดับอื่นเป็นค่าเริ่มต้นแทนถ้าต้องการเปลี่ยน" };
  }

  await prisma.$transaction(async (tx) => {
    if (parsed.data.isDefault && !existing.isDefault) {
      await tx.memberTier.updateMany({
        where: { tenantId, NOT: { memberTierId } },
        data: { isDefault: false },
      });
    }
    await tx.memberTier.update({ where: { memberTierId }, data: parsed.data });
  });

  revalidatePath("/admin/member-tiers");
  redirect("/admin/member-tiers");
}

export async function setDefaultMemberTierAction(formData: FormData) {
  const { tenantId } = await requireTenantAdmin();
  const memberTierId = Number(formData.get("memberTierId"));

  const existing = await prisma.memberTier.findFirst({ where: { memberTierId, tenantId } });
  if (!existing) {
    redirect("/admin/member-tiers");
  }

  await prisma.$transaction([
    prisma.memberTier.updateMany({ where: { tenantId }, data: { isDefault: false } }),
    prisma.memberTier.update({ where: { memberTierId }, data: { isDefault: true } }),
  ]);

  revalidatePath("/admin/member-tiers");
  redirect("/admin/member-tiers");
}

export async function deleteMemberTierAction(formData: FormData): Promise<void> {
  const { tenantId } = await requireTenantAdmin();
  const memberTierId = Number(formData.get("memberTierId"));

  const existing = await prisma.memberTier.findFirst({ where: { memberTierId, tenantId } });
  if (!existing) {
    redirect("/admin/member-tiers");
  }
  if (existing.isDefault) {
    redirect("/admin/member-tiers?error=" + encodeURIComponent("ลบระดับเริ่มต้นไม่ได้ ให้ตั้งระดับอื่นเป็นค่าเริ่มต้นก่อน"));
  }

  const memberCount = await prisma.user.count({ where: { memberTierId } });
  if (memberCount > 0) {
    redirect(
      "/admin/member-tiers?error=" +
        encodeURIComponent(`มีสมาชิก ${memberCount} คนอยู่ในระดับนี้ ย้ายสมาชิกออกก่อนถึงจะลบได้`)
    );
  }

  await prisma.memberTier.delete({ where: { memberTierId } });
  revalidatePath("/admin/member-tiers");
  redirect("/admin/member-tiers");
}
