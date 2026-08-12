import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/auth/actions";
import { prisma } from "@/lib/prisma";
import { updateMemberTierAction } from "@/lib/member-tiers/actions";
import { MemberTierForm } from "@/components/member-tiers/MemberTierForm";

export default async function EditMemberTierPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session.role !== "tenant_admin" || !session.tenantId) {
    redirect("/admin");
  }
  const { id } = await params;
  const memberTierId = Number(id);

  const tier = await prisma.memberTier.findFirst({
    where: { memberTierId, tenantId: session.tenantId },
  });
  if (!tier) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">แก้ไขระดับสมาชิก</h1>
        <Link href="/admin/member-tiers" className="text-sm underline">
          กลับ
        </Link>
      </div>
      <MemberTierForm
        action={updateMemberTierAction}
        defaultValues={{
          ...tier,
          discountValue: tier.discountValue.toString(),
          freeShippingMinAmount: tier.freeShippingMinAmount?.toString() ?? null,
        }}
        submitLabel="บันทึกการแก้ไข"
        lockDefaultCheckbox={tier.isDefault}
      />
    </main>
  );
}
