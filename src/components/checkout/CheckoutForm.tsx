"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart/CartContext";
import { calculatePricing, pickBestPromotion, type MemberTierLike, type PromotionLike } from "@/lib/checkout/pricing";
import { createOrderAction, type ActionState } from "@/lib/checkout/actions";

type DefaultAddress = {
  fullName: string;
  phone: string;
  address: string;
  subDistrict: string;
  district: string;
  province: string;
  postalCode: string;
};

type PaymentInfo = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  promptPayId: string | null;
  qrImageUrl: string | null;
};

export function CheckoutForm({
  defaultAddress,
  memberTier,
  memberTierName,
  promotions,
  paymentInfo,
}: {
  defaultAddress: DefaultAddress | null;
  memberTier: MemberTierLike | null;
  memberTierName: string | null;
  promotions: PromotionLike[];
  paymentInfo: PaymentInfo | null;
}) {
  const { items, subtotal } = useCart();
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(createOrderAction, undefined);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const bestPromotion = useMemo(() => pickBestPromotion(promotions, subtotal), [promotions, subtotal]);
  const pricing = useMemo(
    () => calculatePricing({ subtotal, storePromotion: bestPromotion, memberTier }),
    [subtotal, bestPromotion, memberTier]
  );

  useEffect(() => {
    // subtotal ยังเป็น 0 ตอน cart กำลังโหลดจาก localStorage รอบแรก ข้ามไปก่อนเพื่อไม่ยิง QR ด้วยยอดผิดๆ
    if (!paymentInfo?.promptPayId || items.length === 0 || pricing.total <= 0) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/checkout/qr?amount=${pricing.total}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.dataUrl) setQrDataUrl(data.dataUrl);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [paymentInfo?.promptPayId, items.length, pricing.total]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-black/60">ตะกร้าของคุณว่างเปล่า</p>
        <Link href="/products" className="rounded-md bg-primary px-6 py-3 text-sm text-white">
          เลือกซื้อสินค้า
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <input type="hidden" name="cartItems" value={JSON.stringify(items.map((i) => ({ productId: i.productId, quantity: i.quantity })))} />

      <section className="flex flex-col gap-4 rounded-lg border border-black/10 p-4">
        <h2 className="font-medium">ข้อมูลจัดส่ง</h2>
        {memberTierName && (
          <p className="text-xs text-black/50">เข้าสู่ระบบเป็นสมาชิกระดับ {memberTierName} — ระบบดึงที่อยู่ default มาให้แล้ว แก้ไขได้ก่อนยืนยัน</p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="fullName" className="text-sm font-medium">
              ชื่อผู้รับ
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              defaultValue={defaultAddress?.fullName}
              className="rounded-md border border-black/10 px-3 py-2"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="phone" className="text-sm font-medium">
              เบอร์โทร
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              defaultValue={defaultAddress?.phone}
              className="rounded-md border border-black/10 px-3 py-2"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="address" className="text-sm font-medium">
            ที่อยู่
          </label>
          <textarea
            id="address"
            name="address"
            required
            rows={2}
            defaultValue={defaultAddress?.address}
            className="rounded-md border border-black/10 px-3 py-2"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="subDistrict" className="text-sm font-medium">
              ตำบล/แขวง
            </label>
            <input
              id="subDistrict"
              name="subDistrict"
              type="text"
              defaultValue={defaultAddress?.subDistrict}
              className="rounded-md border border-black/10 px-3 py-2"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="district" className="text-sm font-medium">
              อำเภอ/เขต
            </label>
            <input
              id="district"
              name="district"
              type="text"
              defaultValue={defaultAddress?.district}
              className="rounded-md border border-black/10 px-3 py-2"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="province" className="text-sm font-medium">
              จังหวัด
            </label>
            <input
              id="province"
              name="province"
              type="text"
              defaultValue={defaultAddress?.province}
              className="rounded-md border border-black/10 px-3 py-2"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="postalCode" className="text-sm font-medium">
              รหัสไปรษณีย์
            </label>
            <input
              id="postalCode"
              name="postalCode"
              type="text"
              defaultValue={defaultAddress?.postalCode}
              className="rounded-md border border-black/10 px-3 py-2"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="note" className="text-sm font-medium">
            หมายเหตุ (ไม่บังคับ)
          </label>
          <input id="note" name="note" type="text" className="rounded-md border border-black/10 px-3 py-2" />
        </div>
      </section>

      <section className="flex flex-col gap-2 rounded-lg border border-black/10 p-4 text-sm">
        <h2 className="mb-2 font-medium">สรุปยอด</h2>
        <div className="flex justify-between">
          <span className="text-black/60">ยอดสินค้า</span>
          <span>{pricing.subtotal.toLocaleString("th-TH")} บาท</span>
        </div>
        {pricing.storeDiscount > 0 && (
          <div className="flex justify-between text-accent">
            <span>ส่วนลดร้าน</span>
            <span>-{pricing.storeDiscount.toLocaleString("th-TH")} บาท</span>
          </div>
        )}
        {pricing.memberDiscount > 0 && (
          <div className="flex justify-between text-accent">
            <span>ส่วนลดสมาชิก</span>
            <span>-{pricing.memberDiscount.toLocaleString("th-TH")} บาท</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-black/60">ค่าจัดส่ง</span>
          <span>{pricing.shippingFee === 0 ? "ฟรี" : `${pricing.shippingFee.toLocaleString("th-TH")} บาท`}</span>
        </div>
        <div className="flex justify-between border-t border-black/10 pt-2 text-base font-semibold">
          <span>ยอดรวมสุทธิ</span>
          <span>{pricing.total.toLocaleString("th-TH")} บาท</span>
        </div>
      </section>

      {paymentInfo && (
        <section className="flex flex-col gap-3 rounded-lg border border-black/10 p-4">
          <h2 className="font-medium">โอนเงินเข้าบัญชี</h2>
          <p className="text-sm">
            {paymentInfo.bankName} · {paymentInfo.accountName}
            <br />
            เลขบัญชี: <span className="font-mono">{paymentInfo.accountNumber}</span>
          </p>
          {(qrDataUrl || paymentInfo.qrImageUrl) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl ?? paymentInfo.qrImageUrl ?? ""} alt="QR พร้อมเพย์" className="h-48 w-48" />
          )}
        </section>
      )}

      <section className="flex flex-col gap-2 rounded-lg border border-black/10 p-4">
        <label htmlFor="slip" className="text-sm font-medium">
          แนบรูป/ไฟล์ slip การโอนเงิน
        </label>
        <input id="slip" name="slip" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required />
      </section>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-primary px-6 py-3 text-sm text-white disabled:opacity-60"
      >
        {isPending ? "กำลังยืนยันคำสั่งซื้อ..." : "ยืนยันคำสั่งซื้อ"}
      </button>
    </form>
  );
}
