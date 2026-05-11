/**
 * ECG impact constants — emission factor estimates (IPCC / EPA / Ellen MacArthur Foundation).
 * All values are per kg of material.
 */
export const ECG_FACTORS: Record<
  string,
  { co2KgPerKg: number; waterLPerKg: number; energyKwhPerKg: number }
> = {
  metals:           { co2KgPerKg: 4.5,  waterLPerKg: 38,   energyKwhPerKg: 8.5  },
  plastics:         { co2KgPerKg: 3.1,  waterLPerKg: 22,   energyKwhPerKg: 6.8  },
  paper_cardboard:  { co2KgPerKg: 1.1,  waterLPerKg: 50,   energyKwhPerKg: 2.9  },
  textiles:         { co2KgPerKg: 15.0, waterLPerKg: 10000, energyKwhPerKg: 18.0 },
  electronics:      { co2KgPerKg: 22.0, waterLPerKg: 120,  energyKwhPerKg: 35.0 },
  chemicals:        { co2KgPerKg: 2.8,  waterLPerKg: 40,   energyKwhPerKg: 5.5  },
  food_organics:    { co2KgPerKg: 2.5,  waterLPerKg: 1800, energyKwhPerKg: 1.8  },
  glass:            { co2KgPerKg: 0.9,  waterLPerKg: 8,    energyKwhPerKg: 1.2  },
  wood:             { co2KgPerKg: 0.5,  waterLPerKg: 200,  energyKwhPerKg: 0.8  },
  rubber:           { co2KgPerKg: 3.8,  waterLPerKg: 50,   energyKwhPerKg: 7.2  },
  construction:     { co2KgPerKg: 0.7,  waterLPerKg: 5,    energyKwhPerKg: 1.1  },
  machinery_equipment:{ co2KgPerKg: 6.2, waterLPerKg: 60,  energyKwhPerKg: 12.0 },
  packaging:        { co2KgPerKg: 1.5,  waterLPerKg: 30,   energyKwhPerKg: 3.0  },
  other:            { co2KgPerKg: 2.0,  waterLPerKg: 50,   energyKwhPerKg: 4.0  },
};

/** 1 tonne CO2 ≈ 1 carbon credit (verified carbon standard approximation) */
const KG_CO2_PER_CREDIT = 1000;

export interface EcgImpact {
  co2SavedKg: number;
  waterSavedL: number;
  energySavedKwh: number;
  landfillDivertedKg: number;
  carbonCreditEquivalent: number;
  circularityScore: number;
}

/**
 * Calculate ECG impact for a completed material exchange.
 * @param category  Material category key
 * @param quantityKg Weight of material exchanged in kg
 */
export function calculateEcgImpact(
  category: string,
  quantityKg: number
): EcgImpact {
  const factors = ECG_FACTORS[category] ?? ECG_FACTORS["other"];

  const co2SavedKg = factors.co2KgPerKg * quantityKg;
  const waterSavedL = factors.waterLPerKg * quantityKg;
  const energySavedKwh = factors.energyKwhPerKg * quantityKg;
  const landfillDivertedKg = quantityKg;
  const carbonCreditEquivalent = co2SavedKg / KG_CO2_PER_CREDIT;

  // Circularity score: 0–100 composite based on impact density
  // High CO2 categories score higher when diverted
  const impactDensity = factors.co2KgPerKg;
  const circularityScore = Math.min(
    100,
    Math.round(10 + (impactDensity / 22) * 60 + Math.min(30, quantityKg / 100))
  );

  return {
    co2SavedKg,
    waterSavedL,
    energySavedKwh,
    landfillDivertedKg,
    carbonCreditEquivalent,
    circularityScore,
  };
}

/** Format kg with appropriate unit (kg / tonnes) */
export function formatWeight(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${kg.toFixed(0)}kg`;
}

/** Format CO2 saved */
export function formatCo2(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(2)} tCO₂e`;
  return `${kg.toFixed(1)} kgCO₂e`;
}
