import { getSession } from "@/lib/auth/session";

// GET /api/session — ให้ AccountLink (client component) เช็กสถานะ login แบบ client-side
// แยกออกมาเป็น API route แทนที่จะอ่าน session ตรงใน root layout เพื่อไม่ให้หน้า public
// (home/products ฯลฯ) กลายเป็น dynamic เต็มรูปและเสีย ISR — ดู CLAUDE.md
export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ loggedIn: false });
  }
  return Response.json({
    loggedIn: true,
    role: session.role,
    fullName: session.fullName,
  });
}
