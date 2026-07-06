type StatCardProps = {
  title: string;
  value: string;
  subtitle: string;
  tone: "blue" | "purple" | "green" | "yellow" | "red";
};

const tones = {
  blue: "from-cyan-400/20 to-blue-600/10 text-cyan-100 border-cyan-300/20",
  purple: "from-purple-400/20 to-violet-700/10 text-purple-100 border-purple-300/20",
  green: "from-emerald-400/20 to-green-700/10 text-emerald-100 border-emerald-300/20",
  yellow: "from-yellow-400/20 to-orange-700/10 text-yellow-100 border-yellow-300/20",
  red: "from-red-400/20 to-rose-700/10 text-red-100 border-red-300/20",
};

export default function StatCard({ title, value, subtitle, tone }: StatCardProps) {
  return (
    <div className={`rounded-[28px] border bg-gradient-to-br p-5 shadow-2xl shadow-black/20 backdrop-blur-xl ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold opacity-65">{title}</p>
          <p className="mt-3 text-3xl font-black tracking-tight">{value}</p>
          <p className="mt-2 text-xs font-semibold opacity-50">{subtitle}</p>
        </div>
        <div className="h-11 w-11 rounded-2xl bg-white/10 shadow-inner" />
      </div>
    </div>
  );
}