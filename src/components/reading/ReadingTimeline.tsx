"use client";

import { useMemo, useState } from "react";
import type { ReadingItem, ReadingFilters, ReadingType, ReadingStatus } from "@/lib/reading-types";
import { filterReadings } from "@/lib/reading-types";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

const STATUS_LABELS: Record<ReadingStatus, string> = {
  inbox: "待读",
  reading: "阅读中",
  finished: "已读",
};

const TYPE_LABELS: Record<ReadingType, string> = {
  article: "文章",
  video: "视频",
  repo: "仓库",
  thread: "帖子",
  book: "书籍",
  podcast: "播客",
  tool: "工具",
  other: "其他",
};

const TYPE_ICONS: Record<ReadingType, string> = {
  article: "📄",
  video: "🎬",
  repo: "📦",
  thread: "🧵",
  book: "📚",
  podcast: "🎙️",
  tool: "🔧",
  other: "📎",
};

function buildYearOptions(items: ReadingItem[]) {
  const years = new Set<number>();
  items.forEach((item) => {
    years.add(new Date(item.meta.date).getFullYear());
  });
  return Array.from(years).sort((a, b) => b - a);
}

function buildTagOptions(items: ReadingItem[]) {
  const tags = new Set<string>();
  items.forEach((item) => {
    item.meta.tags?.forEach((tag) => tags.add(tag));
  });
  return Array.from(tags).sort((a, b) => a.localeCompare(b));
}

function buildSourceOptions(items: ReadingItem[]) {
  const sources = new Set<string>();
  items.forEach((item) => {
    if (item.meta.source) sources.add(item.meta.source);
  });
  return Array.from(sources).sort((a, b) => a.localeCompare(b));
}

function buildTypeOptions(items: ReadingItem[]) {
  const types = new Set<ReadingType>();
  items.forEach((item) => {
    if (item.meta.type) types.add(item.meta.type);
  });
  return Array.from(types);
}

