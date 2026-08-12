import { getCurrentTenant } from "@/lib/tenant";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getActiveStorePromotions } from "@/lib/checkout/promotionQueries";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export default async function CheckoutPage() {
  const tenant = await getCurrentTenant();
  const session = await getSession();

  const [paymentInfo, activePromotions] = await Promise.all([
    prisma.paymentInfo.findUnique({ where: { tenantId: tenant.tenantId } }),
    getActiveStorePromotions(tenant.tenantId),
  ]);

  let defaultAddress = null;
  let memberTier = null;
  let memberTierName: string | null = null;

  if (session) {
    const [address, user] = await Promise.all([
      prisma.userAddress.findFirst({ where: { userId: session.userId, isDefault: true } }),
      prisma.user.findUnique({ where: { userId: session.userId }, include: { memberTier: true } }),
    ]);

    if (address) {
      defaultAddress = {
        fullName: address.fullName,
        phone: address.phone,
        address: address.address,
        subDistrict: address.subDistrict ?? "",
        district: address.district ?? "",
        province: address.province ?? "",
        postalCode: address.postalCode ?? "",
      };
    }

    if (user?.memberTier) {
      memberTierName = user.memberTier.name;
      memberTier = {
        memberTierId: user.memberTier.memberTierId,
        discountType: user.memberTier.discountType,
        discountValue: Number(user.memberTier.discountValue),
        freeShippingEnabled: user.memberTier.freeShippingEnabled,
        freeShippingMinAmount: user.memberTier.freeShippingMinAmount
          ? Number(user.memberTier.freeShippingMinAmount)
          : null,
      };
    }
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-12">
      <h1 className="text-2xl font-semibold">ชำระเงิน</h1>
      <CheckoutForm
        defaultAddress={defaultAddress}
        memberTier={memberTier}
        memberTierName={memberTierName}
        promotions={activePromotions.map((p) => ({
          storePromotionId: p.storePromotionId,
          discountType: p.discountType,
          discountValue: Number(p.discountValue),
        }))}
        paymentInfo={
          paymentInfo
            ? {
                bankName: paymentInfo.bankName,
                accountName: paymentInfo.accountName,
                accountNumber: paymentInfo.accountNumber,
                promptPayId: paymentInfo.promptPayId,
                qrImageUrl: paymentInfo.qrImageUrl,
                gatewayEnabled: paymentInfo.gatewayEnabled,
              }
            : null
        }
      />
    </main>
  );
}
