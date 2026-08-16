import "server-only";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage, sendTelegramPhoto } from "@/lib/notifications/telegram";
import { sendEmail } from "@/lib/notifications/email";

type OrderForNotify = {
  orderId: number;
  tenantId: number;
  orderNumber: string;
  totalAmount: unknown;
  fullName: string;
  phone: string;
  address: string;
  subDistrict: string | null;
  district: string | null;
  province: string | null;
  postalCode: string | null;
  paymentSlipUrl: string | null;
  items: { productName: string; quantity: number; unitPrice: unknown }[];
};

function buildOrderMessage(order: OrderForNotify): string {
  const itemLines = order.items
    .map((item) => `- ${item.productName} x${item.quantity} (${Number(item.unitPrice).toLocaleString("th-TH")} บาท/ชิ้น)`)
    .join("\n");
  const addressParts = [order.address, order.subDistrict, order.district, order.province, order.postalCode]
    .filter(Boolean)
    .join(" ");

  return [
    `📦 ออร์เดอร์ใหม่ #${order.orderNumber}`,
    "",
    itemLines,
    "",
    `ยอดรวม: ${Number(order.totalAmount).toLocaleString("th-TH")} บาท`,
    "",
    `ผู้สั่งซื้อ: ${order.fullName} (${order.phone})`,
    `ที่อยู่จัดส่ง: ${addressParts}`,
  ].join("\n");
}

// ไม่ throw ออกไปเด็ดขาด — การแจ้งเตือนล้มเหลวต้องไม่ทำให้สร้างออร์เดอร์ไม่สำเร็จ
export async function notifyNewOrder(order: OrderForNotify): Promise<void> {
  try {
    const config = await prisma.notifyConfig.findUnique({ where: { tenantId: order.tenantId } });
    if (!config) return;

    const message = buildOrderMessage(order);

    if (config.telegramEnabled && config.telegramBotToken && config.telegramChatId) {
      if (order.paymentSlipUrl) {
        const result = await sendTelegramPhoto(config.telegramBotToken, config.telegramChatId, order.paymentSlipUrl, message);
        if (!result.ok) {
          console.error(`[notify] Telegram sendPhoto ล้มเหลวสำหรับออร์เดอร์ #${order.orderNumber}:`, result.error);
        }
      } else {
        const result = await sendTelegramMessage(config.telegramBotToken, config.telegramChatId, message);
        if (!result.ok) {
          console.error(`[notify] Telegram sendMessage ล้มเหลวสำหรับออร์เดอร์ #${order.orderNumber}:`, result.error);
        }
      }
    }

    if (config.emailEnabled && config.emailToAddress) {
      await sendEmail(config.emailToAddress, `ออร์เดอร์ใหม่ #${order.orderNumber}`, message);
    }
  } catch (e) {
    console.error(`[notify] ส่งแจ้งเตือนออร์เดอร์ #${order.orderNumber} ล้มเหลว:`, e);
  }
}

// แจ้งเตือน vendor รายที่มีสินค้าอยู่ในออร์เดอร์นั้นๆ — คู่กับ notifyNewOrder() ด้านบนที่แจ้งแอดมินร้าน
// bot token ใช้ร่วมจาก NotifyConfig ของ tenant เดิม ต่างแค่ chat id ปลายทางเป็นของ vendor แต่ละราย
// ไม่ throw ออกไปเด็ดขาด เหมือนกับ notifyNewOrder()
export async function notifyVendorNewOrder(tenantId: number, vendorId: number, orderNumber: string): Promise<void> {
  try {
    const [config, vendor] = await Promise.all([
      prisma.notifyConfig.findUnique({ where: { tenantId } }),
      prisma.vendor.findUnique({ where: { vendorId }, include: { users: { select: { email: true }, take: 1 } } }),
    ]);
    if (!vendor) return;

    const message = `📦 มีออร์เดอร์ใหม่ #${orderNumber} เข้าไปดูรายการที่ต้องจัดส่งได้ที่ /vendor/orders`;

    if (vendor.notifyTelegramEnabled && vendor.telegramChatId && config?.telegramBotToken) {
      const result = await sendTelegramMessage(config.telegramBotToken, vendor.telegramChatId, message);
      if (!result.ok) {
        console.error(`[notify] Telegram แจ้งเตือน vendor #${vendorId} ล้มเหลวสำหรับออร์เดอร์ #${orderNumber}:`, result.error);
      }
    }

    const vendorEmail = vendor.users[0]?.email;
    if (vendor.notifyEmailEnabled && vendorEmail) {
      await sendEmail(vendorEmail, `มีออร์เดอร์ใหม่ #${orderNumber}`, message);
    }
  } catch (e) {
    console.error(`[notify] แจ้งเตือน vendor #${vendorId} สำหรับออร์เดอร์ #${orderNumber} ล้มเหลว:`, e);
  }
}
