import Link from "next/link";
import { requireSession, logoutAction } from "@/lib/auth/actions";
import { prisma } from "@/lib/prisma";

const ROLE_LABEL: Record<string, string> = {
  super_admin: "ผู้ดูแลระบบสูงสุด",
  tenant_admin: "แอดมินร้าน",
  member: "สมาชิก",
};

export default async function AccountPage() {
  const session = await requireSession();

  const user = await prisma.user.findUnique({
    where: { userId: session.userId },
    include: { memberTier: true, tenant: true },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-4 py-12">
      <h1 className="text-2xl font-semibold">บัญชีของฉัน</h1>

      <dl className="flex flex-col gap-3 rounded-lg border border-black/10 p-4 dark:border-white/20">
        <div className="flex justify-between">
          <dt className="text-black/60 dark:text-white/60">ชื่อ-นามสกุล</dt>
          <dd>{user?.fullName}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-black/60 dark:text-white/60">อีเมล</dt>
          <dd>{user?.email}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-black/60 dark:text-white/60">สิทธิ์การใช้งาน</dt>
          <dd>{ROLE_LABEL[session.role] ?? session.role}</dd>
        </div>
        {user?.tenant && (
          <div className="flex justify-between">
            <dt className="text-black/60 dark:text-white/60">ร้านค้า</dt>
            <dd>{user.tenant.shopName}</dd>
          </div>
        )}
        {user?.memberTier && (
          <div className="flex justify-between">
            <dt className="text-black/60 dark:text-white/60">ระดับสมาชิก</dt>
            <dd>{user.memberTier.name}</dd>
          </div>
        )}
      </dl>

      <Link
        href="/account/addresses"
        className="w-fit rounded-md border border-black/20 px-4 py-2 dark:border-white/30"
      >
        จัดการที่อยู่จัดส่ง
      </Link>

      <form action={logoutAction}>
        <button
          type="submit"
          className="rounded-md border border-black/20 px-4 py-2 dark:border-white/30"
        >
          ออกจากระบบ
        </button>
      </form>
    </main>
  );
}
