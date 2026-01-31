import type { Metadata } from "next";
import { getAllReadings } from "@/lib/mdx";
import { ReadingTimeline } from "@/components/reading/ReadingTimeline";

export const metadata: Metadata = {
  title: "阅读清单",
  description: "待读文章与链接收藏",
};

export default function ReadingPage() {
  const items = getAllReadings();

  return (
    <div className="container mx-auto max-w-5xl px-4 py-16">
      <div className="mb-10 space-y-4">
        <p className="text-sm uppercase tracking-[0.4em] text-muted-foreground">
          Reading Index
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">阅读清单</h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          记录近期阅读与待读灵感，保持清爽的收件箱与可检索的时间轴。
        </p>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground">暂无内容，发链接给我即可收录。</p>
      ) : (
        <ReadingTimeline items={items} />
      )}
    </div>
  );
}
