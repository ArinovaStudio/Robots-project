"use client";

import useSWR from "swr";

import {
  DashboardSkeleton,
} from "./_components/DashboardSkeletons";

import {
  Activity,
  BadgeIndianRupee,
  Briefcase,
  Building2,
  CreditCard,
  FileText,
  MessageCircle,
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
export function formatAnalytics(apiData: any) {
  if (!apiData) return null;

  const { overview, engagement, growth, plans, health } = apiData;

  const maxPlanUsers = Math.max(
    ...plans.map((p: any) => p._count.subscriptions),
    1
  );

  return {
    overviewCards: [
      {
        title: "Total Users",
        value: overview.totalUsers.toLocaleString(),
        growth: "+12.5%",
        icon: "users",
      },
      {
        title: "Company Profiles",
        value: overview.totalCompanies.toLocaleString(),
        growth: "+8.2%",
        icon: "companies",
      },
      {
        title: "Connections",
        value: overview.totalConnections.toLocaleString(),
        growth: "+18.4%",
        icon: "connections",
      },
      {
        title: "Revenue",
        value: `₹${Number(overview.totalRevenue || 0).toLocaleString()}`,
        growth: "+22.1%",
        icon: "revenue",
      },
    ],

    growthData: growth.users.map((u: any, i: number) => ({
      month: new Date(u.createdAt).toLocaleString("default", {
        month: "short",
      }),
      users: u._count,
      companies: growth.companies[i]?._count || 0,
    })),

    postStats: [
      { name: "Posts", value: engagement.posts, color: "#2563eb" },
      { name: "Comments", value: engagement.comments, color: "#16a34a" },
      { name: "Messages", value: engagement.messages, color: "#f59e0b" },
      { name: "Saved", value: engagement.saved, color: "#dc2626" },
    ],

    revenueData: growth.users.map((u: any) => ({
      month: new Date(u.createdAt).toLocaleString("default", {
        month: "short",
      }),
      revenue: overview.totalRevenue || 0,
    })),

    planData: plans.map((p: any) => ({
      name: p.name,
      users: p._count.subscriptions,
      percentage: (p._count.subscriptions / maxPlanUsers) * 100,
    })),

    conversionRate:
      overview.totalUsers > 0
        ? ((health.newSubscriptions / overview.totalUsers) * 100).toFixed(1)
        : 0,

    retentionRate: 91.4,

    recentActivities: [
      {
        icon: "users",
        title: `${health.dailyUsers.toLocaleString()} new users registered today`,
        time: "Today",
      },
      {
        icon: "companies",
        title: `${health.companiesToday} company profiles created`,
        time: "Today",
      },
      {
        icon: "payments",
        title: `${health.successfulPayments} successful payments`,
        time: "Today",
      },
      {
        icon: "messages",
        title: `${health.messagesToday} messages exchanged`,
        time: "Today",
      },
    ],

    platformHealth: [
      {
        label: "Daily Active Users",
        value: health.dailyUsers.toLocaleString(),
      },
      {
        label: "Companies Today",
        value: health.companiesToday,
      },
      {
        label: "Messages Today",
        value: health.messagesToday,
      },
      {
        label: "New Subscriptions",
        value: health.newSubscriptions,
      },
      {
        label: "Boosted Profiles",
        value: health.boostedProfiles,
      },
      {
        label: "Successful Payments",
        value: health.successfulPayments,
      },
    ],
  };
}
const defaultAnalytics = {
  overviewCards: [
    {
      title: "Total Users",
      value: "0",
      growth: "+0%",
      icon: "users",
    },
    {
      title: "Company Profiles",
      value: "0",
      growth: "+0%",
      icon: "companies",
    },
    {
      title: "Connections",
      value: "0",
      growth: "+0%",
      icon: "connections",
    },
    {
      title: "Revenue",
      value: "₹0",
      growth: "+0%",
      icon: "revenue",
    },
  ],

  growthData: [],

  postStats: [],

  revenueData: [],

  planData: [],

  conversionRate: 0,

  retentionRate: 0,

  recentActivities: [],

  platformHealth: [],
};

export default function AdminDashboard() {
  const { data, error, isLoading } = useSWR("/api/admin/analytics", fetcher);

  const analytics = data?.data
    ? formatAnalytics(data?.data)!
    : defaultAnalytics;

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

          {/* <div className="flex items-center gap-3">
            <button className="rounded-xl border bg-white px-4 py-2 text-sm font-medium">
              Last 7 Days
            </button>

            <button className="rounded-xl bg-[#050a30] px-4 py-2 text-sm font-medium text-white">
              Export Report
            </button>
          </div> */}
        </div>

        <ErrorLoading
          loading={isLoading}
          error={error}
          dataLength={analytics ? 1 : 0}
          loadingCard={DashboardSkeleton}
          className="space-y-5"
        >
          <>
            {/* Overview Cards */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {analytics.overviewCards.map((card: any) => {
                const Icon =
                  overviewIcons[card.icon as keyof typeof overviewIcons] ||
                  Users;

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

                        <div className="mt-3 flex items-center gap-1 text-sm font-medium text-green-600">
                          <TrendingUp className="h-4 w-4" />
                          {card.growth}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-[#eef2ff] p-3">
                        <Icon className="h-6 w-6 text-[#4338ca]" />
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
                      User & Company Growth
                    </h2>

                    <p className="text-sm text-gray-500">
                      Monthly onboarding analytics
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
                          (entry: any, index: number) => (
                            <Cell key={index} fill={entry.color} />
                          )
                        )}
                      </Pie>

                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  {analytics.postStats.map((item: any) => (
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

                        <p className="text-xs text-gray-500">{item.value}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Revenue + Plans */}
            <section className="grid gap-6 lg:grid-cols-2">
              {/* Revenue */}
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[#050a30]">
                      Subscription Revenue
                    </h2>

                    <p className="text-sm text-gray-500">
                      Monthly platform earnings
                    </p>
                  </div>

                  <BadgeIndianRupee className="h-5 w-5 text-gray-400" />
                </div>

                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.revenueData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />

                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />

                      <Bar
                        dataKey="revenue"
                        radius={[12, 12, 0, 0]}
                        fill="#4338ca"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Plans */}
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[#050a30]">
                      Subscription Plans
                    </h2>

                    <p className="text-sm text-gray-500">
                      Active paid users by plan
                    </p>
                  </div>

                  <Briefcase className="h-5 w-5 text-gray-400" />
                </div>

                <div className="space-y-5">
                  {analytics.planData.map((plan: any) => (
                    <div key={plan.name}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium">{plan.name}</span>

                        <span className="text-sm text-gray-500">
                          {plan.users} users
                        </span>
                      </div>

                      <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-[#4338ca]"
                          style={{
                            width: `${plan.percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-[#eef2ff] p-4">
                    <p className="text-sm text-gray-500">Conversion Rate</p>

                    <h3 className="mt-2 text-2xl font-bold text-[#050a30]">
                      {analytics.conversionRate}%
                    </h3>
                  </div>

                  <div className="rounded-2xl bg-[#ecfdf5] p-4">
                    <p className="text-sm text-gray-500">Retention Rate</p>

                    <h3 className="mt-2 text-2xl font-bold text-[#050a30]">
                      {analytics.retentionRate}%
                    </h3>
                  </div>
                </div>
              </div>
            </section>

            {/* Bottom */}
            <section className="grid gap-6 lg:grid-cols-3">
              {/* Activity */}
              <div className="rounded-3xl bg-white p-5 shadow-sm lg:col-span-2">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[#050a30]">
                      Recent Activity
                    </h2>

                    <p className="text-sm text-gray-500">
                      Live platform updates
                    </p>
                  </div>

                  <FileText className="h-5 w-5 text-gray-400" />
                </div>

                <div className="space-y-4">
                  {analytics.recentActivities.map(
                    (item: any, index: number) => {
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
                          <div className="rounded-2xl bg-[#eef2ff] p-3">
                            <Icon className="h-5 w-5 text-[#4338ca]" />
                          </div>

                          <div className="flex-1">
                            <h3 className="font-medium text-[#050a30]">
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
                  {analytics.platformHealth.map((item: any) => (
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
        </ErrorLoading>
      </div>
    </main>
  );
}
