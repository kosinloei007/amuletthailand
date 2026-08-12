import Link from "next/link";
import { requireVendor } from "@/lib/auth/actions";
import { prisma } from "@/lib/prisma";
import { createVendorProductAction } from "@/lib/vendor-products/actions";
import { ProductForm } from "@/components/vendor-products/ProductForm";

export default async function NewVendorProductPage() {
  await requireVendor();

  const [provinces, monks, categories] = await Promise.all([
    prisma.province.findMany({ orderBy: { nameTh: "asc" } }),
    prisma.monk.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">เพิ่มสินค้าใหม่</h1>
        <Link href="/vendor/products" className="text-sm underline">
          กลับ
        </Link>
      </div>
      <ProductForm
        action={createVendorProductAction}
        submitLabel="เพิ่มสินค้า"
        provinces={provinces.map((p) => ({ id: p.provinceId, label: p.nameTh }))}
        monks={monks.map((m) => ({ id: m.monkId, label: m.name }))}
        categories={categories.map((c) => ({ id: c.categoryId, label: c.name }))}
      />
    </main>
  );
}
