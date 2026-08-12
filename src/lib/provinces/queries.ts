import "server-only";
import { prisma } from "@/lib/prisma";

export async function getProvinceBySlug(slug: string) {
  return prisma.province.findUnique({ where: { slug } });
}

export async function getActiveProductsByProvince(tenantId: number, provinceId: number) {
  return prisma.product.findMany({
    where: { tenantId, provinceId, isActive: true },
    include: {
      monk: true,
      category: true,
      images: { where: { imageType: "product" }, orderBy: { sortOrder: "asc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });
}
