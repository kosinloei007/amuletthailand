import "server-only";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

// เก็บไฟล์ slip ไว้ที่ public/uploads/slips บนดิสก์เครื่อง dev เอง
// นี่คือทางลัดสำหรับ dev ตาม CLAUDE.md ("ตอน dev ใช้ placeholder ก่อน") — โปรดักชันจริงต้องเปลี่ยนไปใช้
// object storage (S3-compatible) เพราะไฟล์ในดิสก์แบบนี้จะหายเมื่อ deploy ใหม่/scale เป็นหลาย instance
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export type UploadSlipResult = { url: string } | { error: string };

export async function uploadSlipFile(file: File): Promise<UploadSlipResult> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "ไฟล์ slip ต้องเป็นรูปภาพ (JPG/PNG/WebP) หรือ PDF เท่านั้น" };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { error: "ไฟล์ slip ต้องมีขนาดไม่เกิน 5MB" };
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "slips");
  await mkdir(uploadDir, { recursive: true });

  const ext = file.type === "application/pdf" ? "pdf" : file.type.split("/")[1];
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
  const filePath = path.join(uploadDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return { url: `/uploads/slips/${filename}` };
}
