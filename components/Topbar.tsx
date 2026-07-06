"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Search,
  BellRing,
  Clock3,
  PlusCircle,
  ShoppingBag,
  FlaskConical,
  Megaphone,
  X,
  Sparkles,
  LogOut,
} from "lucide-react";

type TopbarProps = {
  delayedCount?: number;
  upcomingCount?: number;
};

type SearchResult = {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  href: string;
  badge: string;
  icon: any;
};

type Order = {
  id: number;
  orderNo: string;
  customer: string;
  channel: string;
  contact: string;
  status: string;
  totalPrice: number;
};

type Tester = {
  id: number;
  customer: string;
  channel: string;
  contact: string;
  product: string;
  essence: string;
  cargoTrackingNo: string;
  status: string;
};

type AdRecord = {
  id: number;
  date: string;
  platform: string;
  amount: number;
  campaignName: string;
  note: string;
};

function formatTL(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export default function Topbar({
  delayedCount = 0,
  upcomingCount = 0,
}: TopbarProps) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [testers, setTesters] = useState<Tester[]>([]);
  const [ads, setAds] = useState<AdRecord[]>([]);
  const [focused, setFocused] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    function loadData() {
      const savedOrders = localStorage.getItem("kp_orders");
      const savedTesters = localStorage.getItem("kp_testers");
      const savedAds = localStorage.getItem("kp_ads");

      try {
        setOrders(savedOrders ? JSON.parse(savedOrders) : []);
      } catch {
        setOrders([]);
      }

      try {
        setTesters(savedTesters ? JSON.parse(savedTesters) : []);
      } catch {
        setTesters([]);
      }

      try {
        setAds(savedAds ? JSON.parse(savedAds) : []);
      } catch {
        setAds([]);
      }
    }

    loadData();

    window.addEventListener("storage", loadData);

    return () => {
      window.removeEventListener("storage", loadData);
    };
  }, []);

  async function handleLogout() {
    setLogoutLoading(true);

    await supabase.auth.signOut();

    setLogoutLoading(false);

    router.push("/login");
    router.refresh();
  }

  const results = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) return [];

    const orderResults: SearchResult[] = orders
      .filter((order) => {
        return (
          order.orderNo?.toLowerCase().includes(value) ||
          order.customer?.toLowerCase().includes(value) ||
          order.channel?.toLowerCase().includes(value) ||
          order.contact?.toLowerCase().includes(value) ||
          order.status?.toLowerCase().includes(value)
        );
      })
      .slice(0, 6)
      .map((order) => ({
        id: `order-${order.id}`,
        type: "Sipariş",
        title: `#${order.orderNo} · ${order.customer}`,
        subtitle: `${order.channel} · ${order.contact || "İletişim yok"} · ${formatTL(
          order.totalPrice
        )}`,
        href: "/orders",
        badge: order.status,
        icon: ShoppingBag,
      }));

    const testerResults: SearchResult[] = testers
      .filter((tester) => {
        return (
          tester.customer?.toLowerCase().includes(value) ||
          tester.channel?.toLowerCase().includes(value) ||
          tester.contact?.toLowerCase().includes(value) ||
          tester.product?.toLowerCase().includes(value) ||
          tester.essence?.toLowerCase().includes(value) ||
          tester.cargoTrackingNo?.toLowerCase().includes(value) ||
          tester.status?.toLowerCase().includes(value)
        );
      })
      .slice(0, 5)
      .map((tester) => ({
        id: `tester-${tester.id}`,
        type: "Tester",
        title: `${tester.customer} · ${tester.product}`,
        subtitle: `${tester.channel} · ${tester.contact || "İletişim yok"} · ${
          tester.essence
        }`,
        href: "/tester",
        badge: tester.status,
        icon: FlaskConical,
      }));

    const adResults: SearchResult[] = ads
      .filter((ad) => {
        return (
          ad.platform?.toLowerCase().includes(value) ||
          ad.campaignName?.toLowerCase().includes(value) ||
          ad.note?.toLowerCase().includes(value) ||
          ad.date?.toLowerCase().includes(value)
        );
      })
      .slice(0, 4)
      .map((ad) => ({
        id: `ad-${ad.id}`,
        type: "Reklam",
        title: ad.campaignName || "Kampanya adı yok",
        subtitle: `${ad.platform} · ${ad.date} · ${formatTL(ad.amount)}`,
        href: "/ads",
        badge: ad.platform,
        icon: Megaphone,
      }));

    return [...orderResults, ...testerResults, ...adResults].slice(0, 10);
  }, [search, orders, testers, ads]);

  const showDropdown = focused && search.trim().length > 0;

  return (
    <header className="sticky top-0 z-20 overflow-visible rounded-[28px] border border-white/10 bg-black/35 p-4 shadow-2xl shadow-black/20 backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_top_left,rgba(103,232,249,0.13),transparent_35%),radial-gradient(circle_at_top_right,rgba(147,51,234,0.12),transparent_32%)]" />

      <div className="relative flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="hidden h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-600 to-purple-600 shadow-lg shadow-cyan-950/40 md:grid">
            <Sparkles size={22} className="text-white" strokeWidth={2.5} />
          </div>

          <div>
            <p className="text-sm font-bold text-cyan-200/70">Kutluk Promosyon</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight md:text-4xl">
              Takip & Finans Paneli
            </h1>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative">
            <div
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                focused
                  ? "border-cyan-300/30 bg-cyan-400/10 shadow-lg shadow-cyan-950/20"
                  : "border-white/10 bg-white/[0.055]"
              }`}
            >
              <Search
                size={18}
                strokeWidth={2.4}
                className={focused ? "text-cyan-100" : "text-white/35"}
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setFocused(true)}
                className="w-full min-w-72 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/35"
                placeholder="Sipariş no, müşteri, Instagram veya telefon ara..."
              />

              {search && (
                <button
                  onClick={() => {
                    setSearch("");
                    setFocused(false);
                  }}
                  className="grid h-7 w-7 place-items-center rounded-xl bg-white/10 text-white/50 transition hover:bg-white/15 hover:text-white"
                >
                  <X size={15} strokeWidth={2.5} />
                </button>
              )}
            </div>

            {showDropdown && (
              <div className="absolute left-0 right-0 top-[58px] z-50 overflow-hidden rounded-[22px] border border-white/10 bg-[#090b16] shadow-2xl shadow-black/60">
                {results.length === 0 && (
                  <div className="p-4 text-sm font-semibold text-white/45">
                    Sonuç bulunamadı.
                  </div>
                )}

                {results.map((result) => {
                  const Icon = result.icon;

                  return (
                    <Link
                      key={result.id}
                      href={result.href}
                      onClick={() => {
                        setSearch("");
                        setFocused(false);
                      }}
                      className="group block border-b border-white/10 p-4 transition last:border-b-0 hover:bg-white/[0.06]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-100 transition group-hover:bg-cyan-400/20">
                            <Icon size={18} strokeWidth={2.4} />
                          </span>

                          <div className="min-w-0">
                            <p className="text-xs font-black text-cyan-200/70">
                              {result.type}
                            </p>

                            <p className="mt-1 truncate text-sm font-black text-white">
                              {result.title}
                            </p>

                            <p className="mt-1 truncate text-xs leading-5 text-white/45">
                              {result.subtitle}
                            </p>
                          </div>
                        </div>

                        <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black text-white/60">
                          {result.badge}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.055] p-2">
            <Link
              href="/orders"
              className="relative flex items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-black text-red-100 transition hover:bg-red-500/20"
            >
              <BellRing size={15} strokeWidth={2.5} />
              <span>Geciken</span>
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] text-white">
                {delayedCount}
              </span>
            </Link>

            <Link
              href="/orders"
              className="relative flex items-center justify-center gap-2 rounded-xl border border-orange-400/20 bg-orange-500/10 px-3 py-2 text-xs font-black text-orange-100 transition hover:bg-orange-500/20"
            >
              <Clock3 size={15} strokeWidth={2.5} />
              <span>Yaklaşan</span>
              <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] text-white">
                {upcomingCount}
              </span>
            </Link>
          </div>

          <Link
            href="/orders/new"
            className="group flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-3 text-center text-sm font-black text-white shadow-lg shadow-cyan-950/40 transition hover:scale-[1.02]"
          >
            <PlusCircle size={18} strokeWidth={2.6} className="transition group-hover:rotate-90" />
            Yeni Sipariş
          </Link>

          <button
            onClick={handleLogout}
            disabled={logoutLoading}
            className="group flex items-center justify-center gap-2 rounded-2xl border border-red-300/20 bg-red-500/10 px-5 py-3 text-sm font-black text-red-100 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut size={17} strokeWidth={2.5} />
            {logoutLoading ? "Çıkılıyor..." : "Çıkış"}
          </button>
        </div>
      </div>
    </header>
  );
}