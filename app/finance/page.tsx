"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";
import { fetchOrders, type Order } from "@/lib/ordersApi";
import { fetchAds, type AdRecord } from "@/lib/adsApi";
import { formatTL, getOrderDueStatus } from "@/lib/helpers";
import {
  Banknote,
  CalendarDays,
  ChartNoAxesCombined,
  CircleDollarSign,
  CreditCard,
  Megaphone,
  RefreshCw,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";

const tabs = [
  { key: "month", label: "Bu Ay" },
  { key: "week", label: "Bu Hafta" },
  { key: "today", label: "Bugün" },
  { key: "all", label: "Tümü" },
];

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

  return { monday, sunday };
}

function isThisWeek(dateString: string) {
  if (!dateString) return false;

  const date = new Date(dateString);
  const { monday, sunday } = getWeekRange();

  return date >= monday && date <= sunday;
}

function getOrderDate(order: Order) {
  return order.processDate || order.createdAt?.split("T")[0] || getToday();
}

function getFilteredOrders(orders: Order[], activeTab: string) {
  const validOrders = orders.filter((order) => order.status !== "İptal");

  if (activeTab === "today") {
    return validOrders.filter((order) =>
      isSameDay(getOrderDate(order), getToday())
    );
  }

  if (activeTab === "week") {
    return validOrders.filter((order) => isThisWeek(getOrderDate(order)));
  }

  if (activeTab === "month") {
    return validOrders.filter((order) => isThisMonth(getOrderDate(order)));
  }

  return validOrders;
}

