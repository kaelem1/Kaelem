/**
 * [INPUT]: slug (文章标识符)
 * [OUTPUT]: Post对象 (metadata + content) 或 Post[] 列表
 * [POS]: 内容解析核心，负责解析 Markdown 文件
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

const BLOG_DIR = path.join(process.cwd(), "src/content/blog");
const WORKS_DIR = path.join(process.cwd(), "src/content/works");
const READING_DIR = path.join(process.cwd(), "src/content/reading");

export interface PostMeta {
  title: string;
  description: string;
  date: string;
  tags?: string[];
  category?: string;
  slug: string;
  readingTime: string;
}

export interface Post {
  meta: PostMeta;
  content: string;
}

export interface WorkMeta {
  title: string;
  description: string;
  date: string;
  tags?: string[];
  link?: string;
  github?: string;
  image?: string;
  slug: string;
}

export interface Work {
  meta: WorkMeta;
  content: string;
}

export interface ReadingMeta {
  title: string;
  description: string;
  date: string;
  tags?: string[];
  category?: string;
  link: string;
  slug: string;
}

export interface ReadingItem {
  meta: ReadingMeta;
  content: string;
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function getAllPosts(): Post[] {
  ensureDir(BLOG_DIR);

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));

  const posts = files.map((filename) => {
    const filePath = path.join(BLOG_DIR, filename);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContent);
    const slug = filename.replace(/\.(mdx?|md)$/, "");
    const stats = readingTime(content);

    return {
      meta: {
        title: data.title || "Untitled",
        description: data.description || "",
        date: data.date || new Date().toISOString(),
        tags: data.tags || [],
        category: data.category || "",
        slug,
        readingTime: stats.text,
      },
      content,
    };
  });

  return posts.sort(
    (a, b) => new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime()
  );
}

export function getPostBySlug(slug: string): Post | null {
  ensureDir(BLOG_DIR);

  const mdxPath = path.join(BLOG_DIR, `${slug}.mdx`);
  const mdPath = path.join(BLOG_DIR, `${slug}.md`);

  let filePath: string | null = null;
  if (fs.existsSync(mdxPath)) {
    filePath = mdxPath;
  } else if (fs.existsSync(mdPath)) {
    filePath = mdPath;
  }

  if (!filePath) return null;

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);
  const stats = readingTime(content);

  return {
    meta: {
      title: data.title || "Untitled",
      description: data.description || "",
      date: data.date || new Date().toISOString(),
      tags: data.tags || [],
      category: data.category || "",
      slug,
      readingTime: stats.text,
    },
    content,
  };
}

export function getAllWorks(): Work[] {
  ensureDir(WORKS_DIR);

  const files = fs.readdirSync(WORKS_DIR).filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));

  const works = files.map((filename) => {
    const filePath = path.join(WORKS_DIR, filename);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContent);
    const slug = filename.replace(/\.(mdx?|md)$/, "");

    return {
      meta: {
        title: data.title || "Untitled",
        description: data.description || "",
        date: data.date || new Date().toISOString(),
        tags: data.tags || [],
        link: data.link || "",
        github: data.github || "",
        image: data.image || "",
        slug,
      },
      content,
    };
  });

  return works.sort(
    (a, b) => new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime()
  );
}

export function getAllReadings(): ReadingItem[] {
  ensureDir(READING_DIR);

  const files = fs.readdirSync(READING_DIR).filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));

  const items = files.map((filename) => {
    const filePath = path.join(READING_DIR, filename);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContent);
    const slug = filename.replace(/\.(mdx?|md)$/, "");

    return {
      meta: {
        title: data.title || "Untitled",
        description: data.description || "",
        date: data.date || new Date().toISOString(),
        tags: data.tags || [],
        category: data.category || "",
        link: data.link || "",
        slug,
      },
      content,
    };
  });

  return items.sort(
    (a, b) => new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime()
  );
}

export function getAllTags(): string[] {
  const posts = getAllPosts();
  const tagsSet = new Set<string>();
  posts.forEach((post) => {
    post.meta.tags?.forEach((tag) => tagsSet.add(tag));
  });
  return Array.from(tagsSet);
}

export function getAllCategories(): string[] {
  const posts = getAllPosts();
  const categoriesSet = new Set<string>();
  posts.forEach((post) => {
    if (post.meta.category) {
      categoriesSet.add(post.meta.category);
    }
  });
  return Array.from(categoriesSet);
}
