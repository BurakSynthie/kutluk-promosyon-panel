"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getSession();

      if (!data.session && !isLoginPage) {
        router.replace("/login");
        setLoading(false);
        return;
      }

      if (data.session && isLoginPage) {
        router.replace("/");
        setLoading(false);
        return;
      }

      setLoading(false);
    }

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !isLoginPage) {
        router.replace("/login");
      }

      if (session && isLoginPage) {
        router.replace("/");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, isLoginPage]);

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#070812] text-white">
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(91,74,255,0.28),transparent_35%),radial-gradient(circle_at_top_right,rgba(0,183,255,0.18),transparent_30%),radial-gradient(circle_at_bottom,rgba(132,32,255,0.13),transparent_35%)]" />

        <div className="relative text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center overflow-hidden rounded-[26px] border border-white/10 bg-white p-2 shadow-2xl shadow-cyan-950/40">
            <Image
              src="/logo.png"
              alt="Kutluk Promosyon Logo"
              width={80}
              height={80}
              className="h-full w-full object-contain"
              priority
            />
          </div>

          <div className="mx-auto mt-6 h-10 w-10 animate-spin rounded-full border-4 border-cyan-300/20 border-t-cyan-300" />

          <p className="mt-5 text-sm font-black text-cyan-100">
            Panel kontrol ediliyor
          </p>

          <p className="mt-2 text-xs font-semibold text-white/40">
            Oturum bilgisi doğrulanıyor.
          </p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}