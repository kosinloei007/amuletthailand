import Link from "next/link";
import { getCurrentTenant } from "@/lib/tenant";
import { getFilteredProducts, getFilterFacets, type FilterOption } from "@/lib/products/queries";
import { ProductCard } from "@/components/products/ProductCard";

type SearchParams = {
  province?: string | string[];
  monk?: string | string[];
  category?: string | string[];
  minPrice?: string;
  maxPrice?: string;
};

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function toNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function FilterGroup({
  title,
  name,
  options,
  selected,
}: {
  title: string;
  name: string;
  options: FilterOption[];
  selected: string[];
}) {
  if (options.length === 0) return null;
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium">{title}</legend>
      <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto">
        {options.map((option) => (
          <label key={option.slug} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name={name}
              value={option.slug}
              defaultChecked={selected.includes(option.slug)}
            />
            {option.label}
            <span className="text-black/40">({option.count})</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const provinceSlugs = toArray(params.province);
  const monkSlugs = toArray(params.monk);
  const categorySlugs = toArray(params.category);
  const minPrice = toNumber(params.minPrice);
  const maxPrice = toNumber(params.maxPrice);

  const tenant = await getCurrentTenant();
  const [facets, products] = await Promise.all([
    getFilterFacets(tenant.tenantId),
    getFilteredProducts(tenant.tenantId, { provinceSlugs, monkSlugs, categorySlugs, minPrice, maxPrice }),
  ]);

  const hasActiveFilters =
    provinceSlugs.length > 0 || monkSlugs.length > 0 || categorySlugs.length > 0 || minPrice !== undefined || maxPrice !== undefined;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12">
      <h1 className="text-2xl font-semibold">รายการพระเครื่อง</h1>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[240px_1fr]">
        <aside className="flex flex-col gap-6 rounded-lg border border-black/10 p-4">
          <form method="get" className="flex flex-col gap-6">
            <FilterGroup title="จังหวัด" name="province" options={facets.provinces} selected={provinceSlugs} />
            <FilterGroup title="หลวงพ่อ/วัด" name="monk" options={facets.monks} selected={monkSlugs} />
            <FilterGroup title="หมวดหมู่" name="category" options={facets.categories} selected={categorySlugs} />

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-medium">ช่วงราคา (บาท)</legend>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="minPrice"
                  min="0"
                  placeholder="ต่ำสุด"
                  defaultValue={params.minPrice}
                  className="w-full rounded-md border border-black/10 px-2 py-1.5 text-sm"
                />
                <span className="text-black/40">-</span>
                <input
                  type="number"
                  name="maxPrice"
                  min="0"
                  placeholder="สูงสุด"
                  defaultValue={params.maxPrice}
                  className="w-full rounded-md border border-black/10 px-2 py-1.5 text-sm"
                />
              </div>
            </fieldset>

            <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-white">
              กรองสินค้า
            </button>
            {hasActiveFilters && (
              <Link href="/products" className="text-center text-sm underline">
                ล้างตัวกรองทั้งหมด
              </Link>
            )}
          </form>
        </aside>

        <section className="flex flex-col gap-4">
          <p className="text-sm text-black/60">พบ {products.length} รายการ</p>

          {products.length === 0 ? (
            <p className="text-black/60">ไม่พบสินค้าตามเงื่อนไขที่เลือก</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.productId} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
