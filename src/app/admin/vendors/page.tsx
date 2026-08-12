import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/actions";
import { prisma } from "@/lib/prisma";
import { createVendorAction, toggleVendorStatusAction } from "@/lib/vendors/actions";
import { VendorForm } from "@/components/vendors/VendorForm";

const STATUS_LABEL: Record<string, string> = {
  active: "เปิดใช้งาน",
  suspended: "ระงับ",
};

export default async function VendorsPage() {
  const session = await requireSession();
  if (session.role !== "tenant_admin" || !session.tenantId) {
    redirect("/admin");
  }

  const vendors = await prisma.vendor.findMany({
    where: { tenantId: session.tenantId },
    include: { _count: { select: { products: true } }, users: { select: { email: true }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">ผู้ขาย (Marketplace)</h1>
        <Link href="/admin" className="text-sm underline">
          กลับไปแดชบอร์ด
        </Link>
      </div>

      <p className="text-sm text-black/60">
        เพิ่มผู้ขายเพื่อให้เข้าสู่ระบบและจัดการสินค้าของตัวเองได้ที่หน้า /vendor — ระงับผู้ขายแล้วสินค้าของผู้ขายรายนั้นจะถูกซ่อนจากหน้าร้านทันที
      </p>

      <div className="flex flex-col gap-4">
        {vendors.length === 0 && <p className="text-sm text-black/60">ยังไม่มีผู้ขายในระบบ</p>}
        {vendors.map((vendor) => (
          <div key={vendor.vendorId} className="flex flex-col gap-3 rounded-lg border border-black/10 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">
                  {vendor.shopName}
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs text-white ${
                      vendor.status === "active" ? "bg-accent" : "bg-black/40"
                    }`}
                  >
                    {STATUS_LABEL[vendor.status] ?? vendor.status}
                  </span>
                </p>
                <p className="text-sm text-black/70">
                  {vendor.contactName}
                  {vendor.users[0] && ` · ${vendor.users[0].email}`}
                  {" · "}
                  {vendor._count.products} สินค้า
                </p>
              </div>
              <Link href={`/admin/vendors/${vendor.vendorId}/edit`} className="shrink-0 text-sm underline">
                แก้ไข
              </Link>
            </div>
            <form action={toggleVendorStatusAction}>
              <input type="hidden" name="vendorId" value={vendor.vendorId} />
              <button type="submit" className="text-sm underline">
                {vendor.status === "active" ? "ระงับผู้ขายรายนี้" : "เปิดใช้งานอีกครั้ง"}
              </button>
            </form>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-black/10 p-4">
        <h2 className="font-medium">เพิ่มผู้ขายใหม่</h2>
        <VendorForm action={createVendorAction} submitLabel="เพิ่มผู้ขาย" showLoginFields />
      </div>
    </main>
  );
}
