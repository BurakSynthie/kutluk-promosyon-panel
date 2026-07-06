"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";
import {
  deleteOrder,
  fetchOrders,
  patchOrder,
  type Order,
  type Payment,
} from "@/lib/ordersApi";
import { formatTL, getOrderDueStatus } from "@/lib/helpers";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Eye,
  ImageIcon,
  Maximize2,
  PackageCheck,
  PlusCircle,
  RefreshCw,
  Search,
  Trash2,
  Truck,
  WalletCards,
  X,
} from "lucide-react";

const tabs = [
  { key: "active", label: "Aktif" },
  { key: "shipped", label: "Kargo Çıktı" },
  { key: "completed", label: "Tamamlandı" },
  { key: "cancelled", label: "İptal" },
  { key: "all", label: "Tümü" },
];

const cargoCompanies = [
  "Yurtiçi Kargo",
  "Aras Kargo",
  "MNG Kargo",
  "Sürat Kargo",
  "PTT Kargo",
  "UPS",
  "DHL",
  "Elden Teslim",
  "Diğer",
];

function getToday() {
  return new Date().toISOString().split("T")[0];
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

function stopCardClick(event: React.MouseEvent) {
  event.stopPropagation();
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("active");

  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);

  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");

  const [cargoOrder, setCargoOrder] = useState<Order | null>(null);
  const [cargoCompany, setCargoCompany] = useState("Yurtiçi Kargo");
  const [cargoTrackingNo, setCargoTrackingNo] = useState("");

  async function loadOrders() {
    setLoading(true);

    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (error: any) {
      alert(error?.message || "Siparişler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function updateLocalAndRemote(id: number, payload: Partial<Order>) {
    setSaving(true);

    try {
      const updated = await patchOrder(id, payload);

      setOrders((prev) =>
        prev.map((order) => (order.id === id ? updated : order))
      );

      if (detailOrder?.id === id) setDetailOrder(updated);
      if (paymentOrder?.id === id) setPaymentOrder(updated);
      if (cargoOrder?.id === id) setCargoOrder(updated);

      return updated;
    } catch (error: any) {
      alert(error?.message || "İşlem yapılırken hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  async function addPayment() {
    if (!paymentOrder) return;

    const amount = Number(paymentAmount || 0);

    if (amount <= 0) {
      alert("Ödeme tutarı girmen gerekiyor.");
      return;
    }

    const oldPaid = Number(paymentOrder.paidAmount || 0);
    const total = Number(paymentOrder.totalPrice || 0);
    const newPaid = oldPaid + amount;
    const newRemaining = Math.max(total - newPaid, 0);

    const payment: Payment = {
      amount,
      date: getToday(),
      note: paymentNote || "Ödeme",
    };

    await updateLocalAndRemote(paymentOrder.id, {
      paidAmount: newPaid,
      remainingAmount: newRemaining,
      payments: [...(paymentOrder.payments || []), payment],
    });

    setPaymentOrder(null);
    setPaymentAmount("");
    setPaymentNote("");
  }

  async function markCargo() {
    if (!cargoOrder) return;

    await updateLocalAndRemote(cargoOrder.id, {
      status: "Kargo Çıktı",
      cargoCompany,
      cargoTrackingNo,
      cargoDate: getToday(),
    });

    setCargoOrder(null);
    setCargoCompany("Yurtiçi Kargo");
    setCargoTrackingNo("");
    setActiveTab("shipped");
  }

  async function markCariPaid(order: Order) {
    await updateLocalAndRemote(order.id, {
      cariPaid: true,
    });
  }

  async function undoCari(order: Order) {
    await updateLocalAndRemote(order.id, {
      cariPaid: false,
    });
  }

  async function completeOrder(order: Order) {
    await updateLocalAndRemote(order.id, {
      status: "Tamamlandı",
    });
    setActiveTab("completed");
  }

  async function undoComplete(order: Order) {
    await updateLocalAndRemote(order.id, {
      status: "İşleme Alındı",
    });
    setActiveTab("active");
  }

  async function cancelOrder(order: Order) {
    const approved = window.confirm("Bu siparişi iptal etmek istiyor musun?");
    if (!approved) return;

    await updateLocalAndRemote(order.id, {
      status: "İptal",
    });
    setActiveTab("cancelled");
  }

  async function undoCancel(order: Order) {
    await updateLocalAndRemote(order.id, {
      status: "İşleme Alındı",
    });
    setActiveTab("active");
  }

  async function removeOrder(order: Order) {
    const approved = window.confirm(
      `#${order.orderNo} siparişini tamamen silmek istiyor musun?`
    );

    if (!approved) return;

    setSaving(true);

    try {
      await deleteOrder(order.id);
      setOrders((prev) => prev.filter((item) => item.id !== order.id));
      if (detailOrder?.id === order.id) setDetailOrder(null);
    } catch (error: any) {
      alert(error?.message || "Sipariş silinemedi.");
    } finally {
      setSaving(false);
    }
  }

  const activeOrders = orders.filter(
    (order) =>
      order.status !== "Kargo Çıktı" &&
      order.status !== "Tamamlandı" &&
      order.status !== "İptal"
  );

  const shippedOrders = orders.filter((order) => order.status === "Kargo Çıktı");
  const completedOrders = orders.filter((order) => order.status === "Tamamlandı");
  const cancelledOrders = orders.filter((order) => order.status === "İptal");

  const delayedOrders = orders.filter(
    (order) =>
      order.status !== "Tamamlandı" &&
      order.status !== "İptal" &&
      getOrderDueStatus(order.processDate, order.workDays).type === "late"
  );

  const upcomingOrders = orders.filter(
    (order) =>
      order.status !== "Tamamlandı" &&
      order.status !== "İptal" &&
      getOrderDueStatus(order.processDate, order.workDays).type === "soon"
  );

  const tabOrders = useMemo(() => {
    if (activeTab === "active") return activeOrders;
    if (activeTab === "shipped") return shippedOrders;
    if (activeTab === "completed") return completedOrders;
    if (activeTab === "cancelled") return cancelledOrders;
    return orders;
  }, [activeTab, orders]);

  const filteredOrders = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) return tabOrders;

    return tabOrders.filter((order) => {
      return (
        order.orderNo?.toLowerCase().includes(value) ||
        order.customer?.toLowerCase().includes(value) ||
        order.channel?.toLowerCase().includes(value) ||
        order.contact?.toLowerCase().includes(value) ||
        order.status?.toLowerCase().includes(value) ||
        order.note?.toLowerCase().includes(value)
      );
    });
  }, [tabOrders, search]);

  const totalSales = orders
    .filter((order) => order.status !== "İptal")
    .reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);

  const totalPaid = orders
    .filter((order) => order.status !== "İptal")
    .reduce((sum, order) => sum + Number(order.paidAmount || 0), 0);

  const totalRemaining = orders
    .filter((order) => order.status !== "İptal")
    .reduce((sum, order) => {
      const total = Number(order.totalPrice || 0);
      const paid = Number(order.paidAmount || 0);
      return sum + Math.max(total - paid, 0);
    }, 0);

  const totalCari = orders
    .filter((order) => order.status !== "İptal" && !order.cariPaid)
    .reduce((sum, order) => sum + Number(order.cariAmount || 0), 0);

  return (
    <main className="min-h-screen bg-[#070812] text-white">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(91,74,255,0.26),transparent_35%),radial-gradient(circle_at_top_right,rgba(0,183,255,0.18),transparent_30%),radial-gradient(circle_at_bottom,rgba(132,32,255,0.12),transparent_35%)]" />

      <div className="relative flex">
        <Sidebar />

        <section className="min-h-screen flex-1 px-4 py-4 pb-44 lg:ml-72 lg:px-8">
          <Topbar delayedCount={delayedOrders.length} upcomingCount={upcomingOrders.length} />

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[26px] border border-cyan-300/20 bg-cyan-500/10 p-5">
              <p className="text-sm font-bold text-cyan-100/60">Toplam Satış</p>
              <p className="mt-2 text-3xl font-black text-cyan-100">{formatTL(totalSales)}</p>
            </div>

            <div className="rounded-[26px] border border-emerald-300/20 bg-emerald-500/10 p-5">
              <p className="text-sm font-bold text-emerald-100/60">Tahsil Edilen</p>
              <p className="mt-2 text-3xl font-black text-emerald-100">{formatTL(totalPaid)}</p>
            </div>

            <div className="rounded-[26px] border border-yellow-300/20 bg-yellow-500/10 p-5">
              <p className="text-sm font-bold text-yellow-100/60">Bekleyen Ödeme</p>
              <p className="mt-2 text-3xl font-black text-yellow-100">{formatTL(totalRemaining)}</p>
            </div>

            <div className="rounded-[26px] border border-purple-300/20 bg-purple-500/10 p-5">
              <p className="text-sm font-bold text-purple-100/60">Cari Bekleyen</p>
              <p className="mt-2 text-3xl font-black text-purple-100">{formatTL(totalCari)}</p>
            </div>
          </div>

          <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm font-bold text-cyan-200/70">Supabase Siparişler</p>
                <h1 className="mt-2 text-3xl font-black">Sipariş Takibi</h1>
                <p className="mt-2 text-sm leading-6 text-white/45">
                  Bu sayfa artık siparişleri Supabase orders tablosundan okur ve günceller.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                  <Search size={18} className="text-white/35" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-transparent text-sm font-semibold outline-none placeholder:text-white/30"
                    placeholder="Sipariş no, müşteri, telefon ara..."
                  />
                </div>

                <button
                  onClick={loadOrders}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-white/70 transition hover:bg-white/15 disabled:opacity-50"
                >
                  <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
                  Yenile
                </button>

                <Link
                  href="/orders/new"
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-cyan-950/40 transition hover:scale-[1.02]"
                >
                  <PlusCircle size={18} />
                  Yeni Sipariş
                </Link>
              </div>
            </div>

            <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
              {tabs.map((tab) => {
                const count =
                  tab.key === "active"
                    ? activeOrders.length
                    : tab.key === "shipped"
                      ? shippedOrders.length
                      : tab.key === "completed"
                        ? completedOrders.length
                        : tab.key === "cancelled"
                          ? cancelledOrders.length
                          : orders.length;

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
                  Siparişler yükleniyor...
                </div>
              )}

              {!loading && filteredOrders.length === 0 && (
                <div className="rounded-[24px] border border-white/10 bg-black/20 p-6 text-sm text-white/50">
                  Bu sekmede sipariş yok.
                </div>
              )}

              {filteredOrders.map((order) => {
                const due = getOrderDueStatus(order.processDate, order.workDays);
                const remaining = Math.max(
                  Number(order.totalPrice || 0) - Number(order.paidAmount || 0),
                  0
                );

                return (
                  <div
                    key={order.id}
                    onClick={() => setDetailOrder(order)}
                    className="cursor-pointer rounded-[26px] border border-white/10 bg-black/20 p-4 transition hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-white/[0.055]"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-200">
                            #{order.orderNo}
                          </span>

                          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusStyle(order.status)}`}>
                            {order.status}
                          </span>

                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/60">
                            {order.channel || "Kanal yok"}
                          </span>

                          {(order.images || []).length > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 px-3 py-1 text-xs font-black text-purple-100">
                              <ImageIcon size={13} />
                              {(order.images || []).length} görsel
                            </span>
                          )}

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${
                              due.type === "late"
                                ? "bg-red-500/15 text-red-100"
                                : due.type === "soon"
                                  ? "bg-orange-500/15 text-orange-100"
                                  : "bg-white/10 text-white/50"
                            }`}
                          >
                            {due.label}
                          </span>
                        </div>

                        <h2 className="mt-3 text-xl font-black">{order.customer}</h2>

                        <p className="mt-1 text-sm text-white/45">
                          {order.contact || "İletişim bilgisi yok"}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {(order.items || []).map((item, index) => (
                            <span
                              key={index}
                              className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-xs text-white/60"
                            >
                              {item.productType} · {item.quantity} adet
                            </span>
                          ))}
                        </div>

                        {(order.images || []).length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {(order.images || []).slice(0, 4).map((image, index) => (
                              <div
                                key={`${image.url}-${index}`}
                                className="h-12 w-12 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]"
                              >
                                <img
                                  src={image.url}
                                  alt={image.name || "Sipariş görseli"}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ))}

                            {(order.images || []).length > 4 && (
                              <div className="grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-xs font-black text-white/60">
                                +{(order.images || []).length - 4}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[520px]">
                        <div className="rounded-2xl bg-cyan-500/10 p-3">
                          <p className="text-xs text-cyan-100/50">Satış</p>
                          <p className="font-black text-cyan-100">{formatTL(order.totalPrice)}</p>
                        </div>

                        <div className="rounded-2xl bg-emerald-500/10 p-3">
                          <p className="text-xs text-emerald-100/50">Ödenen</p>
                          <p className="font-black text-emerald-100">{formatTL(order.paidAmount)}</p>
                        </div>

                        <div className="rounded-2xl bg-yellow-500/10 p-3">
                          <p className="text-xs text-yellow-100/50">Kalan</p>
                          <p className="font-black text-yellow-100">{formatTL(remaining)}</p>
                        </div>

                        <div className="rounded-2xl bg-purple-500/10 p-3">
                          <p className="text-xs text-purple-100/50">Cari</p>
                          <p className="font-black text-purple-100">{formatTL(order.cariAmount)}</p>
                        </div>

                        <div onClick={stopCardClick} className="grid gap-2 sm:col-span-2 sm:grid-cols-3">
                          <button
                            onClick={() => {
                              setPaymentOrder(order);
                              setPaymentAmount("");
                              setPaymentNote("");
                            }}
                            className="rounded-2xl bg-emerald-500/15 p-3 text-sm font-black text-emerald-100 transition hover:bg-emerald-500/25"
                          >
                            Ödeme Ekle
                          </button>

                          {order.status !== "Kargo Çıktı" && order.status !== "Tamamlandı" && order.status !== "İptal" && (
                            <button
                              onClick={() => {
                                setCargoOrder(order);
                                setCargoCompany(order.cargoCompany || "Yurtiçi Kargo");
                                setCargoTrackingNo(order.cargoTrackingNo || "");
                              }}
                              className="rounded-2xl bg-purple-500/15 p-3 text-sm font-black text-purple-100 transition hover:bg-purple-500/25"
                            >
                              Kargo Çıktı
                            </button>
                          )}

                          {!order.cariPaid ? (
                            <button
                              onClick={() => markCariPaid(order)}
                              className="rounded-2xl bg-cyan-500/15 p-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-500/25"
                            >
                              Cari Verildi
                            </button>
                          ) : (
                            <button
                              onClick={() => undoCari(order)}
                              className="rounded-2xl bg-white/10 p-3 text-sm font-black text-white/60 transition hover:bg-white/15"
                            >
                              Cari Geri Al
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {detailOrder && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#090b16] p-6 shadow-2xl shadow-black/60">
            <div className="flex flex-col gap-4 rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-bold text-cyan-100/70">Sipariş Detayı</p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <h2 className="text-3xl font-black text-white">
                    #{detailOrder.orderNo} · {detailOrder.customer}
                  </h2>

                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusStyle(detailOrder.status)}`}>
                    {detailOrder.status}
                  </span>
                </div>

                <p className="mt-2 text-sm text-white/55">
                  {detailOrder.channel} · {detailOrder.contact || "İletişim bilgisi yok"}
                </p>
              </div>

              <button
                onClick={() => setDetailOrder(null)}
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black text-white/70 transition hover:bg-white/15"
              >
                Kapat
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-cyan-500/10 p-4">
                <p className="text-xs text-cyan-100/50">Satış</p>
                <p className="mt-1 text-2xl font-black text-cyan-100">
                  {formatTL(detailOrder.totalPrice)}
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-500/10 p-4">
                <p className="text-xs text-emerald-100/50">Ödenen</p>
                <p className="mt-1 text-2xl font-black text-emerald-100">
                  {formatTL(detailOrder.paidAmount)}
                </p>
              </div>

              <div className="rounded-2xl bg-yellow-500/10 p-4">
                <p className="text-xs text-yellow-100/50">Kalan</p>
                <p className="mt-1 text-2xl font-black text-yellow-100">
                  {formatTL(
                    Math.max(
                      Number(detailOrder.totalPrice || 0) -
                        Number(detailOrder.paidAmount || 0),
                      0
                    )
                  )}
                </p>
              </div>

              <div className="rounded-2xl bg-purple-500/10 p-4">
                <p className="text-xs text-purple-100/50">Kâr</p>
                <p className="mt-1 text-2xl font-black text-purple-100">
                  {formatTL(detailOrder.profit)}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                <p className="text-sm font-black text-cyan-100">Sipariş Bilgileri</p>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Info label="İşleme Tarihi" value={detailOrder.processDate || "-"} />
                  <Info label="Çıkış Tarihi" value={detailOrder.dueDate || "-"} />
                  <Info label="İş Günü" value={`${detailOrder.workDays || 12} iş günü`} />
                  <Info label="Cari Durumu" value={detailOrder.cariPaid ? "Cari verildi" : "Cari bekliyor"} />
                  <Info label="Kargo Firması" value={detailOrder.cargoCompany || "-"} />
                  <Info label="Takip No" value={detailOrder.cargoTrackingNo || "-"} />
                </div>

                {detailOrder.note && (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <p className="text-xs font-black text-white/40">Not</p>
                    <p className="mt-2 text-sm leading-6 text-white/65">{detailOrder.note}</p>
                  </div>
                )}
              </div>

              <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                <p className="text-sm font-black text-purple-100">Ürün Detayları</p>

                <div className="mt-4 space-y-3">
                  {(detailOrder.items || []).length === 0 && (
                    <p className="text-sm text-white/40">Ürün bilgisi yok.</p>
                  )}

                  {(detailOrder.items || []).map((item, index) => (
                    <div key={index} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                      <p className="font-black text-white">Ürün #{index + 1}</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <Info label="Ürün" value={item.productType || "-"} />
                        <Info label="Malzeme" value={item.material || "-"} />
                        <Info label="Adet" value={item.quantity || "-"} />
                        <Info label="Esans" value={item.essence || "-"} />
                      </div>

                      {(item.designNote || item.itemNote) && (
                        <p className="mt-3 text-sm leading-6 text-white/50">
                          {item.designNote || item.itemNote}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-purple-100">Sipariş Görselleri</p>
                  <p className="mt-1 text-xs text-white/40">
                    Tasarım, logo, örnek baskı veya müşteri dosyaları.
                  </p>
                </div>

                <span className="rounded-full bg-purple-500/15 px-3 py-1 text-xs font-black text-purple-100">
                  {(detailOrder.images || []).length} görsel
                </span>
              </div>

              <div className="mt-4">
                {(detailOrder.images || []).length === 0 && (
                  <p className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm text-white/40">
                    Bu siparişe görsel eklenmemiş.
                  </p>
                )}

                {(detailOrder.images || []).length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {(detailOrder.images || []).map((image, index) => (
                      <button
                        key={`${image.url}-${index}`}
                        onClick={() =>
                          setPreviewImage({
                            url: image.url,
                            name: image.name || "Sipariş görseli",
                          })
                        }
                        className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] text-left transition hover:-translate-y-0.5 hover:border-purple-300/30 hover:bg-white/[0.06]"
                      >
                        <div className="relative aspect-square overflow-hidden bg-black/30">
                          <img
                            src={image.url}
                            alt={image.name || "Sipariş görseli"}
                            className="h-full w-full object-cover transition group-hover:scale-105"
                          />

                          <div className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100">
                            <div className="grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur">
                              <Maximize2 size={18} />
                            </div>
                          </div>
                        </div>

                        <div className="p-3">
                          <p className="truncate text-xs font-black text-white/70">
                            {image.name || `Görsel ${index + 1}`}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5">
              <p className="text-sm font-black text-emerald-100">Ödeme Geçmişi</p>

              <div className="mt-4 space-y-2">
                {(detailOrder.payments || []).length === 0 && (
                  <p className="text-sm text-white/40">Ödeme kaydı yok.</p>
                )}

                {(detailOrder.payments || []).map((payment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-4"
                  >
                    <div>
                      <p className="font-black text-emerald-100">{formatTL(payment.amount)}</p>
                      <p className="mt-1 text-xs text-white/40">{payment.note || "Ödeme"}</p>
                    </div>

                    <p className="text-sm font-black text-white/50">{payment.date}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <button
                onClick={() => {
                  setPaymentOrder(detailOrder);
                  setPaymentAmount("");
                  setPaymentNote("");
                }}
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/15 p-4 text-sm font-black text-emerald-100 transition hover:bg-emerald-500/25"
              >
                <CreditCard size={18} />
                Ödeme Ekle
              </button>

              {detailOrder.status !== "Kargo Çıktı" && detailOrder.status !== "Tamamlandı" && detailOrder.status !== "İptal" && (
                <button
                  onClick={() => {
                    setCargoOrder(detailOrder);
                    setCargoCompany(detailOrder.cargoCompany || "Yurtiçi Kargo");
                    setCargoTrackingNo(detailOrder.cargoTrackingNo || "");
                  }}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-purple-500/15 p-4 text-sm font-black text-purple-100 transition hover:bg-purple-500/25"
                >
                  <Truck size={18} />
                  Kargo Çıktı
                </button>
              )}

              {detailOrder.status === "Kargo Çıktı" && (
                <button
                  onClick={() => completeOrder(detailOrder)}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-cyan-500/15 p-4 text-sm font-black text-cyan-100 transition hover:bg-cyan-500/25"
                >
                  <PackageCheck size={18} />
                  Tamamlandı Yap
                </button>
              )}

              {detailOrder.status === "Tamamlandı" && (
                <button
                  onClick={() => undoComplete(detailOrder)}
                  className="rounded-2xl bg-white/10 p-4 text-sm font-black text-white/60 transition hover:bg-white/15"
                >
                  Tamamlanmayı Geri Al
                </button>
              )}

              {detailOrder.status !== "İptal" ? (
                <button
                  onClick={() => cancelOrder(detailOrder)}
                  className="rounded-2xl bg-red-500/15 p-4 text-sm font-black text-red-100 transition hover:bg-red-500/25"
                >
                  İptal Et
                </button>
              ) : (
                <button
                  onClick={() => undoCancel(detailOrder)}
                  className="rounded-2xl bg-white/10 p-4 text-sm font-black text-white/60 transition hover:bg-white/15"
                >
                  İptali Geri Al
                </button>
              )}

              <button
                onClick={() => removeOrder(detailOrder)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-red-500/10 p-4 text-sm font-black text-red-100 transition hover:bg-red-500/20"
              >
                <Trash2 size={18} />
                Tamamen Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {paymentOrder && (
        <div className="fixed inset-0 z-[95] grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#090b16] p-6 shadow-2xl shadow-black/60">
            <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-5">
              <p className="text-sm font-bold text-emerald-100/70">Ödeme Ekle</p>
              <h2 className="mt-2 text-2xl font-black text-white">
                #{paymentOrder.orderNo} · {paymentOrder.customer}
              </h2>
            </div>

            <div className="mt-5 space-y-3">
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-sm font-bold outline-none placeholder:text-white/25"
                placeholder="Ödeme tutarı"
              />

              <input
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-sm font-bold outline-none placeholder:text-white/25"
                placeholder="Not"
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentOrder(null)}
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-sm font-black text-white/70 transition hover:bg-white/15"
              >
                Vazgeç
              </button>

              <button
                onClick={addPayment}
                disabled={saving}
                className="rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-4 text-sm font-black text-white shadow-lg shadow-emerald-950/40 transition hover:scale-[1.02] disabled:opacity-60"
              >
                {saving ? "Kaydediliyor..." : "Ödemeyi Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {cargoOrder && (
        <div className="fixed inset-0 z-[95] grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#090b16] p-6 shadow-2xl shadow-black/60">
            <div className="rounded-3xl border border-purple-400/20 bg-purple-500/10 p-5">
              <p className="text-sm font-bold text-purple-100/70">Kargo Çıktı</p>
              <h2 className="mt-2 text-2xl font-black text-white">
                #{cargoOrder.orderNo} · {cargoOrder.customer}
              </h2>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <label className="text-xs font-black text-white/40">Kargo Firması</label>
                <select
                  value={cargoCompany}
                  onChange={(e) => setCargoCompany(e.target.value)}
                  className="mt-2 w-full bg-transparent text-sm font-bold outline-none"
                >
                  {cargoCompanies.map((company) => (
                    <option key={company}>{company}</option>
                  ))}
                </select>
              </div>

              <input
                value={cargoTrackingNo}
                onChange={(e) => setCargoTrackingNo(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-sm font-bold outline-none placeholder:text-white/25"
                placeholder="Kargo takip numarası"
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => setCargoOrder(null)}
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-sm font-black text-white/70 transition hover:bg-white/15"
              >
                Vazgeç
              </button>

              <button
                onClick={markCargo}
                disabled={saving}
                className="rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-500 px-4 py-4 text-sm font-black text-white shadow-lg shadow-purple-950/40 transition hover:scale-[1.02] disabled:opacity-60"
              >
                {saving ? "Kaydediliyor..." : "Kargo Çıktı Yap"}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewImage && (
        <div className="fixed inset-0 z-[110] grid place-items-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/10 bg-[#090b16] shadow-2xl shadow-black/70">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
              <div className="min-w-0">
                <p className="text-xs font-black text-purple-100/60">Görsel Önizleme</p>
                <p className="truncate text-sm font-black text-white/80">
                  {previewImage.name}
                </p>
              </div>

              <button
                onClick={() => setPreviewImage(null)}
                className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/10 text-white/70 transition hover:bg-white/15"
              >
                <X size={19} />
              </button>
            </div>

            <div className="max-h-[78vh] overflow-auto bg-black/30 p-3">
              <img
                src={previewImage.url}
                alt={previewImage.name}
                className="mx-auto max-h-[74vh] w-auto max-w-full rounded-2xl object-contain"
              />
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
    <div className="rounded-2xl bg-white/[0.045] p-3">
      <p className="text-xs text-white/40">{label}</p>
      <p className="mt-1 font-black text-white">{value}</p>
    </div>
  );
}