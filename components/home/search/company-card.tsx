import Image from "next/image";
import { EllipsisVertical } from "lucide-react";
import CompanyStats from "@/components/home/search/company-stats";

interface Props {
  title: string;
  category: string;
}

export default function CompanyCard({ title, category }: Props) {
  return (
    <div className="rounded-[28px] bg-background p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-2 items-center">
          <Image
            src="/logo.png"
            alt={title}
            width={60}
            height={60}
            className="size-[80px] object-contain"
          />

          <div>
            <h3 className="text-2xl font-bold leading-none">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{category}</p>
          </div>
        </div>

        <EllipsisVertical className="size-5" />
      </div>

      <p className="mt-5 text-sm leading-6 text-muted-foreground">
        Lorem ipsum dolor sit amet consectetur. Lacus nec suscipit eget semper.
        Ipsum fermentum venenatis tortor at nulla. Senectus tristique quis sed
        tellus...
        <span className="cursor-pointer font-medium text-blue-500">
          Read More
        </span>
      </p>

      <CompanyStats />
    </div>
  );
}