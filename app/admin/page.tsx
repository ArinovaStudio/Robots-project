"use client";

import useSWR from "swr";

import { DashboardSkeleton } from "./_components/DashboardSkeletons";

import {
  Activity,
  BadgeIndianRupee,
  Building2,
  CreditCard,
  FileText,
  MessageCircle,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import ErrorLoading from "@/components/ErrorLoading";
import { fetcher } from "@/lib/fetcher";

const overviewIcons = {
  users: Users,
  companies: Building2,
  connections: UserPlus,
  revenue: BadgeIndianRupee,
};
interface AnalyticsComparison {
  current: number;
  previous: number;
}

interface AdminAnalyticsData {
  generatedAt: string;
  overview: {
    totalUsers: number;
    totalCompanies: number;
    totalConnections: number;
    totalRevenue: number;
  };
  engagement: {
    posts: number;
    comments: number;
    messages: number;
    saved: number;
  };
  growth: Array<{
    month: string;
    users: number;
    companies: number;
    connections: number;
    revenue: number;
  }>;
  comparisons: {
    users: AnalyticsComparison;
    companies: AnalyticsComparison;
    connections: AnalyticsComparison;
    revenue: AnalyticsComparison;
  };
  recentActivities: Array<{ icon: string; title: string; time: string }>;
  health: {
    usersToday: number;
    companiesToday: number;
    messagesToday: number;
    totalInvestors: number;
    boostedProfiles: number;
    successfulPaymentsToday: number;
  };
}

interface AdminAnalyticsResponse {
  success: boolean;
  message?: string;
  data: AdminAnalyticsData;
}

export function formatAnalytics(apiData: AdminAnalyticsData) {
  if (!apiData) return null;

  const { overview, engagement, growth, comparisons, health, recentActivities } = apiData;
  const formatChange = (current: number, previous: number) => {
    if (previous === 0) return current === 0 ? "0%" : "New";
    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
  };
  const getComparison = (values: { current: number; previous: number }) => ({
    growth: formatChange(values.current, values.previous),
    growthDirection: values.current > values.previous ? "up" :
      values.current < values.previous ? "down" : "flat",
  });
  const totalEngagement = engagement.posts + engagement.comments + engagement.messages + engagement.saved;

  return {
    overviewCards: [
      {
        title: "Total Users",
        value: overview.totalUsers.toLocaleString(),
        ...getComparison(comparisons.users),
        icon: "users",
      },
      {
        title: "Company Profiles",
        value: overview.totalCompanies.toLocaleString(),
        ...getComparison(comparisons.companies),
        icon: "companies",
      },
      {
        title: "Connections",
        value: overview.totalConnections.toLocaleString(),
        ...getComparison(comparisons.connections),
        icon: "connections",
      },
      {
        title: "Revenue",
        value: `₹${Number(overview.totalRevenue || 0).toLocaleString("en-IN")}`,
        ...getComparison(comparisons.revenue),
        icon: "revenue",
      },
    ],

    growthData: growth,

    postStats: [
      { name: "Posts", value: totalEngagement ? (engagement.posts / totalEngagement) * 100 : 0, count: engagement.posts, color: "#2563eb" },
      { name: "Comments", value: totalEngagement ? (engagement.comments / totalEngagement) * 100 : 0, count: engagement.comments, color: "#16a34a" },
      { name: "Messages", value: totalEngagement ? (engagement.messages / totalEngagement) * 100 : 0, count: engagement.messages, color: "#f59e0b" },
      { name: "Saved", value: totalEngagement ? (engagement.saved / totalEngagement) * 100 : 0, count: engagement.saved, color: "#dc2626" },
    ],

    revenueData: growth.map((item) => ({ month: item.month, revenue: item.revenue })),

    recentActivities,
    generatedAt: apiData.generatedAt,

    platformHealth: [
      {
        label: "New Users Today",
        value: health.usersToday.toLocaleString(),
      },
      {
        label: "Company Profiles Today",
        value: health.companiesToday,
      },
      {
        label: "Messages Today",
        value: health.messagesToday,
      },
      {
        label: "Investor Profiles",
        value: health.totalInvestors,
      },
      {
        label: "Boosted Company Profiles",
        value: health.boostedProfiles,
      },
      {
        label: "Successful Payments Today",
        value: health.successfulPaymentsToday,
      },
    ],
  };
}

export default function AdminDashboard() {
  const { data, error, isLoading, mutate, isValidating } = useSWR<AdminAnalyticsResponse>("/api/admin/analytics", fetcher, {
    refreshInterval: 60_000,
    revalidateOnFocus: true,
  });
  const analytics = data?.success ? formatAnalytics(data.data) : null;
  const analyticsError = error || (data && !data.success ? new Error(data.message || "Failed to load analytics") : undefined);

  return (
    <main>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#050a30]">
              Platform Analytics
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Monitor users, revenue, engagement & growth
            </p>
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-500">
            {analytics?.generatedAt && (
              <span>
                Updated {new Date(analytics.generatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </span>
            )}
            <button
              type="button"
              onClick={() => mutate()}
              disabled={isValidating}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              {isValidating ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        <ErrorLoading
          loading={isLoading}
          error={analyticsError}
          dataLength={analytics ? 1 : 0}
          loadingCard={DashboardSkeleton}
          className="space-y-5"
        >
          {analytics && (
          <>
            {/* Overview Cards */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {analytics.overviewCards.map((card) => {
                const Icon =
                  overviewIcons[card.icon as keyof typeof overviewIcons] ||
                  Users;
                const ChangeIcon = card.growthDirection === "down" ? TrendingDown : TrendingUp;

                return (
                  <div
                    key={card.title}
                    className="rounded-3xl bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-500">{card.title}</p>

                        <h2 className="mt-2 text-3xl font-bold text-[#050a30]">
                          {card.value}
                        </h2>

                        <div className={`mt-3 flex items-center gap-1 text-sm font-medium ${
                          card.growthDirection === "down" ? "text-red-600" :
                          card.growthDirection === "flat" ? "text-gray-500" : "text-green-600"
                        }`}>
                          <ChangeIcon className="h-4 w-4" />
                          <span>{card.growth}</span>
                          <span className="ml-1 text-xs font-normal text-gray-400">vs same period last month</span>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-[#EFF6FF] p-3">
                        <Icon className="h-6 w-6 text-[#2563EB]" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            {/* Charts */}
            <section className="grid gap-6 xl:grid-cols-3">
              {/* Growth */}
              <div className="rounded-3xl bg-white p-5 shadow-sm xl:col-span-2">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[#050a30]">
                      Users, Companies & Connections
                    </h2>

                    <p className="text-sm text-gray-500">
                      Monthly new users, company profiles and accepted connections
                    </p>
                  </div>

                  <Activity className="h-5 w-5 text-gray-400" />
                </div>

                <div className="h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.growthData}>
                      <defs>
                        <linearGradient
                          id="usersGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#2563eb"
                            stopOpacity={0.4}
                          />

                          <stop
                            offset="95%"
                            stopColor="#2563eb"
                            stopOpacity={0}
                          />
                        </linearGradient>

                        <linearGradient
                          id="companyGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#14b8a6"
                            stopOpacity={0.4}
                          />

                          <stop
                            offset="95%"
                            stopColor="#14b8a6"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>

                      <CartesianGrid strokeDasharray="3 3" vertical={false} />

                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />

                      <Area
                        type="monotone"
                        dataKey="users"
                        stroke="#2563eb"
                        fill="url(#usersGradient)"
                        strokeWidth={3}
                      />

                      <Area
                        type="monotone"
                        dataKey="companies"
                        stroke="#14b8a6"
                        fill="url(#companyGradient)"
                        strokeWidth={3}
                      />
                      <Area
                        type="monotone"
                        dataKey="connections"
                        stroke="#f59e0b"
                        fill="transparent"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Engagement */}
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="mb-5">
                  <h2 className="text-lg font-bold text-[#050a30]">
                    Engagement Breakdown
                  </h2>

                  <p className="text-sm text-gray-500">
                    Platform interaction overview
                  </p>
                </div>

                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.postStats}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={4}
                      >
                        {analytics.postStats.map(
                          (entry, index: number) => (
                            <Cell key={index} fill={entry.color} />
                          )
                        )}
                      </Pie>

                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  {analytics.postStats.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center gap-2 rounded-xl bg-[#f8fafc] p-3"
                    >
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor: item.color,
                        }}
                      />

                      <div>
                        <p className="text-sm font-medium">{item.name}</p>

                        <p className="text-xs text-gray-500">
                          {item.count.toLocaleString()} · {item.value.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Revenue */}
            <section>
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[#172033]">
                      Payment Revenue
                    </h2>

                    <p className="text-sm text-gray-500">
                      Monthly successful payments (INR)
                    </p>
                  </div>

                  <BadgeIndianRupee className="h-5 w-5 text-gray-400" />
                </div>

                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.revenueData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />

                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`} />
                      <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Revenue"]} />

                      <Bar
                        dataKey="revenue"
                        radius={[12, 12, 0, 0]}
                        fill="#2563eb"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            {/* Bottom */}
            <section className="grid gap-6 lg:grid-cols-3">
              {/* Activity */}
              <div className="rounded-3xl bg-white p-5 shadow-sm lg:col-span-2">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[#172033]">
                      Recent Activity
                    </h2>

                    <p className="text-sm text-gray-500">
                      Live platform updates
                    </p>
                  </div>

                  <FileText className="h-5 w-5 text-gray-400" />
                </div>

                <div className="space-y-4">
                  {!analytics.recentActivities.length && (
                    <p className="py-8 text-center text-sm text-gray-500">No recent activity yet.</p>
                  )}
                  {analytics.recentActivities.map(
                    (item, index) => {
                      const Icon =
                        {
                          users: Users,
                          companies: Building2,
                          payments: CreditCard,
                          messages: MessageCircle,
                        }[
                          item.icon as
                            | "users"
                            | "companies"
                            | "payments"
                            | "messages"
                        ] || Users;

                      return (
                        <div
                          key={index}
                          className="flex items-center gap-4 rounded-2xl border p-4"
                        >
                          <div className="rounded-2xl bg-[#EFF6FF] p-3">
                            <Icon className="h-5 w-5 text-[#2563EB]" />
                          </div>

                          <div className="flex-1">
                            <h3 className="font-medium text-[#172033]">
                              {item.title}
                            </h3>

                            <p className="text-sm text-gray-500">{item.time}</p>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Health */}
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-[#050a30]">
                  Platform Health
                </h2>

                <div className="mt-6 space-y-5">
                  {analytics.platformHealth.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between border-b pb-3"
                    >
                      <span className="text-sm text-gray-500">
                        {item.label}
                      </span>

                      <span className="font-semibold text-[#050a30]">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
          )}
        </ErrorLoading>
      </div>
    </main>
  );
}
