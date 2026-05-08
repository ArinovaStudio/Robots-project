const tags = [
  "#digital-marketing",
  "#software",
  "#cyber-security",
  "#website",
  "#social-media-marketing",
  "#seo",
  "#digital-marketing",
  "#software",
  "#cyber-security",
  "#website",
  "#social-media-marketing",
  "#seo",
  "#cyber-security",
  "#website",
];

export default function TopTags() {
  return (
    <div className="rounded-3xl border bg-background p-5">
      <h3 className="text-lg font-semibold">Top Tags</h3>

      <div className="mt-4 flex flex-wrap gap-2.5">
        {tags.map((tag, i) => (
          <button
            key={i}
            className="rounded-full border bg-background px-3 py-1.5 text-xs font-bold text-muted-foreground shadow-sm transition-colors hover:text-foreground"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}