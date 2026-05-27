import exchangeData from './exchange-dataset.json';

type Product = {
  id: string;
  name: string;
  complementaryNeeds: string[];
};

type SubIndustry = {
  id: string;
  name: string;
  products: Product[];
};

type Industry = {
  id: string;
  name: string;
  subIndustries: SubIndustry[];
};

type Dataset = {
  industries: Industry[];
};

const dataset = exchangeData as Dataset;

export function getCrossConnections(userIndustry: string, dealInKeywords: string[]): string[] {
  const recommendedServices = new Set<string>();

  const industryMatch = dataset.industries.find(
    (ind) => ind.name.toLowerCase() === userIndustry.toLowerCase()
  );

  if (!industryMatch) return [];

  for (const keyword of dealInKeywords) {
    const keywordLower = keyword.toLowerCase();

    for (const subIndustry of industryMatch.subIndustries) {
      for (const product of subIndustry.products) {
        const productNameLower = product.name.toLowerCase();

        if (productNameLower.includes(keywordLower) || keywordLower.includes(productNameLower)) {
          
          product.complementaryNeeds.forEach(need => {
            recommendedServices.add(need);
          });
        }
      }
    }
  }

  return Array.from(recommendedServices);
}