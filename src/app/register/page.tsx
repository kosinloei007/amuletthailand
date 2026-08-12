import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4 py-12">
      <h1 className="text-2xl font-semibold">สมัครสมาชิก</h1>
      <RegisterForm />
      <p className="text-sm text-black/70 dark:text-white/70">
        มีบัญชีอยู่แล้ว?{" "}
        <Link href="/login" className="underline">
          เข้าสู่ระบบ
        </Link>
      </p>
    </main>
  );
}
