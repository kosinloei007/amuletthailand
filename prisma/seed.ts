import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth/password";
import { provinces } from "./seed-data/provinces";
import { monks } from "./seed-data/monks";
import { themes } from "./seed-data/themes";
import { demoTenant } from "./seed-data/tenant";
import { categories } from "./seed-data/categories";
import { products } from "./seed-data/products";
import { memberTiers } from "./seed-data/member-tiers";
import { DEV_PASSWORD, users } from "./seed-data/users";
import { vendors } from "./seed-data/vendors";

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

async function seedMemberTiers(tenantId: number) {
  for (const tier of memberTiers) {
    const existing = await prisma.memberTier.findFirst({ where: { tenantId, name: tier.name } });
    const data = {
      tenantId,
      name: tier.name,
      sortOrder: tier.sortOrder,
      discountType: tier.discountType,
      discountValue: tier.discountValue,
      freeShippingEnabled: tier.freeShippingEnabled,
      freeShippingMinAmount: tier.freeShippingMinAmount,
      isDefault: tier.isDefault,
    };
    if (existing) {
      await prisma.memberTier.update({ where: { memberTierId: existing.memberTierId }, data });
    } else {
      await prisma.memberTier.create({ data });
    }
  }
  console.log(`Seeded ${memberTiers.length} member tiers`);
}

async function seedUsers(tenantId: number) {
  const passwordHash = await hashPassword(DEV_PASSWORD);
  const allTiers = await prisma.memberTier.findMany({ where: { tenantId }, select: { memberTierId: true, name: true } });
  const tierIdByName = new Map(allTiers.map((t) => [t.name, t.memberTierId]));

  for (const user of users) {
    const memberTierId = user.memberTierName ? tierIdByName.get(user.memberTierName) : undefined;
    if (user.memberTierName && !memberTierId) {
      throw new Error(`ไม่พบ member tier ชื่อ "${user.memberTierName}" สำหรับผู้ใช้ "${user.email}"`);
    }

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
        tenantId: user.belongsToTenant ? tenantId : null,
        memberTierId: memberTierId ?? null,
      },
      create: {
        email: user.email,
        phone: user.phone,
        passwordHash,
        fullName: user.fullName,
        role: user.role,
        tenantId: user.belongsToTenant ? tenantId : null,
        memberTierId: memberTierId ?? null,
      },
    });
  }
  console.log(`Seeded ${users.length} users (dev password: "${DEV_PASSWORD}")`);
}

async function seedVendors(tenantId: number) {
  const allProvinces = await prisma.province.findMany({ select: { provinceId: true, slug: true } });
  const provinceIdBySlug = new Map(allProvinces.map((p) => [p.slug, p.provinceId]));

  const allMonks = await prisma.monk.findMany({ select: { monkId: true, slug: true } });
  const monkIdBySlug = new Map(allMonks.map((m) => [m.slug, m.monkId]));

  const allCategories = await prisma.category.findMany({ select: { categoryId: true, slug: true } });
  const categoryIdBySlug = new Map(allCategories.map((c) => [c.slug, c.categoryId]));

  const passwordHash = await hashPassword(DEV_PASSWORD);

  for (const vendorSeed of vendors) {
    const existingVendor = await prisma.vendor.findFirst({ where: { tenantId, shopName: vendorSeed.shopName } });
    const vendorData = {
      contactName: vendorSeed.contactName,
      phone: vendorSeed.phone,
      bankName: vendorSeed.bankName,
      accountName: vendorSeed.accountName,
      accountNumber: vendorSeed.accountNumber,
    };
    const vendor = existingVendor
      ? await prisma.vendor.update({ where: { vendorId: existingVendor.vendorId }, data: vendorData })
      : await prisma.vendor.create({ data: { tenantId, shopName: vendorSeed.shopName, ...vendorData } });

    await prisma.user.upsert({
      where: { email: vendorSeed.email },
      update: { fullName: vendorSeed.contactName, role: "vendor", tenantId, vendorId: vendor.vendorId },
      create: {
        tenantId,
        email: vendorSeed.email,
        phone: vendorSeed.phone,
        passwordHash,
        fullName: vendorSeed.contactName,
        role: "vendor",
        vendorId: vendor.vendorId,
      },
    });

    for (const product of vendorSeed.products) {
      const provinceId = provinceIdBySlug.get(product.provinceSlug);
      const monkId = monkIdBySlug.get(product.monkSlug);
      const categoryId = categoryIdBySlug.get(product.categorySlug);
      if (!provinceId) throw new Error(`ไม่พบจังหวัด slug="${product.provinceSlug}" สำหรับสินค้าผู้ขาย "${product.name}"`);
      if (!monkId) throw new Error(`ไม่พบหลวงพ่อ slug="${product.monkSlug}" สำหรับสินค้าผู้ขาย "${product.name}"`);
      if (!categoryId) throw new Error(`ไม่พบหมวดหมู่ slug="${product.categorySlug}" สำหรับสินค้าผู้ขาย "${product.name}"`);

      const existing = await prisma.product.findFirst({ where: { tenantId, vendorId: vendor.vendorId, name: product.name } });
      const data = {
        tenantId,
        vendorId: vendor.vendorId,
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
      };

      const saved = existing
        ? await prisma.product.update({ where: { productId: existing.productId }, data })
        : await prisma.product.create({ data });

      await prisma.productImage.deleteMany({ where: { productId: saved.productId } });
      await prisma.productImage.create({
        data: { productId: saved.productId, imageUrl: product.imageUrl, imageType: "product", sortOrder: 0 },
      });
    }
  }
  console.log(`Seeded ${vendors.length} vendors (login password: "${DEV_PASSWORD}")`);
}

async function main() {
  await seedProvinces();
  await seedMonks();
  await seedThemes();
  const tenant = await seedTenant();
  await seedCategories();
  await seedProducts(tenant.tenantId);
  await seedMemberTiers(tenant.tenantId);
  await seedUsers(tenant.tenantId);
  await seedVendors(tenant.tenantId);
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
