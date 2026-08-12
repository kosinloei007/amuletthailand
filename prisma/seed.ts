import { prisma } from "../src/lib/prisma";
import { provinces } from "./seed-data/provinces";
import { monks } from "./seed-data/monks";
import { themes } from "./seed-data/themes";
import { demoTenant } from "./seed-data/tenant";
import { categories } from "./seed-data/categories";
import { products } from "./seed-data/products";

async function seedProvinces() {
  for (const province of provinces) {
    await prisma.province.upsert({
      where: { slug: province.slug },
      update: {
        nameTh: province.nameTh,
        nameEn: province.nameEn,
        region: province.region,
      },
      create: province,
    });
  }
  console.log(`Seeded ${provinces.length} provinces`);
}

async function seedMonks() {
  const allProvinces = await prisma.province.findMany({
    select: { provinceId: true, slug: true },
  });
  const provinceIdBySlug = new Map(allProvinces.map((p) => [p.slug, p.provinceId]));

  for (const monk of monks) {
    const provinceId = provinceIdBySlug.get(monk.provinceSlug);
    if (!provinceId) {
      throw new Error(`ไม่พบจังหวัด slug="${monk.provinceSlug}" สำหรับหลวงพ่อ "${monk.name}"`);
    }

    await prisma.monk.upsert({
      where: { slug: monk.slug },
      update: {
        name: monk.name,
        templeName: monk.templeName,
        provinceId,
        bio: monk.bio,
      },
      create: {
        name: monk.name,
        slug: monk.slug,
        templeName: monk.templeName,
        provinceId,
        bio: monk.bio,
      },
    });
  }
  console.log(`Seeded ${monks.length} monks`);
}

async function seedThemes() {
  for (const theme of themes) {
    const existing = await prisma.theme.findFirst({ where: { name: theme.name } });
    if (existing) {
      await prisma.theme.update({ where: { themeId: existing.themeId }, data: theme });
    } else {
      await prisma.theme.create({ data: theme });
    }
  }
  console.log(`Seeded ${themes.length} themes`);
}

async function seedTenant() {
  const theme = await prisma.theme.findFirst({ where: { name: demoTenant.themeName } });
  if (!theme) {
    throw new Error(`ไม่พบธีมชื่อ "${demoTenant.themeName}" สำหรับ tenant demo`);
  }

  const tenant = await prisma.tenant.upsert({
    where: { slug: demoTenant.slug },
    update: {
      shopName: demoTenant.shopName,
      ownerContact: demoTenant.ownerContact,
      defaultMarkupPercent: demoTenant.defaultMarkupPercent,
      themeId: theme.themeId,
    },
    create: {
      shopName: demoTenant.shopName,
      slug: demoTenant.slug,
      ownerContact: demoTenant.ownerContact,
      defaultMarkupPercent: demoTenant.defaultMarkupPercent,
      themeId: theme.themeId,
    },
  });
  console.log(`Seeded tenant "${tenant.shopName}"`);
  return tenant;
}

async function seedCategories() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    });
  }
  console.log(`Seeded ${categories.length} categories`);
}

async function seedProducts(tenantId: number) {
  const allProvinces = await prisma.province.findMany({ select: { provinceId: true, slug: true } });
  const provinceIdBySlug = new Map(allProvinces.map((p) => [p.slug, p.provinceId]));

  const allMonks = await prisma.monk.findMany({ select: { monkId: true, slug: true } });
  const monkIdBySlug = new Map(allMonks.map((m) => [m.slug, m.monkId]));

  const allCategories = await prisma.category.findMany({ select: { categoryId: true, slug: true } });
  const categoryIdBySlug = new Map(allCategories.map((c) => [c.slug, c.categoryId]));

  for (const product of products) {
    const provinceId = provinceIdBySlug.get(product.provinceSlug);
    const monkId = monkIdBySlug.get(product.monkSlug);
    const categoryId = categoryIdBySlug.get(product.categorySlug);
    if (!provinceId) throw new Error(`ไม่พบจังหวัด slug="${product.provinceSlug}" สำหรับสินค้า "${product.name}"`);
    if (!monkId) throw new Error(`ไม่พบหลวงพ่อ slug="${product.monkSlug}" สำหรับสินค้า "${product.name}"`);
    if (!categoryId) throw new Error(`ไม่พบหมวดหมู่ slug="${product.categorySlug}" สำหรับสินค้า "${product.name}"`);

    const existing = await prisma.product.findFirst({
      where: { tenantId, name: product.name },
    });

    const data = {
      tenantId,
      name: product.name,
      description: product.description,
      costPrice: product.costPrice,
      price: product.price,
      stock: product.stock,
      provinceId,
      monkId,
      categoryId,
      templeName: product.templeName,
      era: product.era,
      hasCertificate: product.hasCertificate,
      certificateInfo: product.certificateInfo,
    };

    const saved = existing
      ? await prisma.product.update({ where: { productId: existing.productId }, data })
      : await prisma.product.create({ data });

    // เขียนรูปใหม่ทุกครั้งเพื่อให้ seed idempotent (ลบของเดิมแล้วสร้างใหม่ตามลำดับ)
    await prisma.productImage.deleteMany({ where: { productId: saved.productId } });
    let productSort = 0;
    let certificateSort = 0;
    for (const image of product.images) {
      await prisma.productImage.create({
        data: {
          productId: saved.productId,
          imageUrl: image.url,
          imageType: image.type,
          sortOrder: image.type === "product" ? productSort++ : certificateSort++,
        },
      });
    }
  }
  console.log(`Seeded ${products.length} products`);
}

async function main() {
  await seedProvinces();
  await seedMonks();
  await seedThemes();
  const tenant = await seedTenant();
  await seedCategories();
  await seedProducts(tenant.tenantId);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
