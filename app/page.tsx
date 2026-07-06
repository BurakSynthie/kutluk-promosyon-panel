"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";
import { formatTL, getOrderDueStatus } from "@/lib/helpers";
import { fetchOrders, type Order } from "@/lib/ordersApi";
import { fetchAds, type AdRecord } from "@/lib/adsApi";
import { fetchTesters, type Tester } from "@/lib/testersApi";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Banknote,
  CalendarClock,
  ChartNoAxesCombined,
  CircleDollarSign,
  Clock3,
  CreditCard,
  FlaskConical,
  Megaphone,
  PackageCheck,
  Percent,
  PlusCircle,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Truck,
  WalletCards,
  Zap,
  type LucideIcon,
} from "lucide-react";

type Tone = "cyan" | "emerald" | "yellow" | "purple" | "orange" | "red";

type ActionItem = {
  title: string;
  description: string;
  badge: string;
  href: string;
  tone: Tone;
  priority: "Yüksek" | "Orta" | "Bilgi";
};

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function isSameDay(dateString: string, targetDateString: string) {
  if (!dateString) return false;

  const date = new Date(`${dateString}T12:00:00`);
  const target = new Date(`${targetDateString}T12:00:00`);

  return (
    date.getFullYear() === target.getFullYear() &&
    date.getMonth() === target.getMonth() &&
    date.getDate() === target.getDate()
  );
}

function isThisMonth(dateString: string) {
  if (!dateString) return false;

  const now = new Date();
  const date = new Date(`${dateString}T12:00:00`);

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  friday.setHours(0, 0, 0, 0);

  return { monday, sunday, friday };
}

function isThisWeek(dateString: string) {
  if (!dateString) return false;

  const date = new Date(`${dateString}T12:00:00`);
  const { monday, sunday } = getWeekRange();

  return date >= monday && date <= sunday;
}

function formatDateTR(date: Date) {
  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
  });
}

function getOrderDate(order: Order) {
  return order.processDate || order.createdAt?.split("T")[0] || getToday();
}

function safeHref(href?: string) {
  if (!href) return "/";
  return href.startsWith("/") ? href : `/${href}`;
}

function safePercent(part: number, total: number) {
  if (!total || total <= 0) return 0;
  return Math.round((part / total) * 100);
}

function useCountUp(value: number, duration = 650) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const totalFrames = Math.max(Math.round(duration / 16), 1);
    const startValue = displayValue;
    const diff = value - startValue;

    const timer = window.setInterval(() => {
      frame += 1;
      const progress = Math.min(frame / totalFrames, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplayValue(Math.round(startValue + diff * eased));

      if (progress >= 1) {
        window.clearInterval(timer);
      }
    }, 16);

    return () => window.clearInterval(timer);
    // displayValue bilinçli olarak dependency dışında tutuldu; her veri değişiminde mevcut ekrandan yeni değere akar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return displayValue;
}

function toneClass(tone: Tone) {
  if (tone === "red") {
    return {
      card: "border-red-300/20 bg-red-500/10",
      icon: "bg-red-400/15 text-red-100",
      value: "text-red-100",
      glow: "shadow-red-950/30",
      badge: "bg-red-500/15 text-red-100",
      hover: "hover:border-red-300/30",
    };
  }

  if (tone === "yellow") {
    return {
      card: "border-yellow-300/20 bg-yellow-500/10",
      icon: "bg-yellow-400/15 text-yellow-100",
      value: "text-yellow-100",
      glow: "shadow-yellow-950/30",
      badge: "bg-yellow-500/15 text-yellow-100",
      hover: "hover:border-yellow-300/30",
    };
  }

  if (tone === "emerald") {
    return {
      card: "border-emerald-300/20 bg-emerald-500/10",
      icon: "bg-emerald-400/15 text-emerald-100",
      value: "text-emerald-100",
      glow: "shadow-emerald-950/30",
      badge: "bg-emerald-500/15 text-emerald-100",
      hover: "hover:border-emerald-300/30",
    };
  }

  if (tone === "purple") {
    return {
      card: "border-purple-300/20 bg-purple-500/10",
      icon: "bg-purple-400/15 text-purple-100",
      value: "text-purple-100",
      glow: "shadow-purple-950/30",
      badge: "bg-purple-500/15 text-purple-100",
      hover: "hover:border-purple-300/30",
    };
  }

  if (tone === "orange") {
    return {
      card: "border-orange-300/20 bg-orange-500/10",
      icon: "bg-orange-400/15 text-orange-100",
      value: "text-orange-100",
      glow: "shadow-orange-950/30",
      badge: "bg-orange-500/15 text-orange-100",
      hover: "hover:border-orange-300/30",
    };
  }

  return {
    card: "border-cyan-300/20 bg-cyan-500/10",
    icon: "bg-cyan-400/15 text-cyan-100",
    value: "text-cyan-100",
    glow: "shadow-cyan-950/30",
    badge: "bg-cyan-500/15 text-cyan-100",
    hover: "hover:border-cyan-300/30",
  };
}

