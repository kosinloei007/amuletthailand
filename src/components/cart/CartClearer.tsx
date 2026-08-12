"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart/CartContext";

// เคลียร์ตะกร้าฝั่ง client เมื่อ order สร้างสำเร็จแล้ว (cart เก็บใน localStorage ไม่รู้จัก server action)
export function CartClearer() {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
