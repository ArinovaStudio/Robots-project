const ollamaUrl = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";

export async function generateUserDataset(industry: string, dealIn: string[]) {
  // const prompt = `
  // You are an expert B2B matchmaking AI.
  // A company in the "${industry}" industry provides these services: ${dealIn.join(", ")}.

  // Analyze the operational, technical, marketing, and financial needs of this business. What specific B2B services, software, agencies, or contractors do they need to hire, purchase, or partner with to operate successfully?

  // Provide a comprehensive list of 15 to 20 highly specific B2B services. Do not use generic terms like "Consulting"; use specific terms like "SEO Marketing Agency", "Cloud Server Hosting", or "Corporate Tax Accounting".

  // You MUST return ONLY valid JSON matching this exact schema:
  // {
  //   "technologyAndSoftware": ["Tech Service 1", "Tech Service 2", "Tech Service 3", "Tech Service 4", "Tech Service 5"],
  //   "marketingAndSales": ["Marketing Service 1", "Marketing Service 2", "Marketing Service 3", "Marketing Service 4"],
  //   "operationsAndLogistics": ["Ops Service 1", "Ops Service 2", "Ops Service 3", "Ops Service 4"],
  //   "legalAndFinancial": ["Financial Service 1", "Financial Service 2", "Financial Service 3"]
  // }
  // `;

  const prompt = `
  You are an expert B2B Matchmaking and Enterprise Architecture AI.
  A company in the "${industry}" industry provides these services/products: ${dealIn.join(", ")}.

  Conduct a deep-dive operational audit of this business. Analyze its day-to-day survival needs, its scaling roadblocks, regulatory compliance pressures, talent requirements, and technical dependencies. What specific external B2B services, enterprise software, niche agencies, or specialized contractors must they hire, license, or partner with to compete at a high level?

  Provide a comprehensive list of 20 to 25 highly specific B2B service niches. Absolutely zero generic filler terms (e.g., do not use "Marketing", "HR", or "IT"). Instead, use highly granular, industry-standard terms (e.g., "SOC 2 Compliance Auditor", "Fractional Chief Marketing Officer", "B2B Lead Generation Agency", "Enterprise Resource Planning (ERP) Implementation Partner").

  You MUST return ONLY valid JSON matching this exact schema:
  {
    "coreTechnologyAndInfrastructure": ["Service 1", "Service 2", "Service 3", "Service 4"],
    "growthMarketingAndSalesEnablement": ["Service 1", "Service 2", "Service 3", "Service 4"],
    "operationsLogisticsAndSupplyChain": ["Service 1", "Service 2", "Service 3", "Service 4"],
    "legalFinancialAndRiskCompliance": ["Service 1", "Service 2", "Service 3"],
    "talentAcquisitionAndHumanCapital": ["Service 1", "Service 2", "Service 3"],
    "strategicGrowthAndSpecializedAdvisory": ["Service 1", "Service 2", "Service 3"]
  }
`;

  try {
    const res = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "phi3:latest",
        prompt: prompt,
        stream: false,
      }),
    });

    const data = await res.json();

    if (data.error) {
      console.error("OLLAMA API ERROR:", data.error);
      return null;
    }

    if (!data.response) {
      console.error("OLLAMA EMPTY RESPONSE. Full data received:", data);
      return null;
    }

    let jsonString = data.response;

    if (jsonString.includes("```json")) {
      jsonString = jsonString.split("```json")[1].split("```")[0];
    } else if (jsonString.includes("```")) {
      jsonString = jsonString.split("```")[1].split("```")[0];
    }

    return JSON.parse(jsonString.trim());
  } catch (error) {
    console.error("AI Generation Failed:", error);
    return null;
  }
}

export function getCrossConnections(customDataset: any): string[] {
  if (!customDataset) return [];

  const connections: string[] = [];

  if (Array.isArray(customDataset.technologyAndSoftware)) {
    connections.push(...customDataset.technologyAndSoftware);
  }
  if (Array.isArray(customDataset.marketingAndSales)) {
    connections.push(...customDataset.marketingAndSales);
  }
  if (Array.isArray(customDataset.operationsAndLogistics)) {
    connections.push(...customDataset.operationsAndLogistics);
  }
  if (Array.isArray(customDataset.legalAndFinancial)) {
    connections.push(...customDataset.legalAndFinancial);
  }

  return connections;
}




// lib/exchange.ts
// const ollamaUrl = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";

// export async function generateUserDataset(industry: string, dealIn: string[]) {
//   const prompt = `
//   You are an expert B2B Matchmaking and Enterprise Architecture AI. 
//   A company in the "${industry}" industry provides these services/products: ${dealIn.join(", ")}.
  
