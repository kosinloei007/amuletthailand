"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "@/lib/auth/actions";

type UserRole = "super_admin" | "tenant_admin" | "member" | "vendor";

type SessionInfo =
  | { loggedIn: false }
  | { loggedIn: true; role: UserRole; fullName: string };

function accountHrefFor(role: UserRole) {
  if (role === "tenant_admin" || role === "super_admin") return "/admin";
  if (role === "vendor") return "/vendor";
  return "/account";
}

export function AccountLink() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const pathname = usePathname();

  // ดึงสถานะ session ใหม่ทุกครั้งที่เปลี่ยนหน้า เพราะ login/logout ทำผ่าน
  // redirect() ใน server action ซึ่งไม่ทำให้ component นี้ remount เอง
  useEffect(() => {
    let cancelled = false;
    fetch("/api/session")
      .then((res) => res.json())
      .then((data: SessionInfo) => {
        if (!cancelled) setSession(data);
      })
      .catch(() => {
        if (!cancelled) setSession({ loggedIn: false });
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (!session?.loggedIn) {
    return (
      <Link href="/login" className="text-sm underline">
        เข้าสู่ระบบ
      </Link>
    );
  }

  return (
    <div className="group relative">
      <Link href={accountHrefFor(session.role)} className="text-sm underline">
        สวัสดี, {session.fullName}
      </Link>
      <div className="invisible absolute right-0 top-full z-20 w-40 pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100">
        <div className="flex flex-col gap-1 rounded-md border border-black/10 bg-surface p-2 shadow-md">
          <Link href={accountHrefFor(session.role)} className="rounded px-2 py-1.5 text-sm hover:bg-black/5">
            บัญชีของฉัน
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-black/5">
              ออกจากระบบ
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
