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
  PlusCircle,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Truck,
  WalletCards,
} from "lucide-react";


function getToday() {
  return new Date().toISOString().split("T")[0];
}

function isSameDay(dateString: string, targetDateString: string) {
  if (!dateString) return false;

  const date = new Date(dateString);
  const target = new Date(targetDateString);

  return (
    date.getFullYear() === target.getFullYear() &&
    date.getMonth() === target.getMonth() &&
    date.getDate() === target.getDate()
  );
}

function isThisMonth(dateString: string) {
  if (!dateString) return false;

  const now = new Date();
  const date = new Date(dateString);

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

  const date = new Date(dateString);
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
  }, [value]);

  return displayValue;
}

function StatusBadge({
  label,
  tone = "cyan",
}: {
  label: string;
  tone?: string;
}) {
  const classes =
    tone === "red"
      ? "bg-red-500/15 text-red-200"
      : tone === "yellow"
        ? "bg-yellow-500/15 text-yellow-200"
        : tone === "emerald"
          ? "bg-emerald-500/15 text-emerald-200"
          : tone === "purple"
            ? "bg-purple-500/15 text-purple-200"
            : tone === "orange"
              ? "bg-orange-500/15 text-orange-200"
              : "bg-cyan-500/15 text-cyan-200";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${classes}`}>
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
  icon: any;
  tone: "cyan" | "emerald" | "yellow" | "purple" | "orange" | "red";
  subtitle: string;
  delay: number;
  currency?: boolean;
  href?: string;
}) {
  const animatedValue = useCountUp(value);

  const toneClasses = {
    cyan: {
      card: "border-cyan-300/20 bg-cyan-500/10",
      icon: "bg-cyan-400/15 text-cyan-100",
      value: "text-cyan-100",
      glow: "shadow-cyan-950/30",
    },
    emerald: {
      card: "border-emerald-300/20 bg-emerald-500/10",
      icon: "bg-emerald-400/15 text-emerald-100",
      value: "text-emerald-100",
      glow: "shadow-emerald-950/30",
    },
    yellow: {
      card: "border-yellow-300/20 bg-yellow-500/10",
      icon: "bg-yellow-400/15 text-yellow-100",
      value: "text-yellow-100",
      glow: "shadow-yellow-950/30",
    },
    purple: {
      card: "border-purple-300/20 bg-purple-500/10",
      icon: "bg-purple-400/15 text-purple-100",
      value: "text-purple-100",
      glow: "shadow-purple-950/30",
    },
    orange: {
      card: "border-orange-300/20 bg-orange-500/10",
      icon: "bg-orange-400/15 text-orange-100",
      value: "text-orange-100",
      glow: "shadow-orange-950/30",
    },
    red: {
      card: "border-red-300/20 bg-red-500/10",
      icon: "bg-red-400/15 text-red-100",
      value: "text-red-100",
      glow: "shadow-red-950/30",
    },
  }[tone];

  const content = (
    <div
      className={`kp-animate-card kp-card-hover kp-shine min-h-[138px] rounded-[26px] border p-5 shadow-xl ${toneClasses.card} ${toneClasses.glow}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="kp-live-dot h-2 w-2 rounded-full bg-current opacity-80" />
            <p className="text-sm font-black text-white/55">{title}</p>
          </div>

          <p className={`mt-3 text-3xl font-black ${toneClasses.value}`}>
            {currency ? formatTL(animatedValue) : animatedValue}
          </p>

          <p className="mt-2 text-xs font-semibold leading-5 text-white/42">
            {subtitle}
          </p>
        </div>

        <div
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${toneClasses.icon}`}
        >
          <Icon size={23} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [ads, setAds] = useState<AdRecord[]>([]);
  const [testers, setTesters] = useState<Tester[]>([]);
  const [loading, setLoading] = useState(true);

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

  const today = getToday();
  const { friday } = getWeekRange();

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

  const actionItems = [
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
        tone: "yellow",
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
        tone: "purple",
      })),

    ...delayed.slice(0, 2).map((order) => ({
      title: `${order.orderNo} gecikmiş sipariş`,
      description: `${order.customer} siparişinin teslim tarihi geçmiş görünüyor.`,
      badge: "Gecikmiş",
      href: "/orders",
      tone: "red",
    })),

    ...upcoming.slice(0, 2).map((order) => ({
      title: `${order.orderNo} teslim yaklaşıyor`,
      description: `${order.customer} siparişinin çıkış tarihi yaklaşıyor.`,
      badge: "Yaklaşan",
      href: "/orders",
      tone: "orange",
    })),

    ...activeOrders
      .filter((order) => order.status === "İşleme Alındı")
      .slice(0, 2)
      .map((order) => ({
        title: `${order.orderNo} kargo bekliyor`,
        description: `${order.customer} siparişi hâlâ işleme alındı durumunda.`,
        badge: "Kargo",
        href: "/cargo",
        tone: "cyan",
      })),

    ...testers
      .filter((tester) => tester.status === "Dönüş Bekleniyor")
      .slice(0, 2)
      .map((tester) => ({
        title: `${tester.customer} tester dönüşü`,
        description: `${tester.product || "Tester"} için müşteri dönüşü bekleniyor.`,
        badge: "Tester",
        href: "/tester",
        tone: "emerald",
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

  return (
    <main className="min-h-screen bg-[#070812] text-white">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(91,74,255,0.26),transparent_35%),radial-gradient(circle_at_top_right,rgba(0,183,255,0.18),transparent_30%),radial-gradient(circle_at_bottom,rgba(132,32,255,0.12),transparent_35%)]" />

      <div className="pointer-events-none fixed left-[12%] top-[18%] h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl kp-float-soft" />
      <div className="pointer-events-none fixed bottom-[12%] right-[10%] h-56 w-56 rounded-full bg-purple-500/10 blur-3xl kp-float-soft" />

      <div className="relative flex">
        <Sidebar />

        <section className="min-h-screen flex-1 px-4 py-4 pb-28 lg:ml-72 lg:px-8">
          <Topbar delayedCount={delayed.length} upcomingCount={upcoming.length} />

          {loading && (
            <div className="mt-6 rounded-[28px] border border-cyan-300/20 bg-cyan-500/10 p-5 text-sm font-black text-cyan-100">
              Supabase verileri yükleniyor...
            </div>
          )}

          <div className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="kp-animate-card kp-card-hover rounded-[30px] border border-cyan-300/20 bg-white/[0.045] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="kp-live-dot h-2.5 w-2.5 rounded-full bg-emerald-300" />
                      <p className="text-sm font-black text-emerald-100/70">
                        Supabase Aksiyon Merkezi
                      </p>
                    </div>

                    <h1 className="mt-3 text-3xl font-black md:text-5xl">
                      Bugün neye bakman gerekiyor?
                    </h1>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
                      Siparişler artık Supabase’den okunuyor. Haftalık cari,
                      yaklaşan sipariş, günlük brüt kâr ve bekleyen ödeme tek ekranda.
                    </p>
                  </div>

                  <Link
                    href="/finance"
                    className="rounded-[26px] border border-purple-300/20 bg-purple-500/10 p-5 transition hover:bg-purple-500/15 kp-pulse-glow"
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
                          Kâr - reklam gideri
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <Link
                    href="/cari"
                    className="group min-h-[160px] rounded-[24px] border border-purple-300/20 bg-purple-500/10 p-4 transition hover:-translate-y-1 hover:bg-purple-500/15"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-purple-400/15 text-purple-100">
                        <CalendarClock size={21} strokeWidth={2.5} />
                      </div>

                      <ArrowRight
                        size={17}
                        className="text-purple-100/60 transition group-hover:translate-x-1"
                      />
                    </div>

                    <p className="mt-4 text-2xl font-black text-purple-100">
                      {formatTL(fridayCari)}
                    </p>
                    <p className="mt-1 text-xs font-bold text-white/45">
                      Cuma verilecek cari · {formatDateTR(friday)}
                    </p>
                  </Link>

                  <Link
                    href="/orders"
                    className="group min-h-[160px] rounded-[24px] border border-orange-300/20 bg-orange-500/10 p-4 transition hover:-translate-y-1 hover:bg-orange-500/15"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-400/15 text-orange-100">
                        <Clock3 size={21} strokeWidth={2.5} />
                      </div>

                      <ArrowRight
                        size={17}
                        className="text-orange-100/60 transition group-hover:translate-x-1"
                      />
                    </div>

                    <p className="mt-4 text-2xl font-black text-orange-100">
                      {upcoming.length}
                    </p>
                    <p className="mt-1 text-xs font-bold text-white/45">
                      Yaklaşan sipariş
                    </p>
                  </Link>

                  <Link
                    href="/finance"
                    className="group min-h-[160px] rounded-[24px] border border-emerald-300/20 bg-emerald-500/10 p-4 transition hover:-translate-y-1 hover:bg-emerald-500/15"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-100">
                        <CircleDollarSign size={21} strokeWidth={2.5} />
                      </div>

                      <ArrowRight
                        size={17}
                        className="text-emerald-100/60 transition group-hover:translate-x-1"
                      />
                    </div>

                    <p className="mt-4 text-2xl font-black text-emerald-100">
                      {formatTL(todayProfit)}
                    </p>
                    <p className="mt-1 text-xs font-bold text-white/45">
                      Bugünkü brüt kâr
                    </p>
                  </Link>

                  <Link
                    href="/payments"
                    className="group min-h-[160px] rounded-[24px] border border-cyan-300/20 bg-cyan-500/10 p-4 transition hover:-translate-y-1 hover:bg-cyan-500/15"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-400/15 text-cyan-100">
                        <CreditCard size={21} strokeWidth={2.5} />
                      </div>

                      <ArrowRight
                        size={17}
                        className="text-cyan-100/60 transition group-hover:translate-x-1"
                      />
                    </div>

                    <p className="mt-4 text-2xl font-black text-cyan-100">
                      {formatTL(monthPendingPayment)}
                    </p>
                    <p className="mt-1 text-xs font-bold text-white/45">
                      Bu ay bekleyen ödeme
                    </p>
                  </Link>
                </div>
              </div>
            </div>

            <div className="kp-animate-card rounded-[30px] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
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
                      className={`group rounded-2xl bg-gradient-to-r ${action.tone} p-4 text-white shadow-lg shadow-black/20 transition hover:-translate-y-1 hover:shadow-2xl`}
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
              subtitle="Supabase orders tablosundan gelen bu ayki satış."
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
              title="Tahsil Edilen"
              value={monthPaid}
              icon={Banknote}
              tone="purple"
              subtitle="Bu ay alınan toplam ödeme."
              delay={160}
              href="/payments"
            />

            <AnimatedStatCard
              title="Bekleyen Ödeme"
              value={monthPendingPayment}
              icon={CreditCard}
              tone="yellow"
              subtitle="Müşteriden alınması gereken kalan tutar."
              delay={240}
              href="/payments"
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <AnimatedStatCard
              title="Cari Bekleyen"
              value={monthPendingCari}
              icon={WalletCards}
              tone="purple"
              subtitle="Henüz cari verildi yapılmayan maliyet."
              delay={320}
              href="/cari"
            />

            <AnimatedStatCard
              title="Reklam Gideri"
              value={monthAdTotal}
              icon={Megaphone}
              tone="orange"
              subtitle="Bu ay girilen reklam harcaması."
              delay={400}
              href="/ads"
            />

            <AnimatedStatCard
              title="Aktif Sipariş"
              value={activeOrders.length}
              icon={ShoppingBag}
              tone="cyan"
              subtitle="Henüz kargo/tamamlanma aşamasına geçmeyen sipariş."
              delay={480}
              currency={false}
              href="/orders"
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

          <div className="mt-6 grid gap-4 xl:grid-cols-3">
            <div className="kp-animate-card kp-card-hover rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm font-black text-cyan-200/70">
                    Hızlı Özet
                  </p>
                  <h2 className="mt-1 text-2xl font-black">Operasyon</h2>
                </div>

                <PackageCheck size={25} className="text-cyan-100" />
              </div>

              <div className="mt-4 space-y-3">
                <Link
                  href="/cari"
                  className="flex items-center justify-between rounded-2xl border border-purple-300/20 bg-purple-500/10 p-4 transition hover:bg-purple-500/15"
                >
                  <div className="flex items-center gap-3">
                    <CalendarClock size={20} className="text-purple-100" />
                    <p className="text-sm font-black text-purple-100">
                      Bu hafta cuma cari
                    </p>
                  </div>
                  <p className="text-xl font-black text-purple-100">
                    {formatTL(fridayCari)}
                  </p>
                </Link>

                <Link
                  href="/orders"
                  className="flex items-center justify-between rounded-2xl border border-orange-300/20 bg-orange-500/10 p-4 transition hover:bg-orange-500/15"
                >
                  <div className="flex items-center gap-3">
                    <Clock3 size={20} className="text-orange-100" />
                    <p className="text-sm font-black text-orange-100">
                      Yaklaşan sipariş
                    </p>
                  </div>
                  <p className="text-xl font-black text-orange-100">
                    {upcoming.length}
                  </p>
                </Link>

                <Link
                  href="/finance"
                  className="flex items-center justify-between rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-4 transition hover:bg-emerald-500/15"
                >
                  <div className="flex items-center gap-3">
                    <CircleDollarSign size={20} className="text-emerald-100" />
                    <p className="text-sm font-black text-emerald-100">
                      Bugünkü brüt kâr
                    </p>
                  </div>
                  <p className="text-xl font-black text-emerald-100">
                    {formatTL(todayProfit)}
                  </p>
                </Link>

                <Link
                  href="/tester"
                  className="flex items-center justify-between rounded-2xl border border-yellow-300/20 bg-yellow-500/10 p-4 transition hover:bg-yellow-500/15"
                >
                  <div className="flex items-center gap-3">
                    <FlaskConical size={20} className="text-yellow-100" />
                    <p className="text-sm font-black text-yellow-100">
                      Dönüş bekleyen tester
                    </p>
                  </div>
                  <p className="text-xl font-black text-yellow-100">
                    {activeTesters.length}
                  </p>
                </Link>

                <Link
                  href="/finance"
                  className="flex items-center justify-between rounded-2xl border border-purple-300/20 bg-purple-500/10 p-4 transition hover:bg-purple-500/15"
                >
                  <div className="flex items-center gap-3">
                    <ChartNoAxesCombined size={20} className="text-purple-100" />
                    <p className="text-sm font-black text-purple-100">
                      Satış bazlı net
                    </p>
                  </div>
                  <p className="text-xl font-black text-purple-100">
                    {formatTL(monthNet)}
                  </p>
                </Link>
              </div>
            </div>

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
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            <div className="kp-animate-card kp-card-hover rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm font-black text-orange-200/70">
                    Reklam
                  </p>
                  <h2 className="mt-1 text-2xl font-black">
                    Son Reklam Giderleri
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

            <div className="kp-animate-card kp-card-hover rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm font-black text-emerald-200/70">
                    Operasyon
                  </p>
                  <h2 className="mt-1 text-2xl font-black">
                    Aksiyon Gerekenler
                  </h2>
                </div>

                <PackageCheck size={24} className="text-emerald-100" />
              </div>

              <div className="mt-4 space-y-3">
                {actionItems.length === 0 && (
                  <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-5">
                    <p className="text-base font-black text-emerald-100">
                      Şu an acil aksiyon yok.
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-5 text-white/45">
                      Bekleyen ödeme, cari, kargo, yaklaşan teslim veya tester
                      dönüş uyarısı bulunmuyor.
                    </p>
                  </div>
                )}

                {actionItems.map((item, index) => {
                  const toneClasses =
                    item.tone === "red"
                      ? "border-red-300/20 bg-red-500/10 text-red-100 hover:border-red-300/30"
                      : item.tone === "yellow"
                        ? "border-yellow-300/20 bg-yellow-500/10 text-yellow-100 hover:border-yellow-300/30"
                        : item.tone === "purple"
                          ? "border-purple-300/20 bg-purple-500/10 text-purple-100 hover:border-purple-300/30"
                          : item.tone === "orange"
                            ? "border-orange-300/20 bg-orange-500/10 text-orange-100 hover:border-orange-300/30"
                            : item.tone === "emerald"
                              ? "border-emerald-300/20 bg-emerald-500/10 text-emerald-100 hover:border-emerald-300/30"
                              : "border-cyan-300/20 bg-cyan-500/10 text-cyan-100 hover:border-cyan-300/30";

                  return (
                    <Link
                      key={`${item.title}-${index}`}
                      href={item.href}
                      className={`block rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:bg-white/[0.055] ${toneClasses}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-black">{item.title}</p>
                          <p className="mt-1 text-xs font-semibold leading-5 text-white/45">
                            {item.description}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[11px] font-black text-white/70">
                          {item.badge}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>

      <MobileNav />
    </main>
  );
}