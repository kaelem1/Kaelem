import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getAllPosts } from "@/lib/mdx";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

export default function HomePage() {
  const recentPosts = getAllPosts().slice(0, 3);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <section className="space-y-6">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          你好，我是 Kaelem
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          欢迎来到我的个人空间。这里记录我的思考、学习和创作。
        </p>
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/blog">阅读博客</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/works">查看作品</Link>
          </Button>
        </div>
      </section>

      <section className="mt-20">
        <h2 className="text-2xl font-semibold mb-6">最近文章</h2>
        {recentPosts.length === 0 ? (
          <p className="text-muted-foreground">暂无文章，快去写一篇吧！</p>
        ) : (
          <div className="space-y-4">
            {recentPosts.map((post) => (
              <Link
                key={post.meta.slug}
                href={`/blog/${post.meta.slug}`}
                className="block group"
              >
                <article className="border-b pb-4">
                  <h3 className="text-lg font-medium group-hover:text-primary transition-colors">
                    {post.meta.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {post.meta.description}
                  </p>
                  <time className="text-xs text-muted-foreground mt-2 block">
                    {format(new Date(post.meta.date), "yyyy年M月d日", {
                      locale: zhCN,
                    })}
                  </time>
                </article>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
