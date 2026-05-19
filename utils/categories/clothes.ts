import { CalculationResult, HabitHandler, StoreHabitArgs } from '../habit-types';
import { InvalidPayloadError } from '../custom-errors';
import { storeEcoActivity } from '../store-eco-activity';

// Types 

export type ClothingType = 'tshirt' | 'jeans' | 'hoodie' | 'jacket' | 'dress' | 'shoes';
export type ClothingMaterial = 'cotton' | 'organic_cotton' | 'polyester' | 'recycled_polyester' | 'wool' | 'leather' | 'linen' | 'mixed';
export type ProductionRegion = 'local' | 'europe' | 'asia' | 'other';

interface ClothesParsedInput {
  clothingType: ClothingType;
  material: ClothingMaterial;
  productionRegion: ProductionRegion;
}

type ClothesExtra = {
  weightKg: number;
  co2PerKg: number;
  waterPerKg: number;
  transportMultiplier: number;
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

// ─── Valid sets ───────────────────────────────────────────────────────────────

const VALID_CLOTHING_TYPES = new Set<ClothingType>(['tshirt', 'jeans', 'hoodie', 'jacket', 'dress', 'shoes']);
const VALID_MATERIALS = new Set<ClothingMaterial>(['cotton', 'organic_cotton', 'polyester', 'recycled_polyester', 'wool', 'leather', 'linen', 'mixed']);
const VALID_REGIONS = new Set<ProductionRegion>(['local', 'europe', 'asia', 'other']);

// ─── Validation ───────────────────────────────────────────────────────────────

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isClothesInput(value: unknown): value is ClothesParsedInput {
  if (!isObject(value)) return false;

  return (
    typeof value.clothingType === 'string' &&
    VALID_CLOTHING_TYPES.has(value.clothingType as ClothingType) &&
    typeof value.material === 'string' &&
    VALID_MATERIALS.has(value.material as ClothingMaterial) &&
    typeof value.productionRegion === 'string' &&
    VALID_REGIONS.has(value.productionRegion as ProductionRegion)
  );
}

function parseClothesInput(raw: unknown): ClothesParsedInput {
  if (!isClothesInput(raw)) {
    throw new InvalidPayloadError();
  }
  return raw;
}

// ─── Calculation ──────────────────────────────────────────────────────────────

async function calculateClothesMetrics(
  data: ClothesParsedInput
): Promise<CalculationResult<ClothesExtra>> {
  const { clothingType, material, productionRegion } = data;

  const weightKg            = CLOTHING_WEIGHT_KG[clothingType];
  const co2PerKg            = MATERIAL_CO2_PER_KG[material];
  const waterPerKg          = MATERIAL_WATER_PER_KG[material];
  const transportMultiplier = REGION_TRANSPORT_MULTIPLIER[productionRegion];

  const co2Kg    = weightKg * co2PerKg * transportMultiplier;
  const waterL   = weightKg * waterPerKg;
  // Clothes manufacturing is energy-intensive but we track it via CO₂;
  // energy_kwh is left at 0 to keep the schema consistent with other handlers.
  const energyKwh = 0;

  return {
    metrics: {
      co2_kg:     Number(co2Kg.toFixed(3)),
      water_l:    Number(waterL.toFixed(1)),
      energy_kwh: energyKwh,
    },
    extra: {
      weightKg,
      co2PerKg,
      waterPerKg,
      transportMultiplier,
    },
  };
}

// ─── Storage ──────────────────────────────────────────────────────────────────

async function storeClothesResult(
  args: StoreHabitArgs<ClothesParsedInput, ClothesExtra>
) {
  const { userId, supabase, category, metrics, parsed, extra, day } = args;

  return storeEcoActivity({
    userId,
    supabase,
    category,
    metrics,
    day,
    details: {
      clothingType:        parsed.clothingType,
      material:            parsed.material,
      productionRegion:    parsed.productionRegion,
      weightKg:            extra.weightKg,
      co2PerKg:            extra.co2PerKg,
      waterPerKg:          extra.waterPerKg,
      transportMultiplier: extra.transportMultiplier,
    },
  });
}

// ─── Export ───────────────────────────────────────────────────────────────────

export const clothesHandler: HabitHandler<ClothesParsedInput, ClothesExtra> = {
  parse: parseClothesInput,
  async calculate(parsed) {
    return calculateClothesMetrics(parsed);
  },
  async store(args) {
    return storeClothesResult(args);
  },
};