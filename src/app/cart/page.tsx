"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/CartContext";

export default function CartPage() {
  const { items, removeItem, setQuantity, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center gap-4 px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">ตะกร้าของคุณว่างเปล่า</h1>
        <Link href="/products" className="rounded-md bg-primary px-6 py-3 text-sm text-white">
          เลือกซื้อสินค้า
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <h1 className="text-2xl font-semibold">ตะกร้าสินค้า</h1>

      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex items-center gap-4 rounded-lg border border-black/10 p-3"
          >
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt={item.name} className="h-20 w-20 rounded-md object-cover" />
            ) : (
              <div className="h-20 w-20 rounded-md bg-black/5" />
            )}
            <div className="flex flex-1 flex-col gap-1">
              <Link href={`/products/${item.productId}`} className="text-sm font-medium underline">
                {item.name}
              </Link>
              <p className="text-sm text-black/60">{item.price.toLocaleString("th-TH")} บาท</p>
              <div className="flex items-center gap-2">
                <select
                  value={item.quantity}
                  onChange={(e) => setQuantity(item.productId, Number(e.target.value))}
                  className="rounded-md border border-black/10 px-2 py-1 text-sm"
                >
                  {Array.from({ length: item.stock }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={() => removeItem(item.productId)} className="text-sm text-red-600 underline">
                  ลบ
                </button>
              </div>
            </div>
            <p className="text-sm font-semibold">{(item.price * item.quantity).toLocaleString("th-TH")} บาท</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-black/10 pt-4">
        <p className="font-medium">ยอดรวม</p>
        <p className="text-xl font-bold">{subtotal.toLocaleString("th-TH")} บาท</p>
      </div>

      <Link href="/checkout" className="rounded-md bg-primary px-6 py-3 text-center text-sm text-white">
        ไปชำระเงิน
      </Link>
    </main>
  );
}
