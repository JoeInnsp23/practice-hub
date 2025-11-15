/**
 * Standard glass-card dropdown menu styling
 * Matches user profile dropdown pattern (components/shared/user-button.tsx:56)
 * Use on SelectContent and DropdownMenuContent components
 *
 * @example
 * import { GLASS_DROPDOWN_MENU_STYLES } from "@/lib/utils/dropdown-styles";
 * import { cn } from "@/lib/utils";
 *
 * <SelectContent className={cn(GLASS_DROPDOWN_MENU_STYLES, "max-h-[300px]")}>
 *   {items}
 * </SelectContent>
 *
 * <DropdownMenuContent className={cn(GLASS_DROPDOWN_MENU_STYLES, "w-56")}>
 *   {items}
 * </DropdownMenuContent>
 */
export const GLASS_DROPDOWN_MENU_STYLES =
  "!bg-white dark:!bg-[rgb(20,26,35)] " +
  "!border-slate-200 dark:!border-[rgb(40,45,55)] " +
  "!shadow-[0_10px_40px_rgba(148,163,184,0.1),0_1px_3px_rgba(0,0,0,0.04)] " +
  "dark:!shadow-[0_2px_4px_rgba(0,0,0,0.15)]";
