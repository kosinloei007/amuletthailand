"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { ActionState } from "@/lib/vendor-products/actions";

type Option = { id: number; label: string };

type ExistingImage = { id: number; url: string };

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
  images?: ExistingImage[];
  certificateImages?: ExistingImage[];
};

function RequiredMark() {
  return <span className="text-red-600"> *</span>;
}

function ImagePicker({
  label,
  required,
  fileFieldName,
  removeFieldName,
  max,
  helpText,
  existingImages,
}: {
  label: string;
  required: boolean;
  fileFieldName: string;
  removeFieldName: string;
  max: number;
  helpText: string;
  existingImages: ExistingImage[];
}) {
  const [keptExisting, setKeptExisting] = useState<ExistingImage[]>(existingImages);
  const [removedIds, setRemovedIds] = useState<number[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const urls = newFiles.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newFiles]);

  const totalCount = keptExisting.length + newFiles.length;
  const remaining = Math.max(0, max - totalCount);

  function syncInputFiles(files: File[]) {
    const dt = new DataTransfer();
    files.forEach((file) => dt.items.add(file));
    if (inputRef.current) inputRef.current.files = dt.files;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files ? Array.from(e.target.files) : [];
    const merged = [...newFiles, ...picked].slice(0, Math.max(0, max - keptExisting.length));
    setNewFiles(merged);
    syncInputFiles(merged);
  }

  function removeExisting(id: number) {
    setKeptExisting((prev) => prev.filter((img) => img.id !== id));
    setRemovedIds((prev) => [...prev, id]);
  }

  function removeNew(index: number) {
    const next = newFiles.filter((_, i) => i !== index);
    setNewFiles(next);
    syncInputFiles(next);
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fileFieldName} className="text-sm font-medium">
        {label}
        {required && <RequiredMark />}
      </label>

      {removedIds.map((id) => (
        <input key={id} type="hidden" name={removeFieldName} value={id} />
      ))}

      {(keptExisting.length > 0 || previews.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {keptExisting.map((img) => (
            <div key={img.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={label}
                className="h-24 w-24 rounded-md border border-black/10 object-cover"
              />
              <button
                type="button"
                onClick={() => removeExisting(img.id)}
                aria-label="ลบรูปนี้"
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs text-white"
              >
                ×
              </button>
            </div>
          ))}
          {previews.map((url, i) => (
            <div key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={label}
                className="h-24 w-24 rounded-md border border-black/10 object-cover"
              />
              <button
                type="button"
                onClick={() => removeNew(i)}
                aria-label="ลบรูปนี้"
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs text-white"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        id={fileFieldName}
        name={fileFieldName}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        disabled={remaining === 0}
        className="rounded-md border border-black/10 px-3 py-2 disabled:opacity-50"
      />
      <p className="text-xs text-black/50">
        {totalCount}/{max} รูป — {helpText}
      </p>
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

      <ImagePicker
        label="รูปพระเครื่อง"
        required
        fileFieldName="imageFiles"
        removeFieldName="removeImageIds"
        max={10}
        helpText="เพิ่มรูปได้เรื่อยๆ ไม่เกิน 10 รูป กด × ที่มุมรูปเพื่อลบ (JPG/PNG/WebP ไม่เกิน 5MB ต่อไฟล์)"
        existingImages={defaultValues?.images ?? []}
      />

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

          <ImagePicker
            label="รูปใบรับประกัน"
            required
            fileFieldName="certificateImageFiles"
            removeFieldName="removeCertificateImageIds"
            max={3}
            helpText="เพิ่มรูปได้เรื่อยๆ ไม่เกิน 3 รูป กด × ที่มุมรูปเพื่อลบ (JPG/PNG/WebP ไม่เกิน 5MB ต่อไฟล์)"
            existingImages={defaultValues?.certificateImages ?? []}
          />
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
