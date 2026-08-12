import "server-only";
import { prisma } from "@/lib/prisma";
import { visibleVendorFilter } from "@/lib/products/queries";

export async function getMonkBySlug(slug: string) {
  return prisma.monk.findUnique({
    where: { slug },
    include: { province: true },
  });
}

export async function getActiveProductsByMonk(tenantId: number, monkId: number) {
  return prisma.product.findMany({
    where: { tenantId, monkId, isActive: true, ...visibleVendorFilter },
    include: {
      province: true,
      category: true,
      images: { where: { imageType: "product" }, orderBy: { sortOrder: "asc" }, take: 1 },
      vendor: { select: { shopName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
