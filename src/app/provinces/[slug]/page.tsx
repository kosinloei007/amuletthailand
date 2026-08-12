import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentTenant } from "@/lib/tenant";
import { getProvinceBySlug, getActiveProductsByProvince } from "@/lib/provinces/queries";
import { ProductCard } from "@/components/products/ProductCard";

export default async function ProvincePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const province = await getProvinceBySlug(slug);
  if (!province) {
    notFound();
  }

  const tenant = await getCurrentTenant();
  const products = await getActiveProductsByProvince(tenant.tenantId, province.provinceId);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12">
      <Link href="/products" className="text-sm underline">
        ← กลับไปรายการสินค้า
      </Link>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">พระเครื่องจากจังหวัด{province.nameTh}</h1>
        {province.region && <p className="text-sm text-black/60 dark:text-white/60">{province.region}</p>}
      </div>

      <section className="flex flex-col gap-4">
        <p className="text-sm text-black/60 dark:text-white/60">พบ {products.length} รายการ</p>
        {products.length === 0 ? (
          <p className="text-black/60 dark:text-white/60">ยังไม่มีสินค้าจากจังหวัดนี้ในร้าน</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.productId} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
