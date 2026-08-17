import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth/actions";
import { prisma } from "@/lib/prisma";
import { updateUserAction } from "@/lib/users/actions";
import { UserForm } from "@/components/users/UserForm";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdmin();
  const { id } = await params;
  const userId = Number(id);

  const user = await prisma.user.findUnique({ where: { userId } });
  if (!user || user.role === "vendor") {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">แก้ไขผู้ใช้</h1>
        <Link href="/admin/users" className="text-sm underline">
          กลับ
        </Link>
      </div>
      <UserForm action={updateUserAction} defaultValues={user} submitLabel="บันทึกการแก้ไข" />
    </main>
  );
}
