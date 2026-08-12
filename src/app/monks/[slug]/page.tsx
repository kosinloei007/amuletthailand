import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentTenant } from "@/lib/tenant";
import { getMonkBySlug, getActiveProductsByMonk } from "@/lib/monks/queries";
import { ProductCard } from "@/components/products/ProductCard";

export default async function MonkProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const monk = await getMonkBySlug(slug);
  if (!monk) {
    notFound();
  }

  const tenant = await getCurrentTenant();
  const products = await getActiveProductsByMonk(tenant.tenantId, monk.monkId);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12">
      <Link href="/products" className="text-sm underline">
        ← กลับไปรายการสินค้า
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{monk.name}</h1>
        <p className="text-sm text-black/60">
          {monk.templeName}
          {monk.province && (
            <>
              {" · "}
              <Link href={`/provinces/${monk.province.slug}`} className="underline">
                จ.{monk.province.nameTh}
              </Link>
            </>
          )}
        </p>
        {monk.bio && <p className="max-w-2xl whitespace-pre-line text-sm text-black/70">{monk.bio}</p>}
      </div>

      <section className="flex flex-col gap-4">
        <p className="text-sm text-black/60">พระเครื่องของ{monk.name} ({products.length} รายการ)</p>
        {products.length === 0 ? (
          <p className="text-black/60">ยังไม่มีสินค้าของหลวงพ่อองค์นี้ในร้าน</p>
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
