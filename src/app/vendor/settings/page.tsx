import Link from "next/link";
import { requireVendor } from "@/lib/auth/actions";
import { ChangePasswordForm } from "@/components/vendor-settings/ChangePasswordForm";

export default async function VendorSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  await requireVendor();
  const { success } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">ตั้งค่าบัญชี</h1>
        <Link href="/vendor" className="text-sm underline">
          กลับไปแดชบอร์ด
        </Link>
      </div>

      <section className="flex flex-col gap-4 rounded-lg border border-black/10 p-4">
        <h2 className="font-medium">เปลี่ยนรหัสผ่าน</h2>
        {success && <p className="text-sm text-green-700">เปลี่ยนรหัสผ่านสำเร็จ</p>}
        <ChangePasswordForm />
      </section>
    </main>
  );
}
