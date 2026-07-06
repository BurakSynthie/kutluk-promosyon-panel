"use client";

import { useEffect, useRef, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";
import {
  createOrder,
  deleteOrder,
  fetchOrders,
  type Order,
} from "@/lib/ordersApi";
import {
  createAd,
  deleteAd,
  fetchAds,
  type AdRecord,
} from "@/lib/adsApi";
import {
  createTester,
  deleteTester,
  fetchTesters,
  type Tester,
} from "@/lib/testersApi";
import { getOrderDueStatus } from "@/lib/helpers";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  FileUp,
  RefreshCw,
  Settings,
  Trash2,
} from "lucide-react";

type BackupFile = {
  app: "Kutluk Promosyon Panel";
  version: "supabase-v1";
  exportedAt: string;
  orders: Order[];
  ads: AdRecord[];
  testers: Tester[];
};

export default function SettingsPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ads, setAds] = useState<AdRecord[]>([]);
  const [testers, setTesters] = useState<Tester[]>([]);

  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  async function loadData() {
    setLoading(true);

    try {
      const [ordersData, adsData, testersData] = await Promise.all([
        fetchOrders(),
        fetchAds(),
        fetchTesters(),
      ]);

      setOrders(ordersData);
      setAds(adsData);
      setTesters(testersData);
    } catch (error: any) {
      alert(error?.message || "Ayarlar verileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
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

  function exportBackup() {
    const backup: BackupFile = {
      app: "Kutluk Promosyon Panel",
      version: "supabase-v1",
      exportedAt: new Date().toISOString(),
      orders,
      ads,
      testers,
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const date = new Date().toISOString().split("T")[0];

    link.href = url;
    link.download = `kutluk-promosyon-yedek-${date}.json`;
    link.click();

    URL.revokeObjectURL(url);
  }

  async function importBackup(file: File) {
    setWorking(true);

    try {
      const text = await file.text();
      const backup = JSON.parse(text) as Partial<BackupFile>;

      if (!backup.orders && !backup.ads && !backup.testers) {
        alert("Bu dosya geçerli bir Kutluk Promosyon yedeği gibi görünmüyor.");
        return;
      }

      const approved = window.confirm(
        "Bu yedek dosyasındaki veriler Supabase’e eklenecek. Mevcut veriler silinmez. Devam edilsin mi?"
      );

      if (!approved) return;

      const backupOrders = Array.isArray(backup.orders) ? backup.orders : [];
      const backupAds = Array.isArray(backup.ads) ? backup.ads : [];
      const backupTesters = Array.isArray(backup.testers)
        ? backup.testers
        : [];

      for (const order of backupOrders) {
        await createOrder({
          orderNo: order.orderNo,
          customer: order.customer,
          channel: order.channel,
          contact: order.contact,
          processDate: order.processDate,
          workDays: order.workDays,
          dueDate: order.dueDate,
          status: order.status,
          totalPrice: order.totalPrice,
          paidAmount: order.paidAmount,
          remainingAmount: order.remainingAmount,
          cariAmount: order.cariAmount,
          profit: order.profit,
          cariPaid: order.cariPaid,
          note: order.note,
          items: order.items || [],
          payments: order.payments || [],
          cargoCompany: order.cargoCompany || "",
          cargoTrackingNo: order.cargoTrackingNo || "",
          cargoDate: order.cargoDate || "",
        });
      }

      for (const ad of backupAds) {
        await createAd({
          date: ad.date,
          platform: ad.platform,
          amount: ad.amount,
          campaignName: ad.campaignName,
          note: ad.note,
        });
      }

      for (const tester of backupTesters) {
        await createTester({
          customer: tester.customer,
          channel: tester.channel,
          contact: tester.contact,
          product: tester.product,
          essence: tester.essence,
          quantity: tester.quantity,
          sendDate: tester.sendDate,
          cargoCompany: tester.cargoCompany,
          cargoTrackingNo: tester.cargoTrackingNo,
          status: tester.status,
          note: tester.note,
          convertedAt: tester.convertedAt,
          closedAt: tester.closedAt,
        });
      }

      alert("Yedek başarıyla Supabase’e aktarıldı.");
      await loadData();
    } catch (error: any) {
      alert(error?.message || "Yedek içe aktarılırken hata oluştu.");
    } finally {
      setWorking(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function clearSupabaseData() {
    const firstConfirm = window.confirm(
      "Dikkat: Supabase’deki tüm sipariş, reklam ve tester kayıtları silinecek. Devam etmek istiyor musun?"
    );

    if (!firstConfirm) return;

    const secondConfirm = window.confirm(
      "Bu işlem geri alınamaz. Önce yedek almadıysan iptal et. Gerçekten tüm veriler silinsin mi?"
    );

    if (!secondConfirm) return;

    setWorking(true);

    try {
      for (const order of orders) {
        await deleteOrder(order.id);
      }

      for (const ad of ads) {
        await deleteAd(ad.id);
      }

      for (const tester of testers) {
        await deleteTester(tester.id);
      }

      setOrders([]);
      setAds([]);
      setTesters([]);

      alert("Supabase verileri temizlendi.");
    } catch (error: any) {
      alert(error?.message || "Veriler temizlenirken hata oluştu.");
    } finally {
      setWorking(false);
    }
  }

  function clearOldLocalStorage() {
    const approved = window.confirm(
      "Eski localStorage kayıtları temizlensin mi? Supabase verilerine dokunulmaz."
    );

    if (!approved) return;

    localStorage.removeItem("kp_orders");
    localStorage.removeItem("kp_ads");
    localStorage.removeItem("kp_testers");

    alert("Eski localStorage kayıtları temizlendi.");
  }

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
              <p className="text-sm font-bold text-cyan-100/60">Sipariş</p>
              <p className="mt-2 text-3xl font-black text-cyan-100">
                {orders.length}
              </p>
            </div>

            <div className="rounded-[26px] border border-orange-300/20 bg-orange-500/10 p-5">
              <p className="text-sm font-bold text-orange-100/60">Reklam</p>
              <p className="mt-2 text-3xl font-black text-orange-100">
                {ads.length}
              </p>
            </div>

            <div className="rounded-[26px] border border-purple-300/20 bg-purple-500/10 p-5">
              <p className="text-sm font-bold text-purple-100/60">Tester</p>
              <p className="mt-2 text-3xl font-black text-purple-100">
                {testers.length}
              </p>
            </div>

            <div className="rounded-[26px] border border-emerald-300/20 bg-emerald-500/10 p-5">
              <p className="text-sm font-bold text-emerald-100/60">Veri Modu</p>
              <p className="mt-2 text-3xl font-black text-emerald-100">
                Supabase
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[30px] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm font-black text-cyan-200/70">
                  Supabase Ayarları
                </p>

                <h1 className="mt-2 text-3xl font-black">Ayarlar</h1>

                <p className="mt-2 text-sm leading-6 text-white/45">
                  Yedek alma, yedek yükleme, eski localStorage temizleme ve
                  Supabase veri yönetimi.
                </p>
              </div>

              <button
                onClick={loadData}
                disabled={loading || working}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-white/70 transition hover:bg-white/15 disabled:opacity-50"
              >
                <RefreshCw
                  size={17}
                  className={loading ? "animate-spin" : ""}
                />
                Yenile
              </button>
            </div>

            {loading && (
              <div className="mt-5 rounded-[24px] border border-cyan-300/20 bg-cyan-500/10 p-5 text-sm font-black text-cyan-100">
                Supabase verileri yükleniyor...
              </div>
            )}

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              <div className="rounded-[26px] border border-emerald-300/20 bg-emerald-500/10 p-5">
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-emerald-100">
                    <Download size={23} />
                  </div>

                  <div>
                    <h2 className="text-xl font-black text-emerald-100">
                      Yedek Al
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-white/50">
                      Supabase’deki sipariş, reklam ve tester kayıtlarını tek
                      JSON dosyası olarak indirir.
                    </p>

                    <button
                      onClick={exportBackup}
                      disabled={working || loading}
                      className="mt-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-4 text-sm font-black text-white shadow-lg shadow-emerald-950/40 transition hover:scale-[1.02] disabled:opacity-50"
                    >
                      Yedek Dosyası İndir
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-[26px] border border-cyan-300/20 bg-cyan-500/10 p-5">
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-cyan-100">
                    <FileUp size={23} />
                  </div>

                  <div>
                    <h2 className="text-xl font-black text-cyan-100">
                      Yedek Yükle
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-white/50">
                      Daha önce indirdiğin JSON yedeğini Supabase’e ekler.
                      Mevcut kayıtları silmez, üstüne ekler.
                    </p>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/json"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];

                        if (file) {
                          importBackup(file);
                        }
                      }}
                    />

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={working || loading}
                      className="mt-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-cyan-950/40 transition hover:scale-[1.02] disabled:opacity-50"
                    >
                      JSON Yedeği Seç
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-[26px] border border-purple-300/20 bg-purple-500/10 p-5">
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-purple-100">
                    <Database size={23} />
                  </div>

                  <div>
                    <h2 className="text-xl font-black text-purple-100">
                      Eski Local Veriyi Temizle
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-white/50">
                      Daha önce tarayıcıda kalan `kp_orders`, `kp_ads`,
                      `kp_testers` verilerini temizler. Supabase kayıtlarına
                      dokunmaz.
                    </p>

                    <button
                      onClick={clearOldLocalStorage}
                      disabled={working || loading}
                      className="mt-5 rounded-2xl bg-purple-500/20 px-5 py-4 text-sm font-black text-purple-100 transition hover:bg-purple-500/30 disabled:opacity-50"
                    >
                      LocalStorage Temizle
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-[26px] border border-red-300/20 bg-red-500/10 p-5">
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-red-100">
                    <Trash2 size={23} />
                  </div>

                  <div>
                    <h2 className="text-xl font-black text-red-100">
                      Supabase Verilerini Sil
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-white/50">
                      Sipariş, reklam ve tester kayıtlarını Supabase’den siler.
                      Önce yedek alman önerilir.
                    </p>

                    <button
                      onClick={clearSupabaseData}
                      disabled={working || loading}
                      className="mt-5 rounded-2xl bg-red-500/20 px-5 py-4 text-sm font-black text-red-100 transition hover:bg-red-500/30 disabled:opacity-50"
                    >
                      Tüm Supabase Verilerini Sil
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-[26px] border border-yellow-300/20 bg-yellow-500/10 p-5">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-yellow-100">
                  <AlertTriangle size={23} />
                </div>

                <div>
                  <h2 className="text-xl font-black text-yellow-100">
                    Önemli Not
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-white/55">
                    Yedek yükleme işlemi mevcut kayıtları silmez. Aynı yedeği
                    iki kere yüklersen kayıtlar iki kere eklenir. Temiz başlangıç
                    istiyorsan önce yedek al, sonra Supabase verilerini sil,
                    ardından yedeği yükle.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-[26px] border border-emerald-300/20 bg-emerald-500/10 p-5">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-emerald-100">
                  <CheckCircle2 size={23} />
                </div>

                <div>
                  <h2 className="text-xl font-black text-emerald-100">
                    Sistem Durumu
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-white/55">
                    Panel şu anda Supabase modunda çalışıyor. Siparişler,
                    reklamlar ve tester kayıtları tarayıcıda değil Supabase
                    database içinde tutuluyor.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {working && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="rounded-[28px] border border-white/10 bg-[#090b16] p-6 text-center shadow-2xl shadow-black/60">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-cyan-300/20 border-t-cyan-300" />

            <p className="mt-5 text-sm font-black text-cyan-100">
              İşlem yapılıyor...
            </p>

            <p className="mt-2 text-xs text-white/40">
              Lütfen bu ekranı kapatma.
            </p>
          </div>
        </div>
      )}

      <MobileNav />
    </main>
  );
}