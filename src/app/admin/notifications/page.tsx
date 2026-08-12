import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/actions";
import { prisma } from "@/lib/prisma";
import { NotifyConfigForm } from "@/components/notifications/NotifyConfigForm";

export default async function NotificationsPage() {
  const session = await requireSession();
  if (session.role !== "tenant_admin" || !session.tenantId) {
    redirect("/admin");
  }

  const config = await prisma.notifyConfig.findUnique({ where: { tenantId: session.tenantId } });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">การแจ้งเตือนออร์เดอร์ใหม่</h1>
        <Link href="/admin" className="text-sm underline">
          กลับไปแดชบอร์ด
        </Link>
      </div>
      <p className="text-sm text-black/60">
        เมื่อมีลูกค้าสั่งซื้อสำเร็จ ระบบจะส่งสรุปออร์เดอร์ไปยังช่องทางที่เปิดไว้ด้านล่างอัตโนมัติ (เปิดได้พร้อมกันหลายช่องทาง)
      </p>
      <NotifyConfigForm
        telegramEnabled={config?.telegramEnabled ?? false}
        telegramBotToken={config?.telegramBotToken ?? ""}
        telegramChatId={config?.telegramChatId ?? ""}
        emailEnabled={config?.emailEnabled ?? false}
        emailToAddress={config?.emailToAddress ?? ""}
      />
    </main>
  );
}
