import Link from "next/link";
import { requireVendor } from "@/lib/auth/actions";
import { prisma } from "@/lib/prisma";
import { toggleVendorProductActiveAction } from "@/lib/vendor-products/actions";

export default async function VendorProductsPage() {
  const session = await requireVendor();

  const products = await prisma.product.findMany({
    where: { vendorId: session.vendorId },
    include: { images: { where: { imageType: "product" }, orderBy: { sortOrder: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">สินค้าของฉัน</h1>
        <Link href="/vendor" className="text-sm underline">
          กลับไปแดชบอร์ด
        </Link>
      </div>

      <Link href="/vendor/products/new" className="w-fit rounded-md bg-primary px-4 py-2 text-sm text-white">
        + เพิ่มสินค้าใหม่
      </Link>

      <div className="flex flex-col gap-4">
        {products.length === 0 && <p className="text-sm text-black/60">ยังไม่มีสินค้า</p>}
        {products.map((product) => (
          <div key={product.productId} className="flex items-center gap-4 rounded-lg border border-black/10 p-4">
            {product.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.images[0].imageUrl} alt={product.name} className="h-16 w-16 rounded-md object-cover" />
            ) : (
              <div className="h-16 w-16 rounded-md bg-black/5" />
            )}
            <div className="flex-1">
              <p className="font-medium">
                {product.name}
                {!product.isActive && (
                  <span className="ml-2 rounded-full bg-black/40 px-2 py-0.5 text-xs text-white">ปิดการขาย</span>
                )}
              </p>
              <p className="text-sm text-black/70">
                {product.sku ? `รหัส ${product.sku} · ` : ""}
                {Number(product.price).toLocaleString("th-TH")} บาท · สต็อก {product.stock} ชิ้น
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 text-sm">
              <Link href={`/vendor/products/${product.productId}/edit`} className="underline">
                แก้ไข
              </Link>
              <form action={toggleVendorProductActiveAction}>
                <input type="hidden" name="productId" value={product.productId} />
                <button type="submit" className="underline">
                  {product.isActive ? "ปิดการขาย" : "เปิดขายอีกครั้ง"}
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
