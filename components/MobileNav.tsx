"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  PlusCircle,
  WalletCards,
  Menu,
  Truck,
  CreditCard,
  FlaskConical,
  Megaphone,
  ChartNoAxesCombined,
  Users,
  Settings,
  X,
} from "lucide-react";

const mainItems = [
  {
    label: "Panel",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Sipariş",
    href: "/orders",
    icon: ShoppingBag,
  },
  {
    label: "Ekle",
    href: "/orders/new",
    icon: PlusCircle,
    special: true,
  },
  {
    label: "Cari",
    href: "/cari",
    icon: WalletCards,
  },
];

const menuItems = [
  {
    label: "Kargo",
    href: "/cargo",
    icon: Truck,
    note: "Kargo çıkan ve bekleyen siparişler",
  },
  {
    label: "Ödemeler",
    href: "/payments",
    icon: CreditCard,
    note: "Tahsilat ve kalan ödemeler",
  },
  {
    label: "Tester",
    href: "/tester",
    icon: FlaskConical,
    note: "Gönderilen tester takipleri",
  },
  {
    label: "Reklam",
    href: "/ads",
    icon: Megaphone,
    note: "Reklam giderleri",
  },
  {
    label: "Finans",
    href: "/finance",
    icon: ChartNoAxesCombined,
    note: "Gelir gider özeti",
  },
  {
    label: "Müşteriler",
    href: "/customers",
    icon: Users,
    note: "Müşteri geçmişleri",
  },
  {
    label: "Ayarlar",
    href: "/settings",
    icon: Settings,
    note: "Yedekleme ve sistem",
  },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    if (href === "/orders") {
      return pathname === "/orders";
    }

    if (href === "/orders/new") {
      return pathname === "/orders/new";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm lg:hidden">
          <div className="absolute inset-0" onClick={() => setOpen(false)} />

          <div className="absolute bottom-0 left-0 right-0 max-h-[82vh] overflow-y-auto rounded-t-[30px] border border-white/10 bg-[#090b16] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl shadow-black/70">
            <div className="mb-4 flex items-center justify-between rounded-[24px] border border-cyan-300/20 bg-cyan-500/10 p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-white p-1.5 shadow-lg shadow-cyan-950/40">
                  <Image
                    src="/logo.png"
                    alt="Kutluk Promosyon Logo"
                    width={48}
                    height={48}
                    className="h-full w-full object-contain"
                    priority
                  />
                </div>

                <div>
                  <p className="text-base font-black text-white">KUTLUK Panel</p>
                  <p className="mt-1 text-xs font-bold text-cyan-100/55">
                    Hızlı menü
                  </p>
                </div>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/10 text-white/70"
              >
                <X size={19} strokeWidth={2.4} />
              </button>
            </div>

            <div className="grid gap-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`group flex items-center gap-3 rounded-[22px] border p-3 transition ${
                      active
                        ? "border-cyan-300/30 bg-cyan-400/15 text-cyan-100"
                        : "border-white/10 bg-white/[0.035] text-white/70 hover:bg-white/[0.07]"
                    }`}
                  >
                    <span
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl transition ${
                        active
                          ? "bg-cyan-400/20 text-cyan-100"
                          : "bg-white/[0.06] text-white/45 group-hover:text-cyan-100"
                      }`}
                    >
                      <Icon size={20} strokeWidth={2.4} />
                    </span>

                    <span className="min-w-0">
                      <span className="block text-sm font-black">{item.label}</span>
                      <span className="mt-1 block truncate text-xs text-white/40">
                        {item.note}
                      </span>
                    </span>

                    {active && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.9)]" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-3 left-3 right-3 z-50 rounded-[26px] border border-white/10 bg-black/60 p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-2xl shadow-black/50 backdrop-blur-2xl lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {mainItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex flex-col items-center justify-center gap-1 rounded-[20px] px-2 py-2.5 transition ${
                  item.special
                    ? active
                      ? "bg-gradient-to-br from-cyan-300 to-blue-600 text-white shadow-lg shadow-cyan-950/50 ring-1 ring-cyan-200/40"
                      : "bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-950/40"
                    : active
                      ? "bg-cyan-400/15 text-cyan-100"
                      : "text-white/45 hover:bg-white/10 hover:text-white"
                }`}
              >
                {active && !item.special && (
                  <span className="absolute top-1 h-1 w-5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />
                )}

                {active && item.special && (
                  <span className="absolute top-1 h-1 w-5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
                )}

                <Icon
                  size={item.special ? 23 : 20}
                  strokeWidth={item.special ? 2.7 : 2.4}
                  className={item.special ? "drop-shadow" : ""}
                />

                <span className="text-[10px] font-black leading-none">
                  {item.label}
                </span>
              </Link>
            );
          })}

          <button
            onClick={() => setOpen(true)}
            className={`flex flex-col items-center justify-center gap-1 rounded-[20px] px-2 py-2.5 transition ${
              open
                ? "bg-cyan-400/15 text-cyan-100"
                : "text-white/45 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Menu size={20} strokeWidth={2.4} />
            <span className="text-[10px] font-black leading-none">Menü</span>
          </button>
        </div>
      </nav>
    </>
  );
}