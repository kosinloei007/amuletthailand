import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/actions";
import { prisma } from "@/lib/prisma";
import { createPayoutBatchAction, markPayoutBatchPaidAction } from "@/lib/payouts/actions";

const STATUS_LABEL: Record<string, string> = {
  pending: "รอจ่าย",
  paid: "จ่ายแล้ว",
};

function sumAmount(items: { unitPrice: unknown; quantity: number }[]) {
  return items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
}

export default async function VendorPayoutsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireSession();
  if (session.role !== "tenant_admin" || !session.tenantId) {
    redirect("/admin");
  }
  const { id } = await params;
  const { error } = await searchParams;
  const vendorId = Number(id);

  const vendor = await prisma.vendor.findFirst({ where: { vendorId, tenantId: session.tenantId } });
  if (!vendor) {
    notFound();
  }

  const now = new Date();
  const [notYetEligibleItems, readyItems, batches] = await Promise.all([
    prisma.orderItem.findMany({
      where: {
        vendorId,
        payoutStatus: "pending",
        OR: [{ payoutEligibleAt: null }, { payoutEligibleAt: { gt: now } }],
      },
    }),
    prisma.orderItem.findMany({
      where: { vendorId, payoutStatus: "pending", payoutEligibleAt: { lte: now }, payoutBatchId: null },
    }),
    prisma.vendorPayoutBatch.findMany({ where: { vendorId }, orderBy: { createdAt: "desc" } }),
  ]);

  const notYetEligibleAmount = sumAmount(notYetEligibleItems);
  const readyAmount = sumAmount(readyItems);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">รอบจ่ายเงิน — {vendor.shopName}</h1>
        <Link href={`/admin/vendors/${vendor.vendorId}/edit`} className="text-sm underline">
          กลับ
        </Link>
      </div>

      <p className="text-sm text-black/60">
        ค่าคอมมิชชั่นปัจจุบัน: {Number(vendor.commissionPercent)}% — แก้ไขได้ที่หน้าแก้ไขผู้ขาย
      </p>

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <section className="flex flex-col gap-3 rounded-lg border border-black/10 p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-black/60">ยอดที่ยังไม่พ้นระยะ escrow ({notYetEligibleItems.length} รายการ)</span>
          <span>{notYetEligibleAmount.toLocaleString("th-TH")} บาท</span>
        </div>
        <div className="flex justify-between font-medium">
          <span>ยอดที่พร้อมจัดเข้ารอบจ่าย ({readyItems.length} รายการ)</span>
          <span>{readyAmount.toLocaleString("th-TH")} บาท</span>
        </div>
        <form action={createPayoutBatchAction}>
          <input type="hidden" name="vendorId" value={vendor.vendorId} />
          <button
            type="submit"
            disabled={readyItems.length === 0}
            className="w-fit rounded-md bg-primary px-4 py-2 text-sm text-white disabled:opacity-40"
          >
            สร้างรอบจ่ายใหม่
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">ประวัติรอบจ่าย</h2>
        {batches.length === 0 && <p className="text-sm text-black/60">ยังไม่มีรอบจ่าย</p>}
        {batches.map((batch) => (
          <div key={batch.payoutBatchId} className="flex flex-col gap-2 rounded-lg border border-black/10 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {batch.periodStart.toLocaleDateString("th-TH")} – {batch.periodEnd.toLocaleDateString("th-TH")}
              </span>
              <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs">
                {STATUS_LABEL[batch.status] ?? batch.status}
              </span>
            </div>
            <div className="flex justify-between text-black/60">
              <span>ยอดขายรวม</span>
              <span>{Number(batch.grossAmount).toLocaleString("th-TH")} บาท</span>
            </div>
            <div className="flex justify-between text-black/60">
              <span>ค่าคอมมิชชั่น</span>
              <span>-{Number(batch.commissionAmount).toLocaleString("th-TH")} บาท</span>
            </div>
            <div className="flex justify-between text-black/60">
              <span>ค่าธรรมเนียม gateway</span>
              <span>-{Number(batch.gatewayFeeAmount).toLocaleString("th-TH")} บาท</span>
            </div>
            <div className="flex justify-between border-t border-black/10 pt-2 font-semibold">
              <span>ยอดสุทธิที่ต้องโอนให้ผู้ขาย</span>
              <span>{Number(batch.netAmount).toLocaleString("th-TH")} บาท</span>
            </div>
            {batch.status === "paid" ? (
              <p className="text-xs text-black/50">จ่ายแล้วเมื่อ {batch.paidAt?.toLocaleString("th-TH")}</p>
            ) : (
              <form action={markPayoutBatchPaidAction}>
                <input type="hidden" name="payoutBatchId" value={batch.payoutBatchId} />
                <input type="hidden" name="vendorId" value={vendor.vendorId} />
                <button type="submit" className="w-fit rounded-md border border-black/20 px-3 py-1.5 text-xs">
                  ทำเครื่องหมายว่าจ่ายแล้ว
                </button>
              </form>
            )}
          </div>
        ))}
      </section>
    </main>
  );
}
