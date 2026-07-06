"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import MobileNav from "@/components/MobileNav";
import {
  createOrder,
  fetchOrders,
  uploadOrderImages,
  type OrderItem,
} from "@/lib/ordersApi";
import {
  ArrowLeft,
  Calculator,
  CheckCircle2,
  CreditCard,
  ImagePlus,
  PackagePlus,
  Plus,
  Save,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

const channels = ["Instagram", "WhatsApp", "Telefon", "Web Sitesi", "Referans", "Diğer"];

const productTypes = [
  "Oto Kokusu",
  "Paspas",
  "Bardak Altlığı",
  "Sırt Kartonu",
  "Karışık Ürün",
];

const materials = [
  "Standart Karton",
  "Selüloz",
  "Paspas Malzemesi",
  "Bardak Altlığı Malzemesi",
  "Diğer",
];

const essenceCategories = ["3 Gün Kalıcılık", "6 Gün Selüloz", "Kokusuz", "Diğer"];

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

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function addBusinessDays(dateString: string, businessDays: number) {
  if (!dateString) return "";

  const date = new Date(`${dateString}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  let addedDays = 0;
  const safeBusinessDays = Number(businessDays || 12);

  while (addedDays < safeBusinessDays) {
    date.setDate(date.getDate() + 1);

    const day = date.getDay();

    if (day !== 0 && day !== 6) {
      addedDays += 1;
    }
  }

  return date.toISOString().split("T")[0];
}

function formatTL(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function emptyItem(): OrderItem {
  return {
    productType: "Oto Kokusu",
    material: "Standart Karton",
    quantity: "1000",
    essenceCategory: "3 Gün Kalıcılık",
    essence: "Karışık",
    designNote: "",
    itemNote: "",
  };
}

export default function NewOrderPage() {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [loadingNo, setLoadingNo] = useState(true);

  const [orderNo, setOrderNo] = useState("");
  const [customer, setCustomer] = useState("");
  const [channel, setChannel] = useState("Instagram");
  const [contact, setContact] = useState("");

  const [processDate, setProcessDate] = useState(getToday());
  const [workDays, setWorkDays] = useState(12);

  const [totalPrice, setTotalPrice] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [cariAmount, setCariAmount] = useState("");
  const [note, setNote] = useState("");

  const [items, setItems] = useState<OrderItem[]>([emptyItem()]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    async function prepareOrderNo() {
      try {
        const orders = await fetchOrders();

        const numbers = orders
          .map((order) => Number(order.orderNo))
          .filter((number) => !Number.isNaN(number));

        const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;

        setOrderNo(String(nextNumber).padStart(4, "0"));
      } catch {
        setOrderNo("0001");
      } finally {
        setLoadingNo(false);
      }
    }

    prepareOrderNo();
  }, []);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [imagePreviews]);

  const dueDate = useMemo(() => {
    if (!processDate) return "";
    return addBusinessDays(processDate, Number(workDays || 12));
  }, [processDate, workDays]);

  const calculated = useMemo(() => {
    const total = Number(totalPrice || 0);
    const paid = Number(paidAmount || 0);
    const cari = Number(cariAmount || 0);
    const remaining = Math.max(total - paid, 0);
    const profit = total - cari;

    return {
      total,
      paid,
      cari,
      remaining,
      profit,
    };
  }, [totalPrice, paidAmount, cariAmount]);

  function updateItem(index: number, key: keyof OrderItem, value: string) {
    setItems((prev) =>
      prev.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        return {
          ...item,
          [key]: value,
        };
      })
    );
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(index: number) {
    if (items.length === 1) return;

    setItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  }

  function handleImageSelection(files: FileList | null) {
    if (!files) return;

    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (imageFiles.length === 0) {
      alert("Sadece görsel dosyası seçebilirsin.");
      return;
    }

    const oversized = imageFiles.find((file) => file.size > 10 * 1024 * 1024);

    if (oversized) {
      alert("Her görsel en fazla 10 MB olmalı.");
      return;
    }

    const nextImages = [...selectedImages, ...imageFiles].slice(0, 10);

    if (selectedImages.length + imageFiles.length > 10) {
      alert("Bir siparişe en fazla 10 görsel ekleyebilirsin.");
    }

    imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    setSelectedImages(nextImages);
    setImagePreviews(nextImages.map((file) => URL.createObjectURL(file)));
  }

  function removeSelectedImage(index: number) {
    const nextImages = selectedImages.filter((_, imageIndex) => imageIndex !== index);

    imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    setSelectedImages(nextImages);
    setImagePreviews(nextImages.map((file) => URL.createObjectURL(file)));
  }

  async function saveOrder() {
    if (!customer.trim()) {
      alert("Müşteri adı girmen gerekiyor.");
      return;
    }

    if (!orderNo.trim()) {
      alert("Sipariş numarası oluşmadı.");
      return;
    }

    if (calculated.total <= 0) {
      alert("Satış tutarı girmen gerekiyor.");
      return;
    }

    setSaving(true);

    try {
      const uploadedImages = selectedImages.length
        ? await uploadOrderImages(selectedImages, orderNo)
        : [];

      await createOrder({
        orderNo,
        customer: customer.trim(),
        channel,
        contact: contact.trim(),
        processDate,
        workDays: Number(workDays || 12),
        dueDate,
        status: "İşleme Alındı",
        totalPrice: calculated.total,
        paidAmount: calculated.paid,
        remainingAmount: calculated.remaining,
        cariAmount: calculated.cari,
        profit: calculated.profit,
        cariPaid: false,
        note,
        items,
        images: uploadedImages,
        payments:
          calculated.paid > 0
            ? [
                {
                  amount: calculated.paid,
                  date: getToday(),
                  note: "İlk ödeme",
                },
              ]
            : [],
      });

      router.push("/orders");
      router.refresh();
    } catch (error: any) {
      alert(error?.message || "Sipariş kaydedilirken hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#070812] text-white">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(91,74,255,0.26),transparent_35%),radial-gradient(circle_at_top_right,rgba(0,183,255,0.18),transparent_30%),radial-gradient(circle_at_bottom,rgba(132,32,255,0.12),transparent_35%)]" />

      <div className="relative flex">
        <Sidebar />

        <section className="min-h-screen flex-1 px-4 py-4 pb-44 lg:ml-72 lg:px-8">
          <Topbar delayedCount={0} upcomingCount={0} />

          <div className="mt-6 rounded-[30px] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <button
                  onClick={() => router.push("/orders")}
                  className="mb-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black text-white/65 transition hover:bg-white/15"
                >
                  <ArrowLeft size={17} />
                  Siparişlere Dön
                </button>

                <p className="text-sm font-black text-cyan-200/70">Yeni Sipariş</p>

                <h1 className="mt-2 text-3xl font-black">
                  Yeni sipariş oluştur
                </h1>

                <p className="mt-2 text-sm leading-6 text-white/45">
                  Müşteri, ürün, görsel, ödeme ve cari bilgilerini tek ekranda kaydet.
                </p>
              </div>

              <div className="rounded-[24px] border border-cyan-300/20 bg-cyan-500/10 p-5">
                <p className="text-xs font-black text-cyan-100/60">Sipariş No</p>
                <p className="mt-1 text-3xl font-black text-cyan-100">
                  {loadingNo ? "..." : `#${orderNo}`}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_380px]">
              <div className="space-y-5">
                <div className="rounded-[26px] border border-white/10 bg-black/20 p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-400/15 text-cyan-100">
                      <PackagePlus size={21} />
                    </div>

                    <div>
                      <p className="font-black">Müşteri Bilgileri</p>
                      <p className="mt-1 text-xs text-white/40">
                        Siparişin temel müşteri bilgileri
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      value={customer}
                      onChange={(e) => setCustomer(e.target.value)}
                      className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm font-bold outline-none placeholder:text-white/25"
                      placeholder="Müşteri adı / firma"
                    />

                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <label className="text-xs font-black text-white/40">Kanal</label>
                      <select
                        value={channel}
                        onChange={(e) => setChannel(e.target.value)}
                        className="mt-2 w-full bg-transparent text-sm font-bold outline-none"
                      >
                        {channels.map((item) => (
                          <option key={item}>{item}</option>
                        ))}
                      </select>
                    </div>

                    <input
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm font-bold outline-none placeholder:text-white/25 md:col-span-2"
                      placeholder={
                        channel === "Instagram"
                          ? "@instagram kullanıcı adı"
                          : channel === "WhatsApp"
                            ? "WhatsApp telefon numarası"
                            : "İletişim bilgisi"
                      }
                    />
                  </div>
                </div>

                <div className="rounded-[26px] border border-white/10 bg-black/20 p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-black">Ürün Bilgileri</p>
                      <p className="mt-1 text-xs text-white/40">
                        Bir siparişe birden fazla ürün ekleyebilirsin.
                      </p>
                    </div>

                    <button
                      onClick={addItem}
                      className="flex items-center gap-2 rounded-2xl bg-cyan-500/15 px-4 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-500/25"
                    >
                      <Plus size={17} />
                      Ürün Ekle
                    </button>
                  </div>

                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="rounded-[24px] border border-white/10 bg-white/[0.035] p-4"
                      >
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <p className="font-black text-cyan-100">
                            Ürün #{index + 1}
                          </p>

                          <button
                            onClick={() => removeItem(index)}
                            disabled={items.length === 1}
                            className="grid h-10 w-10 place-items-center rounded-2xl bg-red-500/10 text-red-100 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                            <label className="text-xs font-black text-white/40">
                              Ürün Türü
                            </label>
                            <select
                              value={item.productType}
                              onChange={(e) =>
                                updateItem(index, "productType", e.target.value)
                              }
                              className="mt-2 w-full bg-transparent text-sm font-bold outline-none"
                            >
                              {productTypes.map((type) => (
                                <option key={type}>{type}</option>
                              ))}
                            </select>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                            <label className="text-xs font-black text-white/40">
                              Malzeme
                            </label>
                            <select
                              value={item.material}
                              onChange={(e) =>
                                updateItem(index, "material", e.target.value)
                              }
                              className="mt-2 w-full bg-transparent text-sm font-bold outline-none"
                            >
                              {materials.map((material) => (
                                <option key={material}>{material}</option>
                              ))}
                            </select>
                          </div>

                          <input
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(index, "quantity", e.target.value)
                            }
                            className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm font-bold outline-none placeholder:text-white/25"
                            placeholder="Adet"
                          />

                          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                            <label className="text-xs font-black text-white/40">
                              Esans Kategorisi
                            </label>
                            <select
                              value={item.essenceCategory}
                              onChange={(e) =>
                                updateItem(index, "essenceCategory", e.target.value)
                              }
                              className="mt-2 w-full bg-transparent text-sm font-bold outline-none"
                            >
                              {essenceCategories.map((category) => (
                                <option key={category}>{category}</option>
                              ))}
                            </select>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-black/30 p-4 md:col-span-2">
                            <label className="text-xs font-black text-white/40">
                              Esans
                            </label>
                            <select
                              value={item.essence}
                              onChange={(e) =>
                                updateItem(index, "essence", e.target.value)
                              }
                              className="mt-2 w-full bg-transparent text-sm font-bold outline-none"
                            >
                              {essences.map((essence) => (
                                <option key={essence}>{essence}</option>
                              ))}
                            </select>
                          </div>

                          <textarea
                            value={item.designNote}
                            onChange={(e) =>
                              updateItem(index, "designNote", e.target.value)
                            }
                            className="min-h-24 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm font-bold outline-none placeholder:text-white/25"
                            placeholder="Tasarım notu"
                          />

                          <textarea
                            value={item.itemNote}
                            onChange={(e) =>
                              updateItem(index, "itemNote", e.target.value)
                            }
                            className="min-h-24 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm font-bold outline-none placeholder:text-white/25"
                            placeholder="Ürün notu"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[26px] border border-white/10 bg-black/20 p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-purple-400/15 text-purple-100">
                      <ImagePlus size={21} />
                    </div>

                    <div>
                      <p className="font-black">Sipariş Görselleri</p>
                      <p className="mt-1 text-xs text-white/40">
                        Tasarım, logo, baskı örneği veya müşteri görsellerini ekle.
                      </p>
                    </div>
                  </div>

                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-cyan-300/25 bg-cyan-500/10 p-6 text-center transition hover:border-cyan-200/45 hover:bg-cyan-500/15">
                    <UploadCloud size={28} className="text-cyan-100" />
                    <p className="mt-3 text-sm font-black text-cyan-100">
                      Görsel seç veya buraya yükle
                    </p>
                    <p className="mt-1 text-xs font-semibold text-white/45">
                      JPG, PNG, WEBP desteklenir. En fazla 10 görsel, görsel başına 10 MB.
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleImageSelection(e.target.files)}
                      className="hidden"
                    />
                  </label>

                  {imagePreviews.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {imagePreviews.map((preview, index) => (
                        <div
                          key={preview}
                          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/30"
                        >
                          <img
                            src={preview}
                            alt={`Sipariş görseli ${index + 1}`}
                            className="h-32 w-full object-cover"
                          />

                          <button
                            type="button"
                            onClick={() => removeSelectedImage(index)}
                            className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/70 text-white transition hover:bg-red-500"
                          >
                            <X size={16} />
                          </button>

                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-2">
                            <p className="truncate text-[11px] font-bold text-white/80">
                              {selectedImages[index]?.name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <p className="text-xs font-black text-white/45">Seçilen görsel</p>
                    <p className="mt-1 text-lg font-black text-white">
                      {selectedImages.length} adet
                    </p>
                  </div>
                </div>

                <div className="rounded-[26px] border border-white/10 bg-black/20 p-5">
                  <p className="font-black">Sipariş Notu</p>

                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="mt-4 min-h-28 w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-sm font-bold outline-none placeholder:text-white/25"
                    placeholder="Genel sipariş notu..."
                  />
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[26px] border border-white/10 bg-black/20 p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-purple-400/15 text-purple-100">
                      <Calculator size={21} />
                    </div>

                    <div>
                      <p className="font-black">Tarih & Süre</p>
                      <p className="mt-1 text-xs text-white/40">
                        İş günü hesabı otomatik yapılır.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <label className="text-xs font-black text-white/40">
                        İşleme Alınma Tarihi
                      </label>
                      <input
                        type="date"
                        value={processDate}
                        onChange={(e) => setProcessDate(e.target.value)}
                        className="mt-2 w-full bg-transparent text-sm font-bold outline-none"
                      />
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <label className="text-xs font-black text-white/40">
                        İş Günü
                      </label>
                      <input
                        type="number"
                        value={workDays}
                        onChange={(e) => setWorkDays(Number(e.target.value))}
                        className="mt-2 w-full bg-transparent text-sm font-bold outline-none"
                      />
                    </div>

                    <div className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-4">
                      <p className="text-xs font-black text-cyan-100/60">
                        Tahmini Çıkış Tarihi
                      </p>
                      <p className="mt-1 text-xl font-black text-cyan-100">
                        {dueDate}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[26px] border border-white/10 bg-black/20 p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-100">
                      <CreditCard size={21} />
                    </div>

                    <div>
                      <p className="font-black">Finans Bilgileri</p>
                      <p className="mt-1 text-xs text-white/40">
                        Satış, ödeme, cari ve kâr hesabı
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <input
                      type="number"
                      value={totalPrice}
                      onChange={(e) => setTotalPrice(e.target.value)}
                      className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm font-bold outline-none placeholder:text-white/25"
                      placeholder="Satış tutarı"
                    />

                    <input
                      type="number"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm font-bold outline-none placeholder:text-white/25"
                      placeholder="Alınan ödeme"
                    />

                    <input
                      type="number"
                      value={cariAmount}
                      onChange={(e) => setCariAmount(e.target.value)}
                      className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm font-bold outline-none placeholder:text-white/25"
                      placeholder="Cari / maliyet tutarı"
                    />
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl bg-cyan-500/10 p-4">
                      <p className="text-xs text-cyan-100/50">Satış</p>
                      <p className="mt-1 text-xl font-black text-cyan-100">
                        {formatTL(calculated.total)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-yellow-500/10 p-4">
                      <p className="text-xs text-yellow-100/50">Kalan Ödeme</p>
                      <p className="mt-1 text-xl font-black text-yellow-100">
                        {formatTL(calculated.remaining)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-purple-500/10 p-4">
                      <p className="text-xs text-purple-100/50">Cari</p>
                      <p className="mt-1 text-xl font-black text-purple-100">
                        {formatTL(calculated.cari)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-emerald-500/10 p-4">
                      <p className="text-xs text-emerald-100/50">Kâr</p>
                      <p className="mt-1 text-xl font-black text-emerald-100">
                        {formatTL(calculated.profit)}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={saveOrder}
                  disabled={saving || loadingNo}
                  className="flex w-full items-center justify-center gap-2 rounded-[24px] bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-5 text-sm font-black text-white shadow-lg shadow-cyan-950/40 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Görseller ve sipariş kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Save size={19} />
                      Siparişi Kaydet
                    </>
                  )}
                </button>

                <div className="rounded-[24px] border border-emerald-300/20 bg-emerald-500/10 p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={21} className="text-emerald-100" />

                    <div>
                      <p className="text-sm font-black text-emerald-100">
                        Gerçek database modu
                      </p>
                      <p className="mt-1 text-xs leading-5 text-white/42">
                        Bu kayıt Supabase orders tablosuna yazılır.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <MobileNav />
    </main>
  );
}