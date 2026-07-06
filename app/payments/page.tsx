"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";
import { fetchOrders, patchOrder, type Order, type Payment } from "@/lib/ordersApi";
import { formatTL, getOrderDueStatus } from "@/lib/helpers";
import {
  CheckCircle2,
  CreditCard,
  Eye,
  RefreshCw,
  Search,
  WalletCards,
  X,
} from "lucide-react";

const tabs = [
  { key: "pending", label: "Ödeme Bekleyen" },
  { key: "paid", label: "Ödemesi Tamamlanan" },
  { key: "history", label: "Ödeme Geçmişi" },
  { key: "all", label: "Tümü" },
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

export default function PaymentsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");

  async function loadOrders() {
    setLoading(true);

    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (error: any) {
      alert(error?.message || "Ödeme verileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function updateOrderPayment(id: number, payload: Partial<Order>) {
    setSaving(true);

    try {
      const updated = await patchOrder(id, payload);

      setOrders((prev) =>
        prev.map((order) => (order.id === id ? updated : order))
      );

      if (detailOrder?.id === id) setDetailOrder(updated);
      if (paymentOrder?.id === id) setPaymentOrder(updated);

      return updated;
    } catch (error: any) {
      alert(error?.message || "Ödeme işlemi yapılamadı.");
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

    await updateOrderPayment(paymentOrder.id, {
      paidAmount: newPaid,
      remainingAmount: newRemaining,
      payments: [...(paymentOrder.payments || []), payment],
    });

    setPaymentOrder(null);
    setPaymentAmount("");
    setPaymentNote("");
  }

  const validOrders = orders.filter((order) => order.status !== "İptal");

  const pendingOrders = validOrders.filter((order) => {
    const total = Number(order.totalPrice || 0);
    const paid = Number(order.paidAmount || 0);
    return Math.max(total - paid, 0) > 0;
  });

  const paidOrders = validOrders.filter((order) => {
    const total = Number(order.totalPrice || 0);
    const paid = Number(order.paidAmount || 0);
    return total > 0 && Math.max(total - paid, 0) === 0;
  });

  const ordersWithPayments = validOrders.filter(
    (order) => (order.payments || []).length > 0
  );

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

  const tabOrders = useMemo(() => {
    if (activeTab === "pending") return pendingOrders;
    if (activeTab === "paid") return paidOrders;
    if (activeTab === "history") return ordersWithPayments;
    return validOrders;
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

  const totalSales = validOrders.reduce(
    (sum, order) => sum + Number(order.totalPrice || 0),
    0
  );

  const totalPaid = validOrders.reduce(
    (sum, order) => sum + Number(order.paidAmount || 0),
    0
  );

  const totalPending = validOrders.reduce((sum, order) => {
    const total = Number(order.totalPrice || 0);
    const paid = Number(order.paidAmount || 0);
    return sum + Math.max(total - paid, 0);
  }, 0);

  const totalPaymentRecordCount = validOrders.reduce(
    (sum, order) => sum + (order.payments || []).length,
    0
  );

  const paymentHistory = validOrders
    .flatMap((order) =>
      (order.payments || []).map((payment, index) => ({
        id: `${order.id}-${index}`,
        order,
        payment,
      }))
    )
    .sort((a, b) => new Date(b.payment.date).getTime() - new Date(a.payment.date).getTime());

  return (
    <main className="min-h-screen bg-[#070812] text-white">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(91,74,255,0.26),transparent_35%),radial-gradient(circle_at_top_right,rgba(0,183,255,0.18),transparent_30%),radial-gradient(circle_at_bottom,rgba(132,32,255,0.12),transparent_35%)]" />

      <div className="relative flex">
        <Sidebar />

        <section className="min-h-screen flex-1 px-4 py-4 pb-28 lg:ml-72 lg:px-8">
          <Topbar delayedCount={delayedOrders.length} upcomingCount={upcomingOrders.length} />

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[26px] border border-cyan-300/20 bg-cyan-500/10 p-5">
              <p className="text-sm font-bold text-cyan-100/60">Toplam Satış</p>
              <p className="mt-2 text-3xl font-black text-cyan-100">
                {formatTL(totalSales)}
              </p>
            </div>

            <div className="rounded-[26px] border border-emerald-300/20 bg-emerald-500/10 p-5">
              <p className="text-sm font-bold text-emerald-100/60">Tahsil Edilen</p>
              <p className="mt-2 text-3xl font-black text-emerald-100">
                {formatTL(totalPaid)}
              </p>
            </div>

            <div className="rounded-[26px] border border-yellow-300/20 bg-yellow-500/10 p-5">
              <p className="text-sm font-bold text-yellow-100/60">Bekleyen Ödeme</p>
              <p className="mt-2 text-3xl font-black text-yellow-100">
                {formatTL(totalPending)}
              </p>
            </div>

            <div className="rounded-[26px] border border-purple-300/20 bg-purple-500/10 p-5">
              <p className="text-sm font-bold text-purple-100/60">Ödeme Kaydı</p>
              <p className="mt-2 text-3xl font-black text-purple-100">
                {totalPaymentRecordCount}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm font-bold text-cyan-200/70">Supabase Ödemeler</p>
                <h1 className="mt-2 text-3xl font-black">Ödeme Takibi</h1>
                <p className="mt-2 text-sm leading-6 text-white/45">
                  Ödemeler artık Supabase orders tablosundaki ödeme geçmişi üzerinden güncellenir.
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
              </div>
            </div>

            <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
              {tabs.map((tab) => {
                const count =
                  tab.key === "pending"
                    ? pendingOrders.length
                    : tab.key === "paid"
                      ? paidOrders.length
                      : tab.key === "history"
                        ? ordersWithPayments.length
                        : validOrders.length;

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

            {activeTab === "history" ? (
              <div className="mt-5 space-y-4">
                {loading && (
                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-6 text-sm font-bold text-white/50">
                    Ödeme geçmişi yükleniyor...
                  </div>
                )}

                {!loading && paymentHistory.length === 0 && (
                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-6 text-sm text-white/50">
                    Henüz ödeme kaydı yok.
                  </div>
                )}

                {paymentHistory.map(({ id, order, payment }) => (
                  <div
                    key={id}
                    onClick={() => setDetailOrder(order)}
                    className="cursor-pointer rounded-[26px] border border-white/10 bg-black/20 p-4 transition hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-white/[0.055]"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-200">
                            #{order.orderNo}
                          </span>

                          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusStyle(order.status)}`}>
                            {order.status}
                          </span>

                          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-100">
                            {payment.date}
                          </span>
                        </div>

                        <h2 className="mt-3 text-xl font-black">{order.customer}</h2>

                        <p className="mt-1 text-sm text-white/45">
                          {payment.note || "Ödeme"} · {order.channel || "Kanal yok"}
                        </p>
                      </div>

                      <p className="text-3xl font-black text-emerald-100">
                        {formatTL(payment.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {loading && (
                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-6 text-sm font-bold text-white/50">
                    Ödeme verileri yükleniyor...
                  </div>
                )}

                {!loading && filteredOrders.length === 0 && (
                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-6 text-sm text-white/50">
                    Bu sekmede ödeme kaydı yok.
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

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-black ${
                                remaining > 0
                                  ? "bg-yellow-500/15 text-yellow-100"
                                  : "bg-emerald-500/15 text-emerald-100"
                              }`}
                            >
                              {remaining > 0 ? "Ödeme Bekliyor" : "Ödeme Tamam"}
                            </span>

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
                            {order.channel || "Kanal yok"} · {order.contact || "İletişim bilgisi yok"}
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
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[500px]">
                          <div className="rounded-2xl bg-cyan-500/10 p-3">
                            <p className="text-xs text-cyan-100/50">Satış</p>
                            <p className="font-black text-cyan-100">
                              {formatTL(order.totalPrice)}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-emerald-500/10 p-3">
                            <p className="text-xs text-emerald-100/50">Ödenen</p>
                            <p className="font-black text-emerald-100">
                              {formatTL(order.paidAmount)}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-yellow-500/10 p-3">
                            <p className="text-xs text-yellow-100/50">Kalan</p>
                            <p className="font-black text-yellow-100">
                              {formatTL(remaining)}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-purple-500/10 p-3">
                            <p className="text-xs text-purple-100/50">Ödeme Kaydı</p>
                            <p className="font-black text-purple-100">
                              {(order.payments || []).length}
                            </p>
                          </div>

                          <div onClick={stopCardClick} className="grid gap-2 sm:col-span-2 sm:grid-cols-2">
                            {remaining > 0 && (
                              <button
                                onClick={() => {
                                  setPaymentOrder(order);
                                  setPaymentAmount("");
                                  setPaymentNote("");
                                }}
                                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/15 p-3 text-sm font-black text-emerald-100 transition hover:bg-emerald-500/25"
                              >
                                <CreditCard size={17} />
                                Ödeme Ekle
                              </button>
                            )}

                            <button
                              onClick={() => setDetailOrder(order)}
                              className="flex items-center justify-center gap-2 rounded-2xl bg-cyan-500/15 p-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-500/25"
                            >
                              <Eye size={17} />
                              Detay
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {detailOrder && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#090b16] p-6 shadow-2xl shadow-black/60">
            <div className="flex flex-col gap-4 rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-bold text-emerald-100/70">Ödeme Detayı</p>

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
                <p className="text-xs text-purple-100/50">Cari</p>
                <p className="mt-1 text-2xl font-black text-purple-100">
                  {formatTL(detailOrder.cariAmount)}
                </p>
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
                      <p className="font-black text-emerald-100">
                        {formatTL(payment.amount)}
                      </p>
                      <p className="mt-1 text-xs text-white/40">
                        {payment.note || "Ödeme"}
                      </p>
                    </div>

                    <p className="text-sm font-black text-white/50">
                      {payment.date}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {Math.max(
                Number(detailOrder.totalPrice || 0) -
                  Number(detailOrder.paidAmount || 0),
                0
              ) > 0 && (
                <button
                  onClick={() => {
                    setPaymentOrder(detailOrder);
                    setPaymentAmount("");
                    setPaymentNote("");
                  }}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-4 text-sm font-black text-white shadow-lg shadow-emerald-950/40 transition hover:scale-[1.01]"
                >
                  <CreditCard size={18} />
                  Ödeme Ekle
                </button>
              )}

              <button
                onClick={() => setDetailOrder(null)}
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-sm font-black text-white/70 transition hover:bg-white/15"
              >
                Detayı Kapat
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

              <p className="mt-3 text-sm text-white/50">
                Kalan ödeme:{" "}
                <span className="font-black text-yellow-100">
                  {formatTL(
                    Math.max(
                      Number(paymentOrder.totalPrice || 0) -
                        Number(paymentOrder.paidAmount || 0),
                      0
                    )
                  )}
                </span>
              </p>
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

      <MobileNav />
    </main>
  );
}