export function ReadingTimeline({ items }: { items: ReadingItem[] }) {
  const [query, setQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState<string[]>([]);
  const [activeYear, setActiveYear] = useState<number | undefined>();
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [activeTypes, setActiveTypes] = useState<string[]>([]);
  const [activeSources, setActiveSources] = useState<string[]>([]);

  const yearOptions = useMemo(() => buildYearOptions(items), [items]);
  const tagOptions = useMemo(() => buildTagOptions(items), [items]);
  const sourceOptions = useMemo(() => buildSourceOptions(items), [items]);
  const typeOptions = useMemo(() => buildTypeOptions(items), [items]);

  const filtered = useMemo(() => {
    const filters: ReadingFilters = {
      query,
      tags: activeTags.length ? activeTags : undefined,
      status: activeStatus.length ? activeStatus : undefined,
      type: activeTypes.length ? activeTypes : undefined,
      source: activeSources.length ? activeSources : undefined,
      year: activeYear,
    };
    return filterReadings(items, filters);
  }, [items, query, activeTags, activeStatus, activeTypes, activeSources, activeYear]);

  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, ReadingItem[]>>((acc, item) => {
      const key = format(new Date(item.meta.date), "yyyy");
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [filtered]);

  const groupedEntries = useMemo(() => {
    return Object.entries(grouped).sort((a, b) => Number(b[0]) - Number(a[0]));
  }, [grouped]);

  const emptyFilters =
    !query &&
    activeStatus.length === 0 &&
    !activeYear &&
    activeTags.length === 0 &&
    activeTypes.length === 0 &&
    activeSources.length === 0;

  const toggleArrayFilter = <T extends string>(
    value: T,
    current: T[],
    setter: React.Dispatch<React.SetStateAction<T[]>>
  ) => {
    setter(
      current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
    );
  };

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border bg-white/70 p-6 shadow-sm backdrop-blur dark:bg-neutral-900/70">
        <div className="space-y-6">
          {/* Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              搜索
            </label>
            <Input
              placeholder="搜索标题、作者、标签、来源..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-11 rounded-xl bg-background"
            />
          </div>

          {/* Filters grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Type filter */}
            {typeOptions.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  类型
                </label>
                <div className="flex flex-wrap gap-2">
                  {typeOptions.map((type) => (
                    <Button
                      key={type}
                      type="button"
                      variant={activeTypes.includes(type) ? "default" : "outline"}
                      size="sm"
                      className="rounded-full"
                      onClick={() => toggleArrayFilter(type, activeTypes, setActiveTypes)}
                    >
                      <span className="mr-1">{TYPE_ICONS[type]}</span>
                      {TYPE_LABELS[type]}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Source filter */}
            {sourceOptions.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  来源
                </label>
                <div className="flex flex-wrap gap-2">
                  {sourceOptions.map((source) => (
                    <Button
                      key={source}
                      type="button"
                      variant={activeSources.includes(source) ? "default" : "outline"}
                      size="sm"
                      className="rounded-full"
                      onClick={() => toggleArrayFilter(source, activeSources, setActiveSources)}
                    >
                      {source}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Status filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                状态
              </label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(STATUS_LABELS) as ReadingStatus[]).map((status) => (
                  <Button
                    key={status}
                    type="button"
                    variant={activeStatus.includes(status) ? "default" : "outline"}
                    size="sm"
                    className="rounded-full"
                    onClick={() => toggleArrayFilter(status, activeStatus, setActiveStatus)}
                  >
                    {STATUS_LABELS[status]}
                  </Button>
                ))}
              </div>
            </div>

            {/* Year filter */}
            {yearOptions.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  年份
                </label>
                <div className="flex flex-wrap gap-2">
                  {yearOptions.map((year) => (
                    <Button
                      key={year}
                      type="button"
                      variant={activeYear === year ? "default" : "outline"}
                      size="sm"
                      className="rounded-full"
                      onClick={() =>
                        setActiveYear(activeYear === year ? undefined : year)
                      }
                    >
                      {year}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tags filter */}
          {tagOptions.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                标签
              </label>
              <div className="flex flex-wrap gap-2">
                {tagOptions.map((tag) => (
                  <Button
                    key={tag}
                    type="button"
                    variant={activeTags.includes(tag) ? "default" : "outline"}
                    size="sm"
                    className="rounded-full"
                    onClick={() => toggleArrayFilter(tag, activeTags, setActiveTags)}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Clear filters */}
          {!emptyFilters && (
            <div className="flex items-center gap-3 pt-2 text-sm text-muted-foreground">
              <span>
                已筛选 {filtered.length} / {items.length} 条
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full"
                onClick={() => {
                  setQuery("");
                  setActiveStatus([]);
                  setActiveYear(undefined);
                  setActiveTags([]);
                  setActiveTypes([]);
                  setActiveSources([]);
                }}
              >
                清空筛选
              </Button>
            </div>
          )}
        </div>
      </section>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground">暂无匹配的阅读条目</p>
      ) : (
        <div className="space-y-12">
          {groupedEntries.map(([year, yearItems]) => (
            <section key={year} className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-muted-foreground">
                  {year}
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-6">
                {yearItems.map((item) => (
                  <article
                    key={item.meta.slug}
                    className="group rounded-2xl border bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-neutral-900/80"
                  >
                    <div className="flex flex-col gap-3">
                      {/* Meta line */}
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span className="text-base">{TYPE_ICONS[item.meta.type]}</span>
                        <span className="font-medium">{TYPE_LABELS[item.meta.type]}</span>
                        <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                        <time dateTime={item.meta.date}>
                          {format(new Date(item.meta.date), "M月d日", {
                            locale: zhCN,
                          })}
                        </time>
                        <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                        <Badge
                          variant={
                            item.meta.status === "finished"
                              ? "secondary"
                              : item.meta.status === "reading"
                              ? "outline"
                              : "secondary"
                          }
                        >
                          {STATUS_LABELS[item.meta.status]}
                        </Badge>
                      </div>

                      {/* Title */}
                      <a
                        href={item.meta.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xl font-semibold tracking-tight transition-colors hover:text-primary"
                      >
                        {item.meta.title}
                      </a>

                      {/* Description */}
                      {item.meta.description && (
                        <p className="text-muted-foreground leading-relaxed">
                          {item.meta.description}
                        </p>
                      )}

                      {/* Author/source info */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        {item.meta.author && <span>作者：{item.meta.author}</span>}
                        {item.meta.source && <span>来源：{item.meta.source}</span>}
                        {item.meta.publishedAt && (
                          <span>
                            发布：
                            {format(new Date(item.meta.publishedAt), "yyyy年M月d日", {
                              locale: zhCN,
                            })}
                          </span>
                        )}
                      </div>

                      {/* Tags */}
                      {item.meta.tags && item.meta.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {item.meta.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
