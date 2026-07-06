import { supabase } from "@/lib/supabaseClient";

export type Tester = {
  id: number;
  customer: string;
  channel: string;
  contact: string;
  product: string;
  essence: string;
  quantity: string;
  sendDate: string;
  cargoCompany: string;
  cargoTrackingNo: string;
  status: string;
  note: string;
  createdAt: string;
  updatedAt?: string;
  convertedAt?: string;
  closedAt?: string;
};

type SupabaseTester = {
  id: number;
  user_id: string;
  customer: string;
  channel: string | null;
  contact: string | null;
  product: string | null;
  essence: string | null;
  quantity: string | null;
  send_date: string | null;
  cargo_company: string | null;
  cargo_tracking_no: string | null;
  status: string | null;
  note: string | null;
  converted_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string | null;
};

function toAppTester(tester: SupabaseTester): Tester {
  return {
    id: tester.id,
    customer: tester.customer || "",
    channel: tester.channel || "",
    contact: tester.contact || "",
    product: tester.product || "",
    essence: tester.essence || "",
    quantity: tester.quantity || "",
    sendDate: tester.send_date || "",
    cargoCompany: tester.cargo_company || "",
    cargoTrackingNo: tester.cargo_tracking_no || "",
    status: tester.status || "Dönüş Bekleniyor",
    note: tester.note || "",
    createdAt: tester.created_at,
    updatedAt: tester.updated_at || "",
    convertedAt: tester.converted_at || "",
    closedAt: tester.closed_at || "",
  };
}

function toSupabaseTester(tester: Partial<Tester>, userId: string) {
  return {
    user_id: userId,
    customer: tester.customer || "",
    channel: tester.channel || "",
    contact: tester.contact || "",
    product: tester.product || "",
    essence: tester.essence || "",
    quantity: tester.quantity || "",
    send_date: tester.sendDate || null,
    cargo_company: tester.cargoCompany || "",
    cargo_tracking_no: tester.cargoTrackingNo || "",
    status: tester.status || "Dönüş Bekleniyor",
    note: tester.note || "",
    converted_at: tester.convertedAt || null,
    closed_at: tester.closedAt || null,
  };
}

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error("Kullanıcı oturumu bulunamadı.");
  }

  return data.user.id;
}

export async function fetchTesters() {
  const { data, error } = await supabase
    .from("testers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data || []) as SupabaseTester[]).map(toAppTester);
}

export async function createTester(tester: Partial<Tester>) {
  const userId = await getCurrentUserId();

  const payload = toSupabaseTester(tester, userId);

  const { data, error } = await supabase
    .from("testers")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toAppTester(data as SupabaseTester);
}

export async function updateTester(id: number, tester: Partial<Tester>) {
  const payload: Record<string, unknown> = {};

  if (tester.customer !== undefined) payload.customer = tester.customer;
  if (tester.channel !== undefined) payload.channel = tester.channel;
  if (tester.contact !== undefined) payload.contact = tester.contact;
  if (tester.product !== undefined) payload.product = tester.product;
  if (tester.essence !== undefined) payload.essence = tester.essence;
  if (tester.quantity !== undefined) payload.quantity = tester.quantity;
  if (tester.sendDate !== undefined) payload.send_date = tester.sendDate || null;
  if (tester.cargoCompany !== undefined) payload.cargo_company = tester.cargoCompany;
  if (tester.cargoTrackingNo !== undefined) payload.cargo_tracking_no = tester.cargoTrackingNo;
  if (tester.status !== undefined) payload.status = tester.status;
  if (tester.note !== undefined) payload.note = tester.note;
  if (tester.convertedAt !== undefined) payload.converted_at = tester.convertedAt || null;
  if (tester.closedAt !== undefined) payload.closed_at = tester.closedAt || null;

  const { data, error } = await supabase
    .from("testers")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toAppTester(data as SupabaseTester);
}

export async function deleteTester(id: number) {
  const { error } = await supabase.from("testers").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}