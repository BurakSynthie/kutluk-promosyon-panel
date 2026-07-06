import { supabase } from "@/lib/supabaseClient";

export type AdRecord = {
  id: number;
  date: string;
  platform: string;
  amount: number;
  campaignName: string;
  note: string;
  createdAt: string;
  updatedAt?: string;
};

type SupabaseAd = {
  id: number;
  user_id: string;
  date: string;
  platform: string;
  amount: number | null;
  campaign_name: string | null;
  note: string | null;
  created_at: string;
  updated_at: string | null;
};

function toAppAd(ad: SupabaseAd): AdRecord {
  return {
    id: Number(ad.id),
    date: ad.date || "",
    platform: ad.platform || "",
    amount: Number(ad.amount || 0),
    campaignName: ad.campaign_name || "",
    note: ad.note || "",
    createdAt: ad.created_at || "",
    updatedAt: ad.updated_at || "",
  };
}

function toSupabaseAd(ad: Partial<AdRecord>, userId: string) {
  return {
    user_id: userId,
    date: ad.date || new Date().toISOString().split("T")[0],
    platform: ad.platform || "Instagram",
    amount: Number(ad.amount || 0),
    campaign_name: ad.campaignName || "",
    note: ad.note || "",
  };
}

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error("Kullanıcı oturumu bulunamadı. Çıkış yapıp tekrar giriş yap.");
  }

  return data.user.id;
}

export async function fetchAds() {
  const { data, error } = await supabase
    .from("ads")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Reklam kayıtları yüklenemedi.");
  }

  return ((data || []) as SupabaseAd[]).map(toAppAd);
}

export async function createAd(ad: Partial<AdRecord>) {
  const userId = await getCurrentUserId();
  const payload = toSupabaseAd(ad, userId);

  const { data, error } = await supabase
    .from("ads")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message || "Reklam kaydı oluşturulamadı.");
  }

  return toAppAd(data as SupabaseAd);
}

export async function updateAd(id: number, ad: Partial<AdRecord>) {
  if (!id) {
    throw new Error("Düzenlenecek reklam kaydı bulunamadı.");
  }

  const payload = {
    p_id: id,
    p_date: ad.date || new Date().toISOString().split("T")[0],
    p_platform: ad.platform || "Instagram",
    p_amount: Number(ad.amount || 0),
    p_campaign_name: ad.campaignName || "",
    p_note: ad.note || "",
  };

  const { data, error } = await supabase.rpc("kp_update_ad_expense", payload);

  if (error) {
    throw new Error(error.message || "Reklam kaydı güncellenemedi.");
  }

  if (!data) {
    throw new Error("Reklam kaydı güncellendi ama veri geri dönmedi.");
  }

  return toAppAd(data as SupabaseAd);
}

export async function deleteAd(id: number) {
  if (!id) {
    throw new Error("Silinecek reklam kaydı bulunamadı.");
  }

  const { data, error } = await supabase.rpc("kp_delete_ad_expense", {
    p_id: id,
  });

  if (error) {
    throw new Error(error.message || "Reklam kaydı silinemedi.");
  }

  if (!data) {
    throw new Error("Reklam kaydı silinemedi veya kayıt bulunamadı.");
  }

  return true;
}