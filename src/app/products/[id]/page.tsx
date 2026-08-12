import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentTenant } from "@/lib/tenant";
import { getProductById } from "@/lib/products/queries";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId)) {
    notFound();
  }

  const tenant = await getCurrentTenant();
  const product = await getProductById(tenant.tenantId, productId);
  if (!product) {
    notFound();
  }

  const [mainImage, ...restImages] = product.images;

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-12">
      <Link href="/products" className="text-sm underline">
        ← กลับไปรายการสินค้า
      </Link>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          {mainImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mainImage.imageUrl}
              alt={product.name}
              className="aspect-square w-full rounded-lg object-cover"
            />
          ) : (
            <div className="aspect-square w-full rounded-lg bg-black/5" />
          )}
          {restImages.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {restImages.map((image) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={image.productImageId}
                  src={image.imageUrl}
                  alt={product.name}
                  className="aspect-square w-full rounded-md object-cover"
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{product.name}</h1>
            {product.category && (
              <span className="mt-1 inline-block rounded-full bg-black/5 px-2 py-0.5 text-xs">
                {product.category.name}
              </span>
            )}
          </div>

          <p className="text-2xl font-bold">{Number(product.price).toLocaleString("th-TH")} บาท</p>

          <dl className="flex flex-col gap-2 text-sm">
            {product.monk && (
              <div className="flex justify-between">
                <dt className="text-black/60">หลวงพ่อ/วัด</dt>
                <dd>
                  <Link href={`/monks/${product.monk.slug}`} className="underline">
                    {product.monk.name}
                  </Link>
                  {product.templeName && ` (${product.templeName})`}
                </dd>
              </div>
            )}
            {product.province && (
              <div className="flex justify-between">
                <dt className="text-black/60">จังหวัด</dt>
                <dd>
                  <Link href={`/provinces/${product.province.slug}`} className="underline">
                    {product.province.nameTh}
                  </Link>
                </dd>
              </div>
            )}
            {product.era && (
              <div className="flex justify-between">
                <dt className="text-black/60">ปีสร้าง/ยุค</dt>
                <dd>{product.era}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-black/60">คงเหลือ</dt>
              <dd>{product.stock > 0 ? `${product.stock} ชิ้น` : "สินค้าหมด"}</dd>
            </div>
          </dl>

          {product.hasCertificate && (
            <div className="rounded-md bg-black/5 p-3 text-sm">
              <p className="font-medium">มีใบรับประกัน</p>
              {product.certificateInfo && <p className="text-black/70">{product.certificateInfo}</p>}
            </div>
          )}

          {product.description && (
            <div>
              <h2 className="mb-1 font-medium">รายละเอียด</h2>
              <p className="whitespace-pre-line text-sm text-black/70">{product.description}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
