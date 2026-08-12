import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { CartClearer } from "@/components/cart/CartClearer";

export default async function OrderConfirmationPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const tenant = await getCurrentTenant();

  const order = await prisma.order.findFirst({
    where: { orderNumber, tenantId: tenant.tenantId },
    include: { items: true },
  });
  if (!order) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <CartClearer />
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold">สั่งซื้อสำเร็จ 🎉</h1>
        <p className="text-black/60">
          เลขออร์เดอร์ของคุณคือ <span className="font-mono font-semibold">{order.orderNumber}</span>
        </p>
        <p className="text-sm text-black/50">
          ทีมงานจะตรวจสอบยอดโอนและแจ้งผลกลับไป ใช้เลขออร์เดอร์นี้กับเบอร์โทรที่กรอกไว้เพื่อติดตามสถานะได้ที่หน้า “ติดตามออร์เดอร์”
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-black/10 p-4">
        {order.items.map((item) => (
          <div key={item.orderItemId} className="flex justify-between text-sm">
            <span>
              {item.productName} x{item.quantity}
            </span>
            <span>{(Number(item.unitPrice) * item.quantity).toLocaleString("th-TH")} บาท</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-black/10 pt-2 font-semibold">
          <span>ยอดรวมสุทธิ</span>
          <span>{Number(order.totalAmount).toLocaleString("th-TH")} บาท</span>
        </div>
      </div>

      <div className="flex gap-3">
        <Link href={`/track-order?orderNumber=${order.orderNumber}&phone=${order.phone}`} className="rounded-md border border-black/20 px-4 py-2 text-sm">
          ติดตามสถานะออร์เดอร์
        </Link>
        <Link href="/products" className="rounded-md bg-primary px-4 py-2 text-sm text-white">
          เลือกซื้อสินค้าต่อ
        </Link>
      </div>
    </main>
  );
}
