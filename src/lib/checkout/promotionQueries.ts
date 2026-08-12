import "server-only";
import { prisma } from "@/lib/prisma";

function isPromotionActiveNow(promo: {
  isActive: boolean;
  scheduleType: string;
  recurringMonth: number | null;
  startDate: Date | null;
  endDate: Date | null;
}): boolean {
  if (!promo.isActive) return false;
  const now = new Date();
  if (promo.scheduleType === "recurring_month") {
    return promo.recurringMonth === now.getMonth() + 1;
  }
  if (promo.scheduleType === "date_range") {
    if (!promo.startDate || !promo.endDate) return false;
    return now >= promo.startDate && now <= promo.endDate;
  }
  return false;
}

export async function getActiveStorePromotions(tenantId: number) {
  const promotions = await prisma.storePromotion.findMany({ where: { tenantId, isActive: true } });
  return promotions.filter(isPromotionActiveNow);
}
