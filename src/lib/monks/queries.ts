import "server-only";
import { prisma } from "@/lib/prisma";

export async function getMonkBySlug(slug: string) {
  return prisma.monk.findUnique({
    where: { slug },
    include: { province: true },
  });
}

export async function getActiveProductsByMonk(tenantId: number, monkId: number) {
  return prisma.product.findMany({
    where: { tenantId, monkId, isActive: true },
    include: {
      province: true,
      category: true,
      images: { where: { imageType: "product" }, orderBy: { sortOrder: "asc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });
}
