"use client";

import { useActionState, useState } from "react";
import type { ActionState } from "@/lib/promotions/actions";

type PromotionFormValues = {
  storePromotionId?: number;
  name?: string;
  discountType?: string;
  discountValue?: number | string;
  scheduleType?: string;
  recurringMonth?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean;
};

const MONTH_LABELS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

export function PromotionForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: PromotionFormValues;
  submitLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);
  const [scheduleType, setScheduleType] = useState(defaultValues?.scheduleType ?? "date_range");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {defaultValues?.storePromotionId && (
        <input type="hidden" name="storePromotionId" value={defaultValues.storePromotionId} />
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          ชื่อโปรโมชั่น
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaultValues?.name}
          placeholder="เช่น โปรเดือนเกิดเจ้าของร้าน"
          className="rounded-md border border-black/10 px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="discountType" className="text-sm font-medium">
            ประเภทส่วนลด
          </label>
          <select
            id="discountType"
            name="discountType"
            defaultValue={defaultValues?.discountType ?? "percentage"}
            className="rounded-md border border-black/10 px-3 py-2"
          >
            <option value="percentage">เปอร์เซ็นต์ (%)</option>
            <option value="fixed_amount">จำนวนเงิน (บาท)</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="discountValue" className="text-sm font-medium">
            จำนวนส่วนลด
          </label>
          <input
            id="discountValue"
            name="discountValue"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={defaultValues?.discountValue}
            className="rounded-md border border-black/10 px-3 py-2"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="scheduleType" className="text-sm font-medium">
          รูปแบบกำหนดการ
        </label>
        <select
          id="scheduleType"
          name="scheduleType"
          value={scheduleType}
          onChange={(e) => setScheduleType(e.target.value)}
          className="rounded-md border border-black/10 px-3 py-2"
        >
          <option value="date_range">ช่วงวันที่ตายตัว</option>
          <option value="recurring_month">วนซ้ำทุกปีในเดือนที่กำหนด</option>
        </select>
      </div>

      {scheduleType === "recurring_month" ? (
        <div className="flex flex-col gap-1">
          <label htmlFor="recurringMonth" className="text-sm font-medium">
            เดือน
          </label>
          <select
            id="recurringMonth"
            name="recurringMonth"
            defaultValue={defaultValues?.recurringMonth ?? ""}
            className="rounded-md border border-black/10 px-3 py-2"
          >
            <option value="" disabled>
              เลือกเดือน
            </option>
            {MONTH_LABELS.map((label, i) => (
              <option key={label} value={i + 1}>
                {label}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="startDate" className="text-sm font-medium">
              วันที่เริ่มต้น
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              defaultValue={defaultValues?.startDate ?? ""}
              className="rounded-md border border-black/10 px-3 py-2"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="endDate" className="text-sm font-medium">
              วันที่สิ้นสุด
            </label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              defaultValue={defaultValues?.endDate ?? ""}
              className="rounded-md border border-black/10 px-3 py-2"
            />
          </div>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={defaultValues?.isActive ?? true} />
        เปิดใช้งาน
      </label>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-fit rounded-md bg-primary px-4 py-2 text-sm text-white disabled:opacity-60"
      >
        {isPending ? "กำลังบันทึก..." : submitLabel}
      </button>
    </form>
  );
}
