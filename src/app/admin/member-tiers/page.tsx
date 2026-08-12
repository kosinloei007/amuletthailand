import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/actions";
import { prisma } from "@/lib/prisma";
import {
  createMemberTierAction,
  deleteMemberTierAction,
  setDefaultMemberTierAction,
} from "@/lib/member-tiers/actions";
import { MemberTierForm } from "@/components/member-tiers/MemberTierForm";

const DISCOUNT_LABEL: Record<string, string> = {
  percentage: "%",
  fixed_amount: "บาท",
  none: "-",
};

export default async function MemberTiersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireSession();
  if (session.role !== "tenant_admin" || !session.tenantId) {
    redirect("/admin");
  }
  const { error } = await searchParams;

  const tiers = await prisma.memberTier.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { users: true } } },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">ระดับสมาชิก</h1>
        <Link href="/admin" className="text-sm underline">
          กลับไปแดชบอร์ด
        </Link>
      </div>

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950">{error}</p>}

      <div className="flex flex-col gap-4">
        {tiers.map((tier) => (
          <div
            key={tier.memberTierId}
            className="flex flex-col gap-3 rounded-lg border border-black/10 p-4 dark:border-white/20"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">
                  {tier.name}
                  {tier.isDefault && (
                    <span className="ml-2 rounded-full bg-foreground px-2 py-0.5 text-xs text-background">
                      ค่าเริ่มต้น
                    </span>
                  )}
                </p>
                <p className="text-sm text-black/70 dark:text-white/70">
                  ส่วนลด {tier.discountType === "none" ? "ไม่มี" : `${tier.discountValue} ${DISCOUNT_LABEL[tier.discountType]}`}
                  {" · "}
                  {tier.freeShippingEnabled
                    ? `จัดส่งฟรี${tier.freeShippingMinAmount ? ` (ยอดขั้นต่ำ ${tier.freeShippingMinAmount} บาท)` : " ทุกยอด"}`
                    : "ไม่มีจัดส่งฟรี"}
                  {" · "}
                  {tier._count.users} สมาชิก
                </p>
              </div>
              <Link href={`/admin/member-tiers/${tier.memberTierId}/edit`} className="shrink-0 text-sm underline">
                แก้ไข
              </Link>
            </div>
            <div className="flex gap-3">
              {!tier.isDefault && (
                <form action={setDefaultMemberTierAction}>
                  <input type="hidden" name="memberTierId" value={tier.memberTierId} />
                  <button type="submit" className="text-sm underline">
                    ตั้งเป็นค่าเริ่มต้น
                  </button>
                </form>
              )}
              <form action={deleteMemberTierAction}>
                <input type="hidden" name="memberTierId" value={tier.memberTierId} />
                <button type="submit" className="text-sm text-red-600 underline">
                  ลบ
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-black/10 p-4 dark:border-white/20">
        <h2 className="font-medium">เพิ่มระดับสมาชิกใหม่</h2>
        <MemberTierForm action={createMemberTierAction} submitLabel="เพิ่มระดับสมาชิก" />
      </div>
    </main>
  );
}
