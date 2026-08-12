"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/actions";
import { sendTelegramMessage } from "@/lib/notifications/telegram";
import { sendEmail } from "@/lib/notifications/email";

export type ActionState = { error?: string; success?: string } | undefined;

async function requireTenantAdmin() {
  const session = await requireSession();
  if (session.role !== "tenant_admin" || !session.tenantId) {
    redirect("/admin");
  }
  return { tenantId: session.tenantId };
}

export async function updateNotifyConfigAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { tenantId } = await requireTenantAdmin();
  const telegramEnabled = formData.get("telegramEnabled") === "on";
  const telegramBotToken = String(formData.get("telegramBotToken") ?? "").trim();
  const telegramChatId = String(formData.get("telegramChatId") ?? "").trim();
  const emailEnabled = formData.get("emailEnabled") === "on";
  const emailToAddress = String(formData.get("emailToAddress") ?? "").trim();

  if (telegramEnabled && (!telegramBotToken || !telegramChatId)) {
    return { error: "เปิดใช้งาน Telegram ต้องกรอก Bot Token และ Chat ID ให้ครบ" };
  }
  if (emailEnabled && !emailToAddress) {
    return { error: "เปิดใช้งานอีเมลต้องกรอกที่อยู่อีเมลปลายทาง" };
  }

  await prisma.notifyConfig.upsert({
    where: { tenantId },
    update: {
      telegramEnabled,
      telegramBotToken: telegramBotToken || null,
      telegramChatId: telegramChatId || null,
      emailEnabled,
      emailToAddress: emailToAddress || null,
    },
    create: {
      tenantId,
      telegramEnabled,
      telegramBotToken: telegramBotToken || null,
      telegramChatId: telegramChatId || null,
      emailEnabled,
      emailToAddress: emailToAddress || null,
    },
  });

  revalidatePath("/admin/notifications");
  redirect("/admin/notifications");
}

export async function testSendNotificationAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { tenantId } = await requireTenantAdmin();
  void formData;

  const config = await prisma.notifyConfig.findUnique({ where: { tenantId } });
  if (!config) {
    return { error: "ยังไม่ได้บันทึกการตั้งค่าแจ้งเตือน" };
  }

  const results: string[] = [];
  const errors: string[] = [];

  if (config.telegramEnabled && config.telegramBotToken && config.telegramChatId) {
    const result = await sendTelegramMessage(
      config.telegramBotToken,
      config.telegramChatId,
      "🔔 ทดสอบส่งข้อความจากระบบร้านค้า — ถ้าเห็นข้อความนี้แปลว่า Bot Token และ Chat ID ถูกต้องแล้ว"
    );
    if (result.ok) results.push("Telegram");
    else errors.push(`Telegram: ${result.error}`);
  }

  if (config.emailEnabled && config.emailToAddress) {
    const result = await sendEmail(config.emailToAddress, "ทดสอบระบบแจ้งเตือน", "นี่คือข้อความทดสอบจากระบบร้านค้า");
    if (result.ok) results.push("อีเมล");
    else errors.push("อีเมล: ยังไม่ได้ต่อผู้ให้บริการอีเมลจริงในเครื่อง dev นี้");
  }

  if (results.length === 0 && errors.length === 0) {
    return { error: "ยังไม่ได้เปิดใช้งานช่องทางแจ้งเตือนใดเลย" };
  }

  if (errors.length > 0) {
    return { error: `ส่งไม่สำเร็จบางช่องทาง: ${errors.join(" · ")}` };
  }

  return { success: `ส่งข้อความทดสอบสำเร็จ: ${results.join(", ")}` };
}
