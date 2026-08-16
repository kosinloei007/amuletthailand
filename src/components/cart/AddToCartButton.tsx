"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart/CartContext";

export function AddToCartButton({
  productId,
  name,
  sku,
  price,
  imageUrl,
  stock,
}: {
  productId: number;
  name: string;
  sku: string | null;
  price: number;
  imageUrl: string | null;
  stock: number;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const router = useRouter();

  if (stock <= 0) {
    return (
      <button type="button" disabled className="w-fit rounded-md bg-black/10 px-6 py-3 text-sm text-black/40">
        สินค้าหมด
      </button>
    );
  }

  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => {
          addItem({ productId, name, sku, price, imageUrl, stock });
          setAdded(true);
          setTimeout(() => setAdded(false), 1500);
        }}
        className="w-fit rounded-md bg-primary px-6 py-3 text-sm text-white"
      >
        {added ? "เพิ่มลงตะกร้าแล้ว" : "เพิ่มลงตะกร้า"}
      </button>
      <button
        type="button"
        onClick={() => {
          addItem({ productId, name, sku, price, imageUrl, stock });
          router.push("/cart");
        }}
        className="w-fit rounded-md border border-black/20 px-6 py-3 text-sm"
      >
        ซื้อเลย
      </button>
    </div>
  );
}
