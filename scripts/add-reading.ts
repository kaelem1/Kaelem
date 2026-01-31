/**
 * [INPUT]: Interactive prompts for reading item details
 * [OUTPUT]: Creates MDX file in src/content/reading/<timestamp>-<short-title>.mdx
 * [POS]: CLI utility script for quick reading list intake
 *
 * [PROTOCOL]:
 * 1. Run with: npx tsx scripts/add-reading.ts
 * 2. Follow the prompts to add a new reading item
 */

import * as fs from "fs";
import * as path from "path";
import slugify from "slugify";
import { input, select } from "@inquirer/prompts";

const READING_DIR = path.join(process.cwd(), "src/content/reading");

type ReadingType = "article" | "video" | "repo" | "thread" | "book" | "podcast" | "tool" | "other";
type ReadingStatus = "inbox" | "reading" | "finished";

interface ReadingInput {
  title: string;
  description: string;
  link: string;
  type: ReadingType;
  status: ReadingStatus;
  source?: string;
  author?: string;
  tags?: string[];
}

const TYPE_CHOICES: { value: ReadingType; name: string }[] = [
  { value: "article", name: "📄 文章 (Article)" },
  { value: "video", name: "🎬 视频 (Video)" },
  { value: "repo", name: "📦 仓库 (Repo)" },
  { value: "thread", name: "🧵 帖子 (Thread)" },
  { value: "book", name: "📚 书籍 (Book)" },
  { value: "podcast", name: "🎙️ 播客 (Podcast)" },
  { value: "tool", name: "🔧 工具 (Tool)" },
  { value: "other", name: "📎 其他 (Other)" },
];

const STATUS_CHOICES: { value: ReadingStatus; name: string }[] = [
  { value: "inbox", name: "📥 待读 (Inbox)" },
  { value: "reading", name: "📖 阅读中 (Reading)" },
  { value: "finished", name: "✅ 已读 (Finished)" },
];

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function generateFilename(title: string): string {
  const timestamp = Date.now();
  const slug = slugify(title, {
    lower: true,
    strict: true,
    locale: "en",
  });
  const shortSlug = slug.slice(0, 50);
  return `${timestamp}-${shortSlug}.mdx`;
}

function generateFrontmatter(data: ReadingInput): string {
  const date = new Date().toISOString().split("T")[0];
  const lines = [
    "---",
    `title: "${data.title.replace(/"/g, '\\"')}"`,
    `description: "${data.description.replace(/"/g, '\\"')}"`,
    `date: "${date}"`,
    `type: "${data.type}"`,
    `status: "${data.status}"`,
    `link: "${data.link}"`,
  ];

  if (data.source) {
    lines.push(`source: "${data.source}"`);
  }
  if (data.author) {
    lines.push(`author: "${data.author}"`);
  }
  if (data.tags && data.tags.length > 0) {
    lines.push(`tags: [${data.tags.map((t) => `"${t}"`).join(", ")}]`);
  }

  lines.push("---", "", "");
  return lines.join("\n");
}

async function main() {
  console.log("\n📚 Adding new reading item...\n");

  const title = await input({
    message: "标题 (Title):",
    validate: (value) => (value.trim() ? true : "Title is required"),
  });

  const link = await input({
    message: "链接 (Link):",
    validate: (value) => {
      if (!value.trim()) return "Link is required";
      try {
        new URL(value);
        return true;
      } catch {
        return "Please enter a valid URL";
      }
    },
  });

  const description = await input({
    message: "描述 (Description):",
    default: "",
  });

  const type = await select({
    message: "类型 (Type):",
    choices: TYPE_CHOICES,
  });

  const status = await select({
    message: "状态 (Status):",
    choices: STATUS_CHOICES,
    default: "inbox",
  });

  const source = await input({
    message: "来源 (Source, e.g., Twitter, Medium, GitHub):",
    default: "",
  });

  const author = await input({
    message: "作者 (Author):",
    default: "",
  });

  const tagsInput = await input({
    message: "标签 (Tags, comma-separated):",
    default: "",
  });

  const tags = tagsInput
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const readingData: ReadingInput = {
    title: title.trim(),
    description: description.trim(),
    link: link.trim(),
    type,
    status,
    source: source.trim() || undefined,
    author: author.trim() || undefined,
    tags: tags.length > 0 ? tags : undefined,
  };

  ensureDir(READING_DIR);

  const filename = generateFilename(readingData.title);
  const filePath = path.join(READING_DIR, filename);
  const content = generateFrontmatter(readingData);

  fs.writeFileSync(filePath, content, "utf-8");

  console.log(`\n✅ Created: ${filePath}\n`);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
