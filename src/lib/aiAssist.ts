// aiAssist.ts - Fuel efficiency calculations and AI assistance

type FuelProps = {
  mjPerL: number;
  defaultEff: number;
  emissionFactor: number;
};

type FuelType = "Diesel" | "Petrol" | "Natural Gas" | "Biomass" | "Coal" | "LPG";

interface Suggestion {
  electricityKwh: number;
  electricityMJ: number;
  fuelType: FuelType;
  fuelEnergyMJ_displayed: number;
  requiredFuelMJ: number;
  requiredFuelL: number | null;
  impliedEfficiency: number | null;
  isRealistic: boolean;
  recommendations: string[];
}

const fuelProps: Record<FuelType, FuelProps> = {
  Diesel: { mjPerL: 35.8, defaultEff: 0.35, emissionFactor: 0.074 },
  Petrol: { mjPerL: 34.2, defaultEff: 0.32, emissionFactor: 0.069 },
  "Natural Gas": { mjPerL: 50.0, defaultEff: 0.42, emissionFactor: 0.056 },
  Biomass: { mjPerL: 15.0, defaultEff: 0.25, emissionFactor: 0.0 },
  Coal: { mjPerL: 29.3, defaultEff: 0.30, emissionFactor: 0.095 },
  LPG: { mjPerL: 46.1, defaultEff: 0.38, emissionFactor: 0.063 }
};

const realistic = {
  eff_min: 0.1,
  eff_max: 0.6,
};

