import Link from "next/link";
import { requireShopAdmin } from "@/lib/auth/actions";
import { prisma } from "@/lib/prisma";
import { createCategoryAction, deleteCategoryAction } from "@/lib/categories/actions";
import { CategoryForm } from "@/components/categories/CategoryForm";

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireShopAdmin();
  const { error } = await searchParams;

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">หมวดหมู่สินค้า</h1>
        <Link href="/admin" className="text-sm underline">
          กลับไปแดชบอร์ด
        </Link>
      </div>

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <div className="flex flex-col gap-4">
        {categories.length === 0 && <p className="text-sm text-black/60">ยังไม่มีหมวดหมู่ในระบบ</p>}
        {categories.map((category) => (
          <div
            key={category.categoryId}
            className="flex items-center justify-between gap-4 rounded-lg border border-black/10 p-4"
          >
            <div>
              <p className="font-medium">{category.name}</p>
              <p className="text-sm text-black/70">
                /{category.slug} · {category._count.products} สินค้า
              </p>
            </div>
            <div className="flex shrink-0 gap-3">
              <Link href={`/admin/categories/${category.categoryId}/edit`} className="text-sm underline">
                แก้ไข
              </Link>
              <form action={deleteCategoryAction}>
                <input type="hidden" name="categoryId" value={category.categoryId} />
                <button type="submit" className="text-sm text-red-600 underline">
                  ลบ
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-black/10 p-4">
        <h2 className="font-medium">เพิ่มหมวดหมู่ใหม่</h2>
        <CategoryForm action={createCategoryAction} submitLabel="เพิ่มหมวดหมู่" />
      </div>
    </main>
  );
}
