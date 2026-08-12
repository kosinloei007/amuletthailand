import Link from "next/link";
import { getCurrentTenant } from "@/lib/tenant";
import { getFilterFacets } from "@/lib/products/queries";
import { getNewArrivals, getBestSellers } from "@/lib/home/queries";
import { ProductCard } from "@/components/products/ProductCard";

// สินค้า/หมวดหมู่เปลี่ยนบ่อยจากฝั่ง admin — ห้ามปล่อยให้หน้านี้ static เฉยๆ (ข้อมูลจะ frozen ตอน build)
export const revalidate = 60;

const NEW_ARRIVALS_DAYS = 30;
const SECTION_LIMIT = 8;
const QUICK_LINK_LIMIT = 6;

function topByCount<T extends { count: number }>(items: T[], limit: number) {
  return [...items].sort((a, b) => b.count - a.count).slice(0, limit);
}

export default async function Home() {
  const tenant = await getCurrentTenant();
  const [facets, newArrivals, bestSellers] = await Promise.all([
    getFilterFacets(tenant.tenantId),
    getNewArrivals(tenant.tenantId, NEW_ARRIVALS_DAYS, SECTION_LIMIT),
    getBestSellers(tenant.tenantId, SECTION_LIMIT),
  ]);

  const topProvinces = topByCount(facets.provinces, QUICK_LINK_LIMIT);
  const topMonks = topByCount(facets.monks, QUICK_LINK_LIMIT);

  return (
    <main className="flex flex-col gap-16 pb-16">
      {/* Hero */}
      <section className="bg-black/5 px-4 py-16 dark:bg-white/5">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
          <h1 className="text-3xl font-semibold sm:text-4xl">{tenant.shopName}</h1>
          <p className="max-w-xl text-black/70 dark:text-white/70">
            พระเครื่องแท้ ตรวจสอบย้อนกลับได้ ค้นหาตามจังหวัดหรือหลวงพ่อที่คุณศรัทธา
          </p>
          <Link href="/products" className="rounded-md bg-foreground px-6 py-3 text-sm text-background">
            ดูสินค้าทั้งหมด
          </Link>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4">
        {/* แถบหมวดหมู่/filter ด่วน */}
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {facets.categories.map((category) => (
              <Link
                key={category.slug}
                href={`/products?category=${category.slug}`}
                className="rounded-full border border-black/10 px-3 py-1.5 text-sm dark:border-white/20"
              >
                {category.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {topProvinces.map((province) => (
              <Link
                key={province.slug}
                href={`/provinces/${province.slug}`}
                className="rounded-full bg-black/5 px-3 py-1.5 text-sm dark:bg-white/10"
              >
                จ.{province.label}
              </Link>
            ))}
            {topMonks.map((monk) => (
              <Link
                key={monk.slug}
                href={`/monks/${monk.slug}`}
                className="rounded-full bg-black/5 px-3 py-1.5 text-sm dark:bg-white/10"
              >
                {monk.label}
              </Link>
            ))}
          </div>
        </section>

        {/* พระเครื่องเข้ามาใหม่ */}
        {newArrivals.length > 0 && (
          <section className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-semibold">พระเครื่องเข้ามาใหม่</h2>
              <Link href="/products" className="text-sm underline">
                ดูทั้งหมด
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {newArrivals.map((product) => (
                <ProductCard key={product.productId} product={product} badge="ใหม่" />
              ))}
            </div>
          </section>
        )}

        {/* สินค้าขายดี */}
        {bestSellers.length > 0 && (
          <section className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-semibold">สินค้าขายดี</h2>
              <Link href="/products" className="text-sm underline">
                ดูทั้งหมด
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {bestSellers.map((product) => (
                <ProductCard key={product.productId} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* แนะนำตามจังหวัด/หลวงพ่อ */}
        {(topProvinces.length > 0 || topMonks.length > 0) && (
          <section className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {topProvinces.length > 0 && (
              <div className="flex flex-col gap-3">
                <h2 className="text-xl font-semibold">แนะนำตามจังหวัด</h2>
                <div className="flex flex-col gap-2">
                  {topProvinces.map((province) => (
                    <Link
                      key={province.slug}
                      href={`/provinces/${province.slug}`}
                      className="flex items-center justify-between rounded-lg border border-black/10 px-4 py-3 text-sm dark:border-white/20"
                    >
                      <span>จ.{province.label}</span>
                      <span className="text-black/50 dark:text-white/50">{province.count} รายการ</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {topMonks.length > 0 && (
              <div className="flex flex-col gap-3">
                <h2 className="text-xl font-semibold">แนะนำตามหลวงพ่อ</h2>
                <div className="flex flex-col gap-2">
                  {topMonks.map((monk) => (
                    <Link
                      key={monk.slug}
                      href={`/monks/${monk.slug}`}
                      className="flex items-center justify-between rounded-lg border border-black/10 px-4 py-3 text-sm dark:border-white/20"
                    >
                      <span>{monk.label}</span>
                      <span className="text-black/50 dark:text-white/50">{monk.count} รายการ</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