//   Conduct a deep-dive operational audit of this business. Analyze its day-to-day survival needs, its scaling roadblocks, regulatory compliance pressures, talent requirements, and technical dependencies. What specific external B2B services, enterprise software, niche agencies, or specialized contractors must they hire, license, or partner with to compete at a high level?
  
//   Provide a comprehensive list of 20 to 25 highly specific B2B service niches. Absolutely zero generic filler terms (e.g., do not use "Marketing", "HR", or "IT"). Instead, use highly granular, industry-standard terms (e.g., "SOC 2 Compliance Auditor", "Fractional Chief Marketing Officer", "B2B Lead Generation Agency", "Enterprise Resource Planning (ERP) Implementation Partner").
  
//   You MUST return ONLY valid JSON matching this exact schema:
//   {
//     "coreTechnologyAndInfrastructure": ["Service 1", "Service 2", "Service 3", "Service 4"],
//     "growthMarketingAndSalesEnablement": ["Service 1", "Service 2", "Service 3", "Service 4"],
//     "operationsLogisticsAndSupplyChain": ["Service 1", "Service 2", "Service 3", "Service 4"],
//     "legalFinancialAndRiskCompliance": ["Service 1", "Service 2", "Service 3"],
//     "talentAcquisitionAndHumanCapital": ["Service 1", "Service 2", "Service 3"],
//     "strategicGrowthAndSpecializedAdvisory": ["Service 1", "Service 2", "Service 3"]
//   }
// `;

//   try {
//     const res = await fetch(`${ollamaUrl}/api/generate`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         model: "phi3:latest",
//         prompt: prompt,
//         stream: false,
//       }),
//     });

//     const data = await res.json();

//     if (data.error) {
//       console.error("OLLAMA API ERROR:", data.error);
//       return null;
//     }

//     if (!data.response) {
//       console.error("OLLAMA EMPTY RESPONSE. Full data received:", data);
//       return null;
//     }

//     let jsonString = data.response;

//     if (jsonString.includes("```json")) {
//       jsonString = jsonString.split("```json")[1].split("```")[0];
//     } else if (jsonString.includes("```")) {
//       jsonString = jsonString.split("```")[1].split("```")[0];
//     }

//     return JSON.parse(jsonString.trim());
//   } catch (error) {
//     console.error("AI Generation Failed:", error);
//     return null;
//   }
// }

// // export function getCrossConnections(customDataset: any): string[] {
// //   if (!customDataset) return [];

// //   const connections: string[] = [];
// //   const candidateKeys = [
// //     "coreTechnologyAndInfrastructure",
// //     "growthMarketingAndSalesEnablement",
// //     "operationsLogisticsAndSupplyChain",
// //     "legalFinancialAndRiskCompliance",
// //     "talentAcquisitionAndHumanCapital",
// //     "strategicGrowthAndSpecializedAdvisory",
// //     "technologyAndSoftware",
// //     "marketingAndSales",
// //     "operationsAndLogistics",
// //     "legalAndFinancial",
// //   ];

// //   if (Array.isArray(customDataset)) {
// //     return customDataset.filter(
// //       (item): item is string => typeof item === "string",
// //     );
// //   }

// //   for (const key of candidateKeys) {
// //     const value = customDataset[key];
// //     if (Array.isArray(value)) {
// //       connections.push(
// //         ...value.filter((item): item is string => typeof item === "string"),
// //       );
// //     }
// //   }

// //   if (connections.length === 0) {
// //     for (const value of Object.values(customDataset)) {
// //       if (Array.isArray(value)) {
// //         connections.push(
// //           ...value.filter((item): item is string => typeof item === "string"),
// //         );
// //       }
// //     }
// //   }

// //   return connections;
// // }

// export function getCrossConnections(customDataset: any): string[] {
//   if (!customDataset) return [];

//   const connections: string[] = [];
//   const candidateKeys = [
//     "coreTechnologyAndInfrastructure",
//     "growthMarketingAndSalesEnablement",
//     "operationsLogisticsAndSupplyChain",
//     "legalFinancialAndRiskCompliance",
//     "talentAcquisitionAndHumanCapital",
//     "strategicGrowthAndSpecializedAdvisory",
//     "technologyAndSoftware",
//     "marketingAndSales",
//     "operationsAndLogistics",
//     "legalAndFinancial",
//   ];

//   if (Array.isArray(customDataset)) {
//     return customDataset.filter(
//       (item): item is string => typeof item === "string",
//     );
//   }

//   for (const key of candidateKeys) {
//     const value = customDataset[key];
//     if (Array.isArray(value)) {
//       connections.push(
//         ...value.filter((item): item is string => typeof item === "string"),
//       );
//     }
//   }

//   if (connections.length === 0) {
//     for (const value of Object.values(customDataset)) {
//       if (Array.isArray(value)) {
//         connections.push(
//           ...value.filter((item): item is string => typeof item === "string"),
//         );
//       }
//     }
//   }

//   return connections;
// }
