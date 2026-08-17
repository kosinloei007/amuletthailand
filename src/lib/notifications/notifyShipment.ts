import "server-only";

// จุดเชื่อมที่เตรียมไว้สำหรับ "แจ้งเตือนลูกค้าอัตโนมัติทันทีที่กรอกเลขพัสดุ" (SMS/email) ตาม docs/vendor-enhancements-plan.md ข้อ 5
// ยังไม่เปิดใช้งานจริง (ไม่มีจุดเรียกฟังก์ชันนี้ที่ไหนในโค้ดตอนนี้) เพราะต้องต่อผู้ให้บริการ SMS/email เพิ่ม (เหมือน sendEmail ที่ยังเป็น stub)
export async function notifyCustomerShipped(_orderNumber: string, _trackingNumber: string): Promise<void> {
  return;
}
