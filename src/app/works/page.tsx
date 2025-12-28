import type { Metadata } from "next";
import { getAllWorks } from "@/lib/mdx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "作品",
  description: "查看我的项目和作品集",
};

export default function WorksPage() {
  const works = getAllWorks();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-4xl font-bold tracking-tight mb-8">作品集</h1>

      {works.length === 0 ? (
        <p className="text-muted-foreground">暂无作品</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {works.map((work) => (
            <Card key={work.meta.slug} className="group">
              <CardHeader>
                <CardTitle className="group-hover:text-primary transition-colors">
                  {work.meta.title}
                </CardTitle>
                <CardDescription>{work.meta.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {work.meta.tags && work.meta.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {work.meta.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-4 text-sm">
                  {work.meta.link && (
                    <a
                      href={work.meta.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      查看项目
                    </a>
                  )}
                  {work.meta.github && (
                    <a
                      href={work.meta.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      GitHub
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
