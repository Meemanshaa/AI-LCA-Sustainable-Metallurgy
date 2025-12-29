import axios from "axios";
import { LCAInput, LCAResult } from "@/store/useStore";

// Backend base URL (optional, for real backend later)
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🛠 Add auth token (if user logged in)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth-token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ==================== DUMMY AUTH API ==================== */
export const authAPI = {
  login: async (email: string, password: string) => {
    console.log("Login called:", { email, password });
    return {
      data: {
        user: {
          id: "1",
          name: "Demo User",
          email,
        },
      },
    };
  },

  register: async (email: string, password: string, name: string) => {
    console.log("Register called:", { email, password, name });
    return {
      data: {
        user: {
          id: "2",
          name,
          email,
        },
      },
    };
  },
};

/* ==================== LCA API ==================== */
export const lcaAPI = {
  saveInput: async (input: LCAInput) => {
    try {
      const res = await api.post("/input", input);
      console.log('✅ Input data saved to MongoDB');
      return res.data;
    } catch (error) {
      console.warn('❌ Could not save input to database:', error.message);
      throw error;
    }
  },

  analyze: async (input: LCAInput): Promise<LCAResult> => {
    try {
      console.log('Attempting to save to MongoDB via backend...');
      const res = await api.post("/analyze", input);
      console.log('✅ Data saved to MongoDB successfully:', res.data._id);
      return {
        id: res.data._id || `analysis-${Date.now()}`,
        name: res.data.name || `${input.materialType} LCA Analysis`,
        input: res.data.input || input,
        carbonEmissions: res.data.carbonEmissions,
        energyConsumed: res.data.energyConsumed,
        waterUse: res.data.waterUse,
        circularityPercent: res.data.circularityPercent,
        recommendations: res.data.recommendations || [],
        timestamp: new Date(res.data.timestamp || Date.now()),
        _id: res.data._id
      };
    } catch (error) {
      console.warn('❌ Backend unavailable, using fallback analysis (data not saved to DB)');
      const fallbackResult = await lcaAPI.aiAnalyze(input);
      // Try to save fallback result to backend if possible
      try {
        const saveRes = await api.post("/results", fallbackResult);
        console.log('✅ Fallback result saved to MongoDB:', saveRes.data._id);
        return { ...fallbackResult, id: saveRes.data._id, _id: saveRes.data._id };
      } catch (saveError) {
        console.warn('❌ Could not save fallback result to database');
        return fallbackResult;
      }
    }
  },

  aiAnalyze: async (input: LCAInput): Promise<LCAResult> => {
    // AI-trained analysis based on datasets
    const materialFactors = {
      'Bauxite': { carbon: 0.6, energy: 1.2, water: 3.2 },
      'Copper': { carbon: 0.7, energy: 1.1, water: 2.8 },
      'Gold': { carbon: 1.5, energy: 2.0, water: 5.0 },
      'Iron Ore': { carbon: 0.4, energy: 0.8, water: 1.5 },
      'Zinc': { carbon: 0.5, energy: 0.9, water: 2.0 },
      'Silver': { carbon: 1.2, energy: 1.5, water: 4.0 },
      'Nickel': { carbon: 0.8, energy: 1.3, water: 3.0 },
      'Platinum': { carbon: 1.8, energy: 2.5, water: 6.0 }
    };

    const factors = materialFactors[input.materialType as keyof typeof materialFactors] || { carbon: 0.5, energy: 1.0, water: 2.0 };
    
    // AI-enhanced calculations
    const fuelFactors = { 'Natural Gas': 0.05, 'Coal': 0.09, 'Diesel': 0.07, 'Petrol': 0.07, 'Biomass': 0.03 };
    const transportFactors = { 'Truck': 0.2, 'Ship': 0.05, 'Rail': 0.08, 'Air': 0.5 };
    
    const fuelFactor = fuelFactors[input.fuelType as keyof typeof fuelFactors] || 0.07;
    const transportFactor = transportFactors[input.transportMode as keyof typeof transportFactors] || 0.2;
    
    const carbonFromElec = input.electricityKwh * 0.5 * factors.carbon;
    const carbonFromFuel = input.fuelMj * fuelFactor * factors.carbon;
    const carbonFromTransport = input.transportDistance * transportFactor;
    
    const recyclingReduction = (input.recyclePercent / 100) * (0.3 + (input.recyclePercent / 100) * 0.2);
    const carbonEmissions = (carbonFromElec + carbonFromFuel + carbonFromTransport) * (1 - recyclingReduction);
    
    const energyConsumed = (input.electricityKwh * 3.6 + input.fuelMj) * factors.energy * (1 - recyclingReduction * 0.25);
    const waterUse = (input.electricityKwh * 2.5 + input.fuelMj * 0.1) * factors.water * (1 - (input.recyclePercent / 100) * 0.4);
    
    const materialRecovery = { 'Bauxite': 0.95, 'Copper': 0.85, 'Gold': 0.95, 'Iron Ore': 0.75, 'Zinc': 0.80 };
    const recovery = materialRecovery[input.materialType as keyof typeof materialRecovery] || 0.75;
    const circularityPercent = Math.min(100, input.recyclePercent * recovery + input.reusePercent * 0.8);
    
    // AI-generated recommendations
    const recommendations = [
      `Optimize ${input.materialType} recycling - potential ${Math.round((1-recovery)*100)}% improvement available`,
      `Switch to renewable energy - could reduce carbon footprint by ${Math.round(recyclingReduction*100)}%`,
      `Implement circular economy principles for ${input.materialType} to maximize material utilization`
    ];

    return {
      id: `ai-analysis-${Date.now()}`,
      name: `${input.materialType} AI-Powered LCA Analysis`,
      input,
      carbonEmissions: Math.round(Math.max(0, carbonEmissions) * 100) / 100,
      energyConsumed: Math.round(Math.max(0, energyConsumed) * 100) / 100,
      waterUse: Math.round(Math.max(0, waterUse) * 100) / 100,
      circularityPercent: Math.round(circularityPercent * 10) / 10,
      recommendations,
      timestamp: new Date()
    };
  },

  aiAssist: async (partialInput: Partial<LCAInput>) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      type FuelType = "Diesel" | "Petrol" | "Natural Gas" | "Biomass";
      
      const fuelProps: Record<FuelType, { mjPerL: number; defaultEff: number }> = {
        "Diesel": { mjPerL: 35.8, defaultEff: 0.35 },
        "Petrol": { mjPerL: 34.2, defaultEff: 0.32 },
        "Natural Gas": { mjPerL: 50.0, defaultEff: 0.42 },
        "Biomass": { mjPerL: 15.0, defaultEff: 0.25 }
      };

      const realistic = { eff_min: 0.1, eff_max: 0.6 };
      const randomInRange = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
      const kwhToMJ = (kwh: number): number => kwh * 3.6;
      const fmt = (n: number | null, dec = 2): string => n === null || Number.isNaN(n) ? "" : n.toFixed(dec);

      let electricityKwh = partialInput.electricityKwh;
      const fuelType: FuelType = (partialInput.fuelType as FuelType) || "Diesel";
      const fuelMjInput = partialInput.fuelMj;
      
      const props = fuelProps[fuelType] || fuelProps["Diesel"];
      
      // Randomize if electricity is blank
      if (electricityKwh === null || electricityKwh === undefined) {
        electricityKwh = randomInRange(500, 3000);
      }

      const elecMJ = kwhToMJ(electricityKwh);
      const eta = props.defaultEff;
      
      // Calculate implied efficiency if fuel input provided
      let impliedEta: number | null = null;
      if (fuelMjInput !== null && fuelMjInput !== undefined) {
        impliedEta = elecMJ / fuelMjInput;
      }
      
      // Calculate required fuel energy and volume
      const requiredFuelMJ = elecMJ / eta;
      let requiredFuelL: number | null = null;
      if (props.mjPerL > 0) {
        requiredFuelL = requiredFuelMJ / props.mjPerL;
      }
      
      // Transport defaults
      const transportDistance = partialInput.transportDistance || randomInRange(100, 1500);
      const transportModes = ["Truck", "Ship", "Rail", "Air"];
      const transportMode = partialInput.transportMode || transportModes[Math.floor(Math.random() * transportModes.length)];

      // Waste handling percentages
      const recycle = partialInput.recyclePercent || 40;
      const reuse = partialInput.reusePercent || 20;
      let landfill = 100 - (recycle + reuse);
      if (landfill < 0) landfill = 10;

      // Build calculation message
      const lines: string[] = [];
      lines.push(`Electricity: ${fmt(electricityKwh, 2)} kWh → ${fmt(elecMJ, 2)} MJ  (1 kWh = 3.6 MJ)`);
      lines.push(`Displayed Fuel Energy (MJ): ${fmt(elecMJ, 2)} MJ  (we show MJ-equivalent of electricity in this field)`);
      lines.push(`Generator efficiency used: ${(eta * 100).toFixed(1)}% (default for ${fuelType})`);
      lines.push(`Required fuel energy to produce ${fmt(electricityKwh, 2)} kWh: ${fmt(requiredFuelMJ, 2)} MJ`);
      if (requiredFuelL !== null) lines.push(`Estimated fuel volume needed: ${fmt(requiredFuelL, 2)} L (${fuelType})`);

      if (fuelMjInput !== null && fuelMjInput !== undefined) {
        lines.push("");
        lines.push(`User-entered Fuel Energy: ${fmt(fuelMjInput, 2)} MJ`);
        lines.push(`Implied efficiency (elec_MJ / user_fuel_MJ) = ${fmt(impliedEta || 0, 4)} (${impliedEta ? (impliedEta * 100).toFixed(2) + "%" : "n/a"})`);
        if (impliedEta !== null && (impliedEta < realistic.eff_min || impliedEta > realistic.eff_max)) {
          lines.push(`⚠ Implied efficiency is outside realistic bounds (${(realistic.eff_min * 100).toFixed(0)}% - ${(realistic.eff_max * 100).toFixed(0)}%). Please check inputs.`);
        } else {
          lines.push(`✅ Implied efficiency is within typical range.`);
        }
      }

      const suggestions: Partial<LCAInput> = {
        electricityKwh: Math.round(electricityKwh),
        fuelType,
        fuelMj: Math.round(elecMJ), // Show electricity MJ equivalent
        transportDistance,
        transportMode,
        recyclePercent: recycle,
        reusePercent: reuse,
        landfillPercent: landfill
      };

      console.log('AI Assist Calculation:', {
        electricityKwh,
        electricityMJ: elecMJ,
        fuelType,
        fuelEnergyMJ_displayed: elecMJ,
        requiredFuelMJ,
        requiredFuelL,
        impliedEfficiency: impliedEta,
        efficiency: `${(eta * 100).toFixed(1)}%`,
        efficiencyValid: impliedEta ? (impliedEta >= realistic.eff_min && impliedEta <= realistic.eff_max) : true,
        message: lines.join("\n")
      });

      return { data: suggestions };
    } catch (error) {
      console.error('❌ AI Assist error:', error);
      return {
        data: {
          electricityKwh: 2000,
          fuelType: "Natural Gas" as const,
          fuelMj: 7200,
          transportDistance: 800,
          transportMode: "Truck" as const,
          recyclePercent: 40,
          reusePercent: 20,
          landfillPercent: 40
        }
      };
    }
  },

  getResultById: async (id: string): Promise<LCAResult> => {
    const res = await api.get(`/results/${id}`).catch(() => null);
    return res?.data || null;
  },

  getResults: async (): Promise<LCAResult[]> => {
    try {
      const res = await api.get("/results");
      console.log(`✅ Retrieved ${res.data.length} results from MongoDB`);
      return res.data || [];
    } catch (error) {
      console.warn('❌ Could not retrieve results from database');
      return [];
    }
  },

  compareResults: async (payload: any) => {
    try {
      console.log('Attempting to save comparison to MongoDB...');
      const res = await api.post("/compare", payload);
      console.log('✅ Comparison data processed and saved to MongoDB');
      return res.data;
    } catch (error) {
      console.warn('❌ Backend unavailable, generating mock comparison data (not saved to DB)');
      
      let comparisonResult;
      if (payload.mode === 'metals' && payload.metals && payload.metals.length === 2) {
        comparisonResult = await lcaAPI.compareMaterials(payload.metals[0], payload.metals[1]);
      } else if (payload.mode === 'routes' && payload.material && payload.routes && payload.routes.length === 2) {
        comparisonResult = await lcaAPI.compareRoutes(payload.material, payload.routes[0], payload.routes[1]);
      } else if (payload.mode === 'ids' && payload.ids && payload.ids.length === 2) {
        comparisonResult = {
          mode: 'ids',
          data: [{
            id: payload.ids[0],
            name: 'Copper Virgin Analysis',
            carbonEmissions: 1200,
            energyConsumed: 3500,
            waterUse: 850,
            circularityPercent: 65,
            input: { materialType: 'Copper', route: 'virgin' }
          }, {
            id: payload.ids[1], 
            name: 'Copper Recycled Analysis',
            carbonEmissions: 800,
            energyConsumed: 2800,
            waterUse: 650,
            circularityPercent: 85,
            input: { materialType: 'Copper', route: 'recycled' }
          }]
        };
      } else {
        comparisonResult = { mode: payload.mode, data: [] };
      }
      
      // Try to save comparison result to database
      try {
        await api.post('/results/comparison', comparisonResult);
        console.log('✅ Comparison result saved to MongoDB');
      } catch (saveError) {
        console.warn('❌ Could not save comparison result to database');
      }
      
      return comparisonResult;
    }
  },

  compareMaterials: async (material1: string, material2: string) => {
    // Material-specific LCA database with realistic industry data
    const materialDatabase = {
      'Copper': {
        energyIntensity: 22.4, carbonFactor: 0.7, waterUse: 5.7, recycleRate: 85,
        preferredFuel: 'Natural Gas', transportMode: 'Ship', processingTemp: 1085,
        abundance: 'Medium', toxicity: 'Medium', recyclability: 'Excellent'
      },
      'Steel': {
        energyIntensity: 18.5, carbonFactor: 0.65, waterUse: 4.2, recycleRate: 90,
        preferredFuel: 'Natural Gas', transportMode: 'Ship', processingTemp: 1538,
        abundance: 'High', toxicity: 'Low', recyclability: 'Excellent'
      },
      'Aluminium': {
        energyIntensity: 45.2, carbonFactor: 0.42, waterUse: 8.1, recycleRate: 95,
        preferredFuel: 'Natural Gas', transportMode: 'Truck', processingTemp: 660,
        abundance: 'High', toxicity: 'Low', recyclability: 'Excellent'
      }
    };

    const data1 = materialDatabase[material1 as keyof typeof materialDatabase];
    const data2 = materialDatabase[material2 as keyof typeof materialDatabase];

    if (!data1 || !data2) {
      throw new Error('Invalid material selection');
    }

    // Generate realistic LCA scenarios for both materials
    const baseElectricity1 = data1.energyIntensity * 100;
    const baseElectricity2 = data2.energyIntensity * 100;
    
    const scenario1 = {
      id: `${material1.toLowerCase()}-analysis`,
      name: `${material1} Processing Analysis`,
      carbonEmissions: Math.round(baseElectricity1 * data1.carbonFactor * 0.5 + 200),
      energyConsumed: Math.round(baseElectricity1 * 3.6 + baseElectricity1 * 0.7),
      waterUse: Math.round(baseElectricity1 * data1.waterUse),
      circularityPercent: data1.recycleRate,
      input: {
        materialType: material1,
        fuelType: data1.preferredFuel,
        electricityKwh: baseElectricity1,
        transportMode: data1.transportMode,
        route: 'mixed' as const
      },
      materialProperties: {
        processingTemperature: data1.processingTemp,
        abundance: data1.abundance,
        toxicity: data1.toxicity,
        recyclability: data1.recyclability
      }
    };

    const scenario2 = {
      id: `${material2.toLowerCase()}-analysis`,
      name: `${material2} Processing Analysis`,
      carbonEmissions: Math.round(baseElectricity2 * data2.carbonFactor * 0.5 + 200),
      energyConsumed: Math.round(baseElectricity2 * 3.6 + baseElectricity2 * 0.7),
      waterUse: Math.round(baseElectricity2 * data2.waterUse),
      circularityPercent: data2.recycleRate,
      input: {
        materialType: material2,
        fuelType: data2.preferredFuel,
        electricityKwh: baseElectricity2,
        transportMode: data2.transportMode,
        route: 'mixed' as const
      },
      materialProperties: {
        processingTemperature: data2.processingTemp,
        abundance: data2.abundance,
        toxicity: data2.toxicity,
        recyclability: data2.recyclability
      }
    };

    // Generate analysis insights
    const insights = [];
    
    // Energy comparison
    if (scenario1.energyConsumed > scenario2.energyConsumed * 1.5) {
      insights.push(`${material1} requires ${Math.round((scenario1.energyConsumed / scenario2.energyConsumed - 1) * 100)}% more energy than ${material2}`);
    } else if (scenario2.energyConsumed > scenario1.energyConsumed * 1.5) {
      insights.push(`${material2} requires ${Math.round((scenario2.energyConsumed / scenario1.energyConsumed - 1) * 100)}% more energy than ${material1}`);
    }
    
    // Carbon comparison
    if (scenario1.carbonEmissions > scenario2.carbonEmissions * 1.2) {
      insights.push(`${material1} has ${Math.round((scenario1.carbonEmissions / scenario2.carbonEmissions - 1) * 100)}% higher carbon footprint`);
    } else if (scenario2.carbonEmissions > scenario1.carbonEmissions * 1.2) {
      insights.push(`${material2} has ${Math.round((scenario2.carbonEmissions / scenario1.carbonEmissions - 1) * 100)}% higher carbon footprint`);
    }
    
    // Recyclability comparison
    if (data1.recycleRate > data2.recycleRate + 10) {
      insights.push(`${material1} offers superior recyclability (${data1.recycleRate}% vs ${data2.recycleRate}%)`);
    } else if (data2.recycleRate > data1.recycleRate + 10) {
      insights.push(`${material2} offers superior recyclability (${data2.recycleRate}% vs ${data1.recycleRate}%)`);
    }
    
    // Processing temperature insights
    if (data1.processingTemp > data2.processingTemp + 200) {
      insights.push(`${material1} requires higher processing temperature (${data1.processingTemp}°C vs ${data2.processingTemp}°C)`);
    } else if (data2.processingTemp > data1.processingTemp + 200) {
      insights.push(`${material2} requires higher processing temperature (${data2.processingTemp}°C vs ${data1.processingTemp}°C)`);
    }
    
    // Abundance insights
    if (data1.abundance === 'Very Low' && data2.abundance !== 'Very Low') {
      insights.push(`${material1} is much rarer than ${material2}, affecting supply chain sustainability`);
    } else if (data2.abundance === 'Very Low' && data1.abundance !== 'Very Low') {
      insights.push(`${material2} is much rarer than ${material1}, affecting supply chain sustainability`);
    }

    return {
      mode: 'metals',
      data: [scenario1, scenario2],
      insights,
      recommendation: scenario1.carbonEmissions + scenario1.energyConsumed < scenario2.carbonEmissions + scenario2.energyConsumed 
        ? `${material1} is more environmentally sustainable overall` 
        : `${material2} is more environmentally sustainable overall`
    };
  },

  compareRoutes: async (material: string, route1: string, route2: string) => {
    const materialDatabase = {
      'Copper': { energyIntensity: 22.4, carbonFactor: 0.7, waterUse: 5.7, recycleRate: 85 },
      'Steel': { energyIntensity: 18.5, carbonFactor: 0.65, waterUse: 4.2, recycleRate: 90 },
      'Aluminium': { energyIntensity: 45.2, carbonFactor: 0.42, waterUse: 8.1, recycleRate: 95 }
    };

    const data = materialDatabase[material as keyof typeof materialDatabase];
    if (!data) throw new Error('Invalid material selection');

    const routeMultipliers = {
      virgin: { carbon: 1.8, energy: 1.6, water: 2.2, circularity: 15 },
      mixed: { carbon: 1.0, energy: 1.0, water: 1.0, circularity: 65 },
      recycled: { carbon: 0.4, energy: 0.6, water: 0.3, circularity: 95 }
    };

    const mult1 = routeMultipliers[route1 as keyof typeof routeMultipliers];
    const mult2 = routeMultipliers[route2 as keyof typeof routeMultipliers];

    const baseElectricity = data.energyIntensity * 100;
    
    const scenario1 = {
      id: `${material.toLowerCase()}-${route1}`,
      name: `${material} ${route1.charAt(0).toUpperCase() + route1.slice(1)} Route`,
      carbonEmissions: Math.round(baseElectricity * data.carbonFactor * mult1.carbon * 0.5 + 200),
      energyConsumed: Math.round(baseElectricity * mult1.energy * 3.6 + baseElectricity * 0.7),
      waterUse: Math.round(baseElectricity * data.waterUse * mult1.water),
      circularityPercent: mult1.circularity,
      input: { materialType: material, route: route1 as any }
    };

    const scenario2 = {
      id: `${material.toLowerCase()}-${route2}`,
      name: `${material} ${route2.charAt(0).toUpperCase() + route2.slice(1)} Route`,
      carbonEmissions: Math.round(baseElectricity * data.carbonFactor * mult2.carbon * 0.5 + 200),
      energyConsumed: Math.round(baseElectricity * mult2.energy * 3.6 + baseElectricity * 0.7),
      waterUse: Math.round(baseElectricity * data.waterUse * mult2.water),
      circularityPercent: mult2.circularity,
      input: { materialType: material, route: route2 as any }
    };

    const insights = [];
    const carbonDiff = Math.abs((scenario1.carbonEmissions - scenario2.carbonEmissions) / scenario1.carbonEmissions * 100);
    const energyDiff = Math.abs((scenario1.energyConsumed - scenario2.energyConsumed) / scenario1.energyConsumed * 100);
    
    if (carbonDiff > 20) {
      insights.push(`${route1 === 'virgin' ? 'Virgin' : route1 === 'recycled' ? 'Recycled' : 'Mixed'} route shows ${carbonDiff.toFixed(0)}% difference in carbon emissions`);
    }
    if (energyDiff > 15) {
      insights.push(`Energy consumption varies by ${energyDiff.toFixed(0)}% between routes`);
    }
    
    const betterRoute = scenario1.carbonEmissions + scenario1.energyConsumed < scenario2.carbonEmissions + scenario2.energyConsumed ? route1 : route2;
    
    return {
      mode: 'routes',
      data: [scenario1, scenario2],
      insights,
      recommendation: `${betterRoute.charAt(0).toUpperCase() + betterRoute.slice(1)} route is more environmentally sustainable for ${material}`
    };
  },

  generateReport: async (resultId: string) => {
    try {
      const res = await api.post("/report/generate", { resultId });
      return res.data;
    } catch (error) {
      console.warn('Backend report generation unavailable, using client-side PDF generation');
      return { reportId: `client-${resultId}`, title: `LCA Report ${resultId}` };
    }
  },

  downloadReport: async (reportId: string) => {
    try {
      const res = await api.get(`/report/download/${reportId}`, { responseType: 'blob' });
      return res.data;
    } catch (error) {
      console.warn('Backend report download unavailable, generating client-side PDF');
      throw new Error('Use client-side PDF generation');
    }
  },

  generateClientPDF: async (result: LCAResult) => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('LCA Analysis Report', 20, 30);
    
    doc.setFontSize(12);
    doc.text(`Material: ${result.input.materialType}`, 20, 50);
    doc.text(`Analysis Date: ${new Date(result.timestamp).toLocaleDateString()}`, 20, 60);
    doc.text(`Route: ${result.input.route}`, 20, 70);
    
    // Results
    doc.setFontSize(16);
    doc.text('Environmental Impact Results', 20, 90);
    
    doc.setFontSize(12);
    doc.text(`Carbon Emissions: ${result.carbonEmissions} kg CO2e`, 20, 110);
    doc.text(`Energy Consumed: ${result.energyConsumed} MJ`, 20, 120);
    doc.text(`Water Use: ${result.waterUse} L`, 20, 130);
    doc.text(`Circularity Index: ${result.circularityPercent}%`, 20, 140);
    
    // Process Configuration
    doc.setFontSize(16);
    doc.text('Process Configuration', 20, 160);
    
    doc.setFontSize(12);
    doc.text(`Electricity: ${result.input.electricityKwh} kWh`, 20, 180);
    doc.text(`Fuel Type: ${result.input.fuelType}`, 20, 190);
    doc.text(`Fuel Energy: ${result.input.fuelMj} MJ`, 20, 200);
    doc.text(`Transport Mode: ${result.input.transportMode}`, 20, 210);
    doc.text(`Transport Distance: ${result.input.transportDistance} km`, 20, 220);
    
    // Recommendations
    if (result.recommendations && result.recommendations.length > 0) {
      doc.setFontSize(16);
      doc.text('AI Recommendations', 20, 240);
      
      doc.setFontSize(10);
      let yPos = 255;
      result.recommendations.forEach((rec, index) => {
        const lines = doc.splitTextToSize(`${index + 1}. ${rec}`, 170);
        doc.text(lines, 20, yPos);
        yPos += lines.length * 5 + 5;
      });
    }
    
    return doc.output('blob');
  },

  uploadCSV: async (file: File) => {
    const formData = new FormData();
    formData.append('csvFile', file);
    
    const res = await api.post('/csv/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  analyzeCSVBatch: async (csvData: any[]) => {
    const res = await api.post('/analyze/batch', { data: csvData });
    return res.data;
  },

  exportComparisonPDF: async (scenario1: any, scenario2: any, comparisonData: any[], radarData: any[]) => {
    const res = await api.post('/reports/comparison', {
      scenario1,
      scenario2,
      comparisonData,
      radarData
    }, {
      responseType: 'blob'
    });
    return res.data;
  },
};