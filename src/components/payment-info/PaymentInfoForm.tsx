"use client";

import { useActionState } from "react";
import { updatePaymentInfoAction, type ActionState } from "@/lib/payment-info/actions";

export function PaymentInfoForm({
  bankName,
  accountName,
  accountNumber,
  promptPayId,
  qrImageUrl,
}: {
  bankName: string;
  accountName: string;
  accountNumber: string;
  promptPayId: string;
  qrImageUrl: string;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(updatePaymentInfoAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="bankName" className="text-sm font-medium">
            ธนาคาร
          </label>
          <input
            id="bankName"
            name="bankName"
            type="text"
            required
            defaultValue={bankName}
            placeholder="เช่น ธนาคารกสิกรไทย"
            className="rounded-md border border-black/10 px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="accountName" className="text-sm font-medium">
            ชื่อบัญชี
          </label>
          <input
            id="accountName"
            name="accountName"
            type="text"
            required
            defaultValue={accountName}
            className="rounded-md border border-black/10 px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="accountNumber" className="text-sm font-medium">
            เลขที่บัญชี
          </label>
          <input
            id="accountNumber"
            name="accountNumber"
            type="text"
            required
            defaultValue={accountNumber}
            className="rounded-md border border-black/10 px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="promptPayId" className="text-sm font-medium">
            เลข PromptPay (ไม่บังคับ)
          </label>
          <input
            id="promptPayId"
            name="promptPayId"
            type="text"
            defaultValue={promptPayId}
            placeholder="เบอร์โทร/เลขบัตร ปชช."
            className="rounded-md border border-black/10 px-3 py-2"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="qrImageUrl" className="text-sm font-medium">
          URL รูป QR คงที่ (ใช้เมื่อไม่มี PromptPay สำหรับ generate อัตโนมัติ)
        </label>
        <input
          id="qrImageUrl"
          name="qrImageUrl"
          type="url"
          defaultValue={qrImageUrl}
          placeholder="https://..."
          className="rounded-md border border-black/10 px-3 py-2"
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-fit rounded-md bg-primary px-4 py-2 text-sm text-white disabled:opacity-60"
      >
        {isPending ? "กำลังบันทึก..." : "บันทึกข้อมูลรับเงิน"}
      </button>
    </form>
  );
}
