"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";
import { fetchOrders, patchOrder, type Order } from "@/lib/ordersApi";
import { formatTL, getOrderDueStatus } from "@/lib/helpers";
import {
  CheckCircle2,
  Eye,
  PackageCheck,
  RefreshCw,
  Search,
  Truck,
  X,
} from "lucide-react";

const tabs = [
  { key: "waiting", label: "Kargo Bekleyen" },
  { key: "shipped", label: "Kargo Çıktı" },
  { key: "completed", label: "Tamamlandı" },
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

export default function CargoPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("waiting");

  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  const [cargoOrder, setCargoOrder] = useState<Order | null>(null);
  const [cargoCompany, setCargoCompany] = useState("Yurtiçi Kargo");
  const [cargoTrackingNo, setCargoTrackingNo] = useState("");

  const [completeOrderTarget, setCompleteOrderTarget] = useState<Order | null>(null);

  async function loadOrders() {
    setLoading(true);

    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (error: any) {
      alert(error?.message || "Kargo verileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function updateOrderCargo(id: number, payload: Partial<Order>) {
    setSaving(true);

    try {
      const updated = await patchOrder(id, payload);

      setOrders((prev) =>
        prev.map((order) => (order.id === id ? updated : order))
      );

      if (detailOrder?.id === id) setDetailOrder(updated);
      if (cargoOrder?.id === id) setCargoOrder(updated);
      if (completeOrderTarget?.id === id) setCompleteOrderTarget(updated);

      return updated;
    } catch (error: any) {
      alert(error?.message || "Kargo işlemi yapılamadı.");
    } finally {
      setSaving(false);
    }
  }

  async function markCargo() {
    if (!cargoOrder) return;

    await updateOrderCargo(cargoOrder.id, {
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

  async function completeSelectedOrder() {
    if (!completeOrderTarget) return;

    await updateOrderCargo(completeOrderTarget.id, {
      status: "Tamamlandı",
    });

    setCompleteOrderTarget(null);
    setActiveTab("completed");
  }

  async function undoCargo(order: Order) {
    await updateOrderCargo(order.id, {
      status: "İşleme Alındı",
      cargoCompany: "",
      cargoTrackingNo: "",
      cargoDate: "",
    });

    setActiveTab("waiting");
  }

  async function undoComplete(order: Order) {
    await updateOrderCargo(order.id, {
      status: "Kargo Çıktı",
    });

    setActiveTab("shipped");
  }

  const validOrders = orders.filter((order) => order.status !== "İptal");

  const waitingOrders = validOrders.filter(
    (order) => order.status !== "Kargo Çıktı" && order.status !== "Tamamlandı"
  );

  const shippedOrders = validOrders.filter((order) => order.status === "Kargo Çıktı");

  const completedOrders = validOrders.filter(
    (order) => order.status === "Tamamlandı"
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
    if (activeTab === "waiting") return waitingOrders;
    if (activeTab === "shipped") return shippedOrders;
    if (activeTab === "completed") return completedOrders;
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
        order.cargoCompany?.toLowerCase().includes(value) ||
        order.cargoTrackingNo?.toLowerCase().includes(value) ||
        order.note?.toLowerCase().includes(value)
      );
    });
  }, [tabOrders, search]);

  const todayCargo = validOrders.filter((order) => order.cargoDate === getToday());

  const cargoTotal = shippedOrders.reduce(
    (sum, order) => sum + Number(order.totalPrice || 0),
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
              <p className="text-sm font-bold text-cyan-100/60">Kargo Bekleyen</p>
              <p className="mt-2 text-3xl font-black text-cyan-100">
                {waitingOrders.length}
              </p>
            </div>

            <div className="rounded-[26px] border border-purple-300/20 bg-purple-500/10 p-5">
              <p className="text-sm font-bold text-purple-100/60">Kargo Çıktı</p>
              <p className="mt-2 text-3xl font-black text-purple-100">
                {shippedOrders.length}
              </p>
            </div>

            <div className="rounded-[26px] border border-emerald-300/20 bg-emerald-500/10 p-5">
              <p className="text-sm font-bold text-emerald-100/60">Tamamlanan</p>
              <p className="mt-2 text-3xl font-black text-emerald-100">
                {completedOrders.length}
              </p>
            </div>

            <div className="rounded-[26px] border border-yellow-300/20 bg-yellow-500/10 p-5">
              <p className="text-sm font-bold text-yellow-100/60">Bugün Kargo</p>
              <p className="mt-2 text-3xl font-black text-yellow-100">
                {todayCargo.length}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm font-bold text-cyan-200/70">Supabase Kargo</p>
                <h1 className="mt-2 text-3xl font-black">Kargo Takibi</h1>
                <p className="mt-2 text-sm leading-6 text-white/45">
                  Kargo bilgileri artık Supabase orders tablosundaki siparişler üzerinden güncellenir.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                  <Search size={18} className="text-white/35" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-transparent text-sm font-semibold outline-none placeholder:text-white/30"
                    placeholder="Sipariş no, müşteri, takip no ara..."
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
                  tab.key === "waiting"
                    ? waitingOrders.length
                    : tab.key === "shipped"
                      ? shippedOrders.length
                      : tab.key === "completed"
                        ? completedOrders.length
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

            <div className="mt-5 space-y-4">
              {loading && (
                <div className="rounded-[24px] border border-white/10 bg-black/20 p-6 text-sm font-bold text-white/50">
                  Kargo verileri yükleniyor...
                </div>
              )}

              {!loading && filteredOrders.length === 0 && (
                <div className="rounded-[24px] border border-white/10 bg-black/20 p-6 text-sm text-white/50">
                  Bu sekmede kargo kaydı yok.
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
                              due.type === "late"
                                ? "bg-red-500/15 text-red-100"
                                : due.type === "soon"
                                  ? "bg-orange-500/15 text-orange-100"
                                  : "bg-white/10 text-white/50"
                            }`}
                          >
                            {due.label}
                          </span>

                          {order.cargoCompany && (
                            <span className="rounded-full bg-purple-500/15 px-3 py-1 text-xs font-black text-purple-100">
                              {order.cargoCompany}
                            </span>
                          )}
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

                        {(order.cargoCompany || order.cargoTrackingNo) && (
                          <div className="mt-3 rounded-2xl border border-purple-400/15 bg-purple-500/5 p-3">
                            <p className="mb-2 text-xs font-black text-purple-100/70">
                              Kargo Bilgisi
                            </p>

                            <div className="grid gap-2 text-sm sm:grid-cols-2">
                              <div className="rounded-xl bg-black/20 p-3">
                                <p className="text-xs text-white/40">Firma</p>
                                <p className="mt-1 font-black text-purple-100">
                                  {order.cargoCompany || "-"}
                                </p>
                              </div>

                              <div className="rounded-xl bg-black/20 p-3">
                                <p className="text-xs text-white/40">Takip No</p>
                                <p className="mt-1 font-black text-purple-100">
                                  {order.cargoTrackingNo || "-"}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[500px]">
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

                        <div className="rounded-2xl bg-purple-500/10 p-3">
                          <p className="text-xs text-purple-100/50">Kargo Tarihi</p>
                          <p className="font-black text-purple-100">
                            {order.cargoDate || "-"}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-emerald-500/10 p-3">
                          <p className="text-xs text-emerald-100/50">Kâr</p>
                          <p className="font-black text-emerald-100">
                            {formatTL(order.profit)}
                          </p>
                        </div>

                        <div onClick={stopCardClick} className="grid gap-2 sm:col-span-2 sm:grid-cols-2">
                          {order.status !== "Kargo Çıktı" && order.status !== "Tamamlandı" && (
                            <button
                              onClick={() => {
                                setCargoOrder(order);
                                setCargoCompany(order.cargoCompany || "Yurtiçi Kargo");
                                setCargoTrackingNo(order.cargoTrackingNo || "");
                              }}
                              className="flex items-center justify-center gap-2 rounded-2xl bg-purple-500/15 p-3 text-sm font-black text-purple-100 transition hover:bg-purple-500/25"
                            >
                              <Truck size={17} />
                              Kargo Çıktı
                            </button>
                          )}

                          {order.status === "Kargo Çıktı" && (
                            <>
                              <button
                                onClick={() => setCompleteOrderTarget(order)}
                                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/15 p-3 text-sm font-black text-emerald-100 transition hover:bg-emerald-500/25"
                              >
                                <CheckCircle2 size={17} />
                                Tamamlandı
                              </button>

                              <button
                                onClick={() => undoCargo(order)}
                                className="rounded-2xl bg-white/10 p-3 text-sm font-black text-white/60 transition hover:bg-white/15"
                              >
                                Kargo Geri Al
                              </button>
                            </>
                          )}

                          {order.status === "Tamamlandı" && (
                            <button
                              onClick={() => undoComplete(order)}
                              className="rounded-2xl bg-white/10 p-3 text-sm font-black text-white/60 transition hover:bg-white/15"
                            >
                              Tamamlanmayı Geri Al
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

            <div className="mt-5 rounded-[24px] border border-purple-300/15 bg-purple-500/10 p-4">
              <p className="text-sm font-black text-purple-100">
                Kargo çıkan siparişlerin toplam satış tutarı: {formatTL(cargoTotal)}
              </p>
            </div>
          </div>
        </section>
      </div>

      {detailOrder && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#090b16] p-6 shadow-2xl shadow-black/60">
            <div className="flex flex-col gap-4 rounded-3xl border border-purple-400/20 bg-purple-500/10 p-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-bold text-purple-100/70">Kargo Detayı</p>

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
              <div className="rounded-2xl bg-purple-500/10 p-4">
                <p className="text-xs text-purple-100/50">Kargo Firması</p>
                <p className="mt-1 text-2xl font-black text-purple-100">
                  {detailOrder.cargoCompany || "-"}
                </p>
              </div>

              <div className="rounded-2xl bg-cyan-500/10 p-4">
                <p className="text-xs text-cyan-100/50">Takip No</p>
                <p className="mt-1 text-2xl font-black text-cyan-100">
                  {detailOrder.cargoTrackingNo || "-"}
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-500/10 p-4">
                <p className="text-xs text-emerald-100/50">Kargo Tarihi</p>
                <p className="mt-1 text-2xl font-black text-emerald-100">
                  {detailOrder.cargoDate || "-"}
                </p>
              </div>

              <div className="rounded-2xl bg-yellow-500/10 p-4">
                <p className="text-xs text-yellow-100/50">Çıkış Tarihi</p>
                <p className="mt-1 text-2xl font-black text-yellow-100">
                  {detailOrder.dueDate || "-"}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                <p className="text-sm font-black text-cyan-100">Sipariş Bilgileri</p>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Info label="Sipariş No" value={`#${detailOrder.orderNo}`} />
                  <Info label="Durum" value={detailOrder.status || "-"} />
                  <Info label="İşleme Tarihi" value={detailOrder.processDate || "-"} />
                  <Info label="İş Günü" value={`${detailOrder.workDays || 12} iş günü`} />
                  <Info label="Satış" value={formatTL(detailOrder.totalPrice)} />
                  <Info label="Kalan" value={formatTL(Math.max(Number(detailOrder.totalPrice || 0) - Number(detailOrder.paidAmount || 0), 0))} />
                </div>

                {detailOrder.note && (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <p className="text-xs font-black text-white/40">Not</p>
                    <p className="mt-2 text-sm leading-6 text-white/65">
                      {detailOrder.note}
                    </p>
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
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {detailOrder.status !== "Kargo Çıktı" && detailOrder.status !== "Tamamlandı" && (
                <button
                  onClick={() => {
                    setCargoOrder(detailOrder);
                    setCargoCompany(detailOrder.cargoCompany || "Yurtiçi Kargo");
                    setCargoTrackingNo(detailOrder.cargoTrackingNo || "");
                  }}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-500 px-4 py-4 text-sm font-black text-white shadow-lg shadow-purple-950/40 transition hover:scale-[1.01]"
                >
                  <Truck size={18} />
                  Kargo Çıktı Yap
                </button>
              )}

              {detailOrder.status === "Kargo Çıktı" && (
                <button
                  onClick={() => setCompleteOrderTarget(detailOrder)}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-4 text-sm font-black text-white shadow-lg shadow-emerald-950/40 transition hover:scale-[1.01]"
                >
                  <CheckCircle2 size={18} />
                  Tamamlandı Yap
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

      {cargoOrder && (
        <div className="fixed inset-0 z-[95] grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#090b16] p-6 shadow-2xl shadow-black/60">
            <div className="rounded-3xl border border-purple-400/20 bg-purple-500/10 p-5">
              <p className="text-sm font-bold text-purple-100/70">Kargo Çıktı</p>
              <h2 className="mt-2 text-2xl font-black text-white">
                #{cargoOrder.orderNo} · {cargoOrder.customer}
              </h2>

              <p className="mt-3 text-sm leading-6 text-white/50">
                Kargo firmasını ve takip numarasını girerek siparişi kargo çıktı yap.
              </p>
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

      {completeOrderTarget && (
        <div className="fixed inset-0 z-[95] grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#090b16] p-6 shadow-2xl shadow-black/60">
            <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-5">
              <p className="text-sm font-bold text-emerald-100/70">Tamamlandı</p>
              <h2 className="mt-2 text-2xl font-black text-white">
                #{completeOrderTarget.orderNo} · {completeOrderTarget.customer}
              </h2>

              <p className="mt-3 text-sm leading-6 text-white/50">
                Bu sipariş tamamlandı olarak işaretlensin mi?
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => setCompleteOrderTarget(null)}
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-sm font-black text-white/70 transition hover:bg-white/15"
              >
                Vazgeç
              </button>

              <button
                onClick={completeSelectedOrder}
                disabled={saving}
                className="rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-4 text-sm font-black text-white shadow-lg shadow-emerald-950/40 transition hover:scale-[1.02] disabled:opacity-60"
              >
                {saving ? "Kaydediliyor..." : "Evet, Tamamlandı"}
              </button>
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