import "server-only";
import { prisma } from "@/lib/prisma";

// สินค้าที่แสดงหน้าร้านต้องเป็นของร้านเอง (vendorId เป็น null) หรือของผู้ขายที่ยังไม่ถูกระงับ
// ใช้ spread ตัวนี้เข้า where ของทุก query ที่ query สินค้าฝั่ง storefront (ไม่ใช้กับฝั่ง admin/vendor เอง)
export const visibleVendorFilter = {
  OR: [{ vendorId: null }, { vendor: { status: { not: "suspended" } } }],
};

const vendorShopNameInclude = { vendor: { select: { shopName: true } } } as const;

export type ProductFilters = {
  provinceSlugs: string[];
  monkSlugs: string[];
  categorySlugs: string[];
  minPrice?: number;
  maxPrice?: number;
};

export async function getFilteredProducts(tenantId: number, filters: ProductFilters) {
  return prisma.product.findMany({
    where: {
      tenantId,
      isActive: true,
      ...visibleVendorFilter,
      ...(filters.provinceSlugs.length > 0 && { province: { slug: { in: filters.provinceSlugs } } }),
      ...(filters.monkSlugs.length > 0 && { monk: { slug: { in: filters.monkSlugs } } }),
      ...(filters.categorySlugs.length > 0 && { category: { slug: { in: filters.categorySlugs } } }),
      ...((filters.minPrice !== undefined || filters.maxPrice !== undefined) && {
        price: {
          ...(filters.minPrice !== undefined && { gte: filters.minPrice }),
          ...(filters.maxPrice !== undefined && { lte: filters.maxPrice }),
        },
      }),
    },
    include: {
      province: true,
      monk: true,
      category: true,
      images: { where: { imageType: "product" }, orderBy: { sortOrder: "asc" }, take: 1 },
      ...vendorShopNameInclude,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProductById(tenantId: number, productId: number) {
  const product = await prisma.product.findFirst({
    where: { productId, tenantId, isActive: true, ...visibleVendorFilter },
    include: {
      province: true,
      monk: true,
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      ...vendorShopNameInclude,
    },
  });
  if (!product) return null;

  // รูปพระปกติขึ้นก่อนเสมอ แล้วตามด้วยรูปใบรับประกัน (ตาม query pattern ใน docs/database.md)
  const productImages = product.images.filter((image) => image.imageType === "product");
  const certificateImages = product.images.filter((image) => image.imageType === "certificate");

  return { ...product, images: [...productImages, ...certificateImages] };
}

export type FilterOption = { slug: string; label: string; count: number };

export async function getFilterFacets(tenantId: number): Promise<{
  provinces: FilterOption[];
  monks: FilterOption[];
  categories: FilterOption[];
}> {
  const [provinceGroups, monkGroups, categoryGroups] = await Promise.all([
    prisma.product.groupBy({
      by: ["provinceId"],
      where: { tenantId, isActive: true, provinceId: { not: null }, ...visibleVendorFilter },
      _count: true,
    }),
    prisma.product.groupBy({
      by: ["monkId"],
      where: { tenantId, isActive: true, monkId: { not: null }, ...visibleVendorFilter },
      _count: true,
    }),
    prisma.product.groupBy({
      by: ["categoryId"],
      where: { tenantId, isActive: true, categoryId: { not: null }, ...visibleVendorFilter },
      _count: true,
    }),
  ]);

  const [provinces, monks, categories] = await Promise.all([
    prisma.province.findMany({
      where: { provinceId: { in: provinceGroups.map((g) => g.provinceId!) } },
      orderBy: { nameTh: "asc" },
    }),
    prisma.monk.findMany({
      where: { monkId: { in: monkGroups.map((g) => g.monkId!) } },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      where: { categoryId: { in: categoryGroups.map((g) => g.categoryId!) } },
      orderBy: { name: "asc" },
    }),
  ]);

  const provinceCount = new Map(provinceGroups.map((g) => [g.provinceId, g._count]));
  const monkCount = new Map(monkGroups.map((g) => [g.monkId, g._count]));
  const categoryCount = new Map(categoryGroups.map((g) => [g.categoryId, g._count]));

  return {
    provinces: provinces.map((p) => ({ slug: p.slug, label: p.nameTh, count: provinceCount.get(p.provinceId) ?? 0 })),
    monks: monks.map((m) => ({ slug: m.slug, label: m.name, count: monkCount.get(m.monkId) ?? 0 })),
    categories: categories.map((c) => ({ slug: c.slug, label: c.name, count: categoryCount.get(c.categoryId) ?? 0 })),
  };
}
