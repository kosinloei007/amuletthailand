import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/auth/actions";
import { prisma } from "@/lib/prisma";
import { updateAddressAction } from "@/lib/addresses/actions";
import { AddressForm } from "@/components/addresses/AddressForm";

export default async function EditAddressPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;
  const userAddressId = Number(id);

  const address = await prisma.userAddress.findFirst({
    where: { userAddressId, userId: session.userId },
  });
  if (!address) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">แก้ไขที่อยู่</h1>
        <Link href="/account/addresses" className="text-sm underline">
          กลับ
        </Link>
      </div>
      <AddressForm action={updateAddressAction} defaultValues={address} submitLabel="บันทึกการแก้ไข" />
    </main>
  );
}
