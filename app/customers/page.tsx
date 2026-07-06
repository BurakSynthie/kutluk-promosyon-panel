"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";
import { fetchOrders, type Order } from "@/lib/ordersApi";
import { formatTL, getOrderDueStatus } from "@/lib/helpers";
import {
  CreditCard,
  Eye,
  PackageCheck,
  RefreshCw,
  Search,
  ShoppingBag,
  TrendingUp,
  UserRound,
  WalletCards,
} from "lucide-react";

type CustomerGroup = {
  name: string;
  orders: Order[];
  totalSales: number;
  totalPaid: number;
  totalRemaining: number;
  totalCari: number;
  totalProfit: number;
  lastOrderDate: string;
  channels: string[];
  contacts: string[];
};

const tabs = [
  { key: "all", label: "Tüm Müşteriler" },
  { key: "active", label: "Aktif Siparişi Olan" },
  { key: "debt", label: "Ödeme Bekleyen" },
  { key: "top", label: "En Yüksek Ciro" },
];

function getOrderDate(order: Order) {
  return order.processDate || order.createdAt?.split("T")[0] || "";
}

function statusStyle(status: string) {
  if (status === "Tamamlandı") {
    return "bg-emerald-500/15 text-emerald-200 border-emerald-300/20";
  }

  if (status === "Kargo Çıktı") {
    return "bg-purple-500/15 text-purple-200 border-purple-300/20";
  }

  if (status === "İptal") {
    return "bg-red-500/15 text-red-200 border-red-300/20";
  }

  return "bg-cyan-500/15 text-cyan-200 border-cyan-300/20";
}

function buildCustomers(orders: Order[]) {
  const map = new Map<string, CustomerGroup>();

  orders
    .filter((order) => order.status !== "İptal")
    .forEach((order) => {
      const name = order.customer?.trim() || "İsimsiz Müşteri";
      const current = map.get(name);

      const total = Number(order.totalPrice || 0);
      const paid = Number(order.paidAmount || 0);
      const remaining = Math.max(total - paid, 0);
      const cari = Number(order.cariAmount || 0);
      const profit = Number(order.profit || 0);

      if (!current) {
        map.set(name, {
          name,
          orders: [order],
          totalSales: total,
          totalPaid: paid,
          totalRemaining: remaining,
          totalCari: cari,
          totalProfit: profit,
          lastOrderDate: getOrderDate(order),
          channels: order.channel ? [order.channel] : [],
          contacts: order.contact ? [order.contact] : [],
        });

        return;
      }

      const nextLastDate =
        new Date(getOrderDate(order) || 0).getTime() >
        new Date(current.lastOrderDate || 0).getTime()
          ? getOrderDate(order)
          : current.lastOrderDate;

      map.set(name, {
        ...current,
        orders: [...current.orders, order],
        totalSales: current.totalSales + total,
        totalPaid: current.totalPaid + paid,
        totalRemaining: current.totalRemaining + remaining,
        totalCari: current.totalCari + cari,
        totalProfit: current.totalProfit + profit,
        lastOrderDate: nextLastDate,
        channels:
          order.channel && !current.channels.includes(order.channel)
            ? [...current.channels, order.channel]
            : current.channels,
        contacts:
          order.contact && !current.contacts.includes(order.contact)
            ? [...current.contacts, order.contact]
            : current.contacts,
      });
    });

  return Array.from(map.values()).sort((a, b) => b.totalSales - a.totalSales);
}

