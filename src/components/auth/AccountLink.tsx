"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
    <Link href={accountHrefFor(session.role)} className="text-sm underline">
      บัญชีของฉัน
    </Link>
  );
}
