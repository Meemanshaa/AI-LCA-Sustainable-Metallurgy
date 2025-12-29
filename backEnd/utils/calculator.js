const calculateLCA = (input, baseline) => {
  const electricityConsumption = Number(input.electricityConsumption || 0);
  const fuelEnergy = Number(input.fuelEnergy || 0);
  const transportDistance = Number(input.transportDistance || 0);
  const recyclePercent = Number(input.recyclePercent || 0);
  const reusePercent = Number(input.reusePercent || 0);

  // Enhanced LCA calculations
  const totalCO2 = Math.round(electricityConsumption * 0.5 + fuelEnergy * 0.07 + transportDistance * 0.2);
  const totalEnergy = Math.round(electricityConsumption * 3.6 + fuelEnergy);
  const waterUse = Math.round(electricityConsumption * 0.5 + fuelEnergy * 0.1);
  let circularityPercent = Math.round(recyclePercent * 0.7 + reusePercent * 0.5);
  if (circularityPercent > 100) circularityPercent = 100;

  // Calculate fuel efficiency score
  const fuelEfficiencyScore = Math.max(10, Math.min(100, 100 - (totalCO2 / totalEnergy) * 50));

  const recommendations = [];
  if (recyclePercent < 50) recommendations.push("Increase recycled content to lower emissions.");
  if (transportDistance > 200) recommendations.push("Consider optimizing transport distance or mode.");
  if (electricityConsumption > 1000) recommendations.push("Investigate energy efficiency or renewable electricity.");

  // Compare with baseline if provided
  let comparisons = null;
  if (baseline) {
    const diff = (val, base) => {
      const change = ((base - val) / base) * 100;
      return { value: val, baseline: base, change: Math.round(change * 10) / 10 };
    };

    comparisons = {
      totalCO2: diff(totalCO2, baseline.totalCO2),
      totalEnergy: diff(totalEnergy, baseline.totalEnergy),
      waterUse: diff(waterUse, baseline.waterUse),
      circularityPercent: diff(circularityPercent, baseline.circularityPercent),
    };
  }

  return {
    totalCO2,
    totalEnergy,
    waterUse,
    circularityPercent,
    fuelEfficiencyScore,
    recommendations,
    comparisons,
  };
};

module.exports = { calculateLCA };