function getFilteredAds(ads: AdRecord[], activeTab: string) {
  if (activeTab === "today") {
    return ads.filter((ad) => isSameDay(ad.date, getToday()));
  }

  if (activeTab === "week") {
    return ads.filter((ad) => isThisWeek(ad.date));
  }

  if (activeTab === "month") {
    return ads.filter((ad) => isThisMonth(ad.date));
  }

  return ads;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: any;
  tone: "cyan" | "emerald" | "yellow" | "purple" | "orange" | "red";
}) {
  const toneClass = {
    cyan: "border-cyan-300/20 bg-cyan-500/10 text-cyan-100",
    emerald: "border-emerald-300/20 bg-emerald-500/10 text-emerald-100",
    yellow: "border-yellow-300/20 bg-yellow-500/10 text-yellow-100",
    purple: "border-purple-300/20 bg-purple-500/10 text-purple-100",
    orange: "border-orange-300/20 bg-orange-500/10 text-orange-100",
    red: "border-red-300/20 bg-red-500/10 text-red-100",
  }[tone];

  return (
    <div className={`kp-card-hover rounded-[26px] border p-5 ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black opacity-60">{title}</p>
          <p className="mt-2 text-3xl font-black">{value}</p>
          <p className="mt-2 text-xs font-semibold leading-5 text-white/42">
            {subtitle}
          </p>
        </div>

        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10">
          <Icon size={23} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}

export default function FinancePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [ads, setAds] = useState<AdRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("month");

  async function loadFinanceData() {
    setLoading(true);

    try {
      const [ordersData, adsData] = await Promise.all([
        fetchOrders(),
        fetchAds(),
      ]);

      setOrders(ordersData);
      setAds(adsData);
    } catch (error: any) {
      alert(error?.message || "Finans verileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFinanceData();
  }, []);

  const validOrders = orders.filter((order) => order.status !== "İptal");

  const delayedOrders = validOrders.filter(
    (order) =>
      order.status !== "Tamamlandı" &&
      getOrderDueStatus(order.processDate, order.workDays).type === "late"
  );

  const upcomingOrders = validOrders.filter(
    (order) =>
      order.status !== "Tamamlandı" &&
      getOrderDueStatus(order.processDate, order.workDays).type === "soon"
  );

  const filteredOrders = useMemo(() => {
    return getFilteredOrders(orders, activeTab);
  }, [orders, activeTab]);

  const filteredAds = useMemo(() => {
    return getFilteredAds(ads, activeTab);
  }, [ads, activeTab]);

  const totalSales = filteredOrders.reduce(
    (sum, order) => sum + Number(order.totalPrice || 0),
    0
  );

  const totalPaid = filteredOrders.reduce(
    (sum, order) => sum + Number(order.paidAmount || 0),
    0
  );

  const totalPendingPayment = filteredOrders.reduce((sum, order) => {
    const total = Number(order.totalPrice || 0);
    const paid = Number(order.paidAmount || 0);
    return sum + Math.max(total - paid, 0);
  }, 0);

  const totalCari = filteredOrders.reduce(
    (sum, order) => sum + Number(order.cariAmount || 0),
    0
  );

  const pendingCari = filteredOrders
    .filter((order) => !order.cariPaid)
    .reduce((sum, order) => sum + Number(order.cariAmount || 0), 0);

  const paidCari = filteredOrders
    .filter((order) => order.cariPaid)
    .reduce((sum, order) => sum + Number(order.cariAmount || 0), 0);

  const grossProfit = filteredOrders.reduce(
    (sum, order) => sum + Number(order.profit || 0),
    0
  );

  const adTotal = filteredAds.reduce(
    (sum, ad) => sum + Number(ad.amount || 0),
    0
  );

  const netProfit = grossProfit - adTotal;

  const completedOrders = filteredOrders.filter(
    (order) => order.status === "Tamamlandı"
  );

  const shippedOrders = filteredOrders.filter(
    (order) => order.status === "Kargo Çıktı"
  );

  const activeOrders = filteredOrders.filter(
    (order) => order.status !== "Kargo Çıktı" && order.status !== "Tamamlandı"
  );

  const channelTotals = useMemo(() => {
    const map = new Map<
      string,
      { count: number; sales: number; profit: number }
    >();

    filteredOrders.forEach((order) => {
      const key = order.channel || "Kanal yok";
      const current = map.get(key) || { count: 0, sales: 0, profit: 0 };

      map.set(key, {
        count: current.count + 1,
        sales: current.sales + Number(order.totalPrice || 0),
        profit: current.profit + Number(order.profit || 0),
      });
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, ...value }))
      .sort((a, b) => b.sales - a.sales);
  }, [filteredOrders]);

  const productTotals = useMemo(() => {
    const map = new Map<string, { count: number; quantity: number }>();

    filteredOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const key = item.productType || "Ürün yok";
        const current = map.get(key) || { count: 0, quantity: 0 };

        map.set(key, {
          count: current.count + 1,
          quantity: current.quantity + Number(item.quantity || 0),
        });
      });
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, ...value }))
      .sort((a, b) => b.quantity - a.quantity);
  }, [filteredOrders]);

  const adPlatformTotals = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();

    filteredAds.forEach((ad) => {
      const key = ad.platform || "Platform yok";
      const current = map.get(key) || { count: 0, total: 0 };

      map.set(key, {
        count: current.count + 1,
        total: current.total + Number(ad.amount || 0),
      });
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, ...value }))
      .sort((a, b) => b.total - a.total);
  }, [filteredAds]);

  const recentOrders = [...filteredOrders]
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    )
    .slice(0, 6);

  const selectedTabLabel =
    tabs.find((tab) => tab.key === activeTab)?.label || "Bu Ay";

  return (
    <main className="min-h-screen bg-[#070812] text-white">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(91,74,255,0.26),transparent_35%),radial-gradient(circle_at_top_right,rgba(0,183,255,0.18),transparent_30%),radial-gradient(circle_at_bottom,rgba(132,32,255,0.12),transparent_35%)]" />

      <div className="relative flex">
        <Sidebar />

        <section className="min-h-screen flex-1 px-4 py-4 pb-28 lg:ml-72 lg:px-8">
          <Topbar
            delayedCount={delayedOrders.length}
            upcomingCount={upcomingOrders.length}
          />

          <div className="mt-6 rounded-[30px] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm font-black text-cyan-200/70">
                  Supabase Finans
                </p>

                <h1 className="mt-2 text-3xl font-black">Finans Özeti</h1>

                <p className="mt-2 text-sm leading-6 text-white/45">
                  Siparişler Supabase orders tablosundan, reklam giderleri
                  Supabase ads tablosundan okunur.
                </p>
              </div>

              <button
                onClick={loadFinanceData}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-white/70 transition hover:bg-white/15 disabled:opacity-50"
              >
                <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
                Yenile
              </button>
            </div>

            <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`shrink-0 rounded-2xl border px-4 py-3 text-sm font-black transition ${
                      isActive
                        ? "border-cyan-300/30 bg-cyan-400/15 text-cyan-100"
                        : "border-white/10 bg-black/20 text-white/50 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {loading && (
            <div className="mt-6 rounded-[24px] border border-cyan-300/20 bg-cyan-500/10 p-5 text-sm font-black text-cyan-100">
              Finans verileri yükleniyor...
            </div>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title={`${selectedTabLabel} Satış`}
              value={formatTL(totalSales)}
              subtitle="Seçili dönem toplam satış tutarı."
              icon={TrendingUp}
              tone="cyan"
            />

            <StatCard
              title={`${selectedTabLabel} Kâr`}
              value={formatTL(grossProfit)}
              subtitle="Cari maliyet düşüldükten sonraki kâr."
              icon={CircleDollarSign}
              tone="emerald"
            />

            <StatCard
              title="Tahsil Edilen"
              value={formatTL(totalPaid)}
              subtitle="Seçili dönemde alınan ödeme."
              icon={Banknote}
              tone="purple"
            />

            <StatCard
              title="Bekleyen Ödeme"
              value={formatTL(totalPendingPayment)}
              subtitle="Müşteriden alınması gereken kalan tutar."
              icon={CreditCard}
              tone="yellow"
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Cari Toplam"
              value={formatTL(totalCari)}
              subtitle="Seçili dönemdeki toplam cari maliyet."
              icon={WalletCards}
              tone="purple"
            />

            <StatCard
              title="Cari Bekleyen"
              value={formatTL(pendingCari)}
              subtitle="Henüz cari verildi yapılmayan tutar."
              icon={WalletCards}
              tone="orange"
            />

            <StatCard
              title="Reklam Gideri"
              value={formatTL(adTotal)}
              subtitle="Seçili dönemde girilen reklam harcaması."
              icon={Megaphone}
              tone="red"
            />

            <StatCard
              title="Net Kalan"
              value={formatTL(netProfit)}
              subtitle="Kâr eksi reklam gideri."
              icon={ChartNoAxesCombined}
              tone={netProfit >= 0 ? "emerald" : "red"}
            />
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-3">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm font-black text-cyan-200/70">
                    Sipariş Durumu
                  </p>
                  <h2 className="mt-1 text-2xl font-black">Operasyon</h2>
                </div>

                <ShoppingBag size={24} className="text-cyan-100" />
              </div>

              <div className="mt-4 space-y-3">
                <InfoRow
                  label="Aktif Sipariş"
                  value={String(activeOrders.length)}
                  tone="cyan"
                />

                <InfoRow
                  label="Kargo Çıktı"
                  value={String(shippedOrders.length)}
                  tone="purple"
                />

                <InfoRow
                  label="Tamamlandı"
                  value={String(completedOrders.length)}
                  tone="emerald"
                />

                <InfoRow
                  label="Cari Verilen"
                  value={formatTL(paidCari)}
                  tone="yellow"
                />
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl xl:col-span-2">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm font-black text-cyan-200/70">
                    Kanal Analizi
                  </p>
                  <h2 className="mt-1 text-2xl font-black">Satış Kanalları</h2>
                </div>

                <CalendarDays size={24} className="text-cyan-100" />
              </div>

              <div className="mt-4 space-y-3">
                {channelTotals.length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/45">
                    Bu dönemde kanal verisi yok.
                  </div>
                )}

                {channelTotals.map((item) => (
                  <div
                    key={item.name}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-black text-white">{item.name}</p>
                        <p className="mt-1 text-xs text-white/40">
                          {item.count} sipariş
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 md:min-w-[280px]">
                        <div className="rounded-2xl bg-cyan-500/10 p-3">
                          <p className="text-xs text-cyan-100/50">Satış</p>
                          <p className="font-black text-cyan-100">
                            {formatTL(item.sales)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-emerald-500/10 p-3">
                          <p className="text-xs text-emerald-100/50">Kâr</p>
                          <p className="font-black text-emerald-100">
                            {formatTL(item.profit)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-3">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm font-black text-purple-200/70">
                    Ürünler
                  </p>
                  <h2 className="mt-1 text-2xl font-black">Ürün Dağılımı</h2>
                </div>

                <ShoppingBag size={24} className="text-purple-100" />
              </div>

              <div className="mt-4 space-y-3">
                {productTotals.length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/45">
                    Bu dönemde ürün verisi yok.
                  </div>
                )}

                {productTotals.map((item) => (
                  <InfoRow
                    key={item.name}
                    label={item.name}
                    value={`${item.quantity} adet`}
                    tone="purple"
                  />
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm font-black text-orange-200/70">
                    Reklam
                  </p>
                  <h2 className="mt-1 text-2xl font-black">
                    Platform Giderleri
                  </h2>
                </div>

                <Megaphone size={24} className="text-orange-100" />
              </div>

              <div className="mt-4 space-y-3">
                {adPlatformTotals.length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/45">
                    Bu dönemde reklam gideri yok.
                  </div>
                )}

                {adPlatformTotals.map((item) => (
                  <InfoRow
                    key={item.name}
                    label={`${item.name} · ${item.count} kayıt`}
                    value={formatTL(item.total)}
                    tone="orange"
                  />
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm font-black text-emerald-200/70">
                    Son Siparişler
                  </p>
                  <h2 className="mt-1 text-2xl font-black">Hareketler</h2>
                </div>

                <TrendingDown size={24} className="text-emerald-100" />
              </div>

              <div className="mt-4 space-y-3">
                {recentOrders.length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/45">
                    Bu dönemde sipariş yok.
                  </div>
                )}

                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-black text-white">
                          #{order.orderNo} · {order.customer}
                        </p>

                        <p className="mt-1 text-xs text-white/40">
                          {order.channel || "Kanal yok"} · {order.status}
                        </p>
                      </div>

                      <p className="font-black text-cyan-100">
                        {formatTL(order.totalPrice)}
                      </p>
                    </div>
                  </div>
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

function InfoRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "cyan" | "emerald" | "yellow" | "purple" | "orange";
}) {
  const toneClass = {
    cyan: "bg-cyan-500/10 text-cyan-100 border-cyan-300/20",
    emerald: "bg-emerald-500/10 text-emerald-100 border-emerald-300/20",
    yellow: "bg-yellow-500/10 text-yellow-100 border-yellow-300/20",
    purple: "bg-purple-500/10 text-purple-100 border-purple-300/20",
    orange: "bg-orange-500/10 text-orange-100 border-orange-300/20",
  }[tone];

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-2xl border p-4 ${toneClass}`}
    >
      <p className="text-sm font-black">{label}</p>
      <p className="text-sm font-black">{value}</p>
    </div>
  );
}