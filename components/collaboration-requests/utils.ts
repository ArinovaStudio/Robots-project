export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return diffMins === 1 ? "1 minute ago" : `${diffMins} minutes ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function parseAmountValue(str: string): number {
  if (!str) return 0;
  const num = parseFloat(str.replace(/[^0-9.]/g, "")) || 0;
  if (/cr|crore/i.test(str)) return num * 10000000;
  if (/l|lac|lakh/i.test(str)) return num * 100000;
  if (/m/i.test(str)) return num * 1000000;
  if (/k/i.test(str)) return num * 1000;
  return num;
}
 