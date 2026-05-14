export default function StatsCard({ viewers, impressions }: { viewers: number, impressions: number }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-slate-900">Profile stats</h3>

      <div className="mt-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-600">
            Profile Viewers
          </span>
          <span className="text-sm font-bold text-red-500">{viewers}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-600">
            Overall impressions
          </span>
          <span className="text-sm font-bold text-green-500">{impressions}</span>
        </div>
      </div>
    </div>
  );
}