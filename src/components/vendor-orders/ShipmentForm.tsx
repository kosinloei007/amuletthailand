"use client";

import { useActionState } from "react";
import { saveVendorShipmentAction, type ActionState } from "@/lib/shipments/actions";
import { CARRIER_OPTIONS } from "@/lib/shipments/carriers";

export function ShipmentForm({
  orderId,
  defaultCarrier,
  defaultTrackingNumber,
}: {
  orderId: number;
  defaultCarrier?: string;
  defaultTrackingNumber?: string;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(saveVendorShipmentAction, undefined);
  const isKnownCarrier = defaultCarrier ? CARRIER_OPTIONS.includes(defaultCarrier) : false;

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="orderId" value={orderId} />
      <div className="flex flex-wrap items-end gap-2">
        <select
          name="carrierName"
          defaultValue={defaultCarrier ? (isKnownCarrier ? defaultCarrier : "other") : ""}
          className="rounded-md border border-black/10 px-2 py-1.5 text-xs"
        >
          <option value="" disabled>
            เลือกขนส่ง
          </option>
          {CARRIER_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
          <option value="other">อื่นๆ (ระบุเอง)</option>
        </select>
        <input
          name="carrierNameOther"
          type="text"
          placeholder="ระบุขนส่ง (ถ้าเลือกอื่นๆ)"
          defaultValue={defaultCarrier && !isKnownCarrier ? defaultCarrier : ""}
          className="rounded-md border border-black/10 px-2 py-1.5 text-xs"
        />
        <input
          name="trackingNumber"
          type="text"
          placeholder="เลขพัสดุ"
          defaultValue={defaultTrackingNumber ?? ""}
          className="rounded-md border border-black/10 px-2 py-1.5 text-xs"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-primary px-3 py-1.5 text-xs text-white disabled:opacity-60"
        >
          {isPending ? "กำลังบันทึก..." : defaultTrackingNumber ? "อัปเดตเลขพัสดุ" : "บันทึกเลขพัสดุ"}
        </button>
      </div>
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
