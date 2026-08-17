// ใช้ 17TRACK เป็น aggregator กลางสำหรับทุกขนส่ง (auto-detect ขนส่งจากเลขพัสดุเอง ไม่ต้องส่ง carrier code)
// เหตุผล: หา URL template ที่มั่นใจได้ของขนส่งไทยแต่ละเจ้าไม่ได้ครบ (เว็บขนส่งเปลี่ยน URL บ่อย) ยกเว้น DHL แต่เพื่อไม่ต้องดูแลหลาย template แยกจึงใช้ 17TRACK รูปแบบเดียวทั้งหมด
export function buildTrackingUrl(trackingNumber: string): string {
  return `https://t.17track.net/en#nums=${encodeURIComponent(trackingNumber)}`;
}
