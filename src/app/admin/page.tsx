import Link from "next/link";
import { requireSession, logoutAction } from "@/lib/auth/actions";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const session = await requireSession();

  const [productCount, orderCount] = session.tenantId
    ? await Promise.all([
        prisma.product.count({ where: { tenantId: session.tenantId } }),
        prisma.order.count({ where: { tenantId: session.tenantId } }),
      ])
    : [
        await prisma.product.count(),
        await prisma.order.count(),
      ];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">แดชบอร์ดแอดมิน</h1>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-md border border-black/20 px-3 py-1.5 text-sm"
          >
            ออกจากระบบ
          </button>
        </form>
      </div>

      <p className="text-black/70">
        ยินดีต้อนรับ {session.fullName} ({session.role === "super_admin" ? "ผู้ดูแลระบบสูงสุด" : "แอดมินร้าน"})
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-black/10 p-4">
          <p className="text-sm text-black/60">สินค้าทั้งหมด</p>
          <p className="text-3xl font-semibold">{productCount}</p>
        </div>
        <div className="rounded-lg border border-black/10 p-4">
          <p className="text-sm text-black/60">คำสั่งซื้อทั้งหมด</p>
          <p className="text-3xl font-semibold">{orderCount}</p>
        </div>
      </div>

      {session.role === "tenant_admin" && (
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/orders" className="w-fit rounded-md border border-black/20 px-4 py-2 text-sm">
            ออร์เดอร์
          </Link>
          <Link href="/admin/member-tiers" className="w-fit rounded-md border border-black/20 px-4 py-2 text-sm">
            จัดการระดับสมาชิก
          </Link>
          <Link href="/admin/promotions" className="w-fit rounded-md border border-black/20 px-4 py-2 text-sm">
            โปรโมชั่นทั้งร้าน
          </Link>
          <Link href="/admin/payment-info" className="w-fit rounded-md border border-black/20 px-4 py-2 text-sm">
            บัญชีรับโอนเงิน
          </Link>
          <Link href="/admin/notifications" className="w-fit rounded-md border border-black/20 px-4 py-2 text-sm">
            การแจ้งเตือน
          </Link>
          <Link href="/admin/settings" className="w-fit rounded-md border border-black/20 px-4 py-2 text-sm">
            ตั้งค่าร้าน
          </Link>
        </div>
      )}
    </main>
  );
}
