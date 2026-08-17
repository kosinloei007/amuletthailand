import Link from "next/link";
import { requireShopAdmin } from "@/lib/auth/actions";
import { prisma } from "@/lib/prisma";
import { PaymentInfoForm } from "@/components/payment-info/PaymentInfoForm";

export default async function PaymentInfoPage() {
  const session = await requireShopAdmin();

  const paymentInfo = await prisma.paymentInfo.findUnique({ where: { tenantId: session.tenantId } });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">บัญชีรับโอนเงิน</h1>
        <Link href="/admin" className="text-sm underline">
          กลับไปแดชบอร์ด
        </Link>
      </div>
      <p className="text-sm text-black/60">
        ข้อมูลนี้จะแสดงในหน้า checkout ให้ลูกค้าโอนเงินเข้าบัญชีนี้ — ถ้ากรอกเลข PromptPay ไว้ ระบบจะ generate QR ตามยอดที่ต้องชำระให้อัตโนมัติ
      </p>
      <PaymentInfoForm
        bankName={paymentInfo?.bankName ?? ""}
        accountName={paymentInfo?.accountName ?? ""}
        accountNumber={paymentInfo?.accountNumber ?? ""}
        promptPayId={paymentInfo?.promptPayId ?? ""}
        qrImageUrl={paymentInfo?.qrImageUrl ?? ""}
        gatewayEnabled={paymentInfo?.gatewayEnabled ?? false}
      />
    </main>
  );
}
