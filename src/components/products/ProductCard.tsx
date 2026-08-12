import Link from "next/link";

export type ProductCardData = {
  productId: number;
  name: string;
  price: unknown; // Prisma.Decimal — แปลงด้วย Number() ตอนแสดงผล
  images: { imageUrl: string }[];
  monk?: { name: string } | null;
  province?: { nameTh: string } | null;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link
      href={`/products/${product.productId}`}
      className="flex flex-col gap-2 rounded-lg border border-black/10 p-3 dark:border-white/20"
    >
      {product.images[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.images[0].imageUrl}
          alt={product.name}
          className="aspect-square w-full rounded-md object-cover"
        />
      ) : (
        <div className="aspect-square w-full rounded-md bg-black/5 dark:bg-white/10" />
      )}
      <p className="line-clamp-2 text-sm font-medium">{product.name}</p>
      <p className="text-sm font-semibold">{Number(product.price).toLocaleString("th-TH")} บาท</p>
      {(product.monk || product.province) && (
        <p className="text-xs text-black/60 dark:text-white/60">
          {product.monk?.name}
          {product.province && ` · จ.${product.province.nameTh}`}
        </p>
      )}
    </Link>
  );
}
