import { notFound } from "next/navigation";
import Link from "next/link";
import { requireVendor } from "@/lib/auth/actions";
import { prisma } from "@/lib/prisma";
import { updateVendorProductAction } from "@/lib/vendor-products/actions";
import { ProductForm } from "@/components/vendor-products/ProductForm";

export default async function EditVendorProductPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireVendor();
  const { id } = await params;
  const productId = Number(id);

  const [product, provinces, monks, categories] = await Promise.all([
    prisma.product.findFirst({
      where: { productId, vendorId: session.vendorId },
      include: { images: { where: { imageType: "product" }, orderBy: { sortOrder: "asc" }, take: 1 } },
    }),
    prisma.province.findMany({ orderBy: { nameTh: "asc" } }),
    prisma.monk.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!product) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">แก้ไขพระเครื่อง</h1>
        <Link href="/vendor/products" className="text-sm underline">
          กลับ
        </Link>
      </div>
      <ProductForm
        action={updateVendorProductAction}
        submitLabel="บันทึกการแก้ไข"
        defaultValues={{
          ...product,
          price: product.price.toString(),
          costPrice: product.costPrice?.toString() ?? null,
          imageUrl: product.images[0]?.imageUrl ?? null,
        }}
        provinces={provinces.map((p) => ({ id: p.provinceId, label: p.nameTh }))}
        monks={monks.map((m) => ({ id: m.monkId, label: m.name }))}
        categories={categories.map((c) => ({ id: c.categoryId, label: c.name }))}
      />
    </main>
  );
}
