export interface BusinessCompany {
  id: string;
  companyName: string;
  logoUrl?: string;
  type: string;
  description: string;
  matchReason: string;
  matchPercentage: number;
  size: number;
  followersCount: number;
  connectionsCount: number;
  yearOfEstablishment: number;
  author: {
    id: string;
  };
  isBoosted?: boolean;
}

export const findBusinessCompanies: BusinessCompany[] = [
  {
    id: "fb-001",
    companyName: "GreenEdge Logistics",
    logoUrl:
      "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=120&q=80",
    type: "Logistics",
    description:
      "A technology-driven logistics partner serving supply chains across manufacturing and export businesses. We connect your product to reliable carriers and optimize delivery routes.",
    matchReason:
      "This business serves manufacturing companies in your niche and has experience with cross-border logistics scalability.",
    matchPercentage: 82,
    size: 1250,
    followersCount: 892,
    connectionsCount: 38,
    yearOfEstablishment: 2017,
    author: { id: "user-201" },
    isBoosted: true,
  },
  {
    id: "fb-002",
    companyName: "Nexa Components",
    logoUrl:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=120&q=80",
    type: "Electronics Manufacturing",
    description:
      "Specializes in high-precision electronics components for automation and robotics manufacturers. Trusted by companies building industrial control systems.",
    matchReason:
      "Your business niche aligns with their supply of high-quality electronics parts used in robotics and manufacturing equipment.",
    matchPercentage: 79,
    size: 980,
    followersCount: 610,
    connectionsCount: 22,
    yearOfEstablishment: 2015,
    author: { id: "user-202" },
  },
  {
    id: "fb-003",
    companyName: "Precision Metal Works",
    logoUrl:
      "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=120&q=80",
    type: "Fabrication",
    description:
      "Precision Metal Works provides customized metal fabrication services for industrial products and machine enclosures, with strong quality controls.",
    matchReason:
      "Their manufacturing capabilities match your product requirements for high-tolerance metal parts and enclosure assemblies.",
    matchPercentage: 88,
    size: 720,
    followersCount: 470,
    connectionsCount: 27,
    yearOfEstablishment: 2012,
    author: { id: "user-203" },
  },
  {
    id: "fb-004",
    companyName: "SolarMach Technologies",
    logoUrl:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=120&q=80",
    type: "Renewable Energy",
    description:
      "A renewable energy partner designing solar-powered solutions and smart energy systems for factories and industrial campuses.",
    matchReason:
      "They help manufacturing and industrial businesses reduce energy costs with tailored solar and monitoring infrastructure.",
    matchPercentage: 74,
    size: 540,
    followersCount: 310,
    connectionsCount: 15,
    yearOfEstablishment: 2019,
    author: { id: "user-204" },
  },
  {
    id: "fb-005",
    companyName: "Axion AI Labs",
    logoUrl:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=120&q=80",
    type: "Industrial AI",
    description:
      "Delivers AI-driven analytics and predictive maintenance tools for industrial machines, helping manufacturing teams avoid downtime.",
    matchReason:
      "Their predictive analytics services help optimize the same manufacturing workflows you rely on.",
    matchPercentage: 91,
    size: 430,
    followersCount: 540,
    connectionsCount: 12,
    yearOfEstablishment: 2020,
    author: { id: "user-205" },
  },
];
