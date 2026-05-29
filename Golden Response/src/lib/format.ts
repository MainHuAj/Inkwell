import { format, formatDistanceToNowStrict } from "date-fns";

export function formatDate(date: string | Date): string {
  return format(new Date(date), "MMM d, yyyy");
}

export function relativeTime(date: string | Date): string {
  return formatDistanceToNowStrict(new Date(date), { addSuffix: true });
}
