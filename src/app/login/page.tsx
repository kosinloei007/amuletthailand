import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4 py-12">
      <h1 className="text-2xl font-semibold">เข้าสู่ระบบ</h1>
      <LoginForm />
      <p className="text-sm text-black/70">
        ยังไม่มีบัญชี?{" "}
        <Link href="/register" className="underline">
          สมัครสมาชิก
        </Link>
      </p>
    </main>
  );
}
