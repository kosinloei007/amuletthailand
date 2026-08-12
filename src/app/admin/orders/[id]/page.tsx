import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/actions";
import { prisma } from "@/lib/prisma";
import { updateOrderStatusAction, updateSlipVerifyStatusAction } from "@/lib/admin-orders/actions";

const STATUS_LABEL: Record<string, string> = {
  pending_verify: "รอตรวจสอบ",
  verified: "ยืนยันแล้ว",
  shipped: "จัดส่งแล้ว",
  cancelled: "ยกเลิก",
};

const SLIP_STATUS_LABEL: Record<string, string> = {
  pending: "รอตรวจสอบ",
  matched: "ยอดตรงกัน",
  mismatched: "ยอดไม่ตรงกัน",
  unreadable: "อ่านสลิปไม่ได้",
};

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session.role !== "tenant_admin" || !session.tenantId) {
    redirect("/admin");
  }
  const { id } = await params;
  const orderId = Number(id);

  const order = await prisma.order.findFirst({
    where: { orderId, tenantId: session.tenantId },
    include: { items: true, user: true, appliedMemberTier: true, appliedStorePromotion: true },
  });
  if (!order) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">ออร์เดอร์ #{order.orderNumber}</h1>
        <Link href="/admin/orders" className="text-sm underline">
          กลับ
        </Link>
      </div>

      <section className="flex flex-col gap-2 rounded-lg border border-black/10 p-4 text-sm">
        <p>
          <span className="text-black/60">ลูกค้า:</span> {order.fullName} ({order.phone})
          {order.user ? " — สมาชิก" : " — guest"}
        </p>
        <p>
          <span className="text-black/60">ที่อยู่:</span> {order.address} {order.subDistrict} {order.district}{" "}
          {order.province} {order.postalCode}
        </p>
        {order.note && (
          <p>
            <span className="text-black/60">หมายเหตุ:</span> {order.note}
          </p>
        )}
        <p>
          <span className="text-black/60">สั่งซื้อเมื่อ:</span> {order.createdAt.toLocaleString("th-TH")}
        </p>
      </section>

      <section className="flex flex-col gap-2 rounded-lg border border-black/10 p-4 text-sm">
        {order.items.map((item) => (
          <div key={item.orderItemId} className="flex justify-between">
            <span>
              {item.productName} x{item.quantity}
            </span>
            <span>{(Number(item.unitPrice) * item.quantity).toLocaleString("th-TH")} บาท</span>
          </div>
        ))}
        <div className="flex justify-between text-black/60">
          <span>ยอดสินค้า</span>
          <span>{Number(order.subtotalAmount).toLocaleString("th-TH")} บาท</span>
        </div>
        {Number(order.discountAmount) > 0 && (
          <div className="flex justify-between text-accent">
            <span>ส่วนลดรวม{order.appliedMemberTier ? ` (สมาชิก ${order.appliedMemberTier.name})` : ""}</span>
            <span>-{Number(order.discountAmount).toLocaleString("th-TH")} บาท</span>
          </div>
        )}
        <div className="flex justify-between text-black/60">
          <span>ค่าจัดส่ง</span>
          <span>{Number(order.shippingFee).toLocaleString("th-TH")} บาท</span>
        </div>
        <div className="flex justify-between border-t border-black/10 pt-2 font-semibold">
          <span>ยอดรวมสุทธิ</span>
          <span>{Number(order.totalAmount).toLocaleString("th-TH")} บาท</span>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-black/10 p-4">
        <h2 className="font-medium">สลิปการโอนเงิน</h2>
        {order.paymentSlipUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={order.paymentSlipUrl} alt="สลิปการโอนเงิน" className="max-w-xs rounded-md border border-black/10" />
        ) : (
          <p className="text-sm text-black/60">ไม่มีไฟล์แนบ</p>
        )}
        <p className="text-sm">
          ผลตรวจสอบปัจจุบัน: <span className="font-medium">{SLIP_STATUS_LABEL[order.slipVerifyStatus] ?? order.slipVerifyStatus}</span>
        </p>
        <form action={updateSlipVerifyStatusAction} className="flex flex-wrap gap-2">
          <input type="hidden" name="orderId" value={order.orderId} />
          {Object.entries(SLIP_STATUS_LABEL).map(([value, label]) => (
            <button
              key={value}
              type="submit"
              name="slipVerifyStatus"
              value={value}
              disabled={order.slipVerifyStatus === value}
              className="rounded-md border border-black/20 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              {label}
            </button>
          ))}
        </form>
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-black/10 p-4">
        <h2 className="font-medium">สถานะออร์เดอร์</h2>
        <p className="text-sm">
          สถานะปัจจุบัน: <span className="font-medium">{STATUS_LABEL[order.status] ?? order.status}</span>
        </p>
        <form action={updateOrderStatusAction} className="flex flex-wrap gap-2">
          <input type="hidden" name="orderId" value={order.orderId} />
          {Object.entries(STATUS_LABEL).map(([value, label]) => (
            <button
              key={value}
              type="submit"
              name="status"
              value={value}
              disabled={order.status === value}
              className="rounded-md border border-black/20 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              {label}
            </button>
          ))}
        </form>
      </section>
    </main>
  );
}
