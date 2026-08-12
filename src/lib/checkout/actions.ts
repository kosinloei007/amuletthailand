"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { getCurrentTenant } from "@/lib/tenant";
import { getActiveStorePromotions } from "@/lib/checkout/promotionQueries";
import { pickBestPromotion, calculatePricing } from "@/lib/checkout/pricing";
import { uploadSlipFile } from "@/lib/checkout/uploadSlip";
import { generateOrderNumber } from "@/lib/checkout/orderNumber";
import { notifyNewOrder } from "@/lib/notifications/notifyOrder";

export type ActionState = { error?: string } | undefined;

type CartItemInput = { productId: number; quantity: number };

export async function createOrderAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const tenant = await getCurrentTenant();
  const session = await getSession();

  let cartItems: CartItemInput[];
  try {
    cartItems = JSON.parse(String(formData.get("cartItems") ?? "[]"));
  } catch {
    return { error: "ข้อมูลตะกร้าไม่ถูกต้อง" };
  }
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return { error: "ตะกร้าสินค้าว่างเปล่า" };
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const subDistrict = String(formData.get("subDistrict") ?? "").trim();
  const district = String(formData.get("district") ?? "").trim();
  const province = String(formData.get("province") ?? "").trim();
  const postalCode = String(formData.get("postalCode") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!fullName || !phone || !address) {
    return { error: "กรุณากรอกชื่อผู้รับ เบอร์โทร และที่อยู่ให้ครบ" };
  }

  const slipFile = formData.get("slip");
  if (!(slipFile instanceof File) || slipFile.size === 0) {
    return { error: "กรุณาแนบรูป slip การโอนเงิน" };
  }

  // ดึงข้อมูลสินค้าจริงจาก DB เสมอ ไม่เชื่อราคา/สต็อกที่ client ส่งมา
  const products = await prisma.product.findMany({
    where: { productId: { in: cartItems.map((i) => i.productId) }, tenantId: tenant.tenantId, isActive: true },
  });
  const productById = new Map(products.map((p) => [p.productId, p]));

  const orderItemsData: { productId: number; productName: string; unitPrice: number; quantity: number }[] = [];
  for (const item of cartItems) {
    const product = productById.get(item.productId);
    if (!product) return { error: `ไม่พบสินค้าบางรายการในตะกร้า (id ${item.productId})` };
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      return { error: "จำนวนสินค้าต้องมากกว่า 0" };
    }
    if (product.stock < item.quantity) {
      return { error: `สินค้า "${product.name}" เหลือไม่พอ (เหลือ ${product.stock} ชิ้น)` };
    }
    orderItemsData.push({
      productId: product.productId,
      productName: product.name,
      unitPrice: Number(product.price),
      quantity: item.quantity,
    });
  }

  const subtotal = orderItemsData.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  let memberTier: Parameters<typeof calculatePricing>[0]["memberTier"] = null;
  let userId: number | null = null;
  if (session) {
    userId = session.userId;
    const user = await prisma.user.findUnique({ where: { userId: session.userId }, include: { memberTier: true } });
    if (user?.memberTier) {
      memberTier = {
        memberTierId: user.memberTier.memberTierId,
        discountType: user.memberTier.discountType,
        discountValue: Number(user.memberTier.discountValue),
        freeShippingEnabled: user.memberTier.freeShippingEnabled,
        freeShippingMinAmount: user.memberTier.freeShippingMinAmount ? Number(user.memberTier.freeShippingMinAmount) : null,
      };
    }
  }

  const activePromotions = await getActiveStorePromotions(tenant.tenantId);
  const bestPromotion = pickBestPromotion(
    activePromotions.map((p) => ({
      storePromotionId: p.storePromotionId,
      discountType: p.discountType,
      discountValue: Number(p.discountValue),
    })),
    subtotal
  );

  const pricing = calculatePricing({ subtotal, storePromotion: bestPromotion, memberTier });

  const slipResult = await uploadSlipFile(slipFile);
  if ("error" in slipResult) return { error: slipResult.error };

  const orderNumber = generateOrderNumber();

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        tenantId: tenant.tenantId,
        userId,
        orderNumber,
        subtotalAmount: pricing.subtotal,
        discountAmount: pricing.storeDiscount + pricing.memberDiscount,
        shippingFee: pricing.shippingFee,
        totalAmount: pricing.total,
        appliedMemberTierId: pricing.memberTierId,
        appliedStorePromotionId: pricing.storePromotionId,
        fullName,
        phone,
        address,
        subDistrict: subDistrict || null,
        district: district || null,
        province: province || null,
        postalCode: postalCode || null,
        note: note || null,
        paymentSlipUrl: slipResult.url,
        items: { create: orderItemsData },
      },
      include: { items: true },
    });

    for (const item of orderItemsData) {
      await tx.product.update({
        where: { productId: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return created;
  });

  // แจ้งเตือนแบบไม่ block การตอบกลับลูกค้า (ตาม docs/checkout-and-payment.md)
  void notifyNewOrder(order);

  redirect(`/order-confirmation/${order.orderNumber}`);
}
