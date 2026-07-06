import { addBusinessDays, formatTL, getOrderDueStatus } from "@/lib/helpers";

type OrderItem = {
  productType: string;
  material: string;
  quantity: number;
  essenceCategory: string;
  essence: string;
};

type Order = {
  id: number;
  orderNo: string;
  customer: string;
  channel: string;
  contact: string;
  processDate: string;
  workDays: number;
  totalPrice: number;
  paidAmount: number;
  cariAmount: number;
  profit: number;
  cariPaid: boolean;
  status: string;
  items: OrderItem[];
};

export default function OrderCard({ order }: { order: Order }) {
  const remaining = order.totalPrice - order.paidAmount;
  const dueDate = addBusinessDays(order.processDate, order.workDays);
  const dueStatus = getOrderDueStatus(order.processDate, order.workDays);

  return (
    <div className="group rounded-[26px] border border-white/10 bg-black/20 p-4 transition hover:border-cyan-300/25 hover:bg-white/[0.055]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-200">#{order.orderNo}</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/60">{order.status}</span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${
              dueStatus.type === "late"
                ? "bg-red-500/15 text-red-200"
                : dueStatus.type === "soon"
                  ? "bg-orange-500/15 text-orange-200"
                  : "bg-emerald-500/15 text-emerald-200"
            }`}>
              {dueStatus.label}
            </span>
          </div>

          <h3 className="mt-3 text-xl font-black">{order.customer}</h3>
          <p className="mt-1 text-sm text-white/45">{order.channel} · {order.contact}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {order.items.map((item, index) => (
              <span key={index} className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-xs text-white/60">
                {item.quantity} adet {item.material} · {item.essence}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-2 text-sm sm:grid-cols-2 xl:min-w-[420px]">
          <div className="rounded-2xl bg-white/[0.045] p-3">
            <p className="text-white/40">Satış</p>
            <p className="font-black">{formatTL(order.totalPrice)}</p>
          </div>
          <div className="rounded-2xl bg-white/[0.045] p-3">
            <p className="text-white/40">Kalan</p>
            <p className={`font-black ${remaining > 0 ? "text-yellow-200" : "text-emerald-200"}`}>{formatTL(remaining)}</p>
          </div>
          <div className="rounded-2xl bg-white/[0.045] p-3">
            <p className="text-white/40">Cari</p>
            <p className={order.cariPaid ? "font-black text-emerald-200" : "font-black text-red-200"}>
              {formatTL(order.cariAmount)}
            </p>
          </div>
          <div className="rounded-2xl bg-white/[0.045] p-3">
            <p className="text-white/40">Çıkış</p>
            <p className="font-black">{dueDate}</p>
          </div>
        </div>
      </div>
    </div>
  );
}