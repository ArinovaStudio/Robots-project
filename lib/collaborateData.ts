export interface CollaborateCompany {
  id: string;
  userId: string;
  companyName: string;
  logoUrl?: string;
  type: string;
  description: string;
  size: number;
  followersCount: number;
  connectionsCount: number;
  yearOfEstablishment: number;
  isBoosted?: boolean;
}

export const collaborateCompanies: CollaborateCompany[] = [
  {
    id: "collab-001",
    userId: "user-301",
    companyName: "RoboForge Automation",
    logoUrl:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=120&q=80",
    type: "Robotics Manufacturing",
    description:
      "A robotics automation company collaborating with hardware startups on robotic arms, factory automation cells, and sensor-integrated production systems.",
    size: 850,
    followersCount: 1280,
    connectionsCount: 46,
    yearOfEstablishment: 2016,
    isBoosted: true,
  },
  {
    id: "collab-002",
    userId: "user-302",
    companyName: "CircuitWorks Labs",
    logoUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=120&q=80",
    type: "Embedded Systems",
    description:
      "Designs embedded controllers, PCB prototypes, and firmware for companies building robotics, IoT devices, and smart industrial equipment.",
    size: 320,
    followersCount: 740,
    connectionsCount: 31,
    yearOfEstablishment: 2018,
  },
  {
    id: "collab-003",
    userId: "user-303",
    companyName: "MechaVision AI",
    logoUrl:
      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=120&q=80",
    type: "Computer Vision",
    description:
      "Builds AI vision models for defect detection, warehouse navigation, robotic inspection, and real-time quality monitoring workflows.",
    size: 460,
    followersCount: 965,
    connectionsCount: 28,
    yearOfEstablishment: 2020,
    isBoosted: true,
  },
  {
    id: "collab-004",
    userId: "user-304",
    companyName: "AlloyGrid Fabricators",
    logoUrl:
      "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=120&q=80",
    type: "Industrial Fabrication",
    description:
      "Provides custom enclosures, chassis, mounting frames, and precision metal fabrication for robotics and heavy equipment companies.",
    size: 610,
    followersCount: 510,
    connectionsCount: 19,
    yearOfEstablishment: 2014,
  },
  {
    id: "collab-005",
    userId: "user-305",
    companyName: "LaunchLoop Ventures",
    logoUrl:
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=120&q=80",
    type: "Growth Partnership",
    description:
      "Partners with B2B technology companies on pilot programs, market expansion, channel partnerships, and enterprise customer introductions.",
    size: 140,
    followersCount: 420,
    connectionsCount: 24,
    yearOfEstablishment: 2021,
  },
  {
    id: "collab-006",
    userId: "user-306",
    companyName: "SupplySync Robotics",
    logoUrl:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=120&q=80",
    type: "Supply Chain Technology",
    description:
      "Collaborates with robotics teams to source motion components, manage vendor pipelines, and coordinate reliable logistics for production scale-up.",
    size: 275,
    followersCount: 690,
    connectionsCount: 35,
    yearOfEstablishment: 2019,
  },
];
