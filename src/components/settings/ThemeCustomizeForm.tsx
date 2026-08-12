"use client";

import { useActionState } from "react";
import { customizeThemeAction, type ActionState } from "@/lib/settings/actions";
import type { ResolvedTheme } from "@/lib/theme/resolve";

function ColorField({ id, label, defaultValue }: { id: string; label: string; defaultValue: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input id={id} name={id} type="color" defaultValue={defaultValue} className="h-10 w-16 rounded border border-black/10" />
    </div>
  );
}

export function ThemeCustomizeForm({ theme }: { theme: ResolvedTheme }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(customizeThemeAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <ColorField id="primaryColor" label="สีหลัก" defaultValue={theme.primaryColor} />
        <ColorField id="accentColor" label="สีรอง" defaultValue={theme.accentColor} />
        <ColorField id="backgroundColor" label="พื้นหลัง" defaultValue={theme.backgroundColor} />
        <ColorField id="surfaceColor" label="พื้นผิวการ์ด" defaultValue={theme.surfaceColor} />
        <ColorField id="textColor" label="ตัวอักษร" defaultValue={theme.textColor} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="logoUrl" className="text-sm font-medium">
          URL โลโก้ (ไม่บังคับ)
        </label>
        <input
          id="logoUrl"
          name="logoUrl"
          type="url"
          defaultValue={theme.logoUrl ?? ""}
          placeholder="https://..."
          className="rounded-md border border-black/10 px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="fontFamily" className="text-sm font-medium">
            ฟอนต์ (ชื่อจาก Google Fonts)
          </label>
          <input
            id="fontFamily"
            name="fontFamily"
            type="text"
            defaultValue={theme.fontFamily ?? ""}
            placeholder="เช่น Noto Serif Thai"
            className="rounded-md border border-black/10 px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="layoutStyle" className="text-sm font-medium">
            รูปแบบเลย์เอาต์
          </label>
          <select
            id="layoutStyle"
            name="layoutStyle"
            defaultValue={theme.layoutStyle}
            className="rounded-md border border-black/10 px-3 py-2"
          >
            <option value="classic">classic</option>
            <option value="minimal">minimal</option>
            <option value="gold-temple">gold-temple</option>
          </select>
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-fit rounded-md bg-primary px-4 py-2 text-sm text-white disabled:opacity-60"
      >
        {isPending ? "กำลังบันทึก..." : "บันทึกธีมที่ปรับแต่ง"}
      </button>
    </form>
  );
}
