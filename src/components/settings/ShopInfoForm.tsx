"use client";

import { useActionState } from "react";
import { updateShopInfoAction, type ActionState } from "@/lib/settings/actions";

export function ShopInfoForm({ shopName, ownerContact }: { shopName: string; ownerContact: string | null }) {
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
