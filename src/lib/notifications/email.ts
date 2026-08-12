import "server-only";

// ยังไม่ได้ต่อผู้ให้บริการอีเมลจริง (เช่น Resend/SendGrid) เพราะไม่มี API key ใช้งาน
// ฟังก์ชันนี้แค่ log ไว้เป็นจุดต่อในอนาคต — ห้ามให้ error ตรงนี้ทำให้การสร้างออร์เดอร์ล้มเหลว
export async function sendEmail(toAddress: string, subject: string, body: string): Promise<{ ok: boolean }> {
  console.log("[email:stub] ยังไม่ได้ตั้งค่าผู้ให้บริการอีเมลจริง — ข้อความที่ควรจะส่ง:", {
    toAddress,
    subject,
    body,
  });
  return { ok: false };
}
