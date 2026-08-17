import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth/actions";
import { prisma } from "@/lib/prisma";
import { toggleUserActiveAction, updateUserRoleAction } from "@/lib/users/actions";

const ROLE_LABEL: Record<string, string> = {
  super_admin: "ผู้ดูแลระบบสูงสุด",
  tenant_admin: "แอดมินร้าน",
  member: "สมาชิก",
  vendor: "ผู้ขาย",
};

const EDITABLE_ROLES = ["member", "tenant_admin", "super_admin"] as const;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireSuperAdmin();
  const { error } = await searchParams;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">ผู้ใช้งานและสิทธิ์ (Role)</h1>
        <Link href="/admin" className="text-sm underline">
          กลับไปแดชบอร์ด
        </Link>
      </div>

      <p className="text-sm text-black/60">
        เปลี่ยนสิทธิ์ได้เฉพาะสมาชิก/แอดมินร้าน/ผู้ดูแลระบบสูงสุด — บัญชีผู้ขาย (vendor) จัดการสิทธิ์ได้ที่หน้าผู้ขาย
        (Marketplace) เท่านั้น เพื่อไม่ให้ข้อมูลผู้ขายกับบัญชีผู้ใช้หลุดกัน
      </p>

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <div className="flex flex-col gap-4">
        {users.map((user) => {
          const isSelf = user.userId === session.userId;
          return (
            <div key={user.userId} className="flex flex-col gap-3 rounded-lg border border-black/10 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">
                    {user.fullName}
                    {isSelf && <span className="ml-2 text-xs text-black/50">(บัญชีของคุณ)</span>}
                    {!user.isActive && (
                      <span className="ml-2 rounded-full bg-black/40 px-2 py-0.5 text-xs text-white">ระงับ</span>
                    )}
                  </p>
                  <p className="text-sm text-black/70">
                    {user.email} · {ROLE_LABEL[user.role] ?? user.role}
                  </p>
                </div>
              </div>

              {user.role !== "vendor" && !isSelf && (
                <form action={updateUserRoleAction} className="flex items-center gap-2">
                  <input type="hidden" name="userId" value={user.userId} />
                  <select
                    name="role"
                    defaultValue={user.role}
                    className="rounded-md border border-black/10 px-2 py-1 text-sm"
                  >
                    {EDITABLE_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABEL[role]}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="text-sm underline">
                    บันทึกสิทธิ์
                  </button>
                </form>
              )}

              {!isSelf && (
                <form action={toggleUserActiveAction}>
                  <input type="hidden" name="userId" value={user.userId} />
                  <button type="submit" className="text-sm underline">
                    {user.isActive ? "ระงับบัญชีนี้" : "เปิดใช้งานอีกครั้ง"}
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
