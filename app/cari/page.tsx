"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";
import { fetchOrders, patchOrder, type Order } from "@/lib/ordersApi";
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
  { key: "pending", label: "Cari Bekleyen" },
  { key: "paid", label: "Cari Verilen" },
  { key: "all", label: "Tümü" },
];

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

export default function CariPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [confirmOrder, setConfirmOrder] = useState<Order | null>(null);
  const [undoOrder, setUndoOrder] = useState<Order | null>(null);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  async function loadOrders() {
    setLoading(true);

    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (error: any) {
      alert(error?.message || "Cari verileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function updateOrderCari(id: number, cariPaid: boolean) {
    setSaving(true);

    try {
      const updated = await patchOrder(id, { cariPaid });

      setOrders((prev) =>
        prev.map((order) => (order.id === id ? updated : order))
      );

      if (detailOrder?.id === id) setDetailOrder(updated);

      return updated;
    } catch (error: any) {
      alert(error?.message || "Cari işlemi yapılamadı.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmCari() {
    if (!confirmOrder) return;

    await updateOrderCari(confirmOrder.id, true);
    setConfirmOrder(null);
  }

  async function undoCari() {
    if (!undoOrder) return;

    await updateOrderCari(undoOrder.id, false);
    setUndoOrder(null);
  }

  async function bulkConfirmCari() {
    if (selectedIds.length === 0) return;

    setSaving(true);

    try {
      const updatedOrders: Order[] = [];

      for (const id of selectedIds) {
        const updated = await patchOrder(id, { cariPaid: true });
        updatedOrders.push(updated);
      }

      setOrders((prev) =>
        prev.map((order) => {
          const updated = updatedOrders.find((item) => item.id === order.id);
          return updated || order;
        })
      );

      setSelectedIds([]);
      setBulkConfirmOpen(false);
    } catch (error: any) {
      alert(error?.message || "Toplu cari işlemi yapılamadı.");
    } finally {
      setSaving(false);
    }
  }

  const validOrders = orders.filter((order) => order.status !== "İptal");

  const pendingCariOrders = validOrders.filter(
    (order) => !order.cariPaid && Number(order.cariAmount || 0) > 0
  );

  const paidCariOrders = validOrders.filter(
    (order) => order.cariPaid && Number(order.cariAmount || 0) > 0
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
    if (activeTab === "pending") return pendingCariOrders;
    if (activeTab === "paid") return paidCariOrders;
    return validOrders.filter((order) => Number(order.cariAmount || 0) > 0);
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

  const totalPendingCari = pendingCariOrders.reduce(
    (sum, order) => sum + Number(order.cariAmount || 0),
    0
  );

  const totalPaidCari = paidCariOrders.reduce(
    (sum, order) => sum + Number(order.cariAmount || 0),
    0
  );

  const selectedOrders = pendingCariOrders.filter((order) =>
    selectedIds.includes(order.id)
  );

  const selectedTotal = selectedOrders.reduce(
    (sum, order) => sum + Number(order.cariAmount || 0),
    0
  );

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }

      return [...prev, id];
    });
  }

  function selectAllVisible() {
    const ids = filteredOrders
      .filter((order) => !order.cariPaid)
      .map((order) => order.id);

    setSelectedIds(ids);
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  return (
    <main className="min-h-screen bg-[#070812] text-white">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(91,74,255,0.26),transparent_35%),radial-gradient(circle_at_top_right,rgba(0,183,255,0.18),transparent_30%),radial-gradient(circle_at_bottom,rgba(132,32,255,0.12),transparent_35%)]" />

      <div className="relative flex">
        <Sidebar />

        <section className="min-h-screen flex-1 px-4 py-4 pb-28 lg:ml-72 lg:px-8">
          <Topbar delayedCount={delayedOrders.length} upcomingCount={upcomingOrders.length} />

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[26px] border border-purple-300/20 bg-purple-500/10 p-5">
              <p className="text-sm font-bold text-purple-100/60">Cari Bekleyen</p>
              <p className="mt-2 text-3xl font-black text-purple-100">
                {formatTL(totalPendingCari)}
              </p>
            </div>

            <div className="rounded-[26px] border border-emerald-300/20 bg-emerald-500/10 p-5">
              <p className="text-sm font-bold text-emerald-100/60">Cari Verilen</p>
              <p className="mt-2 text-3xl font-black text-emerald-100">
                {formatTL(totalPaidCari)}
              </p>
            </div>

            <div className="rounded-[26px] border border-cyan-300/20 bg-cyan-500/10 p-5">
              <p className="text-sm font-bold text-cyan-100/60">Bekleyen Sipariş</p>
              <p className="mt-2 text-3xl font-black text-cyan-100">
                {pendingCariOrders.length}
              </p>
            </div>

            <div className="rounded-[26px] border border-yellow-300/20 bg-yellow-500/10 p-5">
              <p className="text-sm font-bold text-yellow-100/60">Seçili Cari</p>
              <p className="mt-2 text-3xl font-black text-yellow-100">
                {formatTL(selectedTotal)}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm font-bold text-cyan-200/70">Supabase Cari</p>
                <h1 className="mt-2 text-3xl font-black">Cari Takibi</h1>
                <p className="mt-2 text-sm leading-6 text-white/45">
                  Cari durumu artık Supabase orders tablosundaki siparişler üzerinden güncellenir.
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

            <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {tabs.map((tab) => {
                  const count =
                    tab.key === "pending"
                      ? pendingCariOrders.length
                      : tab.key === "paid"
                        ? paidCariOrders.length
                        : validOrders.filter((order) => Number(order.cariAmount || 0) > 0).length;

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

              {activeTab === "pending" && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={selectAllVisible}
                    className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black text-white/65 transition hover:bg-white/15"
                  >
                    Görünenleri Seç
                  </button>

                  <button
                    onClick={clearSelection}
                    className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black text-white/65 transition hover:bg-white/15"
                  >
                    Seçimi Temizle
                  </button>

                  <button
                    onClick={() => setBulkConfirmOpen(true)}
                    disabled={selectedIds.length === 0}
                    className="rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-purple-950/40 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Seçili Cari Verildi
                  </button>
                </div>
              )}
            </div>

            <div className="mt-5 space-y-4">
              {loading && (
                <div className="rounded-[24px] border border-white/10 bg-black/20 p-6 text-sm font-bold text-white/50">
                  Cari verileri yükleniyor...
                </div>
              )}

              {!loading && filteredOrders.length === 0 && (
                <div className="rounded-[24px] border border-white/10 bg-black/20 p-6 text-sm text-white/50">
                  Bu sekmede cari kaydı yok.
                </div>
              )}

              {filteredOrders.map((order) => {
                const due = getOrderDueStatus(order.processDate, order.workDays);
                const remaining = Math.max(
                  Number(order.totalPrice || 0) - Number(order.paidAmount || 0),
                  0
                );

                const isSelected = selectedIds.includes(order.id);

                return (
                  <div
                    key={order.id}
                    onClick={() => setDetailOrder(order)}
                    className={`cursor-pointer rounded-[26px] border p-4 transition hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-white/[0.055] ${
                      isSelected
                        ? "border-cyan-300/30 bg-cyan-400/10"
                        : "border-white/10 bg-black/20"
                    }`}
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          {!order.cariPaid && (
                            <label
                              onClick={stopCardClick}
                              className="flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black text-white/60"
                            >
                              <input
                                checked={isSelected}
                                onChange={() => toggleSelect(order.id)}
                                type="checkbox"
                                className="h-4 w-4 accent-cyan-400"
                              />
                              Seç
                            </label>
                          )}

                          <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-200">
                            #{order.orderNo}
                          </span>

                          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusStyle(order.status)}`}>
                            {order.status}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${
                              order.cariPaid
                                ? "bg-emerald-500/15 text-emerald-100"
                                : "bg-purple-500/15 text-purple-100"
                            }`}
                          >
                            {order.cariPaid ? "Cari Verildi" : "Cari Bekliyor"}
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
                        <div className="rounded-2xl bg-purple-500/10 p-3">
                          <p className="text-xs text-purple-100/50">Cari Tutarı</p>
                          <p className="font-black text-purple-100">
                            {formatTL(order.cariAmount)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-cyan-500/10 p-3">
                          <p className="text-xs text-cyan-100/50">Satış</p>
                          <p className="font-black text-cyan-100">
                            {formatTL(order.totalPrice)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-yellow-500/10 p-3">
                          <p className="text-xs text-yellow-100/50">Kalan Ödeme</p>
                          <p className="font-black text-yellow-100">
                            {formatTL(remaining)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-emerald-500/10 p-3">
                          <p className="text-xs text-emerald-100/50">Kâr</p>
                          <p className="font-black text-emerald-100">
                            {formatTL(order.profit)}
                          </p>
                        </div>

                        <div onClick={stopCardClick} className="grid gap-2 sm:col-span-2 sm:grid-cols-2">
                          {!order.cariPaid ? (
                            <button
                              onClick={() => setConfirmOrder(order)}
                              className="flex items-center justify-center gap-2 rounded-2xl bg-purple-500/15 p-3 text-sm font-black text-purple-100 transition hover:bg-purple-500/25"
                            >
                              <CheckCircle2 size={17} />
                              Cari Verildi
                            </button>
                          ) : (
                            <button
                              onClick={() => setUndoOrder(order)}
                              className="rounded-2xl bg-white/10 p-3 text-sm font-black text-white/60 transition hover:bg-white/15"
                            >
                              Cari Geri Al
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
          </div>
        </section>
      </div>

      {detailOrder && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#090b16] p-6 shadow-2xl shadow-black/60">
            <div className="flex flex-col gap-4 rounded-3xl border border-purple-400/20 bg-purple-500/10 p-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-bold text-purple-100/70">Cari Detayı</p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <h2 className="text-3xl font-black text-white">
                    #{detailOrder.orderNo} · {detailOrder.customer}
                  </h2>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${
                      detailOrder.cariPaid
                        ? "bg-emerald-500/15 text-emerald-100"
                        : "bg-purple-500/15 text-purple-100"
                    }`}
                  >
                    {detailOrder.cariPaid ? "Cari Verildi" : "Cari Bekliyor"}
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
              <div className="rounded-2xl bg-purple-500/10 p-4">
                <p className="text-xs text-purple-100/50">Cari</p>
                <p className="mt-1 text-2xl font-black text-purple-100">
                  {formatTL(detailOrder.cariAmount)}
                </p>
              </div>

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
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                <p className="text-sm font-black text-purple-100">Sipariş Bilgileri</p>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Info label="Sipariş No" value={`#${detailOrder.orderNo}`} />
                  <Info label="Durum" value={detailOrder.status || "-"} />
                  <Info label="İşleme Tarihi" value={detailOrder.processDate || "-"} />
                  <Info label="Çıkış Tarihi" value={detailOrder.dueDate || "-"} />
                  <Info label="Cari Durumu" value={detailOrder.cariPaid ? "Cari verildi" : "Cari bekliyor"} />
                  <Info label="Kâr" value={formatTL(detailOrder.profit)} />
                </div>

                {detailOrder.note && (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <p className="text-xs font-black text-white/40">Not</p>
                    <p className="mt-2 text-sm leading-6 text-white/65">{detailOrder.note}</p>
                  </div>
                )}
              </div>

              <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                <p className="text-sm font-black text-cyan-100">Ürün Detayları</p>

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
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {!detailOrder.cariPaid ? (
                <button
                  onClick={() => setConfirmOrder(detailOrder)}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-500 px-4 py-4 text-sm font-black text-white shadow-lg shadow-purple-950/40 transition hover:scale-[1.01]"
                >
                  <CheckCircle2 size={18} />
                  Cari Verildi Yap
                </button>
              ) : (
                <button
                  onClick={() => setUndoOrder(detailOrder)}
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-sm font-black text-white/70 transition hover:bg-white/15"
                >
                  Cari Geri Al
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

      {confirmOrder && (
        <ConfirmModal
          title="Cari Verildi"
          description={`#${confirmOrder.orderNo} ${confirmOrder.customer} siparişinin carisi verildi olarak işaretlensin mi?`}
          amount={confirmOrder.cariAmount}
          loading={saving}
          confirmText="Evet, Cari Verildi"
          tone="purple"
          onClose={() => setConfirmOrder(null)}
          onConfirm={confirmCari}
        />
      )}

      {undoOrder && (
        <ConfirmModal
          title="Cari Geri Al"
          description={`#${undoOrder.orderNo} ${undoOrder.customer} siparişinin cari durumu geri alınsın mı?`}
          amount={undoOrder.cariAmount}
          loading={saving}
          confirmText="Evet, Geri Al"
          tone="cyan"
          onClose={() => setUndoOrder(null)}
          onConfirm={undoCari}
        />
      )}

      {bulkConfirmOpen && (
        <ConfirmModal
          title="Toplu Cari Verildi"
          description={`${selectedIds.length} sipariş için cari verildi olarak işaretlenecek.`}
          amount={selectedTotal}
          loading={saving}
          confirmText="Seçili Carileri Onayla"
          tone="purple"
          onClose={() => setBulkConfirmOpen(false)}
          onConfirm={bulkConfirmCari}
        />
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

function ConfirmModal({
  title,
  description,
  amount,
  loading,
  confirmText,
  tone,
  onClose,
  onConfirm,
}: {
  title: string;
  description: string;
  amount: number;
  loading: boolean;
  confirmText: string;
  tone: "purple" | "cyan";
  onClose: () => void;
  onConfirm: () => void;
}) {
  const toneClass =
    tone === "purple"
      ? "border-purple-400/20 bg-purple-500/10 text-purple-100 from-purple-500 to-cyan-500"
      : "border-cyan-400/20 bg-cyan-500/10 text-cyan-100 from-cyan-500 to-blue-600";

  return (
    <div className="fixed inset-0 z-[95] grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#090b16] p-6 shadow-2xl shadow-black/60">
        <div className={`rounded-3xl border p-5 ${toneClass}`}>
          <p className="text-sm font-bold opacity-70">{title}</p>
          <h2 className="mt-2 text-2xl font-black text-white">
            {formatTL(amount)}
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/55">
            {description}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-sm font-black text-white/70 transition hover:bg-white/15 disabled:opacity-50"
          >
            Vazgeç
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-2xl bg-gradient-to-r px-4 py-4 text-sm font-black text-white shadow-lg shadow-black/30 transition hover:scale-[1.02] disabled:opacity-60 ${toneClass}`}
          >
            {loading ? "Kaydediliyor..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}