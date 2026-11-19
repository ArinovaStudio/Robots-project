"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CompanyCard from "@/components/home/search/company-card";
import FeedCard from "@/components/home/feed-card";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Store, ShoppingBag, Target, Sparkles, ArrowRight, ShieldAlert, Layers, FileText, UserCheck, Loader2 } from "lucide-react";
import { useUserStore } from "@/store/AuthStore";
import Link from "next/link";
import CollaborateModal from "@/components/modals/collaborate-modal";

const COMPANY_PAGE_SIZE = 12;

export default function MarketplaceClient() {
  const { user } = useUserStore();
  const isInvestor = user?.accountType === "INVESTOR";
  const [activeTab, setActiveTab] = useState<"suppliers" | "buyers">("suppliers");
  const [secondaryTab, setSecondaryTab] = useState<"overall" | "posts" | "profile">("overall");
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Infinite scroll for the company cards (Suppliers / Buyers)
  const [companyPage, setCompanyPage] = useState(1);
  const [companyHasMore, setCompanyHasMore] = useState(false);
  const [companyLoadingMore, setCompanyLoadingMore] = useState(false);
  const companyLoadingMoreRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // Identifies which list (tab + source) is on screen, so a slow "next page" response
  // for a list the user already left can never be appended to the current one.
  const listKeyRef = useRef("");
  // Posts tab: real posts from other businesses that match my Services & Offerings / Looking For
  const [matchedPosts, setMatchedPosts] = useState<any[]>([]);
  const [postsPage, setPostsPage] = useState(1);
  const [postsTotal, setPostsTotal] = useState(0);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsLoadingMore, setPostsLoadingMore] = useState(false);
  const [hasProfileTerms, setHasProfileTerms] = useState(true);
  const showPosts = secondaryTab === "posts";
  const [collaborateTarget, setCollaborateTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (isInvestor) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    // The Posts tab shows posts instead of company cards (loaded by the effect below)
    if (secondaryTab === "posts") {
      setLoading(false);
      return;
    }

    // Cancel the previous request when the tab changes, so a slow response for
    // an old tab/source can never overwrite the list the user is looking at now.
    const controller = new AbortController();
    const tab = activeTab;
    listKeyRef.current = `${tab}:${secondaryTab}`;
    setCompanyHasMore(false);
    setLoading(true);

    (async () => {
      try {
        const endpoint = `${
          tab === "suppliers" ? "/api/match/suppliers" : "/api/match/buyers"
        }?source=${secondaryTab}&page=1&limit=${COMPANY_PAGE_SIZE}`;
        const res = await fetch(endpoint, { signal: controller.signal });
        const json = await res.json();

        if (json.success) {
          if (tab === "suppliers") setSuppliers(json.data);
          else setBuyers(json.data);
          setCompanyPage(1);
          setCompanyHasMore(Boolean(json.pagination?.hasMore));
        } else {
          if (tab === "suppliers") setSuppliers([]);
          else setBuyers([]);
          setCompanyHasMore(false);
        }
        setLoading(false);
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return; // superseded by a newer request
        console.error("Failed to load matches:", err);
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [activeTab, secondaryTab, isInvestor]);

  const fetchMatchedPosts = async (tab: "suppliers" | "buyers", page: number, signal?: AbortSignal) => {
    const res = await fetch(`/api/match/posts?tab=${tab}&page=${page}&limit=10`, { signal });
    return res.json();
  };

  useEffect(() => {
    if (isInvestor || secondaryTab !== "posts") return;

    const controller = new AbortController();
    setPostsLoading(true);
    setMatchedPosts([]);
    setPostsPage(1);

    (async () => {
      try {
        const json = await fetchMatchedPosts(activeTab, 1, controller.signal);
        if (json.success) {
          setMatchedPosts(json.data);
          setPostsTotal(json.pagination?.total ?? json.data.length);
          setHasProfileTerms(json.hasProfileTerms !== false);
        } else {
          setMatchedPosts([]);
          setPostsTotal(0);
        }
        setPostsLoading(false);
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        console.error("Failed to load matching posts:", err);
        setPostsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [activeTab, secondaryTab, isInvestor]);

  const handleLoadMorePosts = async () => {
    if (postsLoadingMore) return;
    setPostsLoadingMore(true);
    try {
      const next = postsPage + 1;
      const json = await fetchMatchedPosts(activeTab, next);
      if (json.success) {
        setMatchedPosts((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          return [...prev, ...json.data.filter((p: any) => !seen.has(p.id))];
        });
        setPostsPage(next);
        setPostsTotal(json.pagination?.total ?? postsTotal);
      }
    } finally {
      setPostsLoadingMore(false);
    }
  };

  const loadMoreCompanies = useCallback(async () => {
    if (companyLoadingMoreRef.current || !companyHasMore) return;
    companyLoadingMoreRef.current = true;
    setCompanyLoadingMore(true);
    const key = listKeyRef.current;
    const tab = activeTab;
    const next = companyPage + 1;
    try {
      const endpoint = `${
        tab === "suppliers" ? "/api/match/suppliers" : "/api/match/buyers"
      }?source=${secondaryTab}&page=${next}&limit=${COMPANY_PAGE_SIZE}`;
      const res = await fetch(endpoint);
      const json = await res.json();
      if (listKeyRef.current !== key) return; // user switched tab/source meanwhile
      if (json.success) {
        const append = (prev: any[]) => {
          const seen = new Set(prev.map((c) => c.userId));
          return [...prev, ...json.data.filter((c: any) => !seen.has(c.userId))];
        };
        if (tab === "suppliers") setSuppliers(append);
        else setBuyers(append);
        setCompanyPage(next);
        setCompanyHasMore(Boolean(json.pagination?.hasMore));
      } else {
        setCompanyHasMore(false);
      }
    } catch (err) {
      console.error("Failed to load more matches:", err);
    } finally {
      companyLoadingMoreRef.current = false;
      setCompanyLoadingMore(false);
    }
  }, [activeTab, secondaryTab, companyPage, companyHasMore]);

  // Fire loadMore when the sentinel below the grid scrolls near the viewport
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !companyHasMore || showPosts || isInvestor) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMoreCompanies();
      },
      { rootMargin: "400px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMoreCompanies, companyHasMore, showPosts, isInvestor, loading]);

  if (isInvestor) {
    return (
      <section className="mx-auto max-w-4xl space-y-6 pb-20 pt-4">
        <div className="rounded-2xl border border-[#E5E7EB] bg-[#F8F4E8] p-8 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-[#EFF6FF] border border-blue-200 p-3 text-[#2563EB] shrink-0">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <span className="rounded-full bg-[#EFF6FF] border border-blue-200 px-3 py-0.5 text-xs font-bold text-[#2563EB] uppercase tracking-wider">
                Investor Account Notice
              </span>
              <h1 className="mt-2 text-2xl font-bold text-[#172033]">
                Service Exchange Unavailable for Investors
              </h1>
              <p className="mt-2 text-sm text-[#64748B] leading-relaxed">
                As an investor on Connecto, you cannot exchange services. B2B service swapping and vendor matching are reserved strictly for registered business accounts.
              </p>
              <p className="mt-2 text-sm text-[#64748B] leading-relaxed">
                Instead, you have full access to our dedicated <strong className="text-[#172033]">Investor Portal</strong>, where you can explore curated startup ideas, live products, active pitch decks, and connect with companies doing good in your selected preferences.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/investors/portal"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition"
                >
                  <Sparkles className="w-4 h-4" /> Open Investor Portal <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/investors/top-performers"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-5 py-2.5 text-sm font-semibold text-[#172033] hover:bg-gray-50 transition"
                >
                  View Companies Matching Your Preferences
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl space-y-6 pb-20">
      
      {/* Primary Section Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-1.5 shadow-xs flex items-center gap-1">
        <button
          onClick={() => setActiveTab("suppliers")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
            activeTab === "suppliers" 
              ? "bg-[#2563EB] text-white shadow-xs" 
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <Store className="w-5 h-5" />
          <span>Suppliers for what you need</span>
        </button>
        <button
          onClick={() => setActiveTab("buyers")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
            activeTab === "buyers" 
              ? "bg-[#2563EB] text-white shadow-xs" 
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span>Buyers for what you offer</span>
        </button>
      </div>

      {/* Main Results Container */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-6">
        {/* Header & Secondary Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-[#172033]">
              {activeTab === "suppliers" ? "Recommended Suppliers" : "Potential Buyers"}
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              {activeTab === "suppliers"
                ? "Discover businesses that can fulfill your commercial requirements and operational needs."
                : "Discover businesses actively in market for the products and services you provide."}
            </p>
          </div>

          {/* Secondary Navigation: Overall, Posts, Profile */}
          <div className="inline-flex items-center gap-1 bg-[#EFF6FF] border border-blue-100 p-1 rounded-xl self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setSecondaryTab("overall")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                secondaryTab === "overall"
                  ? "bg-[#2563EB] text-white shadow-xs"
                  : "text-blue-900 hover:bg-blue-100/60"
              }`}
            >
              <Layers size={13} />
              <span>Overall</span>
            </button>
            <button
              type="button"
              onClick={() => setSecondaryTab("posts")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                secondaryTab === "posts"
                  ? "bg-[#2563EB] text-white shadow-xs"
                  : "text-blue-900 hover:bg-blue-100/60"
              }`}
            >
              <FileText size={13} />
              <span>Posts</span>
            </button>
            <button
              type="button"
              onClick={() => setSecondaryTab("profile")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                secondaryTab === "profile"
                  ? "bg-[#2563EB] text-white shadow-xs"
                  : "text-blue-900 hover:bg-blue-100/60"
              }`}
            >
              <UserCheck size={13} />
              <span>Profile</span>
            </button>
          </div>
        </div>
        
        {(showPosts ? postsLoading : loading) ? (
          <SkeletonTheme baseColor="#f1f5f9" highlightColor="#ffffff">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-5">
                  <div className="flex gap-4">
                    <Skeleton circle width={56} height={56} />
                    <div className="flex-1">
                      <Skeleton width="80%" height={20} />
                      <Skeleton width="40%" height={14} className="mt-2" />
                    </div>
                  </div>
                  <Skeleton count={2} className="mt-4" />
                </div>
              ))}
            </div>
          </SkeletonTheme>
        ) : showPosts ? (
          <div className="space-y-4 max-w-2xl mx-auto">
            {matchedPosts.map((post) => (
              <div key={post.id} className="space-y-2">
                {post.matchedTerms?.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 px-1 text-[11px]">
                    <span className="font-semibold text-gray-500">
                      {activeTab === "suppliers" ? "Offers what you need:" : "Looking for what you offer:"}
                    </span>
                    {post.matchedTerms.slice(0, 4).map((t: string) => (
                      <span key={t} className="rounded-full border border-blue-100 bg-[#EFF6FF] px-2 py-0.5 font-semibold text-[#2563EB]">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <FeedCard post={post} currentUser={user} />
              </div>
            ))}

            {matchedPosts.length < postsTotal && (
              <button
                type="button"
                onClick={handleLoadMorePosts}
                disabled={postsLoadingMore}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 disabled:opacity-60"
              >
                {postsLoadingMore && <Loader2 size={14} className="animate-spin" />}
                Show more posts ({postsTotal - matchedPosts.length} remaining)
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(activeTab === "suppliers" ? suppliers : buyers).map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                showCollaborate={true}
                onCollaborate={(c) => setCollaborateTarget({ id: c.userId, name: c.companyName })}
                onCollabCancelled={(c) => {
                  const reset = (list: any[]) =>
                    list.map((x) => (x.userId === c.userId ? { ...x, collabStatus: "NONE" } : x));
                  setSuppliers(reset);
                  setBuyers(reset);
                }}
              />
            ))}
          </div>
        )}

        {!showPosts && !loading && (
          <div ref={sentinelRef} className="flex h-12 items-center justify-center">
            {companyLoadingMore && <Loader2 size={18} className="animate-spin text-blue-600" />}
          </div>
        )}
        
        {showPosts && !postsLoading && matchedPosts.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-semibold text-gray-700">
              {hasProfileTerms
                ? activeTab === "suppliers"
                  ? "No posts offering what you're looking for yet."
                  : "No posts looking for what you offer yet."
                : activeTab === "suppliers"
                ? "Add what you're looking for to see matching posts."
                : "Add your services & offerings to see matching posts."}
            </p>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              {hasProfileTerms
                ? "New posts from other businesses will appear here as soon as they match your profile."
                : "Update the Services & Offerings and Looking For sections of your company profile."}
            </p>
          </div>
        )}

        {!showPosts && !loading && (activeTab === "suppliers" ? suppliers : buyers).length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <Target className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-semibold text-gray-700">
              {secondaryTab === "profile"
                ? "No profile matches found for your current services or requirements."
                : "No collaboration recommendations found yet."}
            </p>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              Try adding more keywords, services offered, and requirements to your company profile!
            </p>
          </div>
        )}
      </div>

      {/* Collaborate Modal */}
      {collaborateTarget && (
        <CollaborateModal
          recipientId={collaborateTarget.id}
          companyName={collaborateTarget.name}
          onClose={() => setCollaborateTarget(null)}
          onSuccess={() => {
            // Flip the button to "Pending" right away, no refetch needed
            const markPending = (list: any[]) =>
              list.map((c) => (c.userId === collaborateTarget.id ? { ...c, collabStatus: "PENDING" } : c));
            setSuppliers(markPending);
            setBuyers(markPending);
            setCollaborateTarget(null);
          }}
        />
      )}
    </section>
  );
}