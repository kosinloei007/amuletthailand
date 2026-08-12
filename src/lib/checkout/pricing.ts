// ฟังก์ชัน pure ล้วนๆ ไม่แตะ DB — ใช้ได้ทั้งฝั่ง client (preview ราคา) และ server (คำนวณจริงตอน submit)

export const FLAT_SHIPPING_FEE = 50; // ไม่มี field ค่าส่งมาตรฐานในสคีมา ใช้ค่าคงที่นี้แทนไปก่อน

type DiscountType = "percentage" | "fixed_amount" | "none";

export type PromotionLike = {
  storePromotionId: number;
  discountType: string;
  discountValue: number;
};

export type MemberTierLike = {
  memberTierId: number;
  discountType: string;
  discountValue: number;
  freeShippingEnabled: boolean;
  freeShippingMinAmount: number | null;
};

export function applyDiscount(amount: number, discountType: string, discountValue: number): number {
  if (discountType === "percentage") return Math.round(((amount * discountValue) / 100) * 100) / 100;
  if (discountType === "fixed_amount") return Math.min(discountValue, amount);
  return 0;
}

export function pickBestPromotion(promotions: PromotionLike[], subtotal: number): PromotionLike | null {
  if (promotions.length === 0) return null;
  let best = promotions[0];
  let bestDiscount = applyDiscount(subtotal, best.discountType, best.discountValue);
  for (const promo of promotions.slice(1)) {
    const discount = applyDiscount(subtotal, promo.discountType, promo.discountValue);
    if (discount > bestDiscount) {
      best = promo;
      bestDiscount = discount;
    }
  }
  return best;
}

export type PricingBreakdown = {
  subtotal: number;
  storeDiscount: number;
  storePromotionId: number | null;
  memberDiscount: number;
  memberTierId: number | null;
  shippingFee: number;
  total: number;
};

export function calculatePricing({
  subtotal,
  storePromotion,
  memberTier,
}: {
  subtotal: number;
  storePromotion: PromotionLike | null;
  memberTier: MemberTierLike | null;
}): PricingBreakdown {
  const storeDiscount = storePromotion
    ? applyDiscount(subtotal, storePromotion.discountType, storePromotion.discountValue)
    : 0;
  const afterStoreDiscount = subtotal - storeDiscount;

  const memberDiscount = memberTier
    ? applyDiscount(afterStoreDiscount, memberTier.discountType as DiscountType, memberTier.discountValue)
    : 0;
  const afterMemberDiscount = afterStoreDiscount - memberDiscount;

  const qualifiesForFreeShipping =
    !!memberTier &&
    memberTier.freeShippingEnabled &&
    (memberTier.freeShippingMinAmount === null || subtotal >= memberTier.freeShippingMinAmount);

  const shippingFee = qualifiesForFreeShipping ? 0 : FLAT_SHIPPING_FEE;

  return {
    subtotal,
    storeDiscount,
    storePromotionId: storePromotion?.storePromotionId ?? null,
    memberDiscount,
    memberTierId: memberTier?.memberTierId ?? null,
    shippingFee,
    total: afterMemberDiscount + shippingFee,
  };
}
