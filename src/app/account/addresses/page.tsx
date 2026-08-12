import Link from "next/link";
import { requireSession } from "@/lib/auth/actions";
import { prisma } from "@/lib/prisma";
import { deleteAddressAction, setDefaultAddressAction, createAddressAction } from "@/lib/addresses/actions";
import { AddressForm } from "@/components/addresses/AddressForm";

export default async function AddressesPage() {
  const session = await requireSession();

  const addresses = await prisma.userAddress.findMany({
    where: { userId: session.userId },
    orderBy: [{ isDefault: "desc" }, { userAddressId: "desc" }],
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">ที่อยู่จัดส่งของฉัน</h1>
        <Link href="/account" className="text-sm underline">
          กลับไปหน้าบัญชี
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {addresses.length === 0 && (
          <p className="text-black/60 dark:text-white/60">ยังไม่มีที่อยู่จัดส่ง เพิ่มที่อยู่แรกได้ด้านล่าง</p>
        )}
        {addresses.map((address) => (
          <div
            key={address.userAddressId}
            className="flex flex-col gap-3 rounded-lg border border-black/10 p-4 dark:border-white/20"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">
                  {address.fullName} · {address.phone}
                  {address.isDefault && (
                    <span className="ml-2 rounded-full bg-foreground px-2 py-0.5 text-xs text-background">
                      ค่าเริ่มต้น
                    </span>
                  )}
                </p>
                <p className="text-sm text-black/70 dark:text-white/70">
                  {address.address}
                  {address.subDistrict && ` ต.${address.subDistrict}`}
                  {address.district && ` อ.${address.district}`}
                  {address.province && ` จ.${address.province}`}
                  {address.postalCode && ` ${address.postalCode}`}
                </p>
              </div>
              <Link
                href={`/account/addresses/${address.userAddressId}/edit`}
                className="shrink-0 text-sm underline"
              >
                แก้ไข
              </Link>
            </div>
            <div className="flex gap-3">
              {!address.isDefault && (
                <form action={setDefaultAddressAction}>
                  <input type="hidden" name="userAddressId" value={address.userAddressId} />
                  <button type="submit" className="text-sm underline">
                    ตั้งเป็นค่าเริ่มต้น
                  </button>
                </form>
              )}
              <form action={deleteAddressAction}>
                <input type="hidden" name="userAddressId" value={address.userAddressId} />
                <button type="submit" className="text-sm text-red-600 underline">
                  ลบ
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-black/10 p-4 dark:border-white/20">
        <h2 className="font-medium">เพิ่มที่อยู่ใหม่</h2>
        <AddressForm action={createAddressAction} submitLabel="เพิ่มที่อยู่" />
      </div>
    </main>
  );
}
