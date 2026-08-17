import Link from "next/link";
import { requireVendor } from "@/lib/auth/actions";
import { prisma } from "@/lib/prisma";
import { ShipmentForm } from "@/components/vendor-orders/ShipmentForm";
import { buildTrackingUrl } from "@/lib/shipments/trackingUrl";

const STATUS_LABEL: Record<string, string> = {
  pending_verify: "รอตรวจสอบ",
  verified: "ยืนยันแล้ว",
  shipped: "จัดส่งแล้ว",
  cancelled: "ยกเลิก",
};

export default async function VendorOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ shipped?: string }>;
}) {
  const session = await requireVendor();
  const { shipped } = await searchParams;

  const items = await prisma.orderItem.findMany({
    where: { vendorId: session.vendorId },
    include: {
      order: { include: { shipments: { where: { vendorId: session.vendorId } } } },
      product: { select: { sku: true } },
    },
    orderBy: { order: { createdAt: "desc" } },
  });

  const orderGroups = new Map<
    number,
    { order: (typeof items)[number]["order"]; items: typeof items }
  >();
  for (const item of items) {
    const existing = orderGroups.get(item.orderId);
    if (existing) {
      existing.items.push(item);
    } else {
      orderGroups.set(item.orderId, { order: item.order, items: [item] });
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">ออร์เดอร์ของฉัน</h1>
        <Link href="/vendor" className="text-sm underline">
          กลับไปแดชบอร์ด
        </Link>
      </div>

      <p className="text-sm text-black/60">
        แสดงเฉพาะรายการสินค้าของร้านคุณในแต่ละออร์เดอร์ — สถานะออร์เดอร์จัดการโดยแอดมินร้าน ส่วนเลขพัสดุกรอกเองได้ด้านล่าง
      </p>

      <div className="flex flex-col gap-4">
        {orderGroups.size === 0 && <p className="text-sm text-black/60">ยังไม่มีออร์เดอร์</p>}
        {Array.from(orderGroups.values()).map(({ order, items: groupItems }) => {
          const mySubtotal = groupItems.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
          const shipment = order.shipments[0];
          return (
            <div key={order.orderId} className="flex flex-col gap-2 rounded-lg border border-black/10 p-4 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-medium">#{order.orderNumber}</p>
                <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs">
                  {STATUS_LABEL[order.status] ?? order.status}
                </span>
              </div>
              <p className="text-black/60">
                ลูกค้า: {order.fullName} ({order.phone}) · สั่งซื้อเมื่อ {order.createdAt.toLocaleString("th-TH")}
              </p>
              <p className="text-black/60">
                ที่อยู่จัดส่ง: {order.address} {order.subDistrict} {order.district} {order.province}{" "}
                {order.postalCode}
              </p>
              <div className="flex flex-col gap-1 border-t border-black/10 pt-2">
                {groupItems.map((item) => (
                  <div key={item.orderItemId} className="flex justify-between">
                    <span>
                      {item.productName}
                      {item.product.sku && <span className="text-black/50"> ({item.product.sku})</span>} x{item.quantity}
                    </span>
                    <span>{(Number(item.unitPrice) * item.quantity).toLocaleString("th-TH")} บาท</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between border-t border-black/10 pt-2 font-medium">
                <span>ยอดสินค้าของร้านคุณ</span>
                <span>{mySubtotal.toLocaleString("th-TH")} บาท</span>
              </div>
              <div className="flex flex-col gap-2 border-t border-black/10 pt-2">
                {shipment && (
                  <a
                    href={buildTrackingUrl(shipment.trackingNumber)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary underline"
                  >
                    ติดตามพัสดุผ่าน 17TRACK — {shipment.carrierName} {shipment.trackingNumber}
                  </a>
                )}
                {shipped === String(order.orderId) && (
                  <p className="text-xs text-accent">บันทึกเลขพัสดุแล้ว</p>
                )}
                <ShipmentForm
                  orderId={order.orderId}
                  defaultCarrier={shipment?.carrierName}
                  defaultTrackingNumber={shipment?.trackingNumber}
                />
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
