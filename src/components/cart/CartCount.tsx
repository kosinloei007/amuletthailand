"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/CartContext";

export function CartCount() {
  const { itemCount } = useCart();

  return (
    <Link href="/cart" className="relative text-sm underline">
      ตะกร้า
      {itemCount > 0 && (
        <span className="absolute -right-3 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] text-white">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
