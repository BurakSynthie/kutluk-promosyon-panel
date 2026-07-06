"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";
import {
  createAd,
  deleteAd,
  fetchAds,
  updateAd,
  type AdRecord,
} from "@/lib/adsApi";
import { fetchOrders, type Order } from "@/lib/ordersApi";
import { formatTL, getOrderDueStatus } from "@/lib/helpers";
import {
  CalendarDays,
  Edit3,
  Megaphone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

const platforms = [
  "Instagram",
  "Facebook",
  "Meta Ads",
  "Google Ads",
  "TikTok",
  "Threads",
  "Diğer",
];

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

function filterAdsByTab(ads: AdRecord[], activeTab: string) {
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

function emptyForm() {
  return {
    date: getToday(),
    platform: "Instagram",
    amount: "",
    campaignName: "",
    note: "",
  };
}

export default function AdsPage() {
  const [ads, setAds] = useState<AdRecord[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState("month");
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<AdRecord | null>(null);

  const [form, setForm] = useState(emptyForm());

  async function loadData() {
    setLoading(true);

    try {
      const [adsData, ordersData] = await Promise.all([
        fetchAds(),
        fetchOrders(),
      ]);

      setAds(adsData);
      setOrders(ordersData);
    } catch (error: any) {
      alert(error?.message || "Reklam verileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function openNewForm() {
    setEditingAd(null);
    setForm(emptyForm());
    setFormOpen(true);
  }

  function openEditForm(ad: AdRecord) {
    setEditingAd(ad);
    setForm({
      date: ad.date || getToday(),
      platform: ad.platform || "Instagram",
      amount: String(ad.amount || ""),
      campaignName: ad.campaignName || "",
      note: ad.note || "",
    });
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingAd(null);
    setForm(emptyForm());
  }

  async function saveAd() {
    const amount = Number(form.amount || 0);

    if (!form.date) {
      alert("Reklam tarihi girmen gerekiyor.");
      return;
    }

    if (!form.platform) {
      alert("Platform seçmen gerekiyor.");
      return;
    }

    if (amount <= 0) {
      alert("Harcama tutarı girmen gerekiyor.");
      return;
    }

    setSaving(true);

    try {
      if (editingAd) {
        const updated = await updateAd(editingAd.id, {
          date: form.date,
          platform: form.platform,
          amount,
          campaignName: form.campaignName,
          note: form.note,
        });

        setAds((prev) =>
          prev.map((ad) => (ad.id === editingAd.id ? updated : ad))
        );
      } else {
        const created = await createAd({
          date: form.date,
          platform: form.platform,
          amount,
          campaignName: form.campaignName,
          note: form.note,
        });

        setAds((prev) => [created, ...prev]);
      }

      closeForm();
    } catch (error: any) {
      alert(error?.message || "Reklam kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  async function removeAd(ad: AdRecord) {
    const approved = window.confirm(
      `${ad.platform} reklam kaydını silmek istiyor musun?`
    );

    if (!approved) return;

    setSaving(true);

    try {
      await deleteAd(ad.id);
      setAds((prev) => prev.filter((item) => item.id !== ad.id));
    } catch (error: any) {
      alert(error?.message || "Reklam kaydı silinemedi.");
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

  const tabAds = useMemo(() => {
    return filterAdsByTab(ads, activeTab);
  }, [ads, activeTab]);

  const filteredAds = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) return tabAds;

    return tabAds.filter((ad) => {
      return (
        ad.platform?.toLowerCase().includes(value) ||
        ad.campaignName?.toLowerCase().includes(value) ||
        ad.note?.toLowerCase().includes(value) ||
        ad.date?.toLowerCase().includes(value)
      );
    });
  }, [tabAds, search]);

  const totalAdAmount = tabAds.reduce(
    (sum, ad) => sum + Number(ad.amount || 0),
    0
  );

  const todayAds = ads.filter((ad) => isSameDay(ad.date, getToday()));

  const todayTotal = todayAds.reduce(
    (sum, ad) => sum + Number(ad.amount || 0),
    0
  );

  const monthAds = ads.filter((ad) => isThisMonth(ad.date));

  const monthTotal = monthAds.reduce(
    (sum, ad) => sum + Number(ad.amount || 0),
    0
  );

  const weekAds = ads.filter((ad) => isThisWeek(ad.date));

  const weekTotal = weekAds.reduce(
    (sum, ad) => sum + Number(ad.amount || 0),
    0
  );

  const platformTotals = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();

    tabAds.forEach((ad) => {
      const key = ad.platform || "Platform yok";
      const current = map.get(key) || { count: 0, total: 0 };

      map.set(key, {
        count: current.count + 1,
        total: current.total + Number(ad.amount || 0),
      });
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({
        name,
        ...value,
      }))
      .sort((a, b) => b.total - a.total);
  }, [tabAds]);

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

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[26px] border border-orange-300/20 bg-orange-500/10 p-5">
              <p className="text-sm font-bold text-orange-100/60">Bu Ay Reklam</p>
              <p className="mt-2 text-3xl font-black text-orange-100">
                {formatTL(monthTotal)}
              </p>
            </div>

            <div className="rounded-[26px] border border-purple-300/20 bg-purple-500/10 p-5">
              <p className="text-sm font-bold text-purple-100/60">Bu Hafta</p>
              <p className="mt-2 text-3xl font-black text-purple-100">
                {formatTL(weekTotal)}
              </p>
            </div>

            <div className="rounded-[26px] border border-cyan-300/20 bg-cyan-500/10 p-5">
              <p className="text-sm font-bold text-cyan-100/60">Bugün</p>
              <p className="mt-2 text-3xl font-black text-cyan-100">
                {formatTL(todayTotal)}
              </p>
            </div>

            <div className="rounded-[26px] border border-emerald-300/20 bg-emerald-500/10 p-5">
              <p className="text-sm font-bold text-emerald-100/60">
                Seçili Dönem
              </p>
              <p className="mt-2 text-3xl font-black text-emerald-100">
                {formatTL(totalAdAmount)}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm font-bold text-orange-200/70">
                  Supabase Reklam
                </p>
                <h1 className="mt-2 text-3xl font-black">Reklam Giderleri</h1>
                <p className="mt-2 text-sm leading-6 text-white/45">
                  Reklam kayıtları artık Supabase ads tablosuna kaydedilir.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                  <Search size={18} className="text-white/35" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-transparent text-sm font-semibold outline-none placeholder:text-white/30"
                    placeholder="Platform, kampanya, not ara..."
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
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-purple-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-orange-950/40 transition hover:scale-[1.02]"
                >
                  <Plus size={18} />
                  Reklam Ekle
                </button>
              </div>
            </div>

            <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
              {tabs.map((tab) => {
                const count = filterAdsByTab(ads, tab.key).length;
                const isActive = activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`shrink-0 rounded-2xl border px-4 py-3 text-sm font-black transition ${
                      isActive
                        ? "border-orange-300/30 bg-orange-400/15 text-orange-100"
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

            <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_360px]">
              <div className="space-y-4">
                {loading && (
                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-6 text-sm font-bold text-white/50">
                    Reklam verileri yükleniyor...
                  </div>
                )}

                {!loading && filteredAds.length === 0 && (
                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-6 text-sm text-white/50">
                    Bu dönemde reklam kaydı yok.
                  </div>
                )}

                {filteredAds.map((ad) => (
                  <div
                    key={ad.id}
                    className="rounded-[26px] border border-white/10 bg-black/20 p-4 transition hover:-translate-y-0.5 hover:border-orange-300/25 hover:bg-white/[0.055]"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-orange-500/15 px-3 py-1 text-xs font-black text-orange-100">
                            {ad.platform}
                          </span>

                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/60">
                            {ad.date}
                          </span>
                        </div>

                        <h2 className="mt-3 text-xl font-black">
                          {ad.campaignName || "Kampanya adı yok"}
                        </h2>

                        <p className="mt-1 text-sm leading-6 text-white/45">
                          {ad.note || "Not yok"}
                        </p>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] xl:min-w-[420px]">
                        <div className="rounded-2xl bg-orange-500/10 p-4">
                          <p className="text-xs text-orange-100/50">Harcama</p>
                          <p className="mt-1 text-2xl font-black text-orange-100">
                            {formatTL(ad.amount)}
                          </p>
                        </div>

                        <button
                          onClick={() => openEditForm(ad)}
                          className="flex items-center justify-center gap-2 rounded-2xl bg-cyan-500/15 px-4 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-500/25"
                        >
                          <Edit3 size={17} />
                          Düzenle
                        </button>

                        <button
                          onClick={() => removeAd(ad)}
                          disabled={saving}
                          className="flex items-center justify-center gap-2 rounded-2xl bg-red-500/15 px-4 py-3 text-sm font-black text-red-100 transition hover:bg-red-500/25 disabled:opacity-50"
                        >
                          <Trash2 size={17} />
                          Sil
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="rounded-[26px] border border-orange-300/20 bg-orange-500/10 p-5">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-orange-100">
                      <Megaphone size={23} />
                    </div>

                    <div>
                      <p className="text-sm font-black text-orange-100/60">
                        {selectedTabLabel}
                      </p>
                      <p className="mt-1 text-3xl font-black text-orange-100">
                        {formatTL(totalAdAmount)}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-white/45">
                    Seçili dönemdeki toplam reklam harcaması.
                  </p>
                </div>

                <div className="rounded-[26px] border border-white/10 bg-black/20 p-5">
                  <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                    <CalendarDays size={22} className="text-cyan-100" />
                    <div>
                      <p className="font-black">Platform Dağılımı</p>
                      <p className="mt-1 text-xs text-white/40">
                        Seçili dönem harcama kırılımı
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {platformTotals.length === 0 && (
                      <p className="text-sm text-white/40">
                        Platform verisi yok.
                      </p>
                    )}

                    {platformTotals.map((item) => (
                      <div
                        key={item.name}
                        className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-black text-white">{item.name}</p>
                            <p className="mt-1 text-xs text-white/40">
                              {item.count} kayıt
                            </p>
                          </div>

                          <p className="font-black text-orange-100">
                            {formatTL(item.total)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-[95] grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[28px] border border-white/10 bg-[#090b16] p-6 shadow-2xl shadow-black/60">
            <div className="flex items-start justify-between gap-4 rounded-3xl border border-orange-400/20 bg-orange-500/10 p-5">
              <div>
                <p className="text-sm font-bold text-orange-100/70">
                  {editingAd ? "Reklam Düzenle" : "Yeni Reklam Gideri"}
                </p>

                <h2 className="mt-2 text-2xl font-black text-white">
                  {editingAd ? "Kaydı güncelle" : "Reklam harcaması ekle"}
                </h2>

                <p className="mt-2 text-sm leading-6 text-white/45">
                  Kayıt Supabase ads tablosuna yazılır.
                </p>
              </div>

              <button
                onClick={closeForm}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/10 text-white/60 transition hover:bg-white/15"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <label className="text-xs font-black text-white/40">Tarih</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, date: event.target.value }))
                  }
                  className="mt-2 w-full bg-transparent text-sm font-bold outline-none"
                />
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <label className="text-xs font-black text-white/40">
                  Platform
                </label>
                <select
                  value={form.platform}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      platform: event.target.value,
                    }))
                  }
                  className="mt-2 w-full bg-transparent text-sm font-bold outline-none"
                >
                  {platforms.map((platform) => (
                    <option key={platform}>{platform}</option>
                  ))}
                </select>
              </div>

              <input
                type="number"
                value={form.amount}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, amount: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-sm font-bold outline-none placeholder:text-white/25"
                placeholder="Harcama tutarı"
              />

              <input
                value={form.campaignName}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    campaignName: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-sm font-bold outline-none placeholder:text-white/25"
                placeholder="Kampanya adı"
              />

              <textarea
                value={form.note}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, note: event.target.value }))
                }
                className="min-h-28 w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-sm font-bold outline-none placeholder:text-white/25"
                placeholder="Not"
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
                onClick={saveAd}
                disabled={saving}
                className="rounded-2xl bg-gradient-to-r from-orange-500 to-purple-600 px-4 py-4 text-sm font-black text-white shadow-lg shadow-orange-950/40 transition hover:scale-[1.02] disabled:opacity-60"
              >
                {saving
                  ? "Kaydediliyor..."
                  : editingAd
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