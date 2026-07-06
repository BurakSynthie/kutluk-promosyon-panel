import { supabase } from "@/lib/supabaseClient";

export type OrderItem = {
  productType: string;
  material: string;
  quantity: string;
  essenceCategory: string;
  essence: string;
  designNote: string;
  itemNote: string;
};

export type Payment = {
  amount: number;
  date: string;
  note: string;
};

export type OrderImage = {
  name: string;
  url: string;
  path: string;
  size?: number;
  type?: string;
};

export type Order = {
  id: number;
  orderNo: string;
  customer: string;
  channel: string;
  contact: string;
  processDate: string;
  workDays: number;
  dueDate: string;
  status: string;
  totalPrice: number;
  paidAmount: number;
  remainingAmount: number;
  cariAmount: number;
  profit: number;
  cariPaid: boolean;
  note: string;
  items: OrderItem[];
  payments?: Payment[];
  images?: OrderImage[];
  createdAt: string;
  updatedAt?: string;
  cargoCompany?: string;
  cargoTrackingNo?: string;
  cargoDate?: string;
};

type SupabaseOrder = {
  id: number;
  user_id: string;
  order_no: string;
  customer: string;
  channel: string | null;
  contact: string | null;
  process_date: string | null;
  work_days: number | null;
  due_date: string | null;
  status: string | null;
  total_price: number | null;
  paid_amount: number | null;
  remaining_amount: number | null;
  cari_amount: number | null;
  profit: number | null;
  cari_paid: boolean | null;
  note: string | null;
  items: OrderItem[] | null;
  payments: Payment[] | null;
  images: OrderImage[] | null;
  cargo_company: string | null;
  cargo_tracking_no: string | null;
  cargo_date: string | null;
  created_at: string;
  updated_at: string | null;
};

function toAppOrder(order: SupabaseOrder): Order {
  return {
    id: order.id,
    orderNo: order.order_no,
    customer: order.customer || "",
    channel: order.channel || "",
    contact: order.contact || "",
    processDate: order.process_date || "",
    workDays: Number(order.work_days || 12),
    dueDate: order.due_date || "",
    status: order.status || "İşleme Alındı",
    totalPrice: Number(order.total_price || 0),
    paidAmount: Number(order.paid_amount || 0),
    remainingAmount: Number(order.remaining_amount || 0),
    cariAmount: Number(order.cari_amount || 0),
    profit: Number(order.profit || 0),
    cariPaid: Boolean(order.cari_paid),
    note: order.note || "",
    items: Array.isArray(order.items) ? order.items : [],
    payments: Array.isArray(order.payments) ? order.payments : [],
    images: Array.isArray(order.images) ? order.images : [],
    createdAt: order.created_at,
    updatedAt: order.updated_at || "",
    cargoCompany: order.cargo_company || "",
    cargoTrackingNo: order.cargo_tracking_no || "",
    cargoDate: order.cargo_date || "",
  };
}

function toSupabaseOrder(order: Partial<Order>, userId: string) {
  const totalPrice = Number(order.totalPrice || 0);
  const paidAmount = Number(order.paidAmount || 0);
  const remainingAmount =
    order.remainingAmount !== undefined
      ? Number(order.remainingAmount || 0)
      : Math.max(totalPrice - paidAmount, 0);

  return {
    user_id: userId,
    order_no: order.orderNo || "",
    customer: order.customer || "",
    channel: order.channel || "",
    contact: order.contact || "",
    process_date: order.processDate || null,
    work_days: Number(order.workDays || 12),
    due_date: order.dueDate || null,
    status: order.status || "İşleme Alındı",
    total_price: totalPrice,
    paid_amount: paidAmount,
    remaining_amount: remainingAmount,
    cari_amount: Number(order.cariAmount || 0),
    profit: Number(order.profit || 0),
    cari_paid: Boolean(order.cariPaid),
    note: order.note || "",
    items: order.items || [],
    payments: order.payments || [],
    images: order.images || [],
    cargo_company: order.cargoCompany || "",
    cargo_tracking_no: order.cargoTrackingNo || "",
    cargo_date: order.cargoDate || null,
  };
}

