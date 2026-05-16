import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeRange(startISO: string, endISO: string) {
  const fmt = new Intl.DateTimeFormat("ar-EG", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${fmt.format(new Date(startISO))} - ${fmt.format(new Date(endISO))}`;
}

export function arabicWeekday(date: Date) {
  return new Intl.DateTimeFormat("ar-EG", { weekday: "long" }).format(date);
}
