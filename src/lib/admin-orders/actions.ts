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
