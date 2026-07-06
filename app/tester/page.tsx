"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";
import { fetchOrders, type Order } from "@/lib/ordersApi";
import {
  createTester,
  deleteTester,
  fetchTesters,
  updateTester,
  type Tester,
} from "@/lib/testersApi";
import { formatTL, getOrderDueStatus } from "@/lib/helpers";
import {
  CheckCircle2,
  Edit3,
  Eye,
  FlaskConical,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Truck,
  X,
} from "lucide-react";

const tabs = [
  { key: "active", label: "Dönüş Bekleyen" },
  { key: "shipped", label: "Kargo Çıktı" },
  { key: "converted", label: "Siparişe Döndü" },
  { key: "closed", label: "Kapandı" },
  { key: "all", label: "Tümü" },
];

const channels = ["Instagram", "WhatsApp", "Telefon", "Web Sitesi", "Referans", "Diğer"];

const products = [
  "Oto Kokusu Tester",
  "Selüloz Tester",
  "Paspas Tester",
  "Bardak Altlığı Tester",
  "Karışık Tester",
  "Diğer",
];

const essences = [
  "Okyanus",
  "Sakız",
  "Portakal",
  "Çilek",
  "Limon",
  "Bahar",
  "Fresh",
  "Mentol",
  "Hanımeli",
  "Mango",
  "Elma",
  "Lavanta",
  "Vanilya",
  "Blackberry / Böğürtlen",
  "Latte / Sütlü Kahve",
  "Çam",
  "Kavun",
  "Tropik Meyve",
  "Karışık",
  "Diğer",
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

function getNowIso() {
  return new Date().toISOString();
}

function emptyForm() {
  return {
    customer: "",
    channel: "Instagram",
    contact: "",
    product: "Oto Kokusu Tester",
    essence: "Karışık",
    quantity: "1",
    sendDate: getToday(),
    cargoCompany: "Yurtiçi Kargo",
    cargoTrackingNo: "",
    status: "Dönüş Bekleniyor",
    note: "",
  };
}

function statusStyle(status: string) {
  if (status === "Siparişe Döndü") {
    return "bg-emerald-500/15 text-emerald-200 border-emerald-300/20";
  }

  if (status === "Kargo Çıktı") {
    return "bg-purple-500/15 text-purple-200 border-purple-300/20";
  }

  if (status === "Kapandı") {
    return "bg-red-500/15 text-red-200 border-red-300/20";
  }

  return "bg-cyan-500/15 text-cyan-200 border-cyan-300/20";
}

function stopCardClick(event: React.MouseEvent) {
  event.stopPropagation();
}

export default function TesterPage() {
  const [testers, setTesters] = useState<Tester[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("active");

  const [formOpen, setFormOpen] = useState(false);
  const [editingTester, setEditingTester] = useState<Tester | null>(null);
  const [form, setForm] = useState(emptyForm());

  const [detailTester, setDetailTester] = useState<Tester | null>(null);

  async function loadData() {
    setLoading(true);

    try {
      const [testersData, ordersData] = await Promise.all([
        fetchTesters(),
        fetchOrders(),
      ]);

      setTesters(testersData);
      setOrders(ordersData);
    } catch (error: any) {
      alert(error?.message || "Tester verileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function openNewForm() {
    setEditingTester(null);
    setForm(emptyForm());
    setFormOpen(true);
  }

  function openEditForm(tester: Tester) {
    setEditingTester(tester);

    setForm({
      customer: tester.customer || "",
      channel: tester.channel || "Instagram",
      contact: tester.contact || "",
      product: tester.product || "Oto Kokusu Tester",
      essence: tester.essence || "Karışık",
      quantity: tester.quantity || "1",
      sendDate: tester.sendDate || getToday(),
      cargoCompany: tester.cargoCompany || "Yurtiçi Kargo",
      cargoTrackingNo: tester.cargoTrackingNo || "",
      status: tester.status || "Dönüş Bekleniyor",
      note: tester.note || "",
    });

    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingTester(null);
    setForm(emptyForm());
  }

  async function saveTester() {
    if (!form.customer.trim()) {
      alert("Müşteri adı girmen gerekiyor.");
      return;
    }

    setSaving(true);

    try {
      if (editingTester) {
        const updated = await updateTester(editingTester.id, {
          customer: form.customer.trim(),
          channel: form.channel,
          contact: form.contact.trim(),
          product: form.product,
          essence: form.essence,
          quantity: form.quantity,
          sendDate: form.sendDate,
          cargoCompany: form.cargoCompany,
          cargoTrackingNo: form.cargoTrackingNo.trim(),
          status: form.status,
          note: form.note,
        });

        setTesters((prev) =>
          prev.map((tester) =>
            tester.id === editingTester.id ? updated : tester
          )
        );

        if (detailTester?.id === editingTester.id) {
          setDetailTester(updated);
        }
      } else {
        const created = await createTester({
          customer: form.customer.trim(),
          channel: form.channel,
          contact: form.contact.trim(),
          product: form.product,
          essence: form.essence,
          quantity: form.quantity,
          sendDate: form.sendDate,
          cargoCompany: form.cargoCompany,
          cargoTrackingNo: form.cargoTrackingNo.trim(),
          status: form.status,
          note: form.note,
        });

        setTesters((prev) => [created, ...prev]);
      }

      closeForm();
    } catch (error: any) {
      alert(error?.message || "Tester kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  async function patchTesterStatus(id: number, payload: Partial<Tester>) {
    setSaving(true);

    try {
      const updated = await updateTester(id, payload);

      setTesters((prev) =>
        prev.map((tester) => (tester.id === id ? updated : tester))
      );

      if (detailTester?.id === id) {
        setDetailTester(updated);
      }

      return updated;
    } catch (error: any) {
      alert(error?.message || "Tester güncellenemedi.");
    } finally {
      setSaving(false);
    }
  }

  async function markShipped(tester: Tester) {
    await patchTesterStatus(tester.id, {
      status: "Kargo Çıktı",
      sendDate: tester.sendDate || getToday(),
    });

    setActiveTab("shipped");
  }

  async function markConverted(tester: Tester) {
    await patchTesterStatus(tester.id, {
      status: "Siparişe Döndü",
      convertedAt: getNowIso(),
      closedAt: "",
    });

    setActiveTab("converted");
  }

  async function markClosed(tester: Tester) {
    await patchTesterStatus(tester.id, {
      status: "Kapandı",
      closedAt: getNowIso(),
    });

    setActiveTab("closed");
  }

  async function undoStatus(tester: Tester) {
    await patchTesterStatus(tester.id, {
      status: "Dönüş Bekleniyor",
      convertedAt: "",
      closedAt: "",
    });

    setActiveTab("active");
  }

  async function removeTester(tester: Tester) {
    const approved = window.confirm(
      `${tester.customer} tester kaydını silmek istiyor musun?`
    );

    if (!approved) return;

    setSaving(true);

    try {
      await deleteTester(tester.id);
      setTesters((prev) => prev.filter((item) => item.id !== tester.id));

      if (detailTester?.id === tester.id) {
        setDetailTester(null);
      }
    } catch (error: any) {
      alert(error?.message || "Tester silinemedi.");
    } finally {
      setSaving(false);
    }
  }

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

  const activeTesters = testers.filter(
    (tester) =>
      tester.status !== "Siparişe Döndü" &&
      tester.status !== "Kapandı" &&
      tester.status !== "Kargo Çıktı"
  );

  const shippedTesters = testers.filter(
    (tester) => tester.status === "Kargo Çıktı"
  );

  const convertedTesters = testers.filter(
    (tester) => tester.status === "Siparişe Döndü"
  );

  const closedTesters = testers.filter((tester) => tester.status === "Kapandı");

  const tabTesters = useMemo(() => {
    if (activeTab === "active") return activeTesters;
    if (activeTab === "shipped") return shippedTesters;
    if (activeTab === "converted") return convertedTesters;
    if (activeTab === "closed") return closedTesters;
    return testers;
  }, [activeTab, testers]);

  const filteredTesters = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) return tabTesters;

    return tabTesters.filter((tester) => {
      return (
        tester.customer?.toLowerCase().includes(value) ||
        tester.channel?.toLowerCase().includes(value) ||
        tester.contact?.toLowerCase().includes(value) ||
        tester.product?.toLowerCase().includes(value) ||
        tester.essence?.toLowerCase().includes(value) ||
        tester.status?.toLowerCase().includes(value) ||
        tester.note?.toLowerCase().includes(value) ||
        tester.cargoTrackingNo?.toLowerCase().includes(value)
      );
    });
  }, [tabTesters, search]);

  const conversionRate =
    testers.length > 0
      ? Math.round((convertedTesters.length / testers.length) * 100)
      : 0;

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

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[26px] border border-cyan-300/20 bg-cyan-500/10 p-5">
              <p className="text-sm font-bold text-cyan-100/60">
                Dönüş Bekleyen
              </p>
              <p className="mt-2 text-3xl font-black text-cyan-100">
                {activeTesters.length}
              </p>
            </div>

            <div className="rounded-[26px] border border-purple-300/20 bg-purple-500/10 p-5">
              <p className="text-sm font-bold text-purple-100/60">
                Kargo Çıktı
              </p>
              <p className="mt-2 text-3xl font-black text-purple-100">
                {shippedTesters.length}
              </p>
            </div>

            <div className="rounded-[26px] border border-emerald-300/20 bg-emerald-500/10 p-5">
              <p className="text-sm font-bold text-emerald-100/60">
                Siparişe Döndü
              </p>
              <p className="mt-2 text-3xl font-black text-emerald-100">
                {convertedTesters.length}
              </p>
            </div>

            <div className="rounded-[26px] border border-yellow-300/20 bg-yellow-500/10 p-5">
              <p className="text-sm font-bold text-yellow-100/60">
                Dönüş Oranı
              </p>
              <p className="mt-2 text-3xl font-black text-yellow-100">
                %{conversionRate}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm font-bold text-purple-200/70">
                  Supabase Tester
                </p>

                <h1 className="mt-2 text-3xl font-black">Tester Takibi</h1>

                <p className="mt-2 text-sm leading-6 text-white/45">
                  Tester kayıtları artık Supabase testers tablosuna kaydedilir.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                  <Search size={18} className="text-white/35" />

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="bg-transparent text-sm font-semibold outline-none placeholder:text-white/30"
                    placeholder="Müşteri, ürün, esans, takip no ara..."
                  />
                </div>

                <button
                  onClick={loadData}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-white/70 transition hover:bg-white/15 disabled:opacity-50"
                >
                  <RefreshCw
                    size={17}
                    className={loading ? "animate-spin" : ""}
                  />
                  Yenile
                </button>

                <button
                  onClick={openNewForm}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-purple-950/40 transition hover:scale-[1.02]"
                >
                  <Plus size={18} />
                  Tester Ekle
                </button>
              </div>
            </div>

            <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
              {tabs.map((tab) => {
                const count =
                  tab.key === "active"
                    ? activeTesters.length
                    : tab.key === "shipped"
                      ? shippedTesters.length
                      : tab.key === "converted"
                        ? convertedTesters.length
                        : tab.key === "closed"
                          ? closedTesters.length
                          : testers.length;

                const isActive = activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`shrink-0 rounded-2xl border px-4 py-3 text-sm font-black transition ${
                      isActive
                        ? "border-purple-300/30 bg-purple-400/15 text-purple-100"
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
                  Tester verileri yükleniyor...
                </div>
              )}

              {!loading && filteredTesters.length === 0 && (
                <div className="rounded-[24px] border border-white/10 bg-black/20 p-6 text-sm text-white/50">
                  Bu sekmede tester kaydı yok.
                </div>
              )}

              {filteredTesters.map((tester) => (
                <div
                  key={tester.id}
                  onClick={() => setDetailTester(tester)}
                  className="cursor-pointer rounded-[26px] border border-white/10 bg-black/20 p-4 transition hover:-translate-y-0.5 hover:border-purple-300/25 hover:bg-white/[0.055]"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${statusStyle(
                            tester.status
                          )}`}
                        >
                          {tester.status}
                        </span>

                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/60">
                          {tester.channel || "Kanal yok"}
                        </span>

                        <span className="rounded-full bg-purple-500/15 px-3 py-1 text-xs font-black text-purple-100">
                          {tester.sendDate || "Tarih yok"}
                        </span>
                      </div>

                      <h2 className="mt-3 text-xl font-black">
                        {tester.customer}
                      </h2>

                      <p className="mt-1 text-sm text-white/45">
                        {tester.contact || "İletişim bilgisi yok"}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-xs text-white/60">
                          {tester.product || "Ürün yok"}
                        </span>

                        <span className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-xs text-white/60">
                          {tester.essence || "Esans yok"}
                        </span>

                        <span className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-xs text-white/60">
                          {tester.quantity || "1"} adet
                        </span>
                      </div>

                      {(tester.cargoCompany || tester.cargoTrackingNo) && (
                        <div className="mt-3 rounded-2xl border border-purple-400/15 bg-purple-500/5 p-3">
                          <p className="mb-2 text-xs font-black text-purple-100/70">
                            Kargo Bilgisi
                          </p>

                          <div className="grid gap-2 text-sm sm:grid-cols-2">
                            <div className="rounded-xl bg-black/20 p-3">
                              <p className="text-xs text-white/40">Firma</p>
                              <p className="mt-1 font-black text-purple-100">
                                {tester.cargoCompany || "-"}
                              </p>
                            </div>

                            <div className="rounded-xl bg-black/20 p-3">
                              <p className="text-xs text-white/40">Takip No</p>
                              <p className="mt-1 font-black text-purple-100">
                                {tester.cargoTrackingNo || "-"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div
                      onClick={stopCardClick}
                      className="grid gap-2 sm:grid-cols-2 xl:min-w-[460px]"
                    >
                      {tester.status === "Dönüş Bekleniyor" && (
                        <button
                          onClick={() => markShipped(tester)}
                          className="flex items-center justify-center gap-2 rounded-2xl bg-purple-500/15 p-3 text-sm font-black text-purple-100 transition hover:bg-purple-500/25"
                        >
                          <Truck size={17} />
                          Kargo Çıktı
                        </button>
                      )}

                      {(tester.status === "Dönüş Bekleniyor" ||
                        tester.status === "Kargo Çıktı") && (
                        <button
                          onClick={() => markConverted(tester)}
                          className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/15 p-3 text-sm font-black text-emerald-100 transition hover:bg-emerald-500/25"
                        >
                          <CheckCircle2 size={17} />
                          Siparişe Döndü
                        </button>
                      )}

                      {tester.status !== "Kapandı" &&
                        tester.status !== "Siparişe Döndü" && (
                          <button
                            onClick={() => markClosed(tester)}
                            className="rounded-2xl bg-red-500/15 p-3 text-sm font-black text-red-100 transition hover:bg-red-500/25"
                          >
                            Kapandı
                          </button>
                        )}

                      {(tester.status === "Kapandı" ||
                        tester.status === "Siparişe Döndü" ||
                        tester.status === "Kargo Çıktı") && (
                        <button
                          onClick={() => undoStatus(tester)}
                          className="rounded-2xl bg-white/10 p-3 text-sm font-black text-white/60 transition hover:bg-white/15"
                        >
                          Geri Al
                        </button>
                      )}

                      <button
                        onClick={() => openEditForm(tester)}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-cyan-500/15 p-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-500/25"
                      >
                        <Edit3 size={17} />
                        Düzenle
                      </button>

                      <button
                        onClick={() => setDetailTester(tester)}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-white/10 p-3 text-sm font-black text-white/65 transition hover:bg-white/15"
                      >
                        <Eye size={17} />
                        Detay
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {detailTester && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#090b16] p-6 shadow-2xl shadow-black/60">
            <div className="flex flex-col gap-4 rounded-3xl border border-purple-400/20 bg-purple-500/10 p-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-bold text-purple-100/70">
                  Tester Detayı
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <h2 className="text-3xl font-black text-white">
                    {detailTester.customer}
                  </h2>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${statusStyle(
                      detailTester.status
                    )}`}
                  >
                    {detailTester.status}
                  </span>
                </div>

                <p className="mt-2 text-sm text-white/55">
                  {detailTester.channel} ·{" "}
                  {detailTester.contact || "İletişim bilgisi yok"}
                </p>
              </div>

              <button
                onClick={() => setDetailTester(null)}
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black text-white/70 transition hover:bg-white/15"
              >
                Kapat
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Info label="Ürün" value={detailTester.product || "-"} />
              <Info label="Esans" value={detailTester.essence || "-"} />
              <Info label="Adet" value={detailTester.quantity || "-"} />
              <Info label="Gönderim" value={detailTester.sendDate || "-"} />
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                <p className="text-sm font-black text-purple-100">
                  Kargo Bilgileri
                </p>

                <div className="mt-4 grid gap-3">
                  <Info
                    label="Kargo Firması"
                    value={detailTester.cargoCompany || "-"}
                  />
                  <Info
                    label="Takip No"
                    value={detailTester.cargoTrackingNo || "-"}
                  />
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                <p className="text-sm font-black text-cyan-100">Not</p>

                <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-white/60">
                  {detailTester.note || "Not yok."}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <button
                onClick={() => openEditForm(detailTester)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-cyan-500/15 p-4 text-sm font-black text-cyan-100 transition hover:bg-cyan-500/25"
              >
                <Edit3 size={18} />
                Düzenle
              </button>

              <button
                onClick={() => removeTester(detailTester)}
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-2xl bg-red-500/15 p-4 text-sm font-black text-red-100 transition hover:bg-red-500/25 disabled:opacity-50"
              >
                <Trash2 size={18} />
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-[95] grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#090b16] p-6 shadow-2xl shadow-black/60">
            <div className="flex items-start justify-between gap-4 rounded-3xl border border-purple-400/20 bg-purple-500/10 p-5">
              <div>
                <p className="text-sm font-bold text-purple-100/70">
                  {editingTester ? "Tester Düzenle" : "Yeni Tester"}
                </p>

                <h2 className="mt-2 text-2xl font-black text-white">
                  {editingTester ? "Tester kaydını güncelle" : "Tester kaydı ekle"}
                </h2>

                <p className="mt-2 text-sm leading-6 text-white/45">
                  Kayıt Supabase testers tablosuna yazılır.
                </p>
              </div>

              <button
                onClick={closeForm}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/10 text-white/60 transition hover:bg-white/15"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <input
                value={form.customer}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, customer: event.target.value }))
                }
                className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm font-bold outline-none placeholder:text-white/25"
                placeholder="Müşteri adı / firma"
              />

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <label className="text-xs font-black text-white/40">Kanal</label>
                <select
                  value={form.channel}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, channel: event.target.value }))
                  }
                  className="mt-2 w-full bg-transparent text-sm font-bold outline-none"
                >
                  {channels.map((channel) => (
                    <option key={channel}>{channel}</option>
                  ))}
                </select>
              </div>

              <input
                value={form.contact}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, contact: event.target.value }))
                }
                className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm font-bold outline-none placeholder:text-white/25 md:col-span-2"
                placeholder="İletişim bilgisi"
              />

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <label className="text-xs font-black text-white/40">Ürün</label>
                <select
                  value={form.product}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, product: event.target.value }))
                  }
                  className="mt-2 w-full bg-transparent text-sm font-bold outline-none"
                >
                  {products.map((product) => (
                    <option key={product}>{product}</option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <label className="text-xs font-black text-white/40">Esans</label>
                <select
                  value={form.essence}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, essence: event.target.value }))
                  }
                  className="mt-2 w-full bg-transparent text-sm font-bold outline-none"
                >
                  {essences.map((essence) => (
                    <option key={essence}>{essence}</option>
                  ))}
                </select>
              </div>

              <input
                value={form.quantity}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, quantity: event.target.value }))
                }
                className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm font-bold outline-none placeholder:text-white/25"
                placeholder="Adet"
              />

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <label className="text-xs font-black text-white/40">
                  Gönderim Tarihi
                </label>
                <input
                  type="date"
                  value={form.sendDate}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, sendDate: event.target.value }))
                  }
                  className="mt-2 w-full bg-transparent text-sm font-bold outline-none"
                />
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <label className="text-xs font-black text-white/40">
                  Kargo Firması
                </label>
                <select
                  value={form.cargoCompany}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      cargoCompany: event.target.value,
                    }))
                  }
                  className="mt-2 w-full bg-transparent text-sm font-bold outline-none"
                >
                  {cargoCompanies.map((company) => (
                    <option key={company}>{company}</option>
                  ))}
                </select>
              </div>

              <input
                value={form.cargoTrackingNo}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    cargoTrackingNo: event.target.value,
                  }))
                }
                className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm font-bold outline-none placeholder:text-white/25"
                placeholder="Kargo takip numarası"
              />

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 md:col-span-2">
                <label className="text-xs font-black text-white/40">Durum</label>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, status: event.target.value }))
                  }
                  className="mt-2 w-full bg-transparent text-sm font-bold outline-none"
                >
                  <option>Dönüş Bekleniyor</option>
                  <option>Kargo Çıktı</option>
                  <option>Siparişe Döndü</option>
                  <option>Kapandı</option>
                </select>
              </div>

              <textarea
                value={form.note}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, note: event.target.value }))
                }
                className="min-h-28 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm font-bold outline-none placeholder:text-white/25 md:col-span-2"
                placeholder="Tester notu"
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={closeForm}
                disabled={saving}
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-sm font-black text-white/70 transition hover:bg-white/15 disabled:opacity-50"
              >
                Vazgeç
              </button>

              <button
                onClick={saveTester}
                disabled={saving}
                className="rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-500 px-4 py-4 text-sm font-black text-white shadow-lg shadow-purple-950/40 transition hover:scale-[1.02] disabled:opacity-60"
              >
                {saving
                  ? "Kaydediliyor..."
                  : editingTester
                    ? "Güncelle"
                    : "Kaydet"}
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
    <div className="rounded-2xl bg-white/[0.045] p-4">
      <p className="text-xs text-white/40">{label}</p>
      <p className="mt-1 break-words font-black text-white">{value}</p>
    </div>
  );
}