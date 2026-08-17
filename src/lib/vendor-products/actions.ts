"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/auth/actions";
import { uploadProductImageFile } from "@/lib/vendor-products/uploadImage";

export type ActionState = { error?: string } | undefined;

function readProductForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim();
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

  const price = Number(priceRaw);
  const costPrice = costPriceRaw ? Number(costPriceRaw) : undefined;
  const stock = Number(stockRaw);

  if (!name) {
    return { error: "กรุณากรอกชื่อพระเครื่อง" } as const;
  }
  if (!sku) {
    return { error: "กรุณากรอกรหัสพระเครื่อง (SKU)" } as const;
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
      sku,
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
  } as const;
}

export async function createVendorProductAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireVendor();
  const parsed = readProductForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const duplicate = await prisma.product.findFirst({
    where: { tenantId: session.tenantId!, sku: parsed.data.sku },
  });
  if (duplicate) {
    return { error: "รหัสพระเครื่องนี้มีอยู่แล้วในร้าน" };
  }

  let imageUrl: string | null = null;
  const imageFile = formData.get("imageFile");
  if (imageFile instanceof File && imageFile.size > 0) {
    const uploadResult = await uploadProductImageFile(imageFile);
    if ("error" in uploadResult) return { error: uploadResult.error };
    imageUrl = uploadResult.url;
  }

  await prisma.product.create({
    data: {
      ...parsed.data,
      tenantId: session.tenantId!,
      vendorId: session.vendorId,
      ...(imageUrl && {
        images: { create: { imageUrl, imageType: "product", sortOrder: 0 } },
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
    return { error: "ไม่พบพระเครื่ององค์นี้" };
  }

  const duplicate = await prisma.product.findFirst({
    where: { tenantId: session.tenantId!, sku: parsed.data.sku, productId: { not: productId } },
  });
  if (duplicate) {
    return { error: "รหัสพระเครื่องนี้มีอยู่แล้วในร้าน" };
  }

  let imageUrl: string | null = null;
  const imageFile = formData.get("imageFile");
  if (imageFile instanceof File && imageFile.size > 0) {
    const uploadResult = await uploadProductImageFile(imageFile);
    if ("error" in uploadResult) return { error: uploadResult.error };
    imageUrl = uploadResult.url;
  }

  await prisma.$transaction(async (tx) => {
    await tx.product.update({ where: { productId }, data: parsed.data });
    if (imageUrl) {
      await tx.productImage.deleteMany({ where: { productId, imageType: "product" } });
      await tx.productImage.create({
        data: { productId, imageUrl, imageType: "product", sortOrder: 0 },
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
