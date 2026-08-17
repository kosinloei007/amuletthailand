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
  if (sku.length > 10) {
    return { error: "รหัสพระเครื่อง (SKU) ต้องไม่เกิน 10 ตัวอักษร" } as const;
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

function getImageFiles(formData: FormData, field: string): File[] {
  return formData.getAll(field).filter((f): f is File => f instanceof File && f.size > 0);
}

async function uploadAll(files: File[]): Promise<{ urls: string[] } | { error: string }> {
  const urls: string[] = [];
  for (const file of files) {
    const result = await uploadProductImageFile(file);
    if ("error" in result) return { error: result.error };
    urls.push(result.url);
  }
  return { urls };
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

  const mainImageFiles = getImageFiles(formData, "imageFiles");
  if (mainImageFiles.length === 0) {
    return { error: "กรุณาอัปโหลดรูปพระเครื่องอย่างน้อย 1 รูป" };
  }
  if (mainImageFiles.length > 10) {
    return { error: "อัปโหลดรูปพระเครื่องได้ไม่เกิน 10 รูป" };
  }

  const certImageFiles = parsed.data.hasCertificate ? getImageFiles(formData, "certificateImageFiles") : [];
  if (parsed.data.hasCertificate) {
    if (certImageFiles.length === 0) {
      return { error: "กรุณาอัปโหลดรูปใบรับประกันอย่างน้อย 1 รูป" };
    }
    if (certImageFiles.length > 3) {
      return { error: "อัปโหลดรูปใบรับประกันได้ไม่เกิน 3 รูป" };
    }
  }

  const mainUpload = await uploadAll(mainImageFiles);
  if ("error" in mainUpload) return { error: mainUpload.error };
  const certUpload = await uploadAll(certImageFiles);
  if ("error" in certUpload) return { error: certUpload.error };

  await prisma.product.create({
    data: {
      ...parsed.data,
      tenantId: session.tenantId!,
      vendorId: session.vendorId,
      images: {
        create: [
          ...mainUpload.urls.map((imageUrl, sortOrder) => ({ imageUrl, imageType: "product", sortOrder })),
          ...certUpload.urls.map((imageUrl, sortOrder) => ({ imageUrl, imageType: "certificate", sortOrder })),
        ],
      },
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

  const existing = await prisma.product.findFirst({
    where: { productId, vendorId: session.vendorId },
    include: { images: true },
  });
  if (!existing) {
    return { error: "ไม่พบพระเครื่ององค์นี้" };
  }

  const duplicate = await prisma.product.findFirst({
    where: { tenantId: session.tenantId!, sku: parsed.data.sku, productId: { not: productId } },
  });
  if (duplicate) {
    return { error: "รหัสพระเครื่องนี้มีอยู่แล้วในร้าน" };
  }

  const mainImageFiles = getImageFiles(formData, "imageFiles");
  if (mainImageFiles.length > 10) {
    return { error: "อัปโหลดรูปพระเครื่องได้ไม่เกิน 10 รูป" };
  }

  const certImageFiles = parsed.data.hasCertificate ? getImageFiles(formData, "certificateImageFiles") : [];
  const existingCertCount = existing.images.filter((i) => i.imageType === "certificate").length;
  if (parsed.data.hasCertificate) {
    if (certImageFiles.length === 0 && existingCertCount === 0) {
      return { error: "กรุณาอัปโหลดรูปใบรับประกันอย่างน้อย 1 รูป" };
    }
    if (certImageFiles.length > 3) {
      return { error: "อัปโหลดรูปใบรับประกันได้ไม่เกิน 3 รูป" };
    }
  }

  const mainUpload = await uploadAll(mainImageFiles);
  if ("error" in mainUpload) return { error: mainUpload.error };
  const certUpload = await uploadAll(certImageFiles);
  if ("error" in certUpload) return { error: certUpload.error };

  await prisma.$transaction(async (tx) => {
    await tx.product.update({ where: { productId }, data: parsed.data });

    if (mainUpload.urls.length > 0) {
      await tx.productImage.deleteMany({ where: { productId, imageType: "product" } });
      await tx.productImage.createMany({
        data: mainUpload.urls.map((imageUrl, sortOrder) => ({ productId, imageUrl, imageType: "product", sortOrder })),
      });
    }

    if (!parsed.data.hasCertificate) {
      await tx.productImage.deleteMany({ where: { productId, imageType: "certificate" } });
    } else if (certUpload.urls.length > 0) {
      await tx.productImage.deleteMany({ where: { productId, imageType: "certificate" } });
      await tx.productImage.createMany({
        data: certUpload.urls.map((imageUrl, sortOrder) => ({ productId, imageUrl, imageType: "certificate", sortOrder })),
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
