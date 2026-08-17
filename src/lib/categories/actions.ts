"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireShopAdmin } from "@/lib/auth/actions";

export type ActionState = { error?: string } | undefined;

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function readCategoryForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();

  if (!name) {
    return { error: "กรุณากรอกชื่อหมวดหมู่" } as const;
  }
  if (!slug || !SLUG_PATTERN.test(slug)) {
    return { error: "Slug ต้องเป็นตัวพิมพ์เล็กภาษาอังกฤษ ตัวเลข และขีดกลาง (-) เท่านั้น เช่น phra-somdej" } as const;
  }

  return { data: { name, slug } } as const;
}

export async function createCategoryAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireShopAdmin();
  const parsed = readCategoryForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const duplicate = await prisma.category.findUnique({ where: { slug: parsed.data.slug } });
  if (duplicate) {
    return { error: "Slug นี้ถูกใช้งานแล้ว" };
  }

  await prisma.category.create({ data: parsed.data });

  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function updateCategoryAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireShopAdmin();
  const categoryId = Number(formData.get("categoryId"));
  const parsed = readCategoryForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const existing = await prisma.category.findUnique({ where: { categoryId } });
  if (!existing) {
    return { error: "ไม่พบหมวดหมู่นี้" };
  }

  const duplicate = await prisma.category.findFirst({
    where: { slug: parsed.data.slug, categoryId: { not: categoryId } },
  });
  if (duplicate) {
    return { error: "Slug นี้ถูกใช้งานแล้ว" };
  }

  await prisma.category.update({ where: { categoryId }, data: parsed.data });

  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  await requireShopAdmin();
  const categoryId = Number(formData.get("categoryId"));

  const existing = await prisma.category.findUnique({ where: { categoryId } });
  if (!existing) {
    redirect("/admin/categories");
  }

  const productCount = await prisma.product.count({ where: { categoryId } });
  if (productCount > 0) {
    redirect(
      "/admin/categories?error=" +
        encodeURIComponent(`มีสินค้า ${productCount} ชิ้นอยู่ในหมวดหมู่นี้ ย้ายสินค้าออกก่อนถึงจะลบได้`)
    );
  }

  await prisma.category.delete({ where: { categoryId } });
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}
