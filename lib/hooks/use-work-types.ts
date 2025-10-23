import { trpc } from "@/app/providers/trpc-provider";

/**
 * Hook to fetch work types from database
 * @returns Query result with work types array
 */
export function useWorkTypes() {
  return trpc.workTypes.list.useQuery(
    { includeInactive: false },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      refetchOnWindowFocus: false,
    },
  );
}

/**
 * Hook to get a specific work type by code
 * @param code - Work type code (e.g., "WORK", "ADMIN")
 * @returns Work type object or undefined
 */
export function useWorkTypeByCode(code: string) {
  const { data } = useWorkTypes();
  return data?.workTypes.find((wt) => wt.code === code.toUpperCase());
}

/**
 * Hook to get color for a work type
 * @param code - Work type code
 * @returns Hex color code
 */
export function useWorkTypeColor(code: string) {
  const workType = useWorkTypeByCode(code);
  return workType?.colorCode || "#94a3b8"; // slate-400 fallback
}

/**
 * Hook to get label for a work type
 * @param code - Work type code
 * @returns Work type label
 */
export function useWorkTypeLabel(code: string) {
  const workType = useWorkTypeByCode(code);
  return workType?.label || "Unknown";
}
