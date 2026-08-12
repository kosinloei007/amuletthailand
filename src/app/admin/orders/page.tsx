import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/actions";
import { prisma } from "@/lib/prisma";

const STATUS_LABEL: Record<string, string> = {
  pending_verify: "รอตรวจสอบ",
  verified: "ยืนยันแล้ว",
  shipped: "จัดส่งแล้ว",
  cancelled: "ยกเลิก",
};

export default async function AdminOrdersPage() {
  const session = await requireSession();
  if (session.role !== "tenant_admin" || !session.tenantId) {
    redirect("/admin");
  }

  const orders = await prisma.order.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">ออร์เดอร์ทั้งหมด</h1>
        <Link href="/admin" className="text-sm underline">
          กลับไปแดชบอร์ด
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className="text-black/60">ยังไม่มีออร์เดอร์</p>
      ) : (
        <div className="flex flex-col divide-y divide-black/10 rounded-lg border border-black/10">
          {orders.map((order) => (
            <Link
              key={order.orderId}
              href={`/admin/orders/${order.orderId}`}
              className="flex items-center justify-between px-4 py-3 text-sm"
            >
              <div>
                <p className="font-mono font-medium">{order.orderNumber}</p>
                <p className="text-black/60">
                  {order.fullName} · {order.createdAt.toLocaleString("th-TH")}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{Number(order.totalAmount).toLocaleString("th-TH")} บาท</p>
                <p className="text-black/60">{STATUS_LABEL[order.status] ?? order.status}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
