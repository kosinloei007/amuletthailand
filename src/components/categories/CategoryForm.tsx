"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/categories/actions";

export function CategoryForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: { categoryId?: number; name?: string; slug?: string };
  submitLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {defaultValues?.categoryId && (
        <input type="hidden" name="categoryId" value={defaultValues.categoryId} />
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          ชื่อหมวดหมู่
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaultValues?.name ?? ""}
          className="rounded-md border border-black/10 px-3 py-2"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="slug" className="text-sm font-medium">
          Slug (ภาษาอังกฤษ)
        </label>
        <input
          id="slug"
          name="slug"
          type="text"
          required
          placeholder="phra-somdej"
          defaultValue={defaultValues?.slug ?? ""}
          className="rounded-md border border-black/10 px-3 py-2"
        />
        <p className="text-xs text-black/50">ตัวพิมพ์เล็กภาษาอังกฤษ ตัวเลข และขีดกลาง (-) เท่านั้น เช่น phra-somdej</p>
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
