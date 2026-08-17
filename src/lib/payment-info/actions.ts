"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireShopAdmin } from "@/lib/auth/actions";

export type ActionState = { error?: string } | undefined;

export async function updatePaymentInfoAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { tenantId } = await requireShopAdmin();
  const bankName = String(formData.get("bankName") ?? "").trim();
  const accountName = String(formData.get("accountName") ?? "").trim();
  const accountNumber = String(formData.get("accountNumber") ?? "").trim();
  const promptPayId = String(formData.get("promptPayId") ?? "").trim();
  const qrImageUrl = String(formData.get("qrImageUrl") ?? "").trim();
  const gatewayEnabled = formData.get("gatewayEnabled") === "on";

  if (!bankName || !accountName || !accountNumber) {
    return { error: "กรุณากรอกธนาคาร, ชื่อบัญชี และเลขที่บัญชีให้ครบ" };
  }

  await prisma.paymentInfo.upsert({
    where: { tenantId },
    update: {
      bankName,
      accountName,
      accountNumber,
      promptPayId: promptPayId || null,
      qrImageUrl: qrImageUrl || null,
      gatewayEnabled,
    },
    create: {
      tenantId,
      bankName,
      accountName,
      accountNumber,
      promptPayId: promptPayId || null,
      qrImageUrl: qrImageUrl || null,
      gatewayEnabled,
    },
  });

  revalidatePath("/admin/payment-info");
  revalidatePath("/checkout");
  redirect("/admin/payment-info");
}
