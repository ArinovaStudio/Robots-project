export default function StatsCard() {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <h3 className="text-xl font-semibold">Profile stats</h3>

      <div className="mt-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-slate-600">
            Profile Viewers
          </span>

          <span className="text-red-500">0</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-600">
            Overall impressions
          </span>

          <span className="text-green-500">132</span>
        </div>
      </div>
    </div>
  );
}