"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/member-tiers/actions";

type MemberTierFormValues = {
  memberTierId?: number;
  name?: string;
  sortOrder?: number;
  discountType?: string;
  discountValue?: number | string;
  freeShippingEnabled?: boolean;
  freeShippingMinAmount?: number | string | null;
  isDefault?: boolean;
};

export function MemberTierForm({
  action,
  defaultValues,
  submitLabel,
  lockDefaultCheckbox,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: MemberTierFormValues;
  submitLabel: string;
  lockDefaultCheckbox?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {defaultValues?.memberTierId && (
        <input type="hidden" name="memberTierId" value={defaultValues.memberTierId} />
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          ชื่อระดับ
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaultValues?.name}
          className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="discountType" className="text-sm font-medium">
            ประเภทส่วนลด
          </label>
          <select
            id="discountType"
            name="discountType"
            defaultValue={defaultValues?.discountType ?? "none"}
            className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
          >
            <option value="none">ไม่มีส่วนลด</option>
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
            min="0"
            defaultValue={defaultValues?.discountValue ?? 0}
            className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="sortOrder" className="text-sm font-medium">
            ลำดับการแสดง
          </label>
          <input
            id="sortOrder"
            name="sortOrder"
            type="number"
            defaultValue={defaultValues?.sortOrder ?? 0}
            className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="freeShippingMinAmount" className="text-sm font-medium">
            ยอดขั้นต่ำจัดส่งฟรี (เว้นว่าง = ฟรีทุกยอด)
          </label>
          <input
            id="freeShippingMinAmount"
            name="freeShippingMinAmount"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaultValues?.freeShippingMinAmount ?? ""}
            className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="freeShippingEnabled" defaultChecked={defaultValues?.freeShippingEnabled} />
        เปิดใช้งานจัดส่งฟรี
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isDefault" defaultChecked={defaultValues?.isDefault} />
        ตั้งเป็นระดับเริ่มต้นของสมาชิกใหม่
        {lockDefaultCheckbox && (
          <span className="text-black/50 dark:text-white/50">
            (เป็นระดับเริ่มต้นอยู่แล้ว ห้ามยกเลิกตรงนี้ ให้ไปตั้งระดับอื่นเป็นค่าเริ่มต้นแทน)
          </span>
        )}
      </label>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-fit rounded-md bg-foreground px-4 py-2 text-background disabled:opacity-60"
      >
        {isPending ? "กำลังบันทึก..." : submitLabel}
      </button>
    </form>
  );
}
