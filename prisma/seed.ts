import { prisma } from "../src/lib/prisma";
import { provinces } from "./seed-data/provinces";
import { monks } from "./seed-data/monks";

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

async function main() {
  await seedProvinces();
  await seedMonks();
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
