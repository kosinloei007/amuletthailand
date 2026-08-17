"use client";

import { useActionState } from "react";
import { updateShopInfoAction, type ActionState } from "@/lib/settings/actions";

export function ShopInfoForm({
  shopName,
  ownerContact,
  defaultMarkupPercent,
  escrowDays,
  payoutCycleDays,
}: {
  shopName: string;
  ownerContact: string | null;
  defaultMarkupPercent: number | string;
  escrowDays: number;
  payoutCycleDays: number;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(updateShopInfoAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="shopName" className="text-sm font-medium">
          ชื่อร้าน
        </label>
        <input
          id="shopName"
          name="shopName"
          type="text"
          required
          defaultValue={shopName}
          className="rounded-md border border-black/10 px-3 py-2"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="ownerContact" className="text-sm font-medium">
          ช่องทางติดต่อเจ้าของร้าน
        </label>
        <input
          id="ownerContact"
          name="ownerContact"
          type="text"
          defaultValue={ownerContact ?? ""}
          placeholder="เช่น line: @your-shop"
          className="rounded-md border border-black/10 px-3 py-2"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="defaultMarkupPercent" className="text-sm font-medium">
          % บวกราคาขาย default จากต้นทุน
        </label>
        <input
          id="defaultMarkupPercent"
          name="defaultMarkupPercent"
          type="number"
          step="0.01"
          min="0"
          defaultValue={defaultMarkupPercent}
          className="rounded-md border border-black/10 px-3 py-2"
        />
        <p className="text-xs text-black/50">มีผลกับสินค้าที่เพิ่มใหม่หลังจากนี้เท่านั้น ไม่กระทบราคาสินค้าที่ตั้งไว้แล้ว</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="escrowDays" className="text-sm font-medium">
            ระยะเวลา escrow ก่อนจ่ายผู้ขาย (วัน)
          </label>
          <input
            id="escrowDays"
            name="escrowDays"
            type="number"
            step="1"
            min="0"
            defaultValue={escrowDays}
            className="rounded-md border border-black/10 px-3 py-2"
          />
          <p className="text-xs text-black/50">นับจากวันที่ออร์เดอร์เปลี่ยนเป็น &quot;จัดส่งแล้ว&quot;</p>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="payoutCycleDays" className="text-sm font-medium">
            รอบจ่ายเงินผู้ขาย (วัน)
          </label>
          <input
            id="payoutCycleDays"
            name="payoutCycleDays"
            type="number"
            step="1"
            min="1"
            defaultValue={payoutCycleDays}
            className="rounded-md border border-black/10 px-3 py-2"
          />
          <p className="text-xs text-black/50">ใช้เป็นข้อมูลอ้างอิง แอดมินยังเป็นคนกดสร้างรอบจ่ายเอง</p>
        </div>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-fit rounded-md bg-primary px-4 py-2 text-sm text-white disabled:opacity-60"
      >
        {isPending ? "กำลังบันทึก..." : "บันทึกข้อมูลร้าน"}
      </button>
    </form>
  );
}
