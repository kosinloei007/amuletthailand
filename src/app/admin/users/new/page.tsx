import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth/actions";
import { createUserAction } from "@/lib/users/actions";
import { UserForm } from "@/components/users/UserForm";

export default async function NewUserPage() {
  await requireSuperAdmin();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">เพิ่มผู้ใช้ใหม่</h1>
        <Link href="/admin/users" className="text-sm underline">
          กลับ
        </Link>
      </div>
      <UserForm action={createUserAction} submitLabel="เพิ่มผู้ใช้" showPassword />
    </main>
  );
}
