/**
 * [INPUT]: None
 * [OUTPUT]: Type definitions and filter utilities for reading items
 * [POS]: Shared types usable by both server and client components
 */

export type ReadingType = "article" | "video" | "repo" | "thread" | "book" | "podcast" | "tool" | "other";
export type ReadingStatus = "inbox" | "reading" | "finished";

export interface ReadingMeta {
  title: string;
  description: string;
  date: string;
  tags?: string[];
  type: ReadingType;
  link: string;
  slug: string;
  status: ReadingStatus;
  author?: string;
  source?: string;
  publishedAt?: string;
}

export interface ReadingItem {
  meta: ReadingMeta;
  content: string;
}

export interface ReadingFilters {
  query?: string;
  tags?: string[];
  status?: string[];
  type?: string[];
  source?: string[];
  year?: number;
}

function matchesQuery(item: ReadingItem, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  const haystack = [
    item.meta.title,
    item.meta.description,
    item.meta.author || "",
    item.meta.source || "",
    item.meta.type || "",
    ...(item.meta.tags || []),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(needle);
}

export function filterReadings(
  items: ReadingItem[],
  filters: ReadingFilters
): ReadingItem[] {
  const { query, tags, status, type, source, year } = filters;
  return items.filter((item) => {
    if (query && !matchesQuery(item, query)) return false;
    if (tags && tags.length > 0) {
      const itemTags = item.meta.tags || [];
      if (!tags.every((tag) => itemTags.includes(tag))) return false;
    }
    if (status && status.length > 0) {
      if (!status.includes(item.meta.status)) return false;
    }
    if (type && type.length > 0) {
      if (!type.includes(item.meta.type)) return false;
    }
    if (source && source.length > 0) {
      if (!item.meta.source || !source.includes(item.meta.source)) return false;
    }
    if (year) {
      const itemYear = new Date(item.meta.date).getFullYear();
      if (itemYear !== year) return false;
    }
    return true;
  });
}
