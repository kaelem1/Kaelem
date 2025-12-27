import Link from "next/link";
import type { Metadata } from "next";
import { getAllPosts } from "@/lib/mdx";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

export const metadata: Metadata = {
  title: "博客",
  description: "阅读我的文章和技术分享",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-4xl font-bold tracking-tight mb-8">博客</h1>

      {posts.length === 0 ? (
        <p className="text-muted-foreground">暂无文章</p>
      ) : (
        <div className="space-y-8">
          {posts.map((post) => (
            <article
              key={post.meta.slug}
              className="group border-b pb-8 last:border-b-0"
            >
              <Link href={`/blog/${post.meta.slug}`}>
                <h2 className="text-2xl font-semibold mb-2 group-hover:text-primary transition-colors">
                  {post.meta.title}
                </h2>
              </Link>
              <p className="text-muted-foreground mb-3">{post.meta.description}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <time dateTime={post.meta.date}>
                  {format(new Date(post.meta.date), "yyyy年M月d日", {
                    locale: zhCN,
                  })}
                </time>
                <span>·</span>
                <span>{post.meta.readingTime}</span>
              </div>
              {post.meta.tags && post.meta.tags.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {post.meta.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
