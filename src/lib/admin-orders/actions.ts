"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/actions";
import { notifyVendorNewOrder } from "@/lib/notifications/notifyOrder";

async function requireTenantAdmin() {
  const session = await requireSession();
  if (session.role !== "tenant_admin" || !session.tenantId) {
    redirect("/admin");
  }
  return { tenantId: session.tenantId };
}

const VALID_STATUSES = ["pending_verify", "verified", "shipped", "cancelled"];
const VALID_SLIP_STATUSES = ["pending", "matched", "mismatched", "unreadable"];

export async function updateOrderStatusAction(formData: FormData) {
  const { tenantId } = await requireTenantAdmin();
  const orderId = Number(formData.get("orderId"));
  const status = String(formData.get("status") ?? "");

  if (!VALID_STATUSES.includes(status)) redirect(`/admin/orders/${orderId}`);

  const existing = await prisma.order.findFirst({ where: { orderId, tenantId } });
  if (!existing) redirect("/admin/orders");

  await prisma.order.update({ where: { orderId }, data: { status } });

  // เข้าเงื่อนไข escrow ตอน order เปลี่ยนเป็น shipped ครั้งแรก — คำนวณวันที่ยอดของ vendor พร้อมจัดเข้ารอบจ่าย (ดู docs/vendor-enhancements-plan.md ข้อ 6)
  if (status === "shipped" && existing.status !== "shipped") {
    const tenant = await prisma.tenant.findUniqueOrThrow({ where: { tenantId } });
    const shippedAt = new Date();
    const payoutEligibleAt = new Date(shippedAt.getTime() + tenant.escrowDays * 24 * 60 * 60 * 1000);
    await prisma.orderItem.updateMany({
      where: { orderId, vendorId: { not: null }, payoutStatus: "pending", payoutEligibleAt: null },
      data: { payoutEligibleAt },
    });
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  redirect(`/admin/orders/${orderId}`);
}

export async function updateSlipVerifyStatusAction(formData: FormData) {
  const { tenantId } = await requireTenantAdmin();
  const orderId = Number(formData.get("orderId"));
  const slipVerifyStatus = String(formData.get("slipVerifyStatus") ?? "");

  if (!VALID_SLIP_STATUSES.includes(slipVerifyStatus)) redirect(`/admin/orders/${orderId}`);

  const existing = await prisma.order.findFirst({ where: { orderId, tenantId } });
  if (!existing) redirect("/admin/orders");

  await prisma.order.update({ where: { orderId }, data: { slipVerifyStatus } });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  redirect(`/admin/orders/${orderId}`);
}

export async function sendVendorNotifyAction(formData: FormData) {
  const { tenantId } = await requireTenantAdmin();
  const orderId = Number(formData.get("orderId"));
  const vendorId = Number(formData.get("vendorId"));

  const order = await prisma.order.findFirst({ where: { orderId, tenantId } });
  if (!order) redirect("/admin/orders");

  const vendor = await prisma.vendor.findFirst({ where: { vendorId, tenantId } });
  if (!vendor) redirect(`/admin/orders/${orderId}`);

  await notifyVendorNewOrder(tenantId, vendorId, order.orderNumber);

  redirect(`/admin/orders/${orderId}?notified=${vendorId}`);
}

// สำหรับสินค้าของร้านเอง (vendorId = NULL) — tenant_admin กรอกเลขพัสดุแทน vendor
export async function saveHouseShipmentAction(formData: FormData) {
  const { tenantId } = await requireTenantAdmin();
  const orderId = Number(formData.get("orderId"));
  const carrierSelect = String(formData.get("carrierName") ?? "").trim();
  const carrierOther = String(formData.get("carrierNameOther") ?? "").trim();
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim();
  const carrierName = carrierSelect === "other" ? carrierOther : carrierSelect;

  const order = await prisma.order.findFirst({ where: { orderId, tenantId } });
  if (!order) redirect("/admin/orders");
  if (!carrierName || !trackingNumber) redirect(`/admin/orders/${orderId}`);

  const existing = await prisma.shipment.findFirst({ where: { orderId, vendorId: null } });
  if (existing) {
    await prisma.shipment.update({ where: { shipmentId: existing.shipmentId }, data: { carrierName, trackingNumber } });
  } else {
    await prisma.shipment.create({ data: { orderId, vendorId: null, carrierName, trackingNumber } });
  }

  revalidatePath(`/admin/orders/${orderId}`);
  redirect(`/admin/orders/${orderId}?shipped=house`);
}