// --- Helpers ---
const toNumber = (value: string | number | null): number | null => {
  if (value === null || value === undefined) return null;
  const v = value.toString().trim();
  if (!v) return null;
  const n = Number(v.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};

const fmt = (n: number | null, dec = 2): string =>
  n === null || Number.isNaN(n) ? "" : n.toFixed(dec);

const kwhToMJ = (kwh: number): number => kwh * 3.6;
const MJToKwh = (mj: number): number => mj / 3.6;
const randomInRange = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// --- Main AI Assist Function ---
export function calculateFuelSuggestion(
  electricityKwh: number | null,
  fuelType: FuelType = "Natural Gas",
  fuelMjInput: number | null = null,
  fuelVolInput: number | null = null,
  effOverridePct: number | null = null,
  materialType: string = "Other"
): Suggestion {
  
  // Use material-specific electricity if not provided
  const materialDefaults = {
    'Bauxite': 1520, 'Copper': 2240, 'Gold': 24580, 'Iron Ore': 890,
    'Zinc': 1870, 'Silver': 8930, 'Nickel': 4560, 'Platinum': 12550
  };
  
  let finalElectricityKwh = electricityKwh;
  if (finalElectricityKwh === null) {
    finalElectricityKwh = materialDefaults[materialType as keyof typeof materialDefaults] || randomInRange(500, 3000);
  }

  const props = fuelProps[fuelType] || fuelProps["Natural Gas"];
  const elecMJ = kwhToMJ(finalElectricityKwh);

  let eta = effOverridePct && effOverridePct > 0 ? effOverridePct / 100 : props.defaultEff;

  let impliedEta: number | null = null;
  if (fuelMjInput !== null && fuelMjInput > 0) {
    impliedEta = elecMJ / fuelMjInput;
  }

  const requiredFuelMJ = elecMJ / eta;
  let requiredFuelL: number | null = null;
  if (props.mjPerL > 0) {
    requiredFuelL = requiredFuelMJ / props.mjPerL;
  }

  const isRealistic = impliedEta === null || (impliedEta >= realistic.eff_min && impliedEta <= realistic.eff_max);

  // Generate AI recommendations
  const recommendations: string[] = [];
  
  if (!isRealistic && impliedEta !== null) {
    if (impliedEta < realistic.eff_min) {
      recommendations.push(`⚠️ Efficiency too low (${(impliedEta * 100).toFixed(1)}%). Check if fuel energy is correct.`);
    } else {
      recommendations.push(`⚠️ Efficiency too high (${(impliedEta * 100).toFixed(1)}%). Verify input values.`);
    }
  } else {
    recommendations.push(`✅ Efficiency is realistic (${eta ? (eta * 100).toFixed(1) : 'N/A'}%)`);
  }

  // Fuel-specific recommendations
  if (fuelType === "Coal") {
    recommendations.push("💡 Consider switching to Natural Gas for 40% lower emissions");
  } else if (fuelType === "Diesel") {
    recommendations.push("💡 Natural Gas or Biomass would reduce environmental impact");
  } else if (fuelType === "Biomass") {
    recommendations.push("🌱 Excellent choice! Biomass is carbon neutral");
  } else if (fuelType === "Natural Gas") {
    recommendations.push("👍 Good choice - Natural Gas has lower emissions than coal/diesel");
  }

  // Material-specific recommendations
  if (materialType === "Gold" && finalElectricityKwh > 20000) {
    recommendations.push("⚡ High energy material - consider renewable electricity sources");
  } else if (materialType === "Bauxite" && fuelType !== "Natural Gas") {
    recommendations.push("🔧 Natural Gas is optimal for Bauxite processing efficiency");
  }

  return {
    electricityKwh: finalElectricityKwh,
    electricityMJ: elecMJ,
    fuelType,
    fuelEnergyMJ_displayed: elecMJ, // Show MJ equivalent of electricity
    requiredFuelMJ,
    requiredFuelL,
    impliedEfficiency: impliedEta,
    isRealistic,
    recommendations
  };
}

// --- Smart Fill Integration ---
export async function smartFillWithAI(partialData: {
  materialType?: string;
  fuelType?: FuelType;
  electricityKwh?: number;
  fuelMj?: number;
  transportDistance?: number;
  transportMode?: string;
  landfillLocation?: string;
}) {
  try {
    // Try Smart Environmental AI Assistant first
    const response = await fetch('http://localhost:8000/api/smart-fill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        materialType: partialData.materialType,
        fuelType: partialData.fuelType,
        electricityConsumption: partialData.electricityKwh,
        fuelEnergy: partialData.fuelMj,
        transportDistance: partialData.transportDistance,
        transportMode: partialData.transportMode,
        landfillLocation: partialData.landfillLocation
      })
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        const completedData = result.data.completedData;
        
        // Calculate fuel efficiency for the completed data
        const fuelSuggestion = calculateFuelSuggestion(
          parseFloat(completedData.electricityConsumption),
          completedData.fuelType as FuelType,
          parseFloat(completedData.fuelEnergy),
          null,
          null,
          completedData.materialType
        );

        return {
          success: true,
          completedData: {
            materialType: completedData.materialType,
            fuelType: completedData.fuelType,
            electricityKwh: parseFloat(completedData.electricityConsumption),
            fuelMj: parseFloat(completedData.fuelEnergy),
            transportDistance: parseFloat(completedData.transportDistance),
            transportMode: completedData.transportMode,
            landfillLocation: completedData.landfillLocation
          },
          fuelAnalysis: fuelSuggestion,
          aiExplanation: result.data.explanation,
          recommendations: [...result.data.recommendations, ...fuelSuggestion.recommendations],
          environmentalImpact: result.data.environmentalImpact
        };
      }
    }
  } catch (error) {
    console.warn('Smart AI Assistant unavailable, using local calculations');
  }

  // Fallback to local calculations
  const materialType = partialData.materialType || 'Other';
  const fuelType = partialData.fuelType || 'Natural Gas';
  const electricityKwh = partialData.electricityKwh || null;
  
  const fuelSuggestion = calculateFuelSuggestion(
    electricityKwh,
    fuelType,
    partialData.fuelMj || null,
    null,
    null,
    materialType
  );

  return {
    success: true,
    completedData: {
      materialType,
      fuelType,
      electricityKwh: fuelSuggestion.electricityKwh,
      fuelMj: fuelSuggestion.requiredFuelMJ,
      transportDistance: partialData.transportDistance || 500,
      transportMode: partialData.transportMode || 'Truck',
      landfillLocation: partialData.landfillLocation || 'Ghazipur Delhi'
    },
    fuelAnalysis: fuelSuggestion,
    aiExplanation: [
      `Calculated electricity: ${fuelSuggestion.electricityKwh} kWh → ${fmt(fuelSuggestion.electricityMJ)} MJ`,
      `Required fuel energy: ${fmt(fuelSuggestion.requiredFuelMJ)} MJ for ${fuelType}`,
      `Estimated fuel volume: ${fuelSuggestion.requiredFuelL ? fmt(fuelSuggestion.requiredFuelL) + ' L' : 'N/A'}`
    ],
    recommendations: fuelSuggestion.recommendations,
    environmentalImpact: {
      co2Emissions: fuelSuggestion.requiredFuelMJ * (fuelProps[fuelType]?.emissionFactor || 0.07),
      totalEnergy: fuelSuggestion.electricityMJ + fuelSuggestion.requiredFuelMJ,
      fuelEfficiencyScore: Math.round((fuelSuggestion.impliedEfficiency || 0.35) * 100)
    }
  };
}

