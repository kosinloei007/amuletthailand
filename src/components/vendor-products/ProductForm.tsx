"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/vendor-products/actions";

type Option = { id: number; label: string };

type ProductFormValues = {
  productId?: number;
  name?: string;
  sku?: string | null;
  description?: string | null;
  price?: number | string;
  costPrice?: number | string | null;
  stock?: number;
  provinceId?: number | null;
  monkId?: number | null;
  categoryId?: number | null;
  templeName?: string | null;
  era?: string | null;
  hasCertificate?: boolean;
  certificateInfo?: string | null;
  imageUrl?: string | null;
};

export function ProductForm({
  action,
  defaultValues,
  submitLabel,
  provinces,
  monks,
  categories,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: ProductFormValues;
  submitLabel: string;
  provinces: Option[];
  monks: Option[];
  categories: Option[];
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {defaultValues?.productId && <input type="hidden" name="productId" value={defaultValues.productId} />}

      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          ชื่อสินค้า
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaultValues?.name}
          className="rounded-md border border-black/10 px-3 py-2"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="sku" className="text-sm font-medium">
          รหัสสินค้า (SKU)
        </label>
        <input
          id="sku"
          name="sku"
          type="text"
          required
          defaultValue={defaultValues?.sku ?? ""}
          className="rounded-md border border-black/10 px-3 py-2"
        />
        <p className="text-xs text-black/50">ตั้งเองได้ตามต้องการ ต้องไม่ซ้ำกับสินค้าอื่นในร้านของคุณ</p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium">
          รายละเอียด
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaultValues?.description ?? ""}
          className="rounded-md border border-black/10 px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="price" className="text-sm font-medium">
            ราคาขาย (บาท)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={defaultValues?.price}
            className="rounded-md border border-black/10 px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="costPrice" className="text-sm font-medium">
            ต้นทุน (ไม่บังคับ)
          </label>
          <input
            id="costPrice"
            name="costPrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaultValues?.costPrice ?? ""}
            className="rounded-md border border-black/10 px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="stock" className="text-sm font-medium">
            จำนวนสต็อก
          </label>
          <input
            id="stock"
            name="stock"
            type="number"
            min="0"
            required
            defaultValue={defaultValues?.stock ?? 0}
            className="rounded-md border border-black/10 px-3 py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="provinceId" className="text-sm font-medium">
            จังหวัด
          </label>
          <select
            id="provinceId"
            name="provinceId"
            defaultValue={defaultValues?.provinceId ?? ""}
            className="rounded-md border border-black/10 px-3 py-2"
          >
            <option value="">- ไม่ระบุ -</option>
            {provinces.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="monkId" className="text-sm font-medium">
            หลวงพ่อ/วัด
          </label>
          <select
            id="monkId"
            name="monkId"
            defaultValue={defaultValues?.monkId ?? ""}
            className="rounded-md border border-black/10 px-3 py-2"
          >
            <option value="">- ไม่ระบุ -</option>
            {monks.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="categoryId" className="text-sm font-medium">
            หมวดหมู่
          </label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={defaultValues?.categoryId ?? ""}
            className="rounded-md border border-black/10 px-3 py-2"
          >
            <option value="">- ไม่ระบุ -</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="templeName" className="text-sm font-medium">
            วัด/สำนัก (ไม่บังคับ)
          </label>
          <input
            id="templeName"
            name="templeName"
            type="text"
            defaultValue={defaultValues?.templeName ?? ""}
            className="rounded-md border border-black/10 px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="era" className="text-sm font-medium">
            ปีสร้าง/ยุค (ไม่บังคับ)
          </label>
          <input
            id="era"
            name="era"
            type="text"
            defaultValue={defaultValues?.era ?? ""}
            className="rounded-md border border-black/10 px-3 py-2"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="imageUrl" className="text-sm font-medium">
          URL รูปสินค้า
        </label>
        <input
          id="imageUrl"
          name="imageUrl"
          type="url"
          placeholder="https://..."
          defaultValue={defaultValues?.imageUrl ?? ""}
          className="rounded-md border border-black/10 px-3 py-2"
        />
        <p className="text-xs text-black/50">ยังไม่รองรับอัปโหลดไฟล์โดยตรง — ใช้ URL รูปที่โฮสต์ไว้แล้วไปก่อน</p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="hasCertificate" defaultChecked={defaultValues?.hasCertificate} />
        มีใบรับประกัน
      </label>

      <div className="flex flex-col gap-1">
        <label htmlFor="certificateInfo" className="text-sm font-medium">
          รายละเอียดใบรับประกัน (กรอกเมื่อมีใบรับประกัน)
        </label>
        <input
          id="certificateInfo"
          name="certificateInfo"
          type="text"
          defaultValue={defaultValues?.certificateInfo ?? ""}
          className="rounded-md border border-black/10 px-3 py-2"
        />
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
