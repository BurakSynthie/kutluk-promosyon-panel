"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Truck,
  WalletCards,
  Zap,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    const savedEmail = localStorage.getItem("kp_login_email");

    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }

    async function checkSession() {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        router.push("/");
        router.refresh();
      }
    }

    checkSession();
  }, [router]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorText("");

    if (!email.trim() || !password.trim()) {
      setErrorText("E-posta ve şifre girmen gerekiyor.");
      return;
    }

    setLoading(true);

    console.log("SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
  console.log("Supabase login error:", error.message);
  setErrorText(error.message || "Giriş başarısız. E-posta veya şifreyi kontrol et.");
  return;
}

    if (rememberMe) {
      localStorage.setItem("kp_login_email", email.trim());
    } else {
      localStorage.removeItem("kp_login_email");
    }

    setSuccess(true);

    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 1100);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050713] text-white">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(34,211,238,0.22),transparent_30%),radial-gradient(circle_at_78%_16%,rgba(147,51,234,0.22),transparent_28%),radial-gradient(circle_at_50%_85%,rgba(59,130,246,0.16),transparent_34%)]" />

      <div className="pointer-events-none fixed -left-24 top-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl kp-float-soft" />
      <div className="pointer-events-none fixed -right-24 bottom-20 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl kp-float-soft" />

      <div className="pointer-events-none fixed inset-0 opacity-[0.08]">
        <div className="h-full w-full bg-[linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] bg-[size:54px_54px]" />
      </div>

      <section className="relative grid min-h-screen place-items-center px-4 py-8">
        <div className="grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden lg:block">
            <div className="relative">
              <div className="absolute -inset-6 rounded-[44px] bg-gradient-to-r from-cyan-400/10 via-blue-500/5 to-purple-500/10 blur-2xl" />

              <div className="relative overflow-hidden rounded-[38px] border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-black/50 backdrop-blur-2xl">
                <div className="absolute right-6 top-6 rounded-full border border-emerald-300/20 bg-emerald-500/10 px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="kp-live-dot h-2 w-2 rounded-full bg-emerald-300" />
                    <span className="text-xs font-black text-emerald-100">
                      Sistem aktif
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-[28px] border border-white/10 bg-white p-2 shadow-2xl shadow-cyan-950/40">
                    <Image
                      src="/logo.png"
                      alt="Kutluk Promosyon Logo"
                      width={80}
                      height={80}
                      className="h-full w-full object-contain"
                      priority
                    />
                  </div>

                  <div>
                    <p className="text-sm font-black tracking-[0.28em] text-cyan-100/60">
                      KUTLUK PROMOSYON
                    </p>
                    <h1 className="mt-2 max-w-lg text-5xl font-black leading-tight">
                      İş akışını tek panelden yönet.
                    </h1>
                  </div>
                </div>

                <p className="mt-6 max-w-xl text-sm leading-7 text-white/48">
                  Sipariş, cari, ödeme, kargo, tester, reklam ve müşteri
                  hareketlerini tek ekrandan takip etmek için güvenli giriş yap.
                </p>

                <div className="mt-7 grid gap-4 md:grid-cols-3">
                  <div className="kp-card-hover rounded-[26px] border border-cyan-300/20 bg-cyan-500/10 p-5">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-400/15 text-cyan-100">
                      <PackageCheck size={22} strokeWidth={2.5} />
                    </div>

                    <p className="mt-4 text-2xl font-black text-cyan-100">0</p>
                    <p className="mt-1 text-xs font-bold text-white/42">
                      Aktif sipariş
                    </p>
                  </div>

                  <div className="kp-card-hover rounded-[26px] border border-purple-300/20 bg-purple-500/10 p-5">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-purple-400/15 text-purple-100">
                      <WalletCards size={22} strokeWidth={2.5} />
                    </div>

                    <p className="mt-4 text-2xl font-black text-purple-100">₺0</p>
                    <p className="mt-1 text-xs font-bold text-white/42">
                      Bekleyen cari
                    </p>
                  </div>

                  <div className="kp-card-hover rounded-[26px] border border-emerald-300/20 bg-emerald-500/10 p-5">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-100">
                      <BarChart3 size={22} strokeWidth={2.5} />
                    </div>

                    <p className="mt-4 text-2xl font-black text-emerald-100">₺0</p>
                    <p className="mt-1 text-xs font-bold text-white/42">
                      Bugünkü kâr
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-[30px] border border-white/10 bg-black/25 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-white">Panel önizleme</p>
                      <p className="mt-1 text-xs text-white/35">
                        Giriş sonrası kontrol merkezi
                      </p>
                    </div>

                    <Sparkles size={22} className="text-cyan-100" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400/15 text-cyan-100">
                          <Truck size={19} />
                        </div>

                        <div>
                          <p className="text-sm font-black">Kargo ve teslim takibi</p>
                          <p className="mt-1 text-xs text-white/35">
                            Geciken ve yaklaşan işler
                          </p>
                        </div>
                      </div>

                      <ArrowRight size={17} className="text-white/35" />
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-400/15 text-purple-100">
                          <ShieldCheck size={19} />
                        </div>

                        <div>
                          <p className="text-sm font-black">Güvenli erişim</p>
                          <p className="mt-1 text-xs text-white/35">
                            Yetkili kullanıcı girişi
                          </p>
                        </div>
                      </div>

                      <ArrowRight size={17} className="text-white/35" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md">
            <div className="mb-5 flex justify-center lg:hidden">
              <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-[26px] border border-white/10 bg-white p-2 shadow-2xl shadow-cyan-950/40">
                <Image
                  src="/logo.png"
                  alt="Kutluk Promosyon Logo"
                  width={80}
                  height={80}
                  className="h-full w-full object-contain"
                  priority
                />
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-[40px] bg-gradient-to-r from-cyan-400/12 via-blue-500/8 to-purple-500/12 blur-2xl" />

              <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/50 backdrop-blur-2xl md:p-6">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />

                <div className="rounded-[30px] border border-cyan-300/20 bg-cyan-500/10 p-5 text-center">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-cyan-400/15 text-cyan-100 shadow-lg shadow-cyan-950/30">
                    {success ? (
                      <CheckCircle2 size={26} strokeWidth={2.5} />
                    ) : (
                      <Lock size={24} strokeWidth={2.5} />
                    )}
                  </div>

                  <p className="mt-4 text-xs font-black tracking-[0.24em] text-cyan-100/55">
                    GÜVENLİ ERİŞİM
                  </p>

                  <h2 className="mt-2 text-3xl font-black">
                    {success ? "Giriş başarılı" : "Panele Giriş"}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-white/50">
                    {success
                      ? "Panel hazırlanıyor, seni içeri alıyoruz."
                      : "Kutluk Promosyon yönetim paneline devam et."}
                  </p>
                </div>

                {success ? (
                  <div className="mt-5 rounded-[28px] border border-emerald-300/20 bg-emerald-500/10 p-6 text-center">
                    <div className="relative mx-auto mb-5 grid h-16 w-16 place-items-center">
                      <div className="absolute inset-0 animate-spin rounded-full border-4 border-emerald-300/15 border-t-emerald-300" />
                      <CheckCircle2 size={26} className="text-emerald-100" />
                    </div>

                    <p className="text-xl font-black text-emerald-100">
                      Panel açılıyor
                    </p>

                    <p className="mt-2 text-sm leading-6 text-white/45">
                      Sipariş, cari, finans ve kargo ekranları hazırlanıyor.
                    </p>

                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full w-full animate-pulse rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" />
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleLogin} className="mt-5 space-y-3">
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4 transition focus-within:border-cyan-300/30 focus-within:bg-cyan-400/10">
                      <label className="flex items-center gap-2 text-xs font-black text-white/45">
                        <Mail size={15} />
                        E-posta adresi
                      </label>

                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        autoComplete="email"
                        className="mt-3 w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/25"
                        placeholder="mail@ornek.com"
                      />
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4 transition focus-within:border-cyan-300/30 focus-within:bg-cyan-400/10">
                      <label className="flex items-center gap-2 text-xs font-black text-white/45">
                        <Lock size={15} />
                        Şifre
                      </label>

                      <div className="mt-3 flex items-center gap-2">
                        <input
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/25"
                          placeholder="Şifren"
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-white/50 transition hover:bg-white/15 hover:text-white"
                        >
                          {showPassword ? (
                            <EyeOff size={17} strokeWidth={2.4} />
                          ) : (
                            <Eye size={17} strokeWidth={2.4} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                      <label className="flex cursor-pointer items-center gap-3 text-xs font-bold text-white/60">
                        <input
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          type="checkbox"
                          className="h-4 w-4 accent-cyan-400"
                        />
                        Beni hatırla
                      </label>

                      <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-[11px] font-black text-cyan-100/70">
                        E-posta kaydedilir
                      </span>
                    </div>

                    {errorText && (
                      <div className="rounded-2xl border border-red-300/20 bg-red-500/10 p-4 text-sm font-bold leading-6 text-red-100">
                        {errorText}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-600 to-purple-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-cyan-950/40 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition duration-700 group-hover:translate-x-[120%]" />

                      <span className="relative z-10 flex items-center gap-2">
                        {loading ? "Giriş kontrol ediliyor..." : "Giriş Yap"}

                        {!loading && (
                          <ArrowRight
                            size={17}
                            strokeWidth={2.6}
                            className="transition group-hover:translate-x-1"
                          />
                        )}
                      </span>
                    </button>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400/10 text-emerald-100">
                          <Zap size={18} strokeWidth={2.5} />
                        </div>

                        <div>
                          <p className="text-xs font-black text-white/70">
                            Oturum açık kalır
                          </p>
                          <p className="mt-1 text-[11px] leading-5 text-white/35">
                            Çıkış yapmadığın sürece panel tekrar şifre istemez.
                          </p>
                        </div>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>

            <p className="mt-5 text-center text-xs font-semibold text-white/35">
              Sadece yetkili kullanıcılar giriş yapabilir.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}