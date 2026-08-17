"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/auth/actions";

export type ActionState = { error?: string } | undefined;

function readShipmentFields(formData: FormData) {
  const orderId = Number(formData.get("orderId"));
  const carrierSelect = String(formData.get("carrierName") ?? "").trim();
  const carrierOther = String(formData.get("carrierNameOther") ?? "").trim();
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim();
  const carrierName = carrierSelect === "other" ? carrierOther : carrierSelect;

  if (!orderId) return { error: "ไม่พบออร์เดอร์" } as const;
  if (!carrierName) return { error: "กรุณาเลือกหรือกรอกชื่อขนส่ง" } as const;
  if (!trackingNumber) return { error: "กรุณากรอกเลขพัสดุ" } as const;

  return { data: { orderId, carrierName, trackingNumber } } as const;
}

export async function saveVendorShipmentAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireVendor();
  const parsed = readShipmentFields(formData);
  if ("error" in parsed) return { error: parsed.error };
  const { orderId, carrierName, trackingNumber } = parsed.data;

  const hasItem = await prisma.orderItem.findFirst({ where: { orderId, vendorId: session.vendorId } });
  if (!hasItem) return { error: "ไม่พบรายการสินค้าของคุณในออร์เดอร์นี้" };

  const existing = await prisma.shipment.findFirst({ where: { orderId, vendorId: session.vendorId } });
  if (existing) {
    await prisma.shipment.update({ where: { shipmentId: existing.shipmentId }, data: { carrierName, trackingNumber } });
  } else {
    await prisma.shipment.create({ data: { orderId, vendorId: session.vendorId, carrierName, trackingNumber } });
  }

  revalidatePath("/vendor/orders");
  redirect(`/vendor/orders?shipped=${orderId}`);
}
