"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ShieldCheck, CheckCircle2, XCircle, HelpCircle, Clock,
  User, Mail, Phone, Calendar, MapPin, ExternalLink, FileText, Download,
  Eye, MessageSquare, Send, AlertTriangle, X, Check, Building2
} from "lucide-react";
import { toast } from "sonner";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminVerificationDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const applicationId = resolvedParams.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [appData, setAppData] = useState<any>(null);

  // Modals & Action States
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showInfoRequestModal, setShowInfoRequestModal] = useState(false);

  const [rejectionReason, setRejectionReason] = useState("");
  const [infoRequestMessage, setInfoRequestMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Internal Note State
  const [newNote, setNewNote] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  // Document Lightbox & Viewer State
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState("");
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);

  const fetchApplicationDetails = async () => {
    try {
      const res = await fetch(`/api/admin/verifications/${applicationId}`);
      const json = await res.json();
      if (json.success) {
        setAppData(json.data);
      } else {
        toast.error(json.message || "Failed to load application details");
      }
    } catch (err) {
      console.error("Error loading application:", err);
      toast.error("Error loading application details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (applicationId) fetchApplicationDetails();
  }, [applicationId]);

  // Handle Admin Actions
  const handleAction = async (actionType: "APPROVE" | "REJECT" | "REQUEST_MORE_INFO") => {
    setActionLoading(true);
    try {
      const body: any = { action: actionType };
      if (actionType === "REJECT") body.rejectionReason = rejectionReason;
      if (actionType === "REQUEST_MORE_INFO") body.infoRequestMessage = infoRequestMessage;

      const res = await fetch(`/api/admin/verifications/${applicationId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (json.success) {
        toast.success(json.message);
        setShowApproveModal(false);
        setShowRejectModal(false);
        setShowInfoRequestModal(false);
        setRejectionReason("");
        setInfoRequestMessage("");
        fetchApplicationDetails();
      } else {
        toast.error(json.message || "Action failed.");
      }
    } catch (err) {
      console.error("Action error:", err);
      toast.error("Failed to execute action.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Internal Admin Note Submission
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setNoteSubmitting(true);
    try {
      const res = await fetch(`/api/admin/verifications/${applicationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newNote }),
      });
      const json = await res.json();

      if (json.success) {
        toast.success("Internal admin note saved.");
        setNewNote("");
        fetchApplicationDetails();
      } else {
        toast.error(json.message || "Failed to save note.");
      }
    } catch (err) {
      console.error("Note save error:", err);
      toast.error("Error saving note.");
    } finally {
      setNoteSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4 space-y-6">
        <Skeleton height={40} width={200} />
        <Skeleton height={200} borderRadius={12} />
        <Skeleton height={300} borderRadius={12} />
      </div>
    );
  }

  if (!appData) {
    return (
      <div className="max-w-5xl mx-auto p-8 text-center bg-white rounded-xl border">
        <h2 className="text-xl font-bold text-slate-800">Application Not Found</h2>
        <p className="text-slate-500 mt-2">The requested verification application does not exist or has been removed.</p>
        <Link
          href="/admin/verifications"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg text-sm"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const { user, status, history = [], adminNotes = [] } = appData;
  const applicantName = appData.fullName || user?.company?.companyName || user?.name || "Applicant";
  const avatar = user?.company?.logoUrl || user?.image;

  return (
    <div className="max-w-6xl mx-auto p-2 sm:p-4 space-y-6 pb-24">
      {/* Top Header & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <button
            onClick={() => router.push("/admin/verifications")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition mb-2"
          >
            <ArrowLeft size={14} /> Back to Verification Requests
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Application Details
            </h1>
            <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded border">
              ID: {appData.id.slice(0, 8)}...
            </span>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {status !== "VERIFIED" && (
            <button
              onClick={() => setShowApproveModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
            >
              <CheckCircle2 size={16} /> Approve Verification
            </button>
          )}

          {status !== "REJECTED" && (
            <button
              onClick={() => setShowRejectModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
            >
              <XCircle size={16} /> Reject Application
            </button>
          )}

          {status !== "MORE_INFO_REQUIRED" && (
            <button
              onClick={() => setShowInfoRequestModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
            >
              <HelpCircle size={16} /> Request Info
            </button>
          )}
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Main Submitted Information & Documents) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* SECTION 1: Applicant Profile Information */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-slate-100 border overflow-hidden shrink-0 flex items-center justify-center font-bold text-slate-400 text-xl shadow-sm">
                  {avatar ? (
                    <img src={avatar} alt={applicantName} className="h-full w-full object-cover" />
                  ) : (
                    applicantName.charAt(0).toUpperCase()
                  )}
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">{applicantName}</h2>
                  <p className="text-xs text-slate-500">{appData.username || appData.email}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Member since {new Date(user?.createdAt || appData.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <Link
                href={`/profile/${user?.id}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition shrink-0"
              >
                <ExternalLink size={14} /> View Public Profile
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-2.5 text-slate-700">
                <Mail size={16} className="text-slate-400 shrink-0" />
                <span className="font-semibold">{appData.email}</span>
              </div>
              {appData.phone && (
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Phone size={16} className="text-slate-400 shrink-0" />
                  <span>{appData.phone}</span>
                </div>
              )}
              {appData.location && (
                <div className="flex items-center gap-2.5 text-slate-700">
                  <MapPin size={16} className="text-slate-400 shrink-0" />
                  <span>{appData.location}</span>
                </div>
              )}
              {appData.dob && (
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Calendar size={16} className="text-slate-400 shrink-0" />
                  <span>DOB: {appData.dob}</span>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: Verification Details Submitted */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-3 flex items-center gap-2">
              <FileText className="text-blue-600" size={18} /> Submitted Verification Details
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                  Account Category / Type
                </span>
                <span className="inline-block bg-blue-50 text-blue-700 font-semibold px-3 py-1 rounded-lg">
                  {appData.accountType}
                </span>
              </div>

              <div>
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                  Why do you want to get verified?
                </span>
                <p className="text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-line">
                  {appData.reason}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                  What do you use this account for?
                </span>
                <p className="text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-line">
                  {appData.accountUsage}
                </p>
              </div>

              {appData.additionalInfo && (
                <div>
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                    Additional Information
                  </span>
                  <p className="text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-line">
                    {appData.additionalInfo}
                  </p>
                </div>
              )}

              {/* Online Presence Links */}
              {appData.socialLinks && appData.socialLinks.length > 0 && (
                <div>
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-2">
                    Submitted Social Media & Web Links
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {appData.socialLinks.map((linkStr: string, idx: number) => (
                      <a
                        key={idx}
                        href={linkStr}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg text-xs transition border border-slate-200 truncate max-w-xs"
                      >
                        <ExternalLink size={12} /> {linkStr.replace(/^https?:\/\//, "")}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: Document Reviewer */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-3 flex items-center gap-2">
              <ShieldCheck className="text-blue-600" size={18} /> Verification Documents Review
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ID Document */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <FileText size={16} className="text-blue-600" /> Identity Document
                    </span>
                    <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded">
                      Required
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-600 truncate mt-2">
                    {appData.idDocumentName || "Government ID Document"}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                  {appData.idDocumentUrl?.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                    <button
                      onClick={() => {
                        setLightboxUrl(appData.idDocumentUrl);
                        setLightboxTitle(appData.idDocumentName);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-100 transition shadow-sm"
                    >
                      <Eye size={14} /> Preview Image
                    </button>
                  ) : (
                    <button
                      onClick={() => setPdfViewerUrl(appData.idDocumentUrl)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-100 transition shadow-sm"
                    >
                      <Eye size={14} /> Inspect Document
                    </button>
                  )}

                  <a
                    href={appData.idDocumentUrl}
                    download={appData.idDocumentName}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition shadow-sm"
                    title="Download document"
                  >
                    <Download size={16} />
                  </a>
                </div>
              </div>

              {/* Supporting Document */}
              {appData.supportingDocUrl ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <FileText size={16} className="text-purple-600" /> Supporting Document
                      </span>
                      <span className="text-[10px] bg-slate-200 text-slate-600 font-semibold px-2 py-0.5 rounded">
                        Optional
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-600 truncate mt-2">
                      {appData.supportingDocName || "Supporting Evidence Document"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                    {appData.supportingDocUrl?.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                      <button
                        onClick={() => {
                          setLightboxUrl(appData.supportingDocUrl);
                          setLightboxTitle(appData.supportingDocName);
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-100 transition shadow-sm"
                      >
                        <Eye size={14} /> Preview Image
                      </button>
                    ) : (
                      <button
                        onClick={() => setPdfViewerUrl(appData.supportingDocUrl)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-100 transition shadow-sm"
                      >
                        <Eye size={14} /> Inspect Document
                      </button>
                    )}

                    <a
                      href={appData.supportingDocUrl}
                      download={appData.supportingDocName}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition shadow-sm"
                      title="Download document"
                    >
                      <Download size={16} />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-slate-400 text-xs text-center">
                  <FileText size={24} className="mb-1 text-slate-300" />
                  <span>No supporting evidence document provided</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column (History Timeline & Internal Admin Notes) */}
        <div className="space-y-6">

          {/* Application Status Banner */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Application Status
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-slate-900">Current Status</span>
              <span className="text-xs font-semibold">
                {status === "VERIFIED" && <span className="text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">Verified</span>}
                {status === "PENDING" && <span className="text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">Pending Review</span>}
                {status === "REJECTED" && <span className="text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">Rejected</span>}
                {status === "MORE_INFO_REQUIRED" && <span className="text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">Info Required</span>}
              </span>
            </div>

            {appData.rejectionReason && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
                <span className="font-bold block">Rejection Reason:</span>
                <p>{appData.rejectionReason}</p>
              </div>
            )}

            {appData.infoRequestMessage && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-800 space-y-1">
                <span className="font-bold block">Requested Info Message:</span>
                <p>{appData.infoRequestMessage}</p>
              </div>
            )}
          </div>

          {/* Internal Admin Notes */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-3 flex items-center gap-2">
              <MessageSquare className="text-blue-600" size={16} /> Internal Admin Notes
            </h3>

            <p className="text-[11px] text-slate-400">
              Private notes strictly visible to administrators.
            </p>

            <form onSubmit={handleAddNote} className="space-y-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Type internal note..."
                rows={3}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={noteSubmitting || !newNote.trim()}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl transition disabled:opacity-50"
              >
                <Send size={13} /> Add Note
              </button>
            </form>

            <div className="space-y-3 pt-2 max-h-60 overflow-y-auto pr-1">
              {adminNotes.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-2">No internal notes added yet.</p>
              ) : (
                adminNotes.map((note: any) => (
                  <div key={note.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                      <span>{note.authorName || "Admin"}</span>
                      <span>{new Date(note.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-800 leading-relaxed whitespace-pre-line">{note.note}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Timeline History */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-3 flex items-center gap-2">
              <Clock className="text-blue-600" size={16} /> Application History
            </h3>

            <div className="space-y-4 pl-2 relative border-l-2 border-slate-200 ml-2">
              {history.length === 0 ? (
                <div className="pl-4">
                  <p className="text-xs font-semibold text-slate-800">Application Submitted</p>
                  <p className="text-[10px] text-slate-400">{new Date(appData.createdAt).toLocaleString()}</p>
                </div>
              ) : (
                history.map((h: any) => (
                  <div key={h.id} className="relative pl-4 space-y-1">
                    <span className="absolute -left-[9px] top-1 h-3 w-3 rounded-full bg-blue-600 ring-4 ring-white" />
                    <p className="text-xs font-bold text-slate-900">{h.action}</p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      By {h.performedBy || "System"} • {new Date(h.createdAt).toLocaleString()}
                    </p>
                    {h.message && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 font-normal">
                        {h.message}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* APPROVE CONFIRMATION MODAL */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-emerald-600">
              <CheckCircle2 size={28} />
              <h3 className="text-lg font-bold text-slate-900">Approve Verification</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to approve <strong>{applicantName}</strong>? This will immediately assign a blue verification tick badge to their profile across the website.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction("APPROVE")}
                disabled={actionLoading}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-md shadow-emerald-500/20"
              >
                {actionLoading ? "Approving..." : "Confirm Approval"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-rose-600">
              <XCircle size={28} />
              <h3 className="text-lg font-bold text-slate-900">Reject Application</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Please state the reason for rejecting <strong>{applicantName}</strong>'s verification application.
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction("REJECT")}
                disabled={actionLoading || !rejectionReason.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-md shadow-rose-500/20 disabled:opacity-50"
              >
                {actionLoading ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST MORE INFO MODAL */}
      {showInfoRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-purple-600">
              <HelpCircle size={28} />
              <h3 className="text-lg font-bold text-slate-900">Request More Information</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Specify what additional information or documents <strong>{applicantName}</strong> needs to submit.
            </p>

            <textarea
              value={infoRequestMessage}
              onChange={(e) => setInfoRequestMessage(e.target.value)}
              placeholder="e.g. Please provide a clearer photo of your government ID or official business registry document..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <button
                onClick={() => setShowInfoRequestModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction("REQUEST_MORE_INFO")}
                disabled={actionLoading || !infoRequestMessage.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition shadow-md shadow-purple-500/20 disabled:opacity-50"
              >
                {actionLoading ? "Sending..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMAGE LIGHTBOX PREVIEW */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
            <div className="flex items-center justify-between p-4 bg-slate-950 text-white border-b border-slate-800">
              <span className="font-semibold text-sm">{lightboxTitle || "Document Preview"}</span>
              <button
                onClick={() => setLightboxUrl(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center max-h-[75vh] overflow-auto">
              <img src={lightboxUrl} alt="Document Lightbox" className="max-h-[70vh] object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}

      {/* PDF DOCUMENT VIEWER MODAL */}
      {pdfViewerUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="relative max-w-5xl w-full h-[85vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col">
            <div className="flex items-center justify-between p-4 bg-slate-950 text-white border-b border-slate-800">
              <span className="font-semibold text-sm">Document Inspector</span>
              <button
                onClick={() => setPdfViewerUrl(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 w-full bg-slate-100">
              <iframe src={pdfViewerUrl} className="w-full h-full border-none" title="Document Viewer" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
