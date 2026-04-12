"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { API_ROUTES, requestJson } from "@/app/_lib/api-client";

type RegisterResponse = {
  message?: string;
  user_id?: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      const data = await requestJson<RegisterResponse>(API_ROUTES.auth.register, {
        method: "POST",
        body: { email, password },
        fallbackErrorMessage: "Đăng ký thất bại. Vui lòng thử lại.",
      });

      setSuccessMessage(data.message ?? "Đăng ký thành công. Hãy đăng nhập.");
      setTimeout(() => {
        router.push("/login");
      }, 800);
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
              how_to_reg
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
                Tạo tài khoản mới
              </h2>
              <p className="text-on-surface-variant text-sm">
                Đăng ký bằng email và mật khẩu để bắt đầu sử dụng hệ thống.
              </p>
            </div>

            <form className="space-y-6" method="POST" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label
                  className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider"
                  htmlFor="email"
                >
                  Email
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
                <label
                  className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider"
                  htmlFor="password"
                >
                  Mật khẩu
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl">
                    lock
                  </span>
                  <input
                    className="w-full pl-12 pr-12 py-3.5 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-surface-tint/20 focus:bg-surface-container-high transition-all outline-none text-on-surface placeholder:text-outline/60"
                    id="password"
                    name="password"
                    placeholder="Tối thiểu 8 ký tự"
                    minLength={8}
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
                {isSubmitting ? "Đang đăng ký..." : "Đăng ký"}
                <span className="material-symbols-outlined text-lg">
                  arrow_forward
                </span>
              </button>
              {errorMessage ? (
                <p className="text-sm text-error">{errorMessage}</p>
              ) : null}
              {successMessage ? (
                <p className="text-sm text-green-700 dark:text-green-300">
                  {successMessage}
                </p>
              ) : null}
            </form>
          </div>

          <div className="p-6 bg-surface-container-low text-center border-t border-outline-variant/15">
            <p className="text-sm text-on-surface-variant">
              Đã có tài khoản?
              <Link
                href="/login"
                className="font-bold text-primary hover:underline underline-offset-4 ml-1"
              >
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
