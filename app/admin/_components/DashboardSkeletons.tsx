import { Skeleton } from "@/components/ui/skeleton";


export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <DashboardCardSkeleton key={i} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <DashboardChartSkeleton />
        </div>

        <DashboardChartSkeleton />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <DashboardChartSkeleton />
        <DashboardChartSkeleton />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardListSkeleton />
        </div>

        <DashboardListSkeleton />
      </section>
    </div>
  );
}


export function DashboardCardSkeleton() {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>

        <Skeleton className="h-12 w-12 rounded-2xl" />
      </div>
    </div>
  );
}

export function DashboardChartSkeleton() {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="space-y-3">
        <Skeleton className="h-5 w-52" />
        <Skeleton className="h-4 w-40" />
      </div>

      <Skeleton className="mt-6 h-[320px] w-full rounded-2xl" />
    </div>
  );
}

export function DashboardListSkeleton() {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-2xl border p-4"
          >
            <Skeleton className="h-12 w-12 rounded-2xl" />

            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}