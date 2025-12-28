import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "关于",
  description: "履历和介绍",
};

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-4xl font-bold tracking-tight mb-8">关于我</h1>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p className="text-lg text-muted-foreground mb-6">
          这里是关于我的介绍。你可以在这里分享你的故事、经历和兴趣。
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">背景</h2>
        <p className="text-muted-foreground mb-4">
          在这里写一些关于你的背景和经历...
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">技能</h2>
        <p className="text-muted-foreground mb-4">
          在这里列出你的技能和专长...
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">联系方式</h2>
        <p className="text-muted-foreground">
          如果你想联系我，可以通过以下方式...
        </p>
      </div>
    </div>
  );
}
