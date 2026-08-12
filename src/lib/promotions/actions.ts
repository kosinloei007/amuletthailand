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
  return { tenantId: session.tenantId };
}

function readPromotionForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const discountType = String(formData.get("discountType") ?? "percentage");
  const discountValue = Number(formData.get("discountValue") ?? 0);
  const scheduleType = String(formData.get("scheduleType") ?? "date_range");
  const recurringMonthRaw = String(formData.get("recurringMonth") ?? "").trim();
  const startDateRaw = String(formData.get("startDate") ?? "").trim();
  const endDateRaw = String(formData.get("endDate") ?? "").trim();
  const isActive = formData.get("isActive") === "on";

  if (!name) return { error: "กรุณากรอกชื่อโปรโมชั่น" } as const;
  if (!["percentage", "fixed_amount"].includes(discountType)) {
    return { error: "ประเภทส่วนลดไม่ถูกต้อง" } as const;
  }
  if (Number.isNaN(discountValue) || discountValue <= 0) {
    return { error: "จำนวนส่วนลดต้องมากกว่า 0" } as const;
  }

  if (scheduleType === "recurring_month") {
    const recurringMonth = Number(recurringMonthRaw);
    if (!recurringMonth || recurringMonth < 1 || recurringMonth > 12) {
      return { error: "กรุณาเลือกเดือน (1-12) สำหรับโปรโมชั่นแบบวนซ้ำทุกปี" } as const;
    }
    return {
      data: {
        name,
        discountType,
        discountValue,
        scheduleType,
        recurringMonth,
        startDate: null,
        endDate: null,
        isActive,
      },
    } as const;
  }

  if (scheduleType === "date_range") {
    if (!startDateRaw || !endDateRaw) {
      return { error: "กรุณาเลือกวันที่เริ่มต้นและสิ้นสุด" } as const;
    }
    const startDate = new Date(startDateRaw);
    const endDate = new Date(endDateRaw);
    if (startDate > endDate) {
      return { error: "วันที่เริ่มต้นต้องมาก่อนวันที่สิ้นสุด" } as const;
    }
    return {
      data: {
        name,
        discountType,
        discountValue,
        scheduleType,
        recurringMonth: null,
        startDate,
        endDate,
        isActive,
      },
    } as const;
  }

  return { error: "ประเภทกำหนดการไม่ถูกต้อง" } as const;
}

export async function createPromotionAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { tenantId } = await requireTenantAdmin();
  const parsed = readPromotionForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  await prisma.storePromotion.create({ data: { ...parsed.data, tenantId } });

  revalidatePath("/admin/promotions");
  redirect("/admin/promotions");
}

export async function updatePromotionAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { tenantId } = await requireTenantAdmin();
  const storePromotionId = Number(formData.get("storePromotionId"));
  const parsed = readPromotionForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const existing = await prisma.storePromotion.findFirst({ where: { storePromotionId, tenantId } });
  if (!existing) return { error: "ไม่พบโปรโมชั่นนี้" };

  await prisma.storePromotion.update({ where: { storePromotionId }, data: parsed.data });

  revalidatePath("/admin/promotions");
  redirect("/admin/promotions");
}

export async function togglePromotionActiveAction(formData: FormData) {
  const { tenantId } = await requireTenantAdmin();
  const storePromotionId = Number(formData.get("storePromotionId"));

  const existing = await prisma.storePromotion.findFirst({ where: { storePromotionId, tenantId } });
  if (!existing) redirect("/admin/promotions");

  await prisma.storePromotion.update({ where: { storePromotionId }, data: { isActive: !existing.isActive } });

  revalidatePath("/admin/promotions");
  redirect("/admin/promotions");
}

export async function deletePromotionAction(formData: FormData) {
  const { tenantId } = await requireTenantAdmin();
  const storePromotionId = Number(formData.get("storePromotionId"));

  const existing = await prisma.storePromotion.findFirst({ where: { storePromotionId, tenantId } });
  if (!existing) redirect("/admin/promotions");

  await prisma.storePromotion.delete({ where: { storePromotionId } });

  revalidatePath("/admin/promotions");
  redirect("/admin/promotions");
}
