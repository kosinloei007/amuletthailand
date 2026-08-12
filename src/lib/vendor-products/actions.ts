"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/auth/actions";

export type ActionState = { error?: string } | undefined;

function readProductForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const costPriceRaw = String(formData.get("costPrice") ?? "").trim();
  const stockRaw = String(formData.get("stock") ?? "0").trim();
  const provinceIdRaw = String(formData.get("provinceId") ?? "").trim();
  const monkIdRaw = String(formData.get("monkId") ?? "").trim();
  const categoryIdRaw = String(formData.get("categoryId") ?? "").trim();
  const templeName = String(formData.get("templeName") ?? "").trim();
  const era = String(formData.get("era") ?? "").trim();
  const hasCertificate = formData.get("hasCertificate") === "on";
  const certificateInfo = String(formData.get("certificateInfo") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();

  const price = Number(priceRaw);
  const costPrice = costPriceRaw ? Number(costPriceRaw) : undefined;
  const stock = Number(stockRaw);

  if (!name) {
    return { error: "กรุณากรอกชื่อสินค้า" } as const;
  }
  if (!Number.isFinite(price) || price <= 0) {
    return { error: "กรุณากรอกราคาขายให้ถูกต้อง" } as const;
  }
  if (costPrice !== undefined && (!Number.isFinite(costPrice) || costPrice < 0)) {
    return { error: "ต้นทุนต้องเป็นตัวเลขไม่ติดลบ" } as const;
  }
  if (!Number.isInteger(stock) || stock < 0) {
    return { error: "จำนวนสต็อกต้องเป็นจำนวนเต็มไม่ติดลบ" } as const;
  }

  return {
    data: {
      name,
      description: description || null,
      price,
      costPrice: costPrice ?? null,
      stock,
      provinceId: provinceIdRaw ? Number(provinceIdRaw) : null,
      monkId: monkIdRaw ? Number(monkIdRaw) : null,
      categoryId: categoryIdRaw ? Number(categoryIdRaw) : null,
      templeName: templeName || null,
      era: era || null,
      hasCertificate,
      certificateInfo: hasCertificate ? certificateInfo || null : null,
    },
    imageUrl: imageUrl || null,
  } as const;
}

export async function createVendorProductAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireVendor();
  const parsed = readProductForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  await prisma.product.create({
    data: {
      ...parsed.data,
      tenantId: session.tenantId!,
      vendorId: session.vendorId,
      ...(parsed.imageUrl && {
        images: { create: { imageUrl: parsed.imageUrl, imageType: "product", sortOrder: 0 } },
      }),
    },
  });

  revalidatePath("/vendor/products");
  redirect("/vendor/products");
}

export async function updateVendorProductAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireVendor();
  const productId = Number(formData.get("productId"));
  const parsed = readProductForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const existing = await prisma.product.findFirst({ where: { productId, vendorId: session.vendorId } });
  if (!existing) {
    return { error: "ไม่พบสินค้านี้" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.product.update({ where: { productId }, data: parsed.data });
    if (parsed.imageUrl) {
      await tx.productImage.deleteMany({ where: { productId, imageType: "product" } });
      await tx.productImage.create({
        data: { productId, imageUrl: parsed.imageUrl, imageType: "product", sortOrder: 0 },
      });
    }
  });

  revalidatePath("/vendor/products");
  redirect("/vendor/products");
}

export async function toggleVendorProductActiveAction(formData: FormData): Promise<void> {
  const session = await requireVendor();
  const productId = Number(formData.get("productId"));

  const existing = await prisma.product.findFirst({ where: { productId, vendorId: session.vendorId } });
  if (!existing) {
    redirect("/vendor/products");
  }

  await prisma.product.update({ where: { productId }, data: { isActive: !existing.isActive } });

  revalidatePath("/vendor/products");
  redirect("/vendor/products");
}
