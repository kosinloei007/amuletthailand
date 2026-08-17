"use client";

import { useActionState, useState } from "react";
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
  images?: { imageUrl: string }[];
  certificateImages?: { imageUrl: string }[];
};

function RequiredMark() {
  return <span className="text-red-600"> *</span>;
}

function useSelectedFilePreviews() {
  const [previews, setPreviews] = useState<string[]>([]);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setPreviews((prevUrls) => {
      prevUrls.forEach((url) => URL.revokeObjectURL(url));
      return files.map((file) => URL.createObjectURL(file));
    });
  }

  return { previews, onChange };
}

function ImageThumbnails({ previews, altPrefix }: { previews: string[]; altPrefix: string }) {
  if (previews.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {previews.map((url, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={url}
          src={url}
          alt={`${altPrefix} ${i + 1}`}
          className="h-24 w-24 rounded-md border border-black/10 object-cover"
        />
      ))}
    </div>
  );
}

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
  const [hasCertificate, setHasCertificate] = useState(defaultValues?.hasCertificate ?? false);
  const mainImagePreviews = useSelectedFilePreviews();
  const certImagePreviews = useSelectedFilePreviews();

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {defaultValues?.productId && <input type="hidden" name="productId" value={defaultValues.productId} />}

      <div className="flex flex-col gap-1">
        <label htmlFor="sku" className="text-sm font-medium">
          รหัสพระเครื่อง (SKU)
          <RequiredMark />
        </label>
        <input
          id="sku"
          name="sku"
          type="text"
          required
          maxLength={10}
          defaultValue={defaultValues?.sku ?? ""}
          className="rounded-md border border-black/10 px-3 py-2"
        />
        <p className="text-xs text-black/50">
          ตั้งเองได้ตามต้องการ ไม่เกิน 10 ตัวอักษร ต้องไม่ซ้ำกับพระเครื่ององค์อื่นในร้านของคุณ
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          ชื่อพระเครื่อง
          <RequiredMark />
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
            <RequiredMark />
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
            <RequiredMark />
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
        <label htmlFor="imageFiles" className="text-sm font-medium">
          รูปพระเครื่อง
          <RequiredMark />
        </label>
        {mainImagePreviews.previews.length > 0 ? (
          <ImageThumbnails previews={mainImagePreviews.previews} altPrefix="รูปพระเครื่องที่เลือก" />
        ) : (
          defaultValues?.images &&
          defaultValues.images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {defaultValues.images.map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={img.imageUrl}
                  alt={`รูปพระเครื่อง ${i + 1}`}
                  className="h-24 w-24 rounded-md border border-black/10 object-cover"
                />
              ))}
            </div>
          )
        )}
        <input
          id="imageFiles"
          name="imageFiles"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={mainImagePreviews.onChange}
          className="rounded-md border border-black/10 px-3 py-2"
        />
        <p className="text-xs text-black/50">
          {defaultValues?.images && defaultValues.images.length > 0
            ? "เลือกไฟล์ใหม่เพื่อแทนที่รูปทั้งหมดเดิม (1-10 รูป) หรือปล่อยว่างไว้ถ้าไม่ต้องการเปลี่ยนรูป"
            : "อัปโหลดอย่างน้อย 1 รูป ไม่เกิน 10 รูป (JPG/PNG/WebP ไม่เกิน 5MB ต่อไฟล์)"}
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="hasCertificate"
          checked={hasCertificate}
          onChange={(e) => setHasCertificate(e.target.checked)}
        />
        มีใบรับประกัน
      </label>

      {hasCertificate && (
        <div className="flex flex-col gap-4 rounded-md bg-black/5 p-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="certificateInfo" className="text-sm font-medium">
              รายละเอียดใบรับประกัน
            </label>
            <input
              id="certificateInfo"
              name="certificateInfo"
              type="text"
              defaultValue={defaultValues?.certificateInfo ?? ""}
              className="rounded-md border border-black/10 px-3 py-2"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="certificateImageFiles" className="text-sm font-medium">
              รูปใบรับประกัน
              <RequiredMark />
            </label>
            {certImagePreviews.previews.length > 0 ? (
              <ImageThumbnails previews={certImagePreviews.previews} altPrefix="รูปใบรับประกันที่เลือก" />
            ) : (
              defaultValues?.certificateImages &&
              defaultValues.certificateImages.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {defaultValues.certificateImages.map((img, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={img.imageUrl}
                      alt={`รูปใบรับประกัน ${i + 1}`}
                      className="h-24 w-24 rounded-md border border-black/10 object-cover"
                    />
                  ))}
                </div>
              )
            )}
            <input
              id="certificateImageFiles"
              name="certificateImageFiles"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={certImagePreviews.onChange}
              className="rounded-md border border-black/10 px-3 py-2"
            />
            <p className="text-xs text-black/50">
              {defaultValues?.certificateImages && defaultValues.certificateImages.length > 0
                ? "เลือกไฟล์ใหม่เพื่อแทนที่รูปทั้งหมดเดิม (1-3 รูป) หรือปล่อยว่างไว้ถ้าไม่ต้องการเปลี่ยนรูป"
                : "อัปโหลดอย่างน้อย 1 รูป ไม่เกิน 3 รูป (JPG/PNG/WebP ไม่เกิน 5MB ต่อไฟล์)"}
            </p>
          </div>
        </div>
      )}

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
