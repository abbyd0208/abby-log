import { format, parseISO } from "date-fns";

export function formatDate(date: string): string {
  try {
    return format(parseISO(date), "yyyy.MM.dd");
  } catch {
    return date;
  }
}
