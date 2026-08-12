import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/actions";
import { prisma } from "@/lib/prisma";
import { createPromotionAction, deletePromotionAction, togglePromotionActiveAction } from "@/lib/promotions/actions";
import { PromotionForm } from "@/components/promotions/PromotionForm";

const MONTH_LABELS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

export default async function PromotionsPage() {
  const session = await requireSession();
  if (session.role !== "tenant_admin" || !session.tenantId) {
    redirect("/admin");
  }

  const promotions = await prisma.storePromotion.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">โปรโมชั่นทั้งร้าน</h1>
        <Link href="/admin" className="text-sm underline">
          กลับไปแดชบอร์ด
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {promotions.length === 0 && <p className="text-black/60">ยังไม่มีโปรโมชั่น</p>}
        {promotions.map((promo) => (
          <div key={promo.storePromotionId} className="flex flex-col gap-3 rounded-lg border border-black/10 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">
                  {promo.name}
                  {promo.isActive ? (
                    <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-white">เปิดใช้งาน</span>
                  ) : (
                    <span className="ml-2 rounded-full bg-black/10 px-2 py-0.5 text-xs">ปิดอยู่</span>
                  )}
                </p>
                <p className="text-sm text-black/70">
                  ลด {Number(promo.discountValue)} {promo.discountType === "percentage" ? "%" : "บาท"}
                  {" · "}
                  {promo.scheduleType === "recurring_month"
                    ? `ทุกเดือน${MONTH_LABELS[(promo.recurringMonth ?? 1) - 1]}`
                    : `${promo.startDate?.toLocaleDateString("th-TH")} - ${promo.endDate?.toLocaleDateString("th-TH")}`}
                </p>
              </div>
              <Link href={`/admin/promotions/${promo.storePromotionId}/edit`} className="shrink-0 text-sm underline">
                แก้ไข
              </Link>
            </div>
            <div className="flex gap-3">
              <form action={togglePromotionActiveAction}>
                <input type="hidden" name="storePromotionId" value={promo.storePromotionId} />
                <button type="submit" className="text-sm underline">
                  {promo.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                </button>
              </form>
              <form action={deletePromotionAction}>
                <input type="hidden" name="storePromotionId" value={promo.storePromotionId} />
                <button type="submit" className="text-sm text-red-600 underline">
                  ลบ
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-black/10 p-4">
        <h2 className="font-medium">เพิ่มโปรโมชั่นใหม่</h2>
        <PromotionForm action={createPromotionAction} submitLabel="เพิ่มโปรโมชั่น" />
      </div>
    </main>
  );
}
