"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/actions";

async function requireTenantAdmin() {
  const session = await requireSession();
  if (session.role !== "tenant_admin" || !session.tenantId) {
    redirect("/admin");
  }
  return { tenantId: session.tenantId };
}

// รวมยอด OrderItem ของ vendor ที่พ้นระยะ escrow แล้ว (payoutEligibleAt ผ่านมาแล้ว) และยังไม่เคยถูกจัดเข้ารอบ เข้า VendorPayoutBatch ใหม่
export async function createPayoutBatchAction(formData: FormData) {
  const { tenantId } = await requireTenantAdmin();
  const vendorId = Number(formData.get("vendorId"));

  const vendor = await prisma.vendor.findFirst({ where: { vendorId, tenantId } });
  if (!vendor) redirect("/admin/vendors");

  const now = new Date();
  const eligibleItems = await prisma.orderItem.findMany({
    where: { vendorId, payoutStatus: "pending", payoutEligibleAt: { lte: now }, payoutBatchId: null },
  });

  if (eligibleItems.length === 0) {
    redirect(
      `/admin/vendors/${vendorId}/payouts?error=${encodeURIComponent("ยังไม่มีรายการที่พ้นระยะ escrow พร้อมจัดเข้ารอบ")}`,
    );
  }

  const grossAmount = eligibleItems.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
  const commissionAmount = Math.round(grossAmount * (Number(vendor.commissionPercent) / 100) * 100) / 100;
  const gatewayFeeAmount = 0;
  const netAmount = grossAmount - commissionAmount - gatewayFeeAmount;

  const lastBatch = await prisma.vendorPayoutBatch.findFirst({
    where: { vendorId },
    orderBy: { createdAt: "desc" },
  });
  const periodStart = lastBatch?.periodEnd ?? vendor.createdAt;

  await prisma.$transaction(async (tx) => {
    const batch = await tx.vendorPayoutBatch.create({
      data: { vendorId, periodStart, periodEnd: now, grossAmount, commissionAmount, gatewayFeeAmount, netAmount },
    });
    await tx.orderItem.updateMany({
      where: { orderItemId: { in: eligibleItems.map((item) => item.orderItemId) } },
      data: { payoutStatus: "eligible", payoutBatchId: batch.payoutBatchId },
    });
  });

  revalidatePath(`/admin/vendors/${vendorId}/payouts`);
  redirect(`/admin/vendors/${vendorId}/payouts`);
}

export async function markPayoutBatchPaidAction(formData: FormData) {
  const { tenantId } = await requireTenantAdmin();
  const payoutBatchId = Number(formData.get("payoutBatchId"));
  const vendorId = Number(formData.get("vendorId"));

  const batch = await prisma.vendorPayoutBatch.findFirst({
    where: { payoutBatchId, vendorId, vendor: { tenantId } },
  });
  if (!batch || batch.status === "paid") redirect(`/admin/vendors/${vendorId}/payouts`);

  await prisma.$transaction(async (tx) => {
    await tx.vendorPayoutBatch.update({ where: { payoutBatchId }, data: { status: "paid", paidAt: new Date() } });
    await tx.orderItem.updateMany({ where: { payoutBatchId }, data: { payoutStatus: "paid" } });
  });

  revalidatePath(`/admin/vendors/${vendorId}/payouts`);
  redirect(`/admin/vendors/${vendorId}/payouts`);
}
