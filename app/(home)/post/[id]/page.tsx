"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, ArrowLeft } from "lucide-react";
import FeedCard from "@/components/home/feed-card";

export default function SinglePostPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/posts/${id}`);
        const json = await res.json();
        
        if (json.success) {
          setPost(json.data);
        } else {
          setError(json.message || "Post not found");
        }
      } catch {
        setError("Failed to load post");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#5667ff]" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Oops!</h2>
        <p className="text-slate-500 mb-6">{error || "This post might have been deleted."}</p>
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition font-medium text-sm"
        >
          <ArrowLeft size={16} /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-20 space-y-4">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition py-2"
      >
        <ArrowLeft size={16} /> Back to feed
      </button>

      <FeedCard post={post} currentUser={session?.user} />
    </div>
  );
}