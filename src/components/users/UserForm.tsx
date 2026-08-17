"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/users/actions";

const ROLE_OPTIONS = [
  { value: "member", label: "สมาชิก" },
  { value: "tenant_admin", label: "แอดมินร้าน" },
  { value: "super_admin", label: "ผู้ดูแลระบบสูงสุด" },
] as const;

export function UserForm({
  action,
  defaultValues,
  submitLabel,
  showPassword,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: { userId?: number; fullName?: string; email?: string; phone?: string | null; role?: string };
  submitLabel: string;
  showPassword?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {defaultValues?.userId && <input type="hidden" name="userId" value={defaultValues.userId} />}

      <div className="flex flex-col gap-1">
        <label htmlFor="fullName" className="text-sm font-medium">
          ชื่อ-นามสกุล
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          defaultValue={defaultValues?.fullName ?? ""}
          className="rounded-md border border-black/10 px-3 py-2"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          อีเมล
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={defaultValues?.email ?? ""}
          className="rounded-md border border-black/10 px-3 py-2"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="phone" className="text-sm font-medium">
          เบอร์โทร (ไม่บังคับ)
        </label>
        <input
          id="phone"
          name="phone"
          type="text"
          defaultValue={defaultValues?.phone ?? ""}
          className="rounded-md border border-black/10 px-3 py-2"
        />
      </div>

      {showPassword && (
        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium">
            รหัสผ่านเริ่มต้น
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            placeholder="อย่างน้อย 8 ตัวอักษร"
            className="rounded-md border border-black/10 px-3 py-2"
          />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="role" className="text-sm font-medium">
          สิทธิ์ (Role)
        </label>
        <select
          id="role"
          name="role"
          defaultValue={defaultValues?.role ?? "member"}
          className="rounded-md border border-black/10 px-3 py-2"
        >
          {ROLE_OPTIONS.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
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
