import type { Metadata } from "next";
import { getAllReadings } from "@/lib/mdx";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

export const metadata: Metadata = {
  title: "阅读清单",
  description: "待读文章与链接收藏",
};

export default function ReadingPage() {
  const items = getAllReadings();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-4xl font-bold tracking-tight mb-8">阅读清单</h1>

      {items.length === 0 ? (
        <p className="text-muted-foreground">暂无内容，发链接给我即可收录。</p>
      ) : (
        <div className="space-y-8">
          {items.map((item) => (
            <article
              key={item.meta.slug}
              className="group border-b pb-8 last:border-b-0"
            >
              <div className="flex flex-col gap-2">
                <a
                  href={item.meta.link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-2xl font-semibold group-hover:text-primary transition-colors"
                >
                  {item.meta.title}
                </a>
                <p className="text-muted-foreground">{item.meta.description}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <time dateTime={item.meta.date}>
                    {format(new Date(item.meta.date), "yyyy年M月d日", {
                      locale: zhCN,
                    })}
                  </time>
                  {item.meta.category ? (
                    <>
                      <span>·</span>
                      <span>{item.meta.category}</span>
                    </>
                  ) : null}
                </div>
                {item.meta.tags && item.meta.tags.length > 0 && (
                  <div className="flex gap-2">
                    {item.meta.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
