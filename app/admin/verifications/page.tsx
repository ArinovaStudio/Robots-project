"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck, Clock, CheckCircle2, XCircle, HelpCircle,
  Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight,
  Eye, RefreshCw, Loader2, UserCheck
} from "lucide-react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface VerificationAppItem {
  id: string;
  userId: string;
  fullName: string;
  username: string;
  email: string;
  accountType: string;
  status: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED" | "MORE_INFO_REQUIRED";
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    company?: {
      companyName: string;
      logoUrl: string | null;
    };
  };
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  infoRequired: number;
}

export default function AdminVerificationsDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<VerificationAppItem[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    infoRequired: 0,
  });

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        sort,
        page: page.toString(),
        limit: "10",
      });

      const res = await fetch(`/api/admin/verifications?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setApplications(json.data);
        setStats(json.stats);
        setTotalPages(json.pagination.totalPages);
        setTotalCount(json.pagination.total);
      }
    } catch (err) {
      console.error("Failed to load verification requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [search, statusFilter, sort, page]);

  // Badge Status Renderer
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 size={13} /> Verified
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={13} /> Pending
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <XCircle size={13} /> Rejected
          </span>
        );
      case "MORE_INFO_REQUIRED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <HelpCircle size={13} /> Info Required
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Unverified
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 p-2 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="text-blue-600" size={26} /> Verification Requests
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review, verify, reject, or request additional information for user profile verification applications.
          </p>
        </div>

        <button
          onClick={fetchApplications}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm transition"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh Data
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Applications */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
            <UserCheck size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total</p>
            <h3 className="text-xl font-bold text-slate-900">{stats.total}</h3>
          </div>
        </div>

        {/* Pending Applications */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Pending</p>
            <h3 className="text-xl font-bold text-slate-900">{stats.pending}</h3>
          </div>
        </div>

        {/* Approved / Verified */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Approved</p>
            <h3 className="text-xl font-bold text-slate-900">{stats.approved}</h3>
          </div>
        </div>

        {/* Rejected Applications */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <XCircle size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Rejected</p>
            <h3 className="text-xl font-bold text-slate-900">{stats.rejected}</h3>
          </div>
        </div>

        {/* More Info Required */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 col-span-2 lg:col-span-1">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <HelpCircle size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Info Required</p>
            <h3 className="text-xl font-bold text-slate-900">{stats.infoRequired}</h3>
          </div>
        </div>
      </div>

      {/* Search & Filters Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, email, ID..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Sort Selection */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <ArrowUpDown size={14} className="text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">Sort:</span>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="updated">Recently Updated</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t pt-3">
          {[
            { label: "All Applications", value: "ALL", count: stats.total },
            { label: "Pending", value: "PENDING", count: stats.pending },
            { label: "Approved", value: "VERIFIED", count: stats.approved },
            { label: "Rejected", value: "REJECTED", count: stats.rejected },
            { label: "Info Required", value: "MORE_INFO_REQUIRED", count: stats.infoRequired },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setStatusFilter(tab.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                statusFilter === tab.value
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  statusFilter === tab.value
                    ? "bg-blue-700 text-white"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-4">Applicant</th>
                <th className="p-4">Category</th>
                <th className="p-4">Current Status</th>
                <th className="p-4">Submitted Date</th>
                <th className="p-4">Last Updated</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="p-4" colSpan={6}>
                      <Skeleton height={28} />
                    </td>
                  </tr>
                ))
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 font-medium">
                    <ShieldCheck size={40} className="mx-auto mb-2 text-slate-300" />
                    No verification applications found matching your criteria.
                  </td>
                </tr>
              ) : (
                applications.map((app) => {
                  const avatar = app.user?.company?.logoUrl || app.user?.image;
                  const name = app.fullName || app.user?.company?.companyName || app.user?.name || "Applicant";

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/60 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-slate-100 border overflow-hidden shrink-0 flex items-center justify-center font-bold text-slate-400 text-sm">
                            {avatar ? (
                              <img src={avatar} alt={name} className="h-full w-full object-cover" />
                            ) : (
                              name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{name}</p>
                            <p className="text-slate-400 text-[11px]">{app.username || app.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-[11px]">
                          {app.accountType || "General"}
                        </span>
                      </td>

                      <td className="p-4">{renderStatusBadge(app.status)}</td>

                      <td className="p-4 text-slate-500 font-medium">
                        {new Date(app.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      <td className="p-4 text-slate-500 font-medium">
                        {new Date(app.updatedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      <td className="p-4 text-right">
                        <Link
                          href={`/admin/verifications/${app.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded-lg transition text-xs shadow-sm"
                        >
                          <Eye size={14} /> Review
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between bg-slate-50/50 text-xs">
            <span className="text-slate-500">
              Showing <span className="font-semibold">{applications.length}</span> of{" "}
              <span className="font-semibold">{totalCount}</span> applications
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border bg-white disabled:opacity-40 text-slate-600 hover:bg-slate-50"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-semibold text-slate-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border bg-white disabled:opacity-40 text-slate-600 hover:bg-slate-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