function StatusBadge({
  label,
  tone = "cyan",
}: {
  label: string;
  tone?: Tone;
}) {
  const classes = toneClass(tone);

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${classes.badge}`}>
      {label}
    </span>
  );
}

function AnimatedStatCard({
  title,
  value,
  icon: Icon,
  tone,
  subtitle,
  delay,
  currency = true,
  href,
}: {
  title: string;
  value: number;
  icon: LucideIcon;
  tone: Tone;
  subtitle: string;
  delay: number;
  currency?: boolean;
  href?: string;
}) {
  const animatedValue = useCountUp(value);
  const classes = toneClass(tone);

  const content = (
    <div
      className={`kp-animate-card kp-card-hover kp-shine flex min-h-[150px] flex-col justify-between rounded-[26px] border p-5 shadow-xl ${classes.card} ${classes.glow}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="kp-live-dot h-2 w-2 rounded-full bg-current opacity-80" />
            <p className="text-sm font-black text-white/55">{title}</p>
          </div>

          <p className={`mt-3 break-words text-3xl font-black ${classes.value}`}>
            {currency ? formatTL(animatedValue) : animatedValue}
          </p>
        </div>

        <div
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${classes.icon}`}
        >
          <Icon size={23} strokeWidth={2.5} />
        </div>
      </div>

      <p className="mt-3 text-xs font-semibold leading-5 text-white/42">
        {subtitle}
      </p>
    </div>
  );

  if (href) {
    return <Link href={safeHref(href)}>{content}</Link>;
  }

  return content;
}

function MiniMetric({
  label,
  value,
  icon: Icon,
  tone,
  href,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: Tone;
  href?: string;
}) {
  const classes = toneClass(tone);
  const targetHref = safeHref(href);

  return (
    <Link
      href={targetHref}
      className={`group block rounded-2xl border p-4 transition hover:-translate-y-1 hover:bg-white/[0.06] ${classes.card} ${classes.hover}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black text-white/45">{label}</p>
        <div
          className={`grid h-9 w-9 place-items-center rounded-xl transition group-hover:scale-105 ${classes.icon}`}
        >
          <Icon size={17} strokeWidth={2.6} />
        </div>
      </div>

      <div className="mt-2 flex items-end justify-between gap-3">
        <p className={`text-2xl font-black ${classes.value}`}>{value}</p>
        <ArrowRight
          size={16}
          className="mb-1 text-white/30 transition group-hover:translate-x-1 group-hover:text-white/70"
        />
      </div>
    </Link>
  );
}