// --- DOM Setup Function (for direct HTML integration) ---
export function setupAiAssist(): void {
  const el_elec = document.getElementById("electricity_kwh") as HTMLInputElement;
  const el_fuelType = document.getElementById("fuel_type") as HTMLSelectElement;
  const el_fuelMJ = document.getElementById("fuel_energy_mj") as HTMLInputElement;
  const el_fuelVol = document.getElementById("fuel_volume_l") as HTMLInputElement;
  const el_effPct = document.getElementById("fuel_efficiency_pct") as HTMLInputElement;
  const el_msg = document.getElementById("ai_message") as HTMLElement;
  const btn = document.getElementById("ai_assist") as HTMLButtonElement;

  if (!btn) {
    console.warn("ai_assist button not found (id='ai_assist')");
    return;
  }

  btn.addEventListener("click", async () => {
    await new Promise((r) => setTimeout(r, 500));

    const electricityKwh = toNumber(el_elec?.value);
    const fuelType: FuelType = (el_fuelType?.value as FuelType) || "Natural Gas";
    const fuelMjInput = toNumber(el_fuelMJ?.value);
    const fuelVolInput = toNumber(el_fuelVol?.value);
    const effOverridePct = toNumber(el_effPct?.value);

    const suggestion = calculateFuelSuggestion(
      electricityKwh,
      fuelType,
      fuelMjInput,
      fuelVolInput,
      effOverridePct
    );

    // Update form fields
    if (el_elec && !el_elec.value) {
      el_elec.value = suggestion.electricityKwh.toString();
    }
    if (el_fuelMJ) {
      el_fuelMJ.value = fmt(suggestion.fuelEnergyMJ_displayed, 2);
    }
    if (el_fuelVol && suggestion.requiredFuelL) {
      el_fuelVol.value = fmt(suggestion.requiredFuelL, 2);
    }

    // Display analysis
    const lines: string[] = [
      `Electricity: ${fmt(suggestion.electricityKwh, 2)} kWh → ${fmt(suggestion.electricityMJ, 2)} MJ`,
      `Fuel Type: ${suggestion.fuelType}`,
      `Required Fuel Energy: ${fmt(suggestion.requiredFuelMJ, 2)} MJ`,
      suggestion.requiredFuelL ? `Estimated Fuel Volume: ${fmt(suggestion.requiredFuelL, 2)} L` : '',
      suggestion.impliedEfficiency ? `Implied Efficiency: ${fmt(suggestion.impliedEfficiency * 100, 1)}%` : '',
      '',
      ...suggestion.recommendations
    ].filter(line => line !== '');

    if (el_msg) el_msg.textContent = lines.join('\n');

    return suggestion;
  });
}