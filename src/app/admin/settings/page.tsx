import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/actions";
import { prisma } from "@/lib/prisma";
import { resolveTheme } from "@/lib/theme/resolve";
import { selectPresetThemeAction } from "@/lib/settings/actions";
import { ShopInfoForm } from "@/components/settings/ShopInfoForm";
import { ThemeCustomizeForm } from "@/components/settings/ThemeCustomizeForm";

export default async function ShopSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireSession();
  if (session.role !== "tenant_admin" || !session.tenantId) {
    redirect("/admin");
  }
  const { error } = await searchParams;

  const [tenant, presetThemes] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { tenantId: session.tenantId }, include: { theme: true } }),
    prisma.theme.findMany({ where: { isPreset: true }, orderBy: { themeId: "asc" } }),
  ]);

  const currentTheme = resolveTheme(tenant.theme);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-10 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">ตั้งค่าร้าน</h1>
        <Link href="/admin" className="text-sm underline">
          กลับไปแดชบอร์ด
        </Link>
      </div>

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <section className="flex flex-col gap-4 rounded-lg border border-black/10 p-4">
        <h2 className="font-medium">ข้อมูลร้าน</h2>
        <ShopInfoForm shopName={tenant.shopName} ownerContact={tenant.ownerContact} />
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-black/10 p-4">
        <h2 className="font-medium">ธีมสำเร็จรูป</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {presetThemes.map((theme) => {
            const isCurrent = tenant.themeId === theme.themeId;
            return (
              <form key={theme.themeId} action={selectPresetThemeAction}>
                <input type="hidden" name="themeId" value={theme.themeId} />
                <button
                  type="submit"
                  disabled={isCurrent}
                  className={`flex w-full flex-col gap-2 rounded-lg border p-3 text-left text-sm ${
                    isCurrent ? "border-primary" : "border-black/10"
                  }`}
                >
                  <div className="flex gap-1">
                    <span className="h-6 w-6 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
                    <span className="h-6 w-6 rounded-full" style={{ backgroundColor: theme.accentColor }} />
                    <span
                      className="h-6 w-6 rounded-full border border-black/10"
                      style={{ backgroundColor: theme.backgroundColor }}
                    />
                  </div>
                  <span>{theme.name}</span>
                  {isCurrent && <span className="text-xs text-primary">กำลังใช้งานอยู่</span>}
                </button>
              </form>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-black/10 p-4">
        <h2 className="font-medium">ปรับแต่งธีมเอง</h2>
        <p className="text-sm text-black/60">
          ปรับสี/โลโก้/ฟอนต์ตามต้องการ — ถ้าธีมปัจจุบันเป็นธีมสำเร็จรูปหรือใช้ร่วมกับร้านอื่น ระบบจะสร้างธีมใหม่ให้อัตโนมัติแทนการแก้ธีมเดิม
        </p>
        <ThemeCustomizeForm theme={currentTheme} />
      </section>
    </main>
  );
}
