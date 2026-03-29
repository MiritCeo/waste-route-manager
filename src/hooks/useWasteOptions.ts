import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { wasteContainersService } from '@/api/services/wasteContainers.service';
import { WASTE_OPTIONS } from '@/constants/waste';

export type WasteOptionRow = { id: string; name: string; icon: string; sortOrder?: number };

/** „Bazowe” typy bez wariantów 240L/1100L — używane przy wyborze frakcji na trasie */
export const filterBaseWasteOptions = (options: WasteOptionRow[]): WasteOptionRow[] =>
  options.filter(o => !o.id.endsWith('-240') && !o.id.endsWith('-1100'));

export function useWasteOptions() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['waste-containers'],
    queryFn: () => wasteContainersService.getActiveForApp(),
    staleTime: 5 * 60 * 1000,
  });

  const options: WasteOptionRow[] = useMemo(() => {
    if (data && data.length > 0) return data;
    return WASTE_OPTIONS.map((o, i) => ({ ...o, sortOrder: i }));
  }, [data]);

  const baseOptions = useMemo(() => filterBaseWasteOptions(options), [options]);

  const getLabel = (id: string) => options.find(o => o.id === id)?.name ?? id;

  return { options, baseOptions, isLoading, error, refetch, getLabel };
}
