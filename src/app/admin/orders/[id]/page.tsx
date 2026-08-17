import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/actions";
import { prisma } from "@/lib/prisma";
import {
  updateOrderStatusAction,
  updateSlipVerifyStatusAction,
  sendVendorNotifyAction,
  saveHouseShipmentAction,
} from "@/lib/admin-orders/actions";
import { buildTrackingUrl } from "@/lib/shipments/trackingUrl";
import { CARRIER_OPTIONS } from "@/lib/shipments/carriers";

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

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notified?: string; shipped?: string }>;
}) {
  const session = await requireSession();
  if (session.role !== "tenant_admin" || !session.tenantId) {
    redirect("/admin");
  }
  const { id } = await params;
  const { notified, shipped } = await searchParams;
  const orderId = Number(id);

  const order = await prisma.order.findFirst({
    where: { orderId, tenantId: session.tenantId },
    include: {
      items: { include: { product: { select: { sku: true } }, vendor: { select: { vendorId: true, shopName: true } } } },
      shipments: true,
      user: true,
      appliedMemberTier: true,
      appliedStorePromotion: true,
      paymentTransactions: true,
    },
  });
  if (!order) {
    notFound();
  }

  const vendorGroups = new Map<number | "own", { vendor: { vendorId: number; shopName: string } | null; items: typeof order.items }>();
  for (const item of order.items) {
    const key = item.vendorId ?? "own";
    const existing = vendorGroups.get(key);
    if (existing) {
      existing.items.push(item);
    } else {
      vendorGroups.set(key, { vendor: item.vendor, items: [item] });
    }
  }
  const notifiedVendorName =
    notified && vendorGroups.get(Number(notified))?.vendor?.shopName;

  const shipmentByKey = new Map<number | "own", (typeof order.shipments)[number]>();
  for (const s of order.shipments) {
    shipmentByKey.set(s.vendorId ?? "own", s);
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
              {item.productName}
              {item.product.sku && <span className="text-black/50"> ({item.product.sku})</span>} x{item.quantity}
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

      {vendorGroups.size > 1 || (vendorGroups.size === 1 && !vendorGroups.has("own")) ? (
        <section className="flex flex-col gap-3 rounded-lg border border-black/10 p-4">
          <h2 className="font-medium">แยกตามผู้ขาย ({order.items.length} รายการ)</h2>
          {notifiedVendorName && (
            <p className="text-sm text-accent">ส่งแจ้งเตือนไปยัง {notifiedVendorName} แล้ว</p>
          )}
          <div className="flex flex-col gap-2">
            {Array.from(vendorGroups.values()).map(({ vendor, items: groupItems }) => (
              <div
                key={vendor?.vendorId ?? "own"}
                className="flex items-center justify-between rounded-md bg-black/5 px-3 py-2 text-sm"
              >
                <span>
                  ที่อยู่ลูกค้า {order.fullName} — {vendor ? vendor.shopName : "สินค้าของร้านเอง"} มี{" "}
                  {groupItems.length} รายการ
                </span>
                {vendor && (
                  <form action={sendVendorNotifyAction}>
                    <input type="hidden" name="orderId" value={order.orderId} />
                    <input type="hidden" name="vendorId" value={vendor.vendorId} />
                    <button type="submit" className="shrink-0 rounded-md border border-black/20 px-3 py-1 text-xs">
                      Send Notify
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="flex flex-col gap-3 rounded-lg border border-black/10 p-4">
        <h2 className="font-medium">การจัดส่ง (เลขพัสดุ)</h2>
        {shipped && <p className="text-sm text-accent">บันทึกเลขพัสดุแล้ว</p>}
        <div className="flex flex-col gap-3">
          {Array.from(vendorGroups.entries()).map(([key, { vendor, items: groupItems }]) => {
            const shipment = shipmentByKey.get(key);
            const isKnownCarrier = shipment ? CARRIER_OPTIONS.includes(shipment.carrierName) : false;
            return (
              <div key={key} className="flex flex-col gap-2 rounded-md bg-black/5 p-3 text-sm">
                <p className="font-medium">
                  {vendor ? vendor.shopName : "สินค้าของร้านเอง"} ({groupItems.length} รายการ)
                </p>
                {shipment ? (
                  <a
                    href={buildTrackingUrl(shipment.trackingNumber)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline"
                  >
                    ติดตามพัสดุผ่าน 17TRACK — {shipment.carrierName} {shipment.trackingNumber}
                  </a>
                ) : (
                  <p className="text-black/50">
                    {vendor ? "ผู้ขายยังไม่ได้กรอกเลขพัสดุ" : "ยังไม่มีเลขพัสดุ"}
                  </p>
                )}
                {!vendor && (
                  <form action={saveHouseShipmentAction} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="orderId" value={order.orderId} />
                    <select
                      name="carrierName"
                      defaultValue={shipment ? (isKnownCarrier ? shipment.carrierName : "other") : ""}
                      className="rounded-md border border-black/10 px-2 py-1.5 text-xs"
                    >
                      <option value="" disabled>
                        เลือกขนส่ง
                      </option>
                      {CARRIER_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="other">อื่นๆ (ระบุเอง)</option>
                    </select>
                    <input
                      name="carrierNameOther"
                      type="text"
                      placeholder="ระบุขนส่ง (ถ้าเลือกอื่นๆ)"
                      defaultValue={shipment && !isKnownCarrier ? shipment.carrierName : ""}
                      className="rounded-md border border-black/10 px-2 py-1.5 text-xs"
                    />
                    <input
                      name="trackingNumber"
                      type="text"
                      placeholder="เลขพัสดุ"
                      defaultValue={shipment?.trackingNumber ?? ""}
                      className="rounded-md border border-black/10 px-2 py-1.5 text-xs"
                    />
                    <button type="submit" className="rounded-md bg-primary px-3 py-1.5 text-xs text-white">
                      {shipment ? "อัปเดตเลขพัสดุ" : "บันทึกเลขพัสดุ"}
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {order.paymentTransactions.length > 0 ? (
        <section className="flex flex-col gap-2 rounded-lg border border-black/10 p-4 text-sm">
          <h2 className="font-medium">การชำระผ่าน Payment Gateway (จำลอง)</h2>
          {order.paymentTransactions.map((tx) => (
            <div key={tx.paymentTransactionId} className="flex flex-col gap-0.5">
              <p>
                <span className="text-black/60">Gateway:</span> {tx.gatewayName}
              </p>
              <p>
                <span className="text-black/60">Ref:</span> <span className="font-mono">{tx.transactionRef}</span>
              </p>
              <p>
                <span className="text-black/60">สถานะ:</span> {tx.gatewayStatus}
              </p>
              <p className="text-black/60">{tx.createdAt.toLocaleString("th-TH")}</p>
            </div>
          ))}
        </section>
      ) : (
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
      )}

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
