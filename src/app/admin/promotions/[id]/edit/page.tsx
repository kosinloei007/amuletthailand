import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/auth/actions";
import { prisma } from "@/lib/prisma";
import { updatePromotionAction } from "@/lib/promotions/actions";
import { PromotionForm } from "@/components/promotions/PromotionForm";

function toDateInputValue(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export default async function EditPromotionPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session.role !== "tenant_admin" || !session.tenantId) {
    redirect("/admin");
  }
  const { id } = await params;
  const storePromotionId = Number(id);

  const promotion = await prisma.storePromotion.findFirst({
    where: { storePromotionId, tenantId: session.tenantId },
  });
  if (!promotion) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">แก้ไขโปรโมชั่น</h1>
        <Link href="/admin/promotions" className="text-sm underline">
          กลับ
        </Link>
      </div>
      <PromotionForm
        action={updatePromotionAction}
        defaultValues={{
          ...promotion,
          discountValue: promotion.discountValue.toString(),
          startDate: toDateInputValue(promotion.startDate),
          endDate: toDateInputValue(promotion.endDate),
        }}
        submitLabel="บันทึกการแก้ไข"
      />
    </main>
  );
}
