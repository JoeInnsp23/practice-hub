export interface WorkType {
  code: string;
  label: string;
  colorCode: string;
  description: string;
  billable: boolean;
}

export const WORK_TYPES: WorkType[] = [
  {
    code: "work",
    label: "Work",
    colorCode: "#60a5fa", // blue-400
    description: "Client work and project activities",
    billable: true,
  },
  {
    code: "admin",
    label: "Admin",
    colorCode: "#fbbf24", // amber-400
    description: "Administrative tasks",
    billable: false,
  },
  {
    code: "training",
    label: "Training",
    colorCode: "#a78bfa", // violet-400
    description: "Training and development",
    billable: false,
  },
  {
    code: "meeting",
    label: "Meeting",
    colorCode: "#34d399", // emerald-400
    description: "Meetings and discussions",
    billable: true,
  },
  {
    code: "business_development",
    label: "Business Dev",
    colorCode: "#f472b6", // pink-400
    description: "Business development activities",
    billable: false,
  },
  {
    code: "research",
    label: "Research",
    colorCode: "#818cf8", // indigo-400
    description: "Research and analysis",
    billable: true,
  },
  {
    code: "holiday",
    label: "Holiday",
    colorCode: "#10b981", // emerald-500
    description: "Holiday leave",
    billable: false,
  },
  {
    code: "sick",
    label: "Sick",
    colorCode: "#ef4444", // red-500
    description: "Sick leave",
    billable: false,
  },
  {
    code: "time_off_in_lieu",
    label: "TIL",
    colorCode: "#06b6d4", // cyan-500
    description: "Time off in lieu",
    billable: false,
  },
];

export const getWorkTypeByCode = (code: string): WorkType | undefined => {
  return WORK_TYPES.find(wt => wt.code === code);
};

export const getWorkTypeColor = (code: string): string => {
  const workType = getWorkTypeByCode(code);
  return workType?.colorCode || "#94a3b8"; // slate-400 as fallback
};

export const getWorkTypeLabel = (code: string): string => {
  const workType = getWorkTypeByCode(code);
  return workType?.label || "Unknown";
};