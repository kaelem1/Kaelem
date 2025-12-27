import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllPosts, getPostBySlug } from "@/lib/mdx";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { MDXRemote } from "next-mdx-remote/rsc";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.meta.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "文章未找到" };
  return {
    title: post.meta.title,
    description: post.meta.description,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <article>
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            {post.meta.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <time dateTime={post.meta.date}>
              {format(new Date(post.meta.date), "yyyy年M月d日", {
                locale: zhCN,
              })}
            </time>
            <span>·</span>
            <span>{post.meta.readingTime}</span>
          </div>
          {post.meta.tags && post.meta.tags.length > 0 && (
            <div className="flex gap-2">
              {post.meta.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </header>
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <MDXRemote source={post.content} />
        </div>
      </article>
    </div>
  );
}
