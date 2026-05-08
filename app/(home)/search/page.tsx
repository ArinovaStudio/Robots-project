import CompanyCard from "@/components/home/search/company-card";
import CompanySearch from "@/components/home/search/company-search";

const companies = [
  {
    title: "CyberFort",
    category: "Cyber Security Company",
  },
  {
    title: "Outright Creators",
    category: "Digital Marketing Company",
  },
];

export default function TopRatedCompanies() {
  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <CompanySearch />

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Top Rated Companies</h2>
        <span className="text-xl">132</span>
      </div>

      <div className="space-y-5">
        {companies.map((company) => (
          <CompanyCard key={company.title} {...company} />
        ))}
      </div>
    </section>
  );
}