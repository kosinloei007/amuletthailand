// Payment gateway จำลอง (ไม่ได้ต่อ Omise/2C2P จริง เพราะไม่มี API key ของผู้ให้บริการ)
// จำลองสิ่งที่ gateway จริงทำ: ยืนยันเงินอัตโนมัติแบบเรียลไทม์ตอนลูกค้ากด "ยืนยันการชำระเงิน"
// แทนที่ flow โอน+แนบสลิป+รอแอดมินตรวจ — โครงสร้าง (PaymentTransaction) ออกแบบให้พร้อมสลับไปต่อ
// gateway จริงได้ในอนาคตโดยเปลี่ยนแค่ไฟล์นี้ ไม่ต้องแก้ schema หรือ checkout flow
export function createMockGatewayCharge(): { transactionRef: string; gatewayStatus: "successful" } {
  const transactionRef = `MOCK-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  return { transactionRef, gatewayStatus: "successful" };
}
