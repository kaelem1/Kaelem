import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
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
        <p className="text-muted-foreground">
          暂无文章，快去写一篇吧！
        </p>
      </section>
    </div>
  );
}
