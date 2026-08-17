import { notFound } from "next/navigation";
import Link from "next/link";
import { requireShopAdmin } from "@/lib/auth/actions";
import { prisma } from "@/lib/prisma";
import { updateCategoryAction } from "@/lib/categories/actions";
import { CategoryForm } from "@/components/categories/CategoryForm";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireShopAdmin();
  const { id } = await params;
  const categoryId = Number(id);

  const category = await prisma.category.findUnique({ where: { categoryId } });
  if (!category) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">แก้ไขหมวดหมู่</h1>
        <Link href="/admin/categories" className="text-sm underline">
          กลับ
        </Link>
      </div>
      <CategoryForm action={updateCategoryAction} defaultValues={category} submitLabel="บันทึกการแก้ไข" />
    </main>
  );
}
