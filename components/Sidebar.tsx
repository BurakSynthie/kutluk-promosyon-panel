"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  PlusCircle,
  Truck,
  CreditCard,
  WalletCards,
  FlaskConical,
  Megaphone,
  ChartNoAxesCombined,
  Users,
  Settings,
} from "lucide-react";

const menuItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Siparişler",
    href: "/orders",
    icon: ShoppingBag,
  },
  {
    label: "Sipariş Ekle",
    href: "/orders/new",
    icon: PlusCircle,
  },
  {
    label: "Kargo",
    href: "/cargo",
    icon: Truck,
  },
  {
    label: "Ödemeler",
    href: "/payments",
    icon: CreditCard,
  },
  {
    label: "Cari",
    href: "/cari",
    icon: WalletCards,
  },
  {
    label: "Tester",
    href: "/tester",
    icon: FlaskConical,
  },
  {
    label: "Reklam",
    href: "/ads",
    icon: Megaphone,
  },
  {
    label: "Finans",
    href: "/finance",
    icon: ChartNoAxesCombined,
  },
  {
    label: "Müşteriler",
    href: "/customers",
    icon: Users,
  },
  {
    label: "Ayarlar",
    href: "/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-72 border-r border-white/10 bg-black/30 p-5 backdrop-blur-2xl lg:block">
      <div className="flex h-full flex-col">
        <Link
          href="/"
          className="group rounded-[28px] border border-white/10 bg-white/[0.045] p-5 transition hover:border-cyan-300/30 hover:bg-white/[0.07]"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-white p-1.5 shadow-lg shadow-cyan-950/40 transition group-hover:scale-105">
              <Image
                src="/logo.png"
                alt="Kutluk Promosyon Logo"
                width={56}
                height={56}
                className="h-full w-full object-contain"
                priority
              />
            </div>

            <div>
              <p className="text-lg font-black leading-none text-white">KUTLUK</p>
              <p className="mt-1 text-xs font-bold tracking-[0.24em] text-cyan-200/60">
                PROMOSYON
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-500/10 p-3">
            <p className="text-xs font-bold leading-5 text-cyan-100/70">
              Takip, finans, cari ve kargo kontrol paneli
            </p>
          </div>
        </Link>

        <nav className="mt-5 space-y-2 overflow-y-auto pr-1">
          {menuItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl border px-4 py-3.5 text-sm font-black transition-all duration-200 ${
                  isActive
                    ? "border-cyan-300/30 bg-cyan-400/15 text-cyan-100 shadow-lg shadow-cyan-950/20"
                    : "border-transparent bg-transparent text-white/50 hover:border-white/10 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {isActive && (
                  <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.9)]" />
                )}

                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl transition ${
                    isActive
                      ? "bg-cyan-400/20 text-cyan-100"
                      : "bg-white/[0.055] text-white/45 group-hover:bg-white/10 group-hover:text-cyan-100"
                  }`}
                >
                  <Icon size={18} strokeWidth={2.4} />
                </span>

                <span className="relative z-10">{item.label}</span>

                {isActive && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.9)]" />
                )}
              </Link>
            );
          })}
        </nav>

        
      </div>
    </aside>
  );
}