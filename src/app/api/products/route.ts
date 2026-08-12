import { NextRequest } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getNewArrivals } from "@/lib/home/queries";

// GET /api/products?sort=newest&days=30
// เตรียมไว้ตาม docs/home-and-catalog.md ให้ปรับจำนวนวันของ "พระเครื่องเข้ามาใหม่" ได้
// โดยไม่ต้องแก้โค้ดหน้าเว็บ — ตอนนี้รองรับเฉพาะ sort=newest
export async function GET(request: NextRequest) {
  const sort = request.nextUrl.searchParams.get("sort") ?? "newest";
  const daysParam = Number(request.nextUrl.searchParams.get("days"));
  const days = Number.isFinite(daysParam) && daysParam > 0 ? daysParam : 30;

  if (sort !== "newest") {
    return Response.json({ error: `sort="${sort}" ยังไม่รองรับ (รองรับเฉพาะ "newest")` }, { status: 400 });
  }

  const tenant = await getCurrentTenant();
  const products = await getNewArrivals(tenant.tenantId, days);

  return Response.json({ days, count: products.length, products });
}
