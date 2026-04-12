"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { API_ROUTES, requestJson } from "@/app/_lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      await requestJson<{ ok: boolean }>(API_ROUTES.auth.login, {
        method: "POST",
        body: { email, password },
        fallbackErrorMessage:
          "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.",
      });

      router.push("/");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Đã có lỗi xảy ra.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background font-body text-on-surface min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 legal-pattern pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-fixed/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-secondary-fixed/20 rounded-full blur-3xl" />

      <main className="relative z-10 w-full max-w-[440px]">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-container rounded-xl mb-4 diffusion-shadow">
            <span className="material-symbols-outlined text-on-primary text-3xl">
              gavel
            </span>
          </div>
          <h1 className="font-headline font-extrabold text-2xl tracking-tighter text-primary">
            The Sovereign Associate
          </h1>
          <p className="font-headline font-medium text-sm text-on-surface-variant tracking-wide mt-1 uppercase">
            Elite Legal Intelligence
          </p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl diffusion-shadow overflow-hidden border border-outline-variant/15">
          <div className="p-8 md:p-10">
            <div className="mb-8">
              <h2 className="font-headline font-bold text-xl text-on-surface mb-2">
                Chào mừng trở lại
              </h2>
              <p className="text-on-surface-variant text-sm">
                Vui lòng nhập thông tin để truy cập hồ sơ pháp lý của bạn.
              </p>
            </div>

            <form className="space-y-6" method="POST" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label
                  className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider"
                  htmlFor="email"
                >
                  Email công việc
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl">
                    mail
                  </span>
                  <input
                    className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-surface-tint/20 focus:bg-surface-container-high transition-all outline-none text-on-surface placeholder:text-outline/60"
                    id="email"
                    name="email"
                    placeholder="name@firm.com"
                    required
                    type="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label
                    className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider"
                    htmlFor="password"
                  >
                    Mật khẩu
                  </label>
                  <a
                    href="#"
                    className="text-xs font-medium text-primary hover:text-primary-container transition-colors"
                  >
                    Quên mật khẩu?
                  </a>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl">
                    lock
                  </span>
                  <input
                    className="w-full pl-12 pr-12 py-3.5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-surface-tint/20 focus:bg-surface-container-high transition-all outline-none text-on-surface placeholder:text-outline/60"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    required
                    type={showPassword ? "text" : "password"}
                  />
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <button
                className="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline font-bold rounded-full diffusion-shadow hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
                <span className="material-symbols-outlined text-lg">
                  arrow_forward
                </span>
              </button>
              {errorMessage ? (
                <p className="text-sm text-error">{errorMessage}</p>
              ) : null}
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant/30" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest">
                <span className="bg-surface-container-lowest px-4 text-outline font-medium">
                  Hoặc tiếp tục với
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-3 py-3 px-4 bg-surface-container-low hover:bg-surface-container-high rounded-xl transition-colors border border-outline-variant/10">
                <span className="text-sm font-semibold text-on-surface">
                  Google
                </span>
              </button>
              <button className="flex items-center justify-center gap-3 py-3 px-4 bg-surface-container-low hover:bg-surface-container-high rounded-xl transition-colors border border-outline-variant/10">
                <span className="material-symbols-outlined text-xl text-on-surface">
                  shield_person
                </span>
                <span className="text-sm font-semibold text-on-surface">SSO</span>
              </button>
            </div>
          </div>

          <div className="p-6 bg-surface-container-low text-center border-t border-outline-variant/15">
            <p className="text-sm text-on-surface-variant">
              Chưa có tài khoản?
              <Link
                href="/register"
                className="font-bold text-primary hover:underline underline-offset-4 ml-1"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