export default function CustomersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const [detailCustomer, setDetailCustomer] = useState<CustomerGroup | null>(null);

  async function loadCustomers() {
    setLoading(true);

    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (error: any) {
      alert(error?.message || "Müşteri verileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
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

  const customers = useMemo(() => {
    return buildCustomers(orders);
  }, [orders]);

  const activeCustomers = customers.filter((customer) =>
    customer.orders.some(
      (order) =>
        order.status !== "Tamamlandı" &&
        order.status !== "Kargo Çıktı" &&
        order.status !== "İptal"
    )
  );

  const debtCustomers = customers.filter(
    (customer) => customer.totalRemaining > 0
  );

  const topCustomers = [...customers]
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 20);

  const tabCustomers = useMemo(() => {
    if (activeTab === "active") return activeCustomers;
    if (activeTab === "debt") return debtCustomers;
    if (activeTab === "top") return topCustomers;
    return customers;
  }, [activeTab, customers]);

  const filteredCustomers = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) return tabCustomers;

    return tabCustomers.filter((customer) => {
      return (
        customer.name.toLowerCase().includes(value) ||
        customer.channels.join(" ").toLowerCase().includes(value) ||
        customer.contacts.join(" ").toLowerCase().includes(value) ||
        customer.orders.some((order) =>
          order.orderNo?.toLowerCase().includes(value)
        )
      );
    });
  }, [tabCustomers, search]);

  const totalCustomerCount = customers.length;

  const totalSales = customers.reduce(
    (sum, customer) => sum + customer.totalSales,
    0
  );

  const totalRemaining = customers.reduce(
    (sum, customer) => sum + customer.totalRemaining,
    0
  );

  const totalProfit = customers.reduce(
    (sum, customer) => sum + customer.totalProfit,
    0
  );

  return (
    <main className="min-h-screen bg-[#070812] text-white">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(91,74,255,0.26),transparent_35%),radial-gradient(circle_at_top_right,rgba(0,183,255,0.18),transparent_30%),radial-gradient(circle_at_bottom,rgba(132,32,255,0.12),transparent_35%)]" />

      <div className="relative flex">
        <Sidebar />

        <section className="min-h-screen flex-1 px-4 py-4 pb-28 lg:ml-72 lg:px-8">
          <Topbar delayedCount={delayedOrders.length} upcomingCount={upcomingOrders.length} />

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[26px] border border-cyan-300/20 bg-cyan-500/10 p-5">
              <p className="text-sm font-bold text-cyan-100/60">Toplam Müşteri</p>
              <p className="mt-2 text-3xl font-black text-cyan-100">
                {totalCustomerCount}
              </p>
            </div>

            <div className="rounded-[26px] border border-emerald-300/20 bg-emerald-500/10 p-5">
              <p className="text-sm font-bold text-emerald-100/60">Toplam Ciro</p>
              <p className="mt-2 text-3xl font-black text-emerald-100">
                {formatTL(totalSales)}
              </p>
            </div>

            <div className="rounded-[26px] border border-yellow-300/20 bg-yellow-500/10 p-5">
              <p className="text-sm font-bold text-yellow-100/60">Bekleyen Ödeme</p>
              <p className="mt-2 text-3xl font-black text-yellow-100">
                {formatTL(totalRemaining)}
              </p>
            </div>

            <div className="rounded-[26px] border border-purple-300/20 bg-purple-500/10 p-5">
              <p className="text-sm font-bold text-purple-100/60">Toplam Kâr</p>
              <p className="mt-2 text-3xl font-black text-purple-100">
                {formatTL(totalProfit)}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm font-bold text-cyan-200/70">Supabase Müşteriler</p>
                <h1 className="mt-2 text-3xl font-black">Müşteri Takibi</h1>
                <p className="mt-2 text-sm leading-6 text-white/45">
                  Müşteriler artık Supabase orders tablosundaki siparişlerden otomatik gruplanır.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                  <Search size={18} className="text-white/35" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-transparent text-sm font-semibold outline-none placeholder:text-white/30"
                    placeholder="Müşteri, kanal, telefon, sipariş no ara..."
                  />
                </div>

                <button
                  onClick={loadCustomers}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-white/70 transition hover:bg-white/15 disabled:opacity-50"
                >
                  <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
                  Yenile
                </button>
              </div>
            </div>

            <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
              {tabs.map((tab) => {
                const count =
                  tab.key === "active"
                    ? activeCustomers.length
                    : tab.key === "debt"
                      ? debtCustomers.length
                      : tab.key === "top"
                        ? topCustomers.length
                        : customers.length;

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
                    <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 space-y-4">
              {loading && (
                <div className="rounded-[24px] border border-white/10 bg-black/20 p-6 text-sm font-bold text-white/50">
                  Müşteriler yükleniyor...
                </div>
              )}

              {!loading && filteredCustomers.length === 0 && (
                <div className="rounded-[24px] border border-white/10 bg-black/20 p-6 text-sm text-white/50">
                  Bu sekmede müşteri yok.
                </div>
              )}

              {filteredCustomers.map((customer) => {
                const activeOrderCount = customer.orders.filter(
                  (order) =>
                    order.status !== "Tamamlandı" &&
                    order.status !== "Kargo Çıktı" &&
                    order.status !== "İptal"
                ).length;

                return (
                  <div
                    key={customer.name}
                    onClick={() => setDetailCustomer(customer)}
                    className="cursor-pointer rounded-[26px] border border-white/10 bg-black/20 p-4 transition hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-white/[0.055]"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-200">
                            {customer.orders.length} sipariş
                          </span>

                          {activeOrderCount > 0 && (
                            <span className="rounded-full bg-orange-500/15 px-3 py-1 text-xs font-black text-orange-100">
                              {activeOrderCount} aktif
                            </span>
                          )}

                          {customer.totalRemaining > 0 && (
                            <span className="rounded-full bg-yellow-500/15 px-3 py-1 text-xs font-black text-yellow-100">
                              Ödeme bekliyor
                            </span>
                          )}

                          {customer.channels.map((channel) => (
                            <span
                              key={channel}
                              className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/60"
                            >
                              {channel}
                            </span>
                          ))}
                        </div>

                        <h2 className="mt-3 text-xl font-black">{customer.name}</h2>

                        <p className="mt-1 text-sm text-white/45">
                          {customer.contacts[0] || "İletişim bilgisi yok"}
                        </p>

                        <p className="mt-2 text-xs font-semibold text-white/35">
                          Son sipariş: {customer.lastOrderDate || "-"}
                        </p>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[520px]">
                        <div className="rounded-2xl bg-cyan-500/10 p-3">
                          <p className="text-xs text-cyan-100/50">Ciro</p>
                          <p className="font-black text-cyan-100">
                            {formatTL(customer.totalSales)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-emerald-500/10 p-3">
                          <p className="text-xs text-emerald-100/50">Ödenen</p>
                          <p className="font-black text-emerald-100">
                            {formatTL(customer.totalPaid)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-yellow-500/10 p-3">
                          <p className="text-xs text-yellow-100/50">Kalan</p>
                          <p className="font-black text-yellow-100">
                            {formatTL(customer.totalRemaining)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-purple-500/10 p-3">
                          <p className="text-xs text-purple-100/50">Kâr</p>
                          <p className="font-black text-purple-100">
                            {formatTL(customer.totalProfit)}
                          </p>
                        </div>

                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            setDetailCustomer(customer);
                          }}
                          className="flex items-center justify-center gap-2 rounded-2xl bg-cyan-500/15 p-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-500/25 sm:col-span-2"
                        >
                          <Eye size={17} />
                          Müşteri Detayı
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {detailCustomer && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#090b16] p-6 shadow-2xl shadow-black/60">
            <div className="flex flex-col gap-4 rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-bold text-cyan-100/70">Müşteri Detayı</p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <h2 className="text-3xl font-black text-white">
                    {detailCustomer.name}
                  </h2>

                  <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-200">
                    {detailCustomer.orders.length} sipariş
                  </span>
                </div>

                <p className="mt-2 text-sm text-white/55">
                  {detailCustomer.contacts.join(" · ") || "İletişim bilgisi yok"}
                </p>
              </div>

              <button
                onClick={() => setDetailCustomer(null)}
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black text-white/70 transition hover:bg-white/15"
              >
                Kapat
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-cyan-500/10 p-4">
                <p className="text-xs text-cyan-100/50">Toplam Ciro</p>
                <p className="mt-1 text-2xl font-black text-cyan-100">
                  {formatTL(detailCustomer.totalSales)}
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-500/10 p-4">
                <p className="text-xs text-emerald-100/50">Tahsil Edilen</p>
                <p className="mt-1 text-2xl font-black text-emerald-100">
                  {formatTL(detailCustomer.totalPaid)}
                </p>
              </div>

              <div className="rounded-2xl bg-yellow-500/10 p-4">
                <p className="text-xs text-yellow-100/50">Bekleyen</p>
                <p className="mt-1 text-2xl font-black text-yellow-100">
                  {formatTL(detailCustomer.totalRemaining)}
                </p>
              </div>

              <div className="rounded-2xl bg-purple-500/10 p-4">
                <p className="text-xs text-purple-100/50">Toplam Kâr</p>
                <p className="mt-1 text-2xl font-black text-purple-100">
                  {formatTL(detailCustomer.totalProfit)}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-400/15 text-cyan-100">
                  <UserRound size={21} />
                </div>

                <div>
                  <p className="font-black">Müşteri Bilgileri</p>
                  <p className="mt-1 text-xs text-white/40">
                    Siparişlerden otomatik toplanan bilgiler
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <Info label="Kanallar" value={detailCustomer.channels.join(", ") || "-"} />
                <Info label="İletişimler" value={detailCustomer.contacts.join(", ") || "-"} />
                <Info label="Son Sipariş" value={detailCustomer.lastOrderDate || "-"} />
              </div>
            </div>

            <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-purple-400/15 text-purple-100">
                  <ShoppingBag size={21} />
                </div>

                <div>
                  <p className="font-black">Sipariş Geçmişi</p>
                  <p className="mt-1 text-xs text-white/40">
                    Bu müşteriye ait tüm Supabase siparişleri
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {detailCustomer.orders
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(getOrderDate(b) || 0).getTime() -
                      new Date(getOrderDate(a) || 0).getTime()
                  )
                  .map((order) => {
                    const remaining = Math.max(
                      Number(order.totalPrice || 0) - Number(order.paidAmount || 0),
                      0
                    );

                    return (
                      <div
                        key={order.id}
                        className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
                      >
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-200">
                                #{order.orderNo}
                              </span>

                              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusStyle(order.status)}`}>
                                {order.status}
                              </span>

                              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/60">
                                {getOrderDate(order) || "-"}
                              </span>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {(order.items || []).map((item, index) => (
                                <span
                                  key={index}
                                  className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/60"
                                >
                                  {item.productType} · {item.quantity} adet
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="grid gap-2 sm:grid-cols-4 xl:min-w-[560px]">
                            <MiniStat
                              label="Satış"
                              value={formatTL(order.totalPrice)}
                              tone="cyan"
                            />

                            <MiniStat
                              label="Ödenen"
                              value={formatTL(order.paidAmount)}
                              tone="emerald"
                            />

                            <MiniStat
                              label="Kalan"
                              value={formatTL(remaining)}
                              tone="yellow"
                            />

                            <MiniStat
                              label="Kâr"
                              value={formatTL(order.profit)}
                              tone="purple"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      <MobileNav />
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.045] p-4">
      <p className="text-xs text-white/40">{label}</p>
      <p className="mt-1 break-words font-black text-white">{value}</p>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "cyan" | "emerald" | "yellow" | "purple";
}) {
  const toneClass = {
    cyan: "bg-cyan-500/10 text-cyan-100",
    emerald: "bg-emerald-500/10 text-emerald-100",
    yellow: "bg-yellow-500/10 text-yellow-100",
    purple: "bg-purple-500/10 text-purple-100",
  }[tone];

  return (
    <div className={`rounded-2xl p-3 ${toneClass}`}>
      <p className="text-xs opacity-50">{label}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}