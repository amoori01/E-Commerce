// ====================================================================
// AMG LOGISTICS FREIGHT & TON-KILOMETER CALCULATOR
// Aligned with AMG Holdings Commercial Transport & Haulage Tariff
// ====================================================================

export interface FreightRoute {
  originBranchId: string;
  originBranchName: string;
  destinationCity: string;
  distanceKm: number;
}

export interface FreightEstimateResult {
  originBranchName: string;
  destinationCity: string;
  distanceKm: number;
  totalWeightMetricTons: number;
  tonKilometers: number;
  baseHaulageEtb: number;
  fuelSurchargeEtb: number;
  insuranceEtb: number;
  totalFreightEtb: number;
  estimatedLeadTimeDays: number;
  carrierType: 'sinotruk_prime_mover_40t' | 'medium_flatbed_15t' | 'urban_dispatch_5t';
}

// Distance matrix from key AMG regional plants/depots to destinations
export const INTER_CITY_DISTANCES_KM: Record<string, Record<string, number>> = {
  'branch-addis': {
    'Addis Ababa Metro': 25,
    'Adama': 98,
    'Hawassa': 275,
    'Dire Dawa': 452,
    'Mekelle': 780,
    'Bahir Dar': 565,
    'Gondar': 738,
    'Jimma': 352,
  },
  'branch-adama': {
    'Addis Ababa Metro': 98,
    'Adama': 15,
    'Hawassa': 210,
    'Dire Dawa': 355,
    'Mekelle': 850,
    'Bahir Dar': 660,
    'Gondar': 830,
    'Jimma': 430,
  },
  'branch-hawassa': {
    'Addis Ababa Metro': 275,
    'Adama': 210,
    'Hawassa': 15,
    'Dire Dawa': 540,
    'Mekelle': 1050,
    'Bahir Dar': 840,
    'Gondar': 1010,
    'Jimma': 290,
  },
  'branch-diredawa': {
    'Addis Ababa Metro': 452,
    'Adama': 355,
    'Hawassa': 540,
    'Dire Dawa': 15,
    'Mekelle': 890,
    'Bahir Dar': 980,
    'Gondar': 1150,
    'Jimma': 790,
  },
};

/**
 * Standard AMG Logistics Tariff:
 * - Base rate per Ton-Kilometer: 14.50 ETB / (t·km)
 * - Minimum mobilization fee: 4,500 ETB
 * - Diesel surcharge (fluctuating energy baseline): 8.5%
 * - Goods-in-transit (GIT) insurance: 0.75% of consignment value or flat minimum 1,200 ETB
 */
export function calculateConsignmentFreight(params: {
  originBranchId: string;
  originBranchName: string;
  destinationCity: string;
  weightTons: number;
  consignmentValueEtb?: number;
}): FreightEstimateResult {
  const originDistances = INTER_CITY_DISTANCES_KM[params.originBranchId] || INTER_CITY_DISTANCES_KM['branch-addis'];
  const distanceKm = originDistances[params.destinationCity] || 150; // default 150km if regional unlisted

  const normalizedWeight = Math.max(0.5, params.weightTons);
  const tonKilometers = normalizedWeight * distanceKm;

  // Base rate calculation
  const calculatedBase = tonKilometers * 14.50;
  const baseHaulageEtb = Math.max(4500, Math.round(calculatedBase));

  // Surcharges
  const fuelSurchargeEtb = Math.round(baseHaulageEtb * 0.085);
  const insuranceEtb = Math.round(
    params.consignmentValueEtb ? Math.max(1200, params.consignmentValueEtb * 0.0075) : 1500
  );

  const totalFreightEtb = baseHaulageEtb + fuelSurchargeEtb + insuranceEtb;

  // Fleet allocation
  let carrierType: 'sinotruk_prime_mover_40t' | 'medium_flatbed_15t' | 'urban_dispatch_5t' = 'urban_dispatch_5t';
  if (normalizedWeight > 15) {
    carrierType = 'sinotruk_prime_mover_40t';
  } else if (normalizedWeight > 5) {
    carrierType = 'medium_flatbed_15t';
  }

  // Lead-time calculation (average industrial freight 250km/day + 1 loading day)
  const estimatedLeadTimeDays = Math.max(1, Math.ceil(distanceKm / 250) + 1);

  return {
    originBranchName: params.originBranchName,
    destinationCity: params.destinationCity,
    distanceKm,
    totalWeightMetricTons: normalizedWeight,
    tonKilometers: Math.round(tonKilometers * 10) / 10,
    baseHaulageEtb,
    fuelSurchargeEtb,
    insuranceEtb,
    totalFreightEtb,
    estimatedLeadTimeDays,
    carrierType,
  };
}