function ActionCard({ item }: { item: ActionItem }) {
  const classes = toneClass(item.tone);
  const targetHref = safeHref(item.href);

  return (
    <Link
      href={targetHref}
      className={`group block rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:bg-white/[0.055] ${classes.card} ${classes.hover}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-[11px] font-black ${classes.badge}`}>
              {item.badge}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-black text-white/55">
              {item.priority}
            </span>
          </div>

          <p className="mt-3 text-sm font-black text-white">{item.title}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-white/45">
            {item.description}
          </p>
        </div>

        <ArrowRight
          size={17}
          className="mt-1 shrink-0 text-white/35 transition group-hover:translate-x-1 group-hover:text-white"
        />
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [ads, setAds] = useState<AdRecord[]>([]);
  const [testers, setTesters] = useState<Tester[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveNow, setLiveNow] = useState<Date | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);

      try {
        const [supabaseOrders, supabaseAds, supabaseTesters] = await Promise.all([
          fetchOrders(),
          fetchAds(),
          fetchTesters(),
        ]);

        setOrders(supabaseOrders);
        setAds(supabaseAds);
        setTesters(supabaseTesters);
      } catch (error: any) {
        alert(error?.message || "Dashboard verileri yüklenemedi.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  useEffect(() => {
    function tick() {
      setLiveNow(new Date());
    }

    tick();
    const timer = window.setInterval(tick, 30_000);

    return () => window.clearInterval(timer);
  }, []);

  const today = getToday();
  const { friday } = getWeekRange();

  const liveDateText = liveNow
    ? liveNow.toLocaleDateString("tr-TR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Bugün";

  const liveTimeText = liveNow
    ? liveNow.toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--:--";

  const validOrders = orders.filter((order) => order.status !== "İptal");

  const monthOrders = validOrders.filter((order) =>
    isThisMonth(getOrderDate(order))
  );

  const monthAds = ads.filter((ad) => isThisMonth(ad.date));

  const weekOrders = validOrders.filter((order) =>
    isThisWeek(getOrderDate(order))
  );

  const todayOrders = validOrders.filter((order) =>
    isSameDay(getOrderDate(order), today)
  );

  const monthSales = monthOrders.reduce(
    (sum, order) => sum + Number(order.totalPrice || 0),
    0
  );

  const monthPaid = monthOrders.reduce(
    (sum, order) => sum + Number(order.paidAmount || 0),
    0
  );

  const monthPendingPayment = monthOrders.reduce((sum, order) => {
    const total = Number(order.totalPrice || 0);
    const paid = Number(order.paidAmount || 0);
    return sum + Math.max(total - paid, 0);
  }, 0);

  const monthPendingCari = monthOrders
    .filter((order) => !order.cariPaid)
    .reduce((sum, order) => sum + Number(order.cariAmount || 0), 0);

  const fridayCari = weekOrders
    .filter((order) => !order.cariPaid)
    .reduce((sum, order) => sum + Number(order.cariAmount || 0), 0);

  const todayProfit = todayOrders.reduce(
    (sum, order) => sum + Number(order.profit || 0),
    0
  );

  const monthProfit = monthOrders.reduce(
    (sum, order) => sum + Number(order.profit || 0),
    0
  );

  const monthAdTotal = monthAds.reduce(
    (sum, ad) => sum + Number(ad.amount || 0),
    0
  );

  const monthNet = monthProfit - monthAdTotal;
  const adRatio = safePercent(monthAdTotal, monthSales);
  const netMargin = safePercent(monthNet, monthSales);
  const collectionRate = safePercent(monthPaid, monthSales);

  const activeOrders = validOrders.filter(
    (order) => order.status !== "Kargo Çıktı" && order.status !== "Tamamlandı"
  );

  const delayed = validOrders.filter(
    (order) =>
      order.status !== "Tamamlandı" &&
      getOrderDueStatus(order.processDate, order.workDays).type === "late"
  );

  const upcoming = validOrders.filter(
    (order) =>
      order.status !== "Tamamlandı" &&
      getOrderDueStatus(order.processDate, order.workDays).type === "soon"
  );

  const activeTesters = testers.filter(
    (tester) => tester.status !== "Siparişe Döndü" && tester.status !== "Kapandı"
  );

  const recentOrders = useMemo(() => {
    return [...validOrders]
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      )
      .slice(0, 5);
  }, [validOrders]);

  const recentAds = useMemo(() => {
    return [...ads]
      .sort(
        (a, b) =>
          new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
      )
      .slice(0, 4);
  }, [ads]);

  const actionItems: ActionItem[] = [
    ...monthOrders
      .filter((order) => Number(order.remainingAmount || 0) > 0)
      .slice(0, 2)
      .map((order) => ({
        title: `${order.orderNo} ödeme bekliyor`,
        description: `${order.customer} müşterisinden ${formatTL(
          Number(order.remainingAmount || 0)
        )} tahsil edilecek.`,
        badge: "Ödeme",
        href: "/payments",
        tone: "yellow" as Tone,
        priority: "Yüksek" as const,
      })),

    ...monthOrders
      .filter((order) => Number(order.cariAmount || 0) > 0 && !order.cariPaid)
      .slice(0, 2)
      .map((order) => ({
        title: `${order.orderNo} cari bekliyor`,
        description: `${order.customer} için ${formatTL(
          Number(order.cariAmount || 0)
        )} cari verilmemiş.`,
        badge: "Cari",
        href: "/cari",
        tone: "purple" as Tone,
        priority: "Orta" as const,
      })),

    ...delayed.slice(0, 2).map((order) => ({
      title: `${order.orderNo} gecikmiş sipariş`,
      description: `${order.customer} siparişinin teslim tarihi geçmiş görünüyor.`,
      badge: "Gecikmiş",
      href: "/orders",
      tone: "red" as Tone,
      priority: "Yüksek" as const,
    })),

    ...upcoming.slice(0, 2).map((order) => ({
      title: `${order.orderNo} teslim yaklaşıyor`,
      description: `${order.customer} siparişinin çıkış tarihi yaklaşıyor.`,
      badge: "Yaklaşan",
      href: "/orders",
      tone: "orange" as Tone,
      priority: "Orta" as const,
    })),

    ...activeOrders
      .filter((order) => order.status === "İşleme Alındı")
      .slice(0, 2)
      .map((order) => ({
        title: `${order.orderNo} kargo bekliyor`,
        description: `${order.customer} siparişi hâlâ işleme alındı durumunda.`,
        badge: "Kargo",
        href: "/cargo",
        tone: "cyan" as Tone,
        priority: "Bilgi" as const,
      })),

    ...testers
      .filter((tester) => tester.status === "Dönüş Bekleniyor")
      .slice(0, 2)
      .map((tester) => ({
        title: `${tester.customer} tester dönüşü`,
        description: `${tester.product || "Tester"} için müşteri dönüşü bekleniyor.`,
        badge: "Tester",
        href: "/tester",
        tone: "emerald" as Tone,
        priority: "Bilgi" as const,
      })),
  ].slice(0, 8);

  const quickActions = [
    {
      label: "Sipariş Ekle",
      href: "/orders/new",
      icon: PlusCircle,
      tone: "from-cyan-400 to-blue-600",
    },
    {
      label: "Siparişler",
      href: "/orders",
      icon: ShoppingBag,
      tone: "from-purple-500 to-cyan-500",
    },
    {
      label: "Kargo",
      href: "/cargo",
      icon: Truck,
      tone: "from-blue-500 to-cyan-500",
    },
    {
      label: "Ödemeler",
      href: "/payments",
      icon: CreditCard,
      tone: "from-emerald-500 to-cyan-500",
    },
    {
      label: "Cari",
      href: "/cari",
      icon: WalletCards,
      tone: "from-purple-500 to-pink-500",
    },
    {
      label: "Finans",
      href: "/finance",
      icon: ChartNoAxesCombined,
      tone: "from-orange-500 to-purple-500",
    },
  ];

  const summaryText =
    monthSales <= 0
      ? "Bu ay için henüz satış girişi görünmüyor. İlk siparişi ekleyince net, cari, reklam ve tahsilat oranları burada canlanacak."
      : `Bu ay ${formatTL(monthSales)} satış, ${formatTL(
          monthPendingCari
        )} cari bekleyen ve ${formatTL(monthAdTotal)} reklam gideri görünüyor. Net kârın şu an ${formatTL(
          monthNet
        )}.`;

  const pulseLabel =
    monthSales <= 0
      ? "Veri bekleniyor"
      : monthNet < 0
        ? "Dikkat"
        : adRatio > 25
          ? "Reklam yüksek"
          : monthPendingPayment > 0
            ? "Tahsilat takip"
            : "Kârlılık iyi";

  const pulseDescription =
    monthSales <= 0
      ? "Sipariş eklenince finans nabzı hesaplanacak."
      : monthNet < 0
        ? "Reklam veya cari giderler bu ayki kârı aşmış görünüyor."
        : adRatio > 25
          ? "Reklam gideri satışa göre yüksek. Kampanya performansını kontrol et."
          : monthPendingPayment > 0
            ? "Net durum iyi, ancak bekleyen ödeme var."
            : "Net kâr pozitif ve tahsilat dengeli görünüyor.";

  return (
    <main className="min-h-screen bg-[#070812] text-white">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(91,74,255,0.26),transparent_35%),radial-gradient(circle_at_top_right,rgba(0,183,255,0.18),transparent_30%),radial-gradient(circle_at_bottom,rgba(132,32,255,0.12),transparent_35%)]" />

      <div className="pointer-events-none fixed left-[12%] top-[18%] h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl kp-float-soft" />
      <div className="pointer-events-none fixed bottom-[12%] right-[10%] h-56 w-56 rounded-full bg-purple-500/10 blur-3xl kp-float-soft" />

      <div className="relative flex">
        <Sidebar />

        <section className="min-h-screen flex-1 px-4 py-4 pb-44 lg:ml-72 lg:px-8 lg:pb-8">
          <Topbar delayedCount={delayed.length} upcomingCount={upcoming.length} />

          {loading && (
            <div className="mt-6 rounded-[28px] border border-cyan-300/20 bg-cyan-500/10 p-5 text-sm font-black text-cyan-100">
              Supabase verileri yükleniyor...
            </div>
          )}

          <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="kp-animate-card kp-card-hover overflow-hidden rounded-[34px] border border-cyan-300/20 bg-white/[0.045] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_35%)]" />

              <div className="relative">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="kp-live-dot h-2.5 w-2.5 rounded-full bg-emerald-300" />
                      <p className="text-sm font-black text-emerald-100/70">
                        Canlı Operasyon Merkezi
                      </p>

                      <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black text-white/55">
                        Supabase bağlantılı
                      </span>
                    </div>

                    <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
                      Bugün neye bakman gerekiyor?
                    </h1>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-black text-white/70">
                        <CalendarClock size={16} />
                        <span>{liveDateText}</span>
                      </div>

                      <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-500/10 px-4 py-2 text-sm font-black text-cyan-100">
                        <Activity size={16} />
                        <span>{liveTimeText} · Canlı takip</span>
                      </div>
                    </div>

                    <p className="mt-4 max-w-2xl text-sm leading-6 text-white/48">
                      {summaryText}
                    </p>
                  </div>

                  <Link
                    href="/finance"
                    className="shrink-0 rounded-[28px] border border-purple-300/20 bg-purple-500/10 p-5 transition hover:-translate-y-0.5 hover:bg-purple-500/15 kp-pulse-glow"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-400/15 text-purple-100">
                        <Sparkles size={23} strokeWidth={2.5} />
                      </div>

                      <div>
                        <p className="text-xs font-black text-purple-100/60">
                          Bu Ay Net
                        </p>
                        <p className="mt-1 text-3xl font-black text-purple-100">
                          {formatTL(monthNet)}
                        </p>
                        <p className="mt-1 text-xs text-white/40">
                          Brüt kâr - reklam gideri
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <MiniMetric
                    label="Aksiyon"
                    value={String(actionItems.length)}
                    icon={Zap}
                    tone={actionItems.length > 0 ? "yellow" : "emerald"}
                    href="/orders"
                  />

                  <MiniMetric
                    label="Bugünkü Brüt"
                    value={formatTL(todayProfit)}
                    icon={CircleDollarSign}
                    tone="emerald"
                    href="/finance"
                  />

                  <MiniMetric
                    label="Cuma Cari"
                    value={formatTL(fridayCari)}
                    icon={CalendarClock}
                    tone="purple"
                    href="/cari"
                  />

                  <MiniMetric
                    label="Aktif Sipariş"
                    value={String(activeOrders.length)}
                    icon={ShoppingBag}
                    tone="cyan"
                    href="/orders"
                  />
                </div>
              </div>
            </div>

            <div className="kp-animate-card rounded-[34px] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-cyan-200/70">
                    Hızlı İşlemler
                  </p>
                  <h2 className="mt-1 text-2xl font-black">Kısayollar</h2>
                </div>

                <PackageCheck size={25} className="text-cyan-100" />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;

                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      className={`group min-h-[96px] rounded-2xl bg-gradient-to-r ${action.tone} p-4 text-white shadow-lg shadow-black/20 transition hover:-translate-y-1 hover:shadow-2xl`}
                      style={{ animationDelay: `${index * 70}ms` }}
                    >
                      <Icon
                        size={22}
                        strokeWidth={2.6}
                        className="transition group-hover:scale-110 group-hover:rotate-6"
                      />

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <p className="text-sm font-black">{action.label}</p>
                        <ArrowRight
                          size={16}
                          strokeWidth={2.6}
                          className="transition group-hover:translate-x-1"
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <AnimatedStatCard
              title="Bu Ay Satış"
              value={monthSales}
              icon={TrendingUp}
              tone="cyan"
              subtitle="Bu ay iptal olmayan siparişlerin toplam satışı."
              delay={0}
              href="/finance"
            />

            <AnimatedStatCard
              title="Brüt Kâr"
              value={monthProfit}
              icon={CircleDollarSign}
              tone="emerald"
              subtitle="Cari düşüldükten sonra, reklam hariç sipariş kârı."
              delay={80}
              href="/finance"
            />

            <AnimatedStatCard
              title="Reklam"
              value={monthAdTotal}
              icon={Megaphone}
              tone="orange"
              subtitle="Bu ay girilen toplam reklam harcaması."
              delay={160}
              href="/ads"
            />

            <AnimatedStatCard
              title="Net Kâr"
              value={monthNet}
              icon={Sparkles}
              tone={monthNet < 0 ? "red" : "purple"}
              subtitle="Brüt kârdan reklam gideri düşülmüş net kalan."
              delay={240}
              href="/finance"
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <AnimatedStatCard
              title="Tahsil Edilen"
              value={monthPaid}
              icon={Banknote}
              tone="emerald"
              subtitle="Bu ay alınan toplam ödeme."
              delay={320}
              href="/payments"
            />

            <AnimatedStatCard
              title="Bekleyen Ödeme"
              value={monthPendingPayment}
              icon={CreditCard}
              tone="yellow"
              subtitle="Müşteriden alınması gereken kalan tutar."
              delay={400}
              href="/payments"
            />

            <AnimatedStatCard
              title="Cari Bekleyen"
              value={monthPendingCari}
              icon={WalletCards}
              tone="purple"
              subtitle="Henüz cari verildi yapılmayan maliyet."
              delay={480}
              href="/cari"
            />

            <AnimatedStatCard
              title="Yaklaşan Sipariş"
              value={upcoming.length}
              icon={Clock3}
              tone="orange"
              subtitle="Çıkış tarihi yaklaşan aktif siparişler."
              delay={560}
              currency={false}
              href="/orders"
            />
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="kp-animate-card kp-card-hover rounded-[30px] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm font-black text-emerald-200/70">
                    Finans Nabzı
                  </p>
                  <h2 className="mt-1 text-2xl font-black">{pulseLabel}</h2>
                </div>

                {monthNet < 0 || adRatio > 25 ? (
                  <AlertTriangle size={25} className="text-orange-100" />
                ) : (
                  <ShieldCheck size={25} className="text-emerald-100" />
                )}
              </div>

              <p className="mt-4 text-sm font-semibold leading-6 text-white/48">
                {pulseDescription}
              </p>

              <div className="mt-5 grid gap-3">
                <MiniMetric
                  label="Reklam / Satış"
                  value={`%${adRatio}`}
                  icon={Percent}
                  tone={adRatio > 25 ? "orange" : "cyan"}
                  href="/finance"
                />

                <MiniMetric
                  label="Net Kâr Marjı"
                  value={`%${netMargin}`}
                  icon={Activity}
                  tone={monthNet < 0 ? "red" : "emerald"}
                  href="/finance"
                />

                <MiniMetric
                  label="Tahsilat Oranı"
                  value={`%${collectionRate}`}
                  icon={Banknote}
                  tone={collectionRate < 70 ? "yellow" : "purple"}
                  href="/payments"
                />
              </div>
            </div>

            <div className="kp-animate-card kp-card-hover rounded-[30px] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm font-black text-orange-200/70">
                    Operasyon
                  </p>
                  <h2 className="mt-1 text-2xl font-black">
                    Aksiyon Gerekenler
                  </h2>
                </div>

                <Link
                  href="/orders"
                  className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-xs font-black text-white/65 transition hover:bg-white/15"
                >
                  Siparişlere Git
                  <ArrowRight size={15} />
                </Link>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {actionItems.length === 0 && (
                  <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-5 md:col-span-2">
                    <p className="text-base font-black text-emerald-100">
                      Şu an acil aksiyon yok.
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-5 text-white/45">
                      Bekleyen ödeme, cari, kargo, yaklaşan teslim veya tester
                      dönüş uyarısı bulunmuyor.
                    </p>
                  </div>
                )}

                {actionItems.map((item, index) => (
                  <ActionCard key={`${item.title}-${index}`} item={item} />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-3">
            <div className="kp-animate-card kp-card-hover rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl xl:col-span-2">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm font-black text-cyan-200/70">
                    Son Hareketler
                  </p>
                  <h2 className="mt-1 text-2xl font-black">Son Siparişler</h2>
                </div>

                <Link
                  href="/orders"
                  className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-xs font-black text-white/65 transition hover:bg-white/15"
                >
                  Tümünü Gör
                  <ArrowRight size={15} />
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {recentOrders.length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/45">
                    Henüz sipariş yok.
                  </div>
                )}

                {recentOrders.map((order) => {
                  const remaining = Math.max(
                    Number(order.totalPrice || 0) - Number(order.paidAmount || 0),
                    0
                  );

                  return (
                    <Link
                      key={order.id}
                      href="/orders"
                      className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-cyan-300/25 hover:bg-white/[0.055] md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge label={`#${order.orderNo}`} />
                          <StatusBadge
                            label={order.status}
                            tone={
                              order.status === "Tamamlandı"
                                ? "emerald"
                                : order.status === "Kargo Çıktı"
                                  ? "purple"
                                  : "cyan"
                            }
                          />
                        </div>

                        <p className="mt-2 text-lg font-black">
                          {order.customer}
                        </p>
                        <p className="mt-1 text-xs text-white/42">
                          {order.channel} · {order.contact || "İletişim yok"}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 md:min-w-[280px]">
                        <div className="rounded-2xl bg-cyan-500/10 p-3">
                          <p className="text-xs text-cyan-100/50">Satış</p>
                          <p className="font-black text-cyan-100">
                            {formatTL(order.totalPrice)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-yellow-500/10 p-3">
                          <p className="text-xs text-yellow-100/50">Kalan</p>
                          <p className="font-black text-yellow-100">
                            {formatTL(remaining)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="kp-animate-card kp-card-hover rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm font-black text-orange-200/70">
                    Reklam
                  </p>
                  <h2 className="mt-1 text-2xl font-black">
                    Son Reklamlar
                  </h2>
                </div>

                <Megaphone size={24} className="text-orange-100" />
              </div>

              <div className="mt-4 space-y-3">
                {recentAds.length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/45">
                    Henüz reklam gideri yok.
                  </div>
                )}

                {recentAds.map((ad) => (
                  <Link
                    key={ad.id}
                    href="/ads"
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-orange-300/25 hover:bg-white/[0.055]"
                  >
                    <div>
                      <StatusBadge label={ad.platform} tone="orange" />
                      <p className="mt-2 font-black">
                        {ad.campaignName || "Kampanya adı yok"}
                      </p>
                      <p className="mt-1 text-xs text-white/42">{ad.date}</p>
                    </div>

                    <p className="text-lg font-black text-orange-100">
                      {formatTL(ad.amount)}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      <MobileNav />
    </main>
  );
}
