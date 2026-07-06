type EssenceGroup = {
  category: string;
  items: string[];
};

export default function OrderFormPreview({ essences }: { essences: EssenceGroup[] }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
      <div className="border-b border-white/10 pb-4">
        <p className="text-sm text-white/50">Demo Form</p>
        <h2 className="text-2xl font-black tracking-tight">Sipariş Ekleme Alanı</h2>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <label className="text-xs font-bold text-white/45">Sipariş No</label>
          <div className="mt-2 text-lg font-black text-cyan-200">0004</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <label className="text-xs font-bold text-white/45">Sipariş Kanalı</label>
          <select className="mt-2 w-full bg-transparent text-sm font-bold outline-none">
            <option>Instagram</option>
            <option>WhatsApp</option>
            <option>Telefon</option>
            <option>Web Sitesi</option>
            <option>Diğer</option>
          </select>
        </div>

        <input className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-semibold outline-none placeholder:text-white/30" placeholder="Müşteri adı / firma" />
        <input className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-semibold outline-none placeholder:text-white/30" placeholder="@instagram veya telefon" />

        <input className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-semibold outline-none placeholder:text-white/30" placeholder="Toplam satış: 3500" />
        <input className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-semibold outline-none placeholder:text-white/30" placeholder="Alınan ödeme: 1750" />

        <input className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-semibold outline-none placeholder:text-white/30" placeholder="Cari: 2100" />
        <input className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-semibold outline-none placeholder:text-white/30" placeholder="Kâr: 1400" />
      </div>

      <div className="mt-4 rounded-[24px] border border-cyan-300/15 bg-cyan-400/5 p-4">
        <div className="flex items-center justify-between">
          <p className="font-black">Ürün / Esans Satırı</p>
          <button className="rounded-xl bg-cyan-400/15 px-3 py-2 text-xs font-black text-cyan-100">+ Satır Ekle</button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <select className="rounded-2xl border border-white/10 bg-black/30 p-3 text-sm font-bold outline-none">
            <option>Oto Kokusu</option>
            <option>Paspas</option>
            <option>Sırt Kartonlu</option>
            <option>Bardak Altlığı</option>
          </select>

          <select className="rounded-2xl border border-white/10 bg-black/30 p-3 text-sm font-bold outline-none">
            <option>Tek Kat</option>
            <option>Selüloz</option>
            <option>Yok</option>
          </select>

          <input className="rounded-2xl border border-white/10 bg-black/30 p-3 text-sm font-semibold outline-none placeholder:text-white/30" placeholder="Adet" />

          <select className="rounded-2xl border border-white/10 bg-black/30 p-3 text-sm font-bold outline-none">
            {essences.map((group) => (
              <option key={group.category}>{group.category}</option>
            ))}
          </select>

          <select className="rounded-2xl border border-white/10 bg-black/30 p-3 text-sm font-bold outline-none md:col-span-2">
            {essences.flatMap((group) =>
              group.items.map((item) => (
                <option key={`${group.category}-${item}`}>{item}</option>
              ))
            )}
          </select>
        </div>
      </div>

      <textarea
        className="mt-4 min-h-32 w-full rounded-[24px] border border-white/10 bg-black/20 p-4 text-sm font-semibold outline-none placeholder:text-white/30"
        placeholder="Sipariş notu: ön arka farklı, logo büyüsün, prova gönderilecek..."
      />

      <button className="mt-4 w-full rounded-2xl bg-gradient-to-r from-purple-500 via-blue-600 to-cyan-400 px-5 py-4 text-sm font-black shadow-lg shadow-blue-950/40">
        Siparişi Kaydet
      </button>
    </div>
  );
}