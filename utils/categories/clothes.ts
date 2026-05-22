import { CalculationResult, HabitHandler, StoreHabitArgs } from '../habit-types';
import { InvalidPayloadError } from '../custom-errors';
import { storeEcoActivity } from '../store-eco-activity';

// Types 

export type ClothingType = 'tshirt' | 'jeans' | 'hoodie' | 'jacket' | 'dress' | 'shoes';
export type ClothingMaterial = 'cotton' | 'organic_cotton' | 'polyester' | 'recycled_polyester' | 'wool' | 'leather' | 'linen' | 'mixed';
export type ProductionRegion = 'local' | 'europe' | 'asia' | 'other';

// secondHand: true  → material and productionRegion are not needed
// secondHand: false → material and productionRegion are required
type ClothesNewInput = {
  clothingType: ClothingType;
  secondHand: false;
  material: ClothingMaterial;
  productionRegion: ProductionRegion;
};
 
type ClothesSecondHandInput = {
  clothingType: ClothingType;
  secondHand: true;
};
 
type ClothesParsedInput = ClothesNewInput | ClothesSecondHandInput;

type ClothesExtra = {
  weightKg: number;
  secondHand: boolean;
  co2PerKg: number | null;
  waterPerKg: number | null;
  transportMultiplier: number | null;
};

// Lookup tables

/**
 Approximate textile weight per clothing item in kg.
 */
const CLOTHING_WEIGHT_KG: Record<ClothingType, number> = {
  tshirt:  0.20,
  jeans:   0.70,
  hoodie:  0.60,
  jacket:  0.90,
  dress:   0.40,
  shoes:   0.80,
};

/**
 * CO₂ kg per kg of material (manufacturing + dyeing, excluding transport).
 * Sources: various LCA studies, rounded for practical use.
 */
const MATERIAL_CO2_PER_KG: Record<ClothingMaterial, number> = {
  cotton:             8.0,
  organic_cotton:     5.5,
  polyester:         14.0,
  recycled_polyester:  7.0,
  wool:              25.0,
  leather:           30.0,
  linen:              4.5,
  mixed:             10.0,
};

/**
 * Water usage in liters per kg of material.
 */
const MATERIAL_WATER_PER_KG: Record<ClothingMaterial, number> = {
  cotton:             10000,
  organic_cotton:      7000,
  polyester:            100,
  recycled_polyester:    80,
  wool:               8000,
  leather:            15000,
  linen:              2000,
  mixed:              5000,
};

/**
 * Transport CO₂ multiplier on top of manufacturing CO₂.
 * local  → minimal transport, essentially no shipping overhead
 * europe → truck/train freight, low multiplier
 * asia   → ocean freight to Europe, moderate overhead
 * other  → mixed freight, similar to asia
 */
const REGION_TRANSPORT_MULTIPLIER: Record<ProductionRegion, number> = {
  local:   1.00,
  europe:  1.05,
  asia:    1.15,
  other:   1.12,
};

/**
 * Second hand residual CO₂ factor.
 * ~5% of weight-based manufacturing CO₂ to account for transport
 * to thrift store and processing. No water since no textile is produced.
 * Uses a fixed base of 10 kg CO₂/kg (roughly average across materials).
 */
const SECOND_HAND_CO2_PER_KG = 0.5; // 10 * 0.05
const SECOND_HAND_WATER_L = 0;

// Valid sets
const VALID_CLOTHING_TYPES = new Set<string>(['tshirt', 'jeans', 'hoodie', 'jacket', 'dress', 'shoes']);
const VALID_MATERIALS = new Set<string>(['cotton', 'organic_cotton', 'polyester', 'recycled_polyester', 'wool', 'leather', 'linen', 'mixed']);
const VALID_REGIONS = new Set<string>(['local', 'europe', 'asia', 'other']);

// Validation

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
 
function isClothesInput(value: unknown): value is ClothesParsedInput {
  if (!isObject(value)) return false;
  if (typeof value.clothingType !== 'string') return false;
  if (!VALID_CLOTHING_TYPES.has(value.clothingType)) return false;
  if (typeof value.secondHand !== 'boolean') return false;
 
  if (value.secondHand === true) {
    // No further fields required
    return true;
  }
 
  // secondHand === false: material and region are required
  return (
    typeof value.material === 'string' &&
    VALID_MATERIALS.has(value.material) &&
    typeof value.productionRegion === 'string' &&
    VALID_REGIONS.has(value.productionRegion)
  );
}
 
function parseClothesInput(raw: unknown): ClothesParsedInput {
  if (!isClothesInput(raw)) {
    throw new InvalidPayloadError();
  }
  return raw;
}
 
// Calculation

async function calculateClothesMetrics(
  data: ClothesParsedInput
): Promise<CalculationResult<ClothesExtra>> {
  const weightKg = CLOTHING_WEIGHT_KG[data.clothingType];
 
  if (data.secondHand) {
    const co2Kg  = weightKg * SECOND_HAND_CO2_PER_KG;
    const waterL = SECOND_HAND_WATER_L;
 
    return {
      metrics: {
        co2_kg:     Number(co2Kg.toFixed(3)),
        water_l:    waterL,
        energy_kwh: 0,
      },
      extra: {
        weightKg,
        secondHand:          true,
        co2PerKg:            SECOND_HAND_CO2_PER_KG,
        waterPerKg:          0,
        transportMultiplier: null,
      },
    };
  }
 
  // New item
  const co2PerKg            = MATERIAL_CO2_PER_KG[data.material];
  const waterPerKg          = MATERIAL_WATER_PER_KG[data.material];
  const transportMultiplier = REGION_TRANSPORT_MULTIPLIER[data.productionRegion];
 
  const co2Kg  = weightKg * co2PerKg * transportMultiplier;
  const waterL = weightKg * waterPerKg;
 
  return {
    metrics: {
      co2_kg:     Number(co2Kg.toFixed(3)),
      water_l:    Number(waterL.toFixed(1)),
      energy_kwh: 0,
    },
    extra: {
      weightKg,
      secondHand:          false,
      co2PerKg,
      waterPerKg,
      transportMultiplier,
    },
  };
}
 
// Storage

async function storeClothesResult(
  args: StoreHabitArgs<ClothesParsedInput, ClothesExtra>
) {
  const { userId, supabase, category, metrics, parsed, extra, day } = args;
 
  const details: Record<string, unknown> = {
    clothingType: parsed.clothingType,
    secondHand:   parsed.secondHand,
    weightKg:     extra.weightKg,
  };
 
  if (!parsed.secondHand) {
    details.material            = parsed.material;
    details.productionRegion    = parsed.productionRegion;
    details.co2PerKg            = extra.co2PerKg;
    details.waterPerKg          = extra.waterPerKg;
    details.transportMultiplier = extra.transportMultiplier;
  }
 
  return storeEcoActivity({
    userId,
    supabase,
    category,
    metrics,
    day,
    details,
  });
}
 
// Export

export const clothesHandler: HabitHandler<ClothesParsedInput, ClothesExtra> = {
  parse: parseClothesInput,
  async calculate(parsed) {
    return calculateClothesMetrics(parsed);
  },
  async store(args) {
    return storeClothesResult(args);
  },
};