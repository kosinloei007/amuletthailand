import Link from "next/link";
import { requireVendor } from "@/lib/auth/actions";
import { logoutAction } from "@/lib/auth/actions";
import { prisma } from "@/lib/prisma";

export default async function VendorDashboardPage() {
  const session = await requireVendor();

  const [productCount, orderItemCount, vendor] = await Promise.all([
    prisma.product.count({ where: { vendorId: session.vendorId } }),
    prisma.orderItem.count({ where: { vendorId: session.vendorId } }),
    prisma.vendor.findUnique({ where: { vendorId: session.vendorId } }),
  ]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">แดชบอร์ดผู้ขาย</h1>
        <form action={logoutAction}>
          <button type="submit" className="rounded-md border border-black/20 px-3 py-1.5 text-sm">
            ออกจากระบบ
          </button>
        </form>
      </div>

      <p className="text-black/70">
        ยินดีต้อนรับ {vendor?.shopName}
        {vendor?.status === "suspended" && (
          <span className="ml-2 rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">
            บัญชีถูกระงับ — พระเครื่องจะไม่แสดงบนหน้าร้านจนกว่าแอดมินจะเปิดใช้งานอีกครั้ง
          </span>
        )}
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-black/10 p-4">
          <p className="text-sm text-black/60">พระเครื่องของฉัน</p>
          <p className="text-3xl font-semibold">{productCount}</p>
        </div>
        <div className="rounded-lg border border-black/10 p-4">
          <p className="text-sm text-black/60">รายการที่ถูกสั่งซื้อ</p>
          <p className="text-3xl font-semibold">{orderItemCount}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/vendor/products" className="w-fit rounded-md border border-black/20 px-4 py-2 text-sm">
          จัดการพระเครื่อง
        </Link>
        <Link href="/vendor/orders" className="w-fit rounded-md border border-black/20 px-4 py-2 text-sm">
          ออร์เดอร์ของฉัน
        </Link>
        <Link href="/vendor/settings" className="w-fit rounded-md border border-black/20 px-4 py-2 text-sm">
          ตั้งค่าบัญชี
        </Link>
      </div>
    </main>
  );
}
