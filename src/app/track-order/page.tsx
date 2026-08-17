import { getCurrentTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { buildTrackingUrl } from "@/lib/shipments/trackingUrl";

const STATUS_LABEL: Record<string, string> = {
  pending_verify: "รอตรวจสอบการชำระเงิน",
  verified: "ยืนยันการชำระเงินแล้ว",
  shipped: "จัดส่งแล้ว",
  cancelled: "ยกเลิกแล้ว",
};

export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ orderNumber?: string; phone?: string }>;
}) {
  const { orderNumber, phone } = await searchParams;
  const tenant = await getCurrentTenant();

  const order =
    orderNumber && phone
      ? await prisma.order.findFirst({
          where: { tenantId: tenant.tenantId, orderNumber: orderNumber.trim(), phone: phone.trim() },
          include: { items: true, shipments: { include: { vendor: { select: { shopName: true } } } } },
        })
      : null;

  const searched = Boolean(orderNumber && phone);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-4 py-12">
      <h1 className="text-2xl font-semibold">ติดตามสถานะออร์เดอร์</h1>

      <form method="get" className="flex flex-col gap-4 rounded-lg border border-black/10 p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="orderNumber" className="text-sm font-medium">
            เลขออร์เดอร์
          </label>
          <input
            id="orderNumber"
            name="orderNumber"
            type="text"
            required
            defaultValue={orderNumber}
            className="rounded-md border border-black/10 px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="phone" className="text-sm font-medium">
            เบอร์โทรที่ใช้สั่งซื้อ
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            defaultValue={phone}
            className="rounded-md border border-black/10 px-3 py-2"
          />
        </div>
        <button type="submit" className="w-fit rounded-md bg-primary px-4 py-2 text-sm text-white">
          ตรวจสอบสถานะ
        </button>
      </form>

      {searched && !order && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          ไม่พบออร์เดอร์ที่ตรงกับเลขออร์เดอร์และเบอร์โทรนี้
        </p>
      )}

      {order && (
        <div className="flex flex-col gap-3 rounded-lg border border-black/10 p-4">
          <div className="flex items-center justify-between">
            <p className="font-mono font-semibold">{order.orderNumber}</p>
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-white">
              {STATUS_LABEL[order.status] ?? order.status}
            </span>
          </div>
          <div className="flex flex-col gap-1 text-sm">
            {order.items.map((item) => (
              <div key={item.orderItemId} className="flex justify-between">
                <span>
                  {item.productName} x{item.quantity}
                </span>
                <span>{(Number(item.unitPrice) * item.quantity).toLocaleString("th-TH")} บาท</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between border-t border-black/10 pt-2 text-sm font-semibold">
            <span>ยอดรวมสุทธิ</span>
            <span>{Number(order.totalAmount).toLocaleString("th-TH")} บาท</span>
          </div>
          {order.shipments.length > 0 && (
            <div className="flex flex-col gap-1 border-t border-black/10 pt-2 text-sm">
              <p className="font-medium">เลขพัสดุ</p>
              {order.shipments.map((s) => (
                <a
                  key={s.shipmentId}
                  href={buildTrackingUrl(s.trackingNumber)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline"
                >
                  {s.vendor ? `${s.vendor.shopName} — ` : ""}
                  {s.carrierName} {s.trackingNumber} (ติดตามผ่าน 17TRACK)
                </a>
              ))}
            </div>
          )}
          <p className="text-xs text-black/50">สั่งซื้อเมื่อ {order.createdAt.toLocaleString("th-TH")}</p>
        </div>
      )}
    </main>
  );
}
