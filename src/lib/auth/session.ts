import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";

export const SESSION_COOKIE_NAME = "session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 วัน

export type UserRole = "super_admin" | "tenant_admin" | "member" | "vendor";

export type SessionPayload = {
  userId: number;
  tenantId: number | null;
  role: UserRole;
  email: string;
  fullName: string;
  vendorId: number | null;
};

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("ไม่ได้ตั้งค่า AUTH_SECRET ใน .env");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

async function isHttpsRequest(): Promise<boolean> {
  // ใช้ x-forwarded-proto จาก reverse proxy (ถ้ามี) แทนการเดาจาก NODE_ENV ตรงๆ
  // เพราะ next start ที่รันหลัง IIS/PM2 ยังถือว่า "production" แต่ตัว proxy เองอาจเสิร์ฟผ่าน
  // plain HTTP อยู่ (เช่น amulet-test.local:8080 ที่ยังไม่ได้ตั้ง TLS) — ถ้า mark cookie เป็น
  // Secure ทั้งที่ต่อผ่าน HTTP เบราว์เซอร์จะไม่เก็บ cookie เลย ทำให้ login แล้วดูเหมือนไม่ login
  // (header/AccountLink เช็คสถานะจาก fetch('/api/session') ใหม่ทุกครั้งจึงเห็นว่าไม่มี cookie)
  const hdrs = await headers();
  const proto = hdrs.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  return proto === "https";
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = await createSessionToken(payload);
  const cookieStore = await cookies();
  const secure = await isHttpsRequest();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
