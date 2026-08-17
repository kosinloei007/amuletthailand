import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/auth/actions";
import { prisma } from "@/lib/prisma";
import { updateVendorAction } from "@/lib/vendors/actions";
import { VendorForm } from "@/components/vendors/VendorForm";

export default async function EditVendorPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session.role !== "tenant_admin" || !session.tenantId) {
    redirect("/admin");
  }
  const { id } = await params;
  const vendorId = Number(id);

  const vendor = await prisma.vendor.findFirst({
    where: { vendorId, tenantId: session.tenantId },
    include: { users: { select: { email: true }, take: 1 } },
  });
  if (!vendor) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">แก้ไขผู้ขาย</h1>
        <div className="flex gap-4">
          <Link href={`/admin/vendors/${vendor.vendorId}/payouts`} className="text-sm underline">
            รอบจ่ายเงิน
          </Link>
          <Link href="/admin/vendors" className="text-sm underline">
            กลับ
          </Link>
        </div>
      </div>
      <VendorForm
        action={updateVendorAction}
        defaultValues={{ ...vendor, commissionPercent: vendor.commissionPercent.toString() }}
        submitLabel="บันทึกการแก้ไข"
        loginEmail={vendor.users[0]?.email}
      />
    </main>
  );
}
