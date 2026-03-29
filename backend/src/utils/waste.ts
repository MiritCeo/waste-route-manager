import type { PrismaClient } from '@prisma/client';

export type WasteType =
  | 'bio-green'
  | 'bio-green-240'
  | 'bio-green-1100'
  | 'bio-kitchen'
  | 'bio-kitchen-240'
  | 'bio-kitchen-1100'
  | 'glass-clear'
  | 'glass-clear-1100'
  | 'glass-colored'
  | 'glass-colored-1100'
  | 'paper'
  | 'paper-1100'
  | 'plastic'
  | 'plastic-1100'
  | 'ash'
  | 'mixed'
  | 'mixed-240'
  | 'mixed-1100';

export const WASTE_OPTIONS: Array<{ id: WasteType; name: string; icon: string }> = [
  { id: 'bio-green', name: 'Bio zielone 120L', icon: '🌿' },
  { id: 'bio-green-240', name: 'Bio zielone 240L', icon: '🌿' },
  { id: 'bio-green-1100', name: 'Bio zielone 1100L', icon: '🌿' },
  { id: 'bio-kitchen', name: 'Bio kuchenne 120L', icon: '🍂' },
  { id: 'bio-kitchen-240', name: 'Bio kuchenne 240L', icon: '🍂' },
  { id: 'bio-kitchen-1100', name: 'Bio kuchenne 1100L', icon: '🍂' },
  { id: 'glass-clear', name: 'Szkło bezbarwne', icon: '🫙' },
  { id: 'glass-clear-1100', name: 'Szkło bezbarwne 1100L', icon: '🫙' },
  { id: 'glass-colored', name: 'Szkło kolorowe', icon: '🍾' },
  { id: 'glass-colored-1100', name: 'Szkło kolorowe 1100L', icon: '🍾' },
  { id: 'paper', name: 'Papier', icon: '📦' },
  { id: 'paper-1100', name: 'Papier 1100L', icon: '📦' },
  { id: 'plastic', name: 'Plastik i metal', icon: '♻️' },
  { id: 'plastic-1100', name: 'Plastik i metal 1100L', icon: '♻️' },
  { id: 'ash', name: 'Popiół', icon: '🔥' },
  { id: 'mixed', name: 'Zmieszane 120L', icon: '🗑️' },
  { id: 'mixed-240', name: 'Zmieszane 240L', icon: '🗑️' },
  { id: 'mixed-1100', name: 'Zmieszane 1100L', icon: '🗑️' },
];

export type WasteCategoryRow = {
  id: string;
  name: string;
  icon: string;
  count: number;
};

let definitionMapCache: Map<string, { name: string; icon: string }> | null = null;
let definitionMapCacheAt = 0;
const DEFINITION_CACHE_MS = 60_000;

export const invalidateWasteDefinitionCache = () => {
  definitionMapCache = null;
  definitionMapCacheAt = 0;
};

export async function getWasteDefinitionMap(
  prisma: PrismaClient
): Promise<Map<string, { name: string; icon: string }>> {
  const now = Date.now();
  if (definitionMapCache && now - definitionMapCacheAt < DEFINITION_CACHE_MS) {
    return definitionMapCache;
  }
  const rows = await prisma.wasteContainerDefinition.findMany();
  const map = new Map<string, { name: string; icon: string }>();
  rows.forEach(row => {
    map.set(row.id, { name: row.name, icon: row.icon });
  });
  for (const opt of WASTE_OPTIONS) {
    if (!map.has(opt.id)) {
      map.set(opt.id, { name: opt.name, icon: opt.icon });
    }
  }
  definitionMapCache = map;
  definitionMapCacheAt = now;
  return map;
}

export const buildWasteCategoriesFromMap = (
  types: string[],
  map: Map<string, { name: string; icon: string }>
): WasteCategoryRow[] =>
  types.map(type => {
    const def = map.get(type);
    const legacy = WASTE_OPTIONS.find(o => o.id === type);
    return {
      id: type,
      name: def?.name ?? legacy?.name ?? type,
      icon: def?.icon ?? legacy?.icon ?? '🗑️',
      count: 0,
    };
  });

export async function buildWasteCategories(
  prisma: PrismaClient,
  types: string[]
): Promise<WasteCategoryRow[]> {
  const map = await getWasteDefinitionMap(prisma);
  return buildWasteCategoriesFromMap(types, map);
}

export const isLegacyWasteType = (value?: string): value is WasteType =>
  Boolean(value && WASTE_OPTIONS.some(option => option.id === value));

export async function isKnownWasteContainerId(prisma: PrismaClient, id: string): Promise<boolean> {
  if (isLegacyWasteType(id)) return true;
  const row = await prisma.wasteContainerDefinition.findFirst({
    where: { id, active: true },
  });
  return Boolean(row);
}
