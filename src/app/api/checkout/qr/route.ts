import { NextRequest } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { generatePromptPayQrDataUrl } from "@/lib/checkout/promptpay";

export async function GET(request: NextRequest) {
  const amount = Number(request.nextUrl.searchParams.get("amount"));
  if (!Number.isFinite(amount) || amount <= 0) {
    return Response.json({ error: "amount ไม่ถูกต้อง" }, { status: 400 });
  }

  const tenant = await getCurrentTenant();
  const paymentInfo = await prisma.paymentInfo.findUnique({ where: { tenantId: tenant.tenantId } });
  if (!paymentInfo?.promptPayId) {
    return Response.json({ error: "ร้านนี้ยังไม่ได้ตั้งค่า PromptPay" }, { status: 404 });
  }

  const dataUrl = await generatePromptPayQrDataUrl(paymentInfo.promptPayId, amount);
  return Response.json({ dataUrl });
}
