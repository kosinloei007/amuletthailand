"use client";

import { useActionState } from "react";
import { registerAction } from "@/lib/auth/actions";

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="fullName" className="text-sm font-medium">
          ชื่อ-นามสกุล
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          autoComplete="name"
          className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
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
          autoComplete="email"
          className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="phone" className="text-sm font-medium">
          เบอร์โทร (ไม่บังคับ)
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">
          รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="confirmPassword" className="text-sm font-medium">
          ยืนยันรหัสผ่าน
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-foreground px-4 py-2 text-background disabled:opacity-60"
      >
        {isPending ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
      </button>
    </form>
  );
}
