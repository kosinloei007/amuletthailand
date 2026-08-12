import "server-only";
import { prisma } from "@/lib/prisma";
import { visibleVendorFilter } from "@/lib/products/queries";

const productCardInclude = {
  province: true,
  monk: true,
  category: true,
  images: { where: { imageType: "product" as const }, orderBy: { sortOrder: "asc" as const }, take: 1 },
  vendor: { select: { shopName: true } },
};

export async function getNewArrivals(tenantId: number, days: number, limit?: number) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return prisma.product.findMany({
    where: { tenantId, isActive: true, createdAt: { gte: since }, ...visibleVendorFilter },
    include: productCardInclude,
    orderBy: { createdAt: "desc" },
    ...(limit && { take: limit }),
  });
}

export async function getBestSellers(tenantId: number, limit: number) {
  const grouped = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: { order: { tenantId } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });
  if (grouped.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { productId: { in: grouped.map((g) => g.productId) }, tenantId, isActive: true, ...visibleVendorFilter },
    include: productCardInclude,
  });
  const productById = new Map(products.map((p) => [p.productId, p]));

  return grouped.map((g) => productById.get(g.productId)).filter((p) => p !== undefined);
}
