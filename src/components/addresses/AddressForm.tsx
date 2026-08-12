"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/addresses/actions";

type AddressFormValues = {
  userAddressId?: number;
  fullName?: string;
  phone?: string;
  address?: string;
  subDistrict?: string | null;
  district?: string | null;
  province?: string | null;
  postalCode?: string | null;
  isDefault?: boolean;
};

export function AddressForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: AddressFormValues;
  submitLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {defaultValues?.userAddressId && (
        <input type="hidden" name="userAddressId" value={defaultValues.userAddressId} />
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="fullName" className="text-sm font-medium">
            ชื่อผู้รับ
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            defaultValue={defaultValues?.fullName}
            className="rounded-md border border-black/10 px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="phone" className="text-sm font-medium">
            เบอร์โทร
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            defaultValue={defaultValues?.phone}
            className="rounded-md border border-black/10 px-3 py-2"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="address" className="text-sm font-medium">
          ที่อยู่ (บ้านเลขที่, ถนน, หมู่บ้าน ฯลฯ)
        </label>
        <textarea
          id="address"
          name="address"
          required
          rows={2}
          defaultValue={defaultValues?.address}
          className="rounded-md border border-black/10 px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="subDistrict" className="text-sm font-medium">
            ตำบล/แขวง
          </label>
          <input
            id="subDistrict"
            name="subDistrict"
            type="text"
            defaultValue={defaultValues?.subDistrict ?? ""}
            className="rounded-md border border-black/10 px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="district" className="text-sm font-medium">
            อำเภอ/เขต
          </label>
          <input
            id="district"
            name="district"
            type="text"
            defaultValue={defaultValues?.district ?? ""}
            className="rounded-md border border-black/10 px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="province" className="text-sm font-medium">
            จังหวัด
          </label>
          <input
            id="province"
            name="province"
            type="text"
            defaultValue={defaultValues?.province ?? ""}
            className="rounded-md border border-black/10 px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="postalCode" className="text-sm font-medium">
            รหัสไปรษณีย์
          </label>
          <input
            id="postalCode"
            name="postalCode"
            type="text"
            defaultValue={defaultValues?.postalCode ?? ""}
            className="rounded-md border border-black/10 px-3 py-2"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isDefault" defaultChecked={defaultValues?.isDefault} />
        ตั้งเป็นที่อยู่จัดส่งเริ่มต้น
      </label>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-fit rounded-md bg-primary px-4 py-2 text-white disabled:opacity-60"
      >
        {isPending ? "กำลังบันทึก..." : submitLabel}
      </button>
    </form>
  );
}