function cleanFileName(name: string) {
  return name
    .toLowerCase()
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .replace(/[^a-z0-9._-]/g, "-");
}

export async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error("Kullanıcı oturumu bulunamadı.");
  }

  return data.user.id;
}

export async function uploadOrderImages(files: File[], orderNo: string) {
  const userId = await getCurrentUserId();

  if (!files.length) {
    return [];
  }

  const uploadedImages: OrderImage[] = [];

  for (const file of files) {
    const fileExt = file.name.split(".").pop() || "jpg";
    const safeName = cleanFileName(file.name.replace(`.${fileExt}`, ""));
    const uniqueName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}-${safeName}.${fileExt}`;

    const path = `${userId}/${orderNo || "siparis"}/${uniqueName}`;

    const { error } = await supabase.storage
      .from("order-images")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw new Error(error.message);
    }

    const { data } = supabase.storage.from("order-images").getPublicUrl(path);

    uploadedImages.push({
      name: file.name,
      url: data.publicUrl,
      path,
      size: file.size,
      type: file.type,
    });
  }

  return uploadedImages;
}

export async function fetchOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data || []) as SupabaseOrder[]).map(toAppOrder);
}

export async function createOrder(order: Partial<Order>) {
  const userId = await getCurrentUserId();

  const payload = toSupabaseOrder(order, userId);

  const { data, error } = await supabase
    .from("orders")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toAppOrder(data as SupabaseOrder);
}

export async function updateOrder(id: number, order: Partial<Order>) {
  const userId = await getCurrentUserId();

  const payload = toSupabaseOrder(order, userId);

  const { data, error } = await supabase
    .from("orders")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toAppOrder(data as SupabaseOrder);
}

export async function patchOrder(id: number, order: Partial<Order>) {
  const payload: Record<string, unknown> = {};

  if (order.orderNo !== undefined) payload.order_no = order.orderNo;
  if (order.customer !== undefined) payload.customer = order.customer;
  if (order.channel !== undefined) payload.channel = order.channel;
  if (order.contact !== undefined) payload.contact = order.contact;
  if (order.processDate !== undefined) {
    payload.process_date = order.processDate || null;
  }
  if (order.workDays !== undefined) {
    payload.work_days = Number(order.workDays || 12);
  }
  if (order.dueDate !== undefined) payload.due_date = order.dueDate || null;
  if (order.status !== undefined) payload.status = order.status;
  if (order.totalPrice !== undefined) {
    payload.total_price = Number(order.totalPrice || 0);
  }
  if (order.paidAmount !== undefined) {
    payload.paid_amount = Number(order.paidAmount || 0);
  }
  if (order.remainingAmount !== undefined) {
    payload.remaining_amount = Number(order.remainingAmount || 0);
  }
  if (order.cariAmount !== undefined) {
    payload.cari_amount = Number(order.cariAmount || 0);
  }
  if (order.profit !== undefined) payload.profit = Number(order.profit || 0);
  if (order.cariPaid !== undefined) payload.cari_paid = Boolean(order.cariPaid);
  if (order.note !== undefined) payload.note = order.note;
  if (order.items !== undefined) payload.items = order.items;
  if (order.payments !== undefined) payload.payments = order.payments;
  if (order.images !== undefined) payload.images = order.images;
  if (order.cargoCompany !== undefined) {
    payload.cargo_company = order.cargoCompany;
  }
  if (order.cargoTrackingNo !== undefined) {
    payload.cargo_tracking_no = order.cargoTrackingNo;
  }
  if (order.cargoDate !== undefined) {
    payload.cargo_date = order.cargoDate || null;
  }

  const { data, error } = await supabase
    .from("orders")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toAppOrder(data as SupabaseOrder);
}

export async function deleteOrder(id: number) {
  const { error } = await supabase.from("orders").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}