"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/vendors/actions";

type VendorFormValues = {
  vendorId?: number;
  shopName?: string;
  contactName?: string;
  phone?: string | null;
  bankName?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
};

export function VendorForm({
  action,
  defaultValues,
  submitLabel,
  showLoginFields,
  loginEmail,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: VendorFormValues;
  submitLabel: string;
  showLoginFields?: boolean;
  loginEmail?: string;
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {defaultValues?.vendorId && <input type="hidden" name="vendorId" value={defaultValues.vendorId} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="shopName" className="text-sm font-medium">
            ชื่อร้านผู้ขาย
          </label>
          <input
            id="shopName"
            name="shopName"
            type="text"
            required
            defaultValue={defaultValues?.shopName}
            className="rounded-md border border-black/10 px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="contactName" className="text-sm font-medium">
            ชื่อผู้ติดต่อ
          </label>
          <input
            id="contactName"
            name="contactName"
            type="text"
            required
            defaultValue={defaultValues?.contactName}
            className="rounded-md border border-black/10 px-3 py-2"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="phone" className="text-sm font-medium">
          เบอร์โทร (ไม่บังคับ)
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={defaultValues?.phone ?? ""}
          className="rounded-md border border-black/10 px-3 py-2"
        />
      </div>

      {showLoginFields ? (
        <div className="grid grid-cols-1 gap-4 rounded-md bg-black/5 p-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium">
              อีเมลเข้าสู่ระบบ (ผู้ขาย)
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="rounded-md border border-black/10 px-3 py-2"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium">
              รหัสผ่านเริ่มต้น
            </label>
            <input
              id="password"
              name="password"
              type="text"
              required
              minLength={8}
              placeholder="อย่างน้อย 8 ตัวอักษร"
              className="rounded-md border border-black/10 px-3 py-2"
            />
          </div>
        </div>
      ) : (
        loginEmail && (
          <p className="text-sm text-black/60">
            อีเมลเข้าสู่ระบบ: <span className="font-medium text-black">{loginEmail}</span>
          </p>
        )
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="bankName" className="text-sm font-medium">
            ธนาคาร (สำหรับจ่ายเงินผู้ขาย)
          </label>
          <input
            id="bankName"
            name="bankName"
            type="text"
            defaultValue={defaultValues?.bankName ?? ""}
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
            defaultValue={defaultValues?.accountName ?? ""}
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
            defaultValue={defaultValues?.accountNumber ?? ""}
            className="rounded-md border border-black/10 px-3 py-2"
          />
        </div>
      </div>

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
