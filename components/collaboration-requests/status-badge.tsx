interface StatusBadgeProps {
  status: string;
  pendingLabel?: string;
}

export default function StatusBadge({ status, pendingLabel = "Pending review" }: StatusBadgeProps) {
  const base = "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border whitespace-nowrap";

  switch (status) {
    case "ACCEPTED":
      return <span className={`${base} bg-blue-50 text-blue-700 border-blue-200`}>Accepted</span>;
    case "REVIEWED":
    case "INFO_REQUESTED":
      return <span className={`${base} bg-blue-50 text-blue-700 border-blue-200`}>Ask info</span>;
    case "DECLINED":
      return <span className={`${base} bg-gray-100 text-gray-600 border-gray-200`}>Declined</span>;
    default:
      return <span className={`${base} bg-amber-50 text-amber-700 border-amber-200`}>{pendingLabel}</span>;
  }
}