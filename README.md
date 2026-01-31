# Kaelem's Blog

个人博客站点，使用 Next.js 14 + TailwindCSS + Supabase 构建。

## 核心同步协议 (Mandatory)
1. **原子更新规则**：任何功能、架构、写法更新，必须在代码修改完成后，立即同步更新对应目录的子文档。
2. **递归触发**：文件变更 -> 更新文件Header -> 更新所属文件夹MD -> （若影响全局）更新主MD。
3. **分形自治**：确保系统在任何一个子目录下，Claude都能通过该目录的MD重建局部世界观。

## 顶层架构
```
/src
├── /app          # Next.js App Router 页面
├── /components   # UI组件
├── /lib          # 工具函数和核心逻辑
└── /content      # Markdown内容（博客+阅读清单+作品）
```

## 技术栈
- **框架**: Next.js 14 (App Router)
- **样式**: TailwindCSS + shadcn/ui
- **内容**: MDX (Markdown + JSX)
- **数据库**: Supabase (访问统计)
- **部署**: Vercel

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入你的 Supabase 配置

# 本地开发
npm run dev

# 构建
npm run build
```

## 脚本

- `pnpm add-reading`：交互式添加阅读条目
- `pnpm add-reading -- --title "..." --link "..." --yes`：非交互模式（自动化用）

## 写文章

在 `src/content/blog/` 创建 `.mdx` 文件：

```mdx
---
title: "文章标题"
description: "文章描述"
date: "2024-12-27"
tags: ["标签1", "标签2"]
category: "分类"
---

文章内容...
```

## 添加作品

在 `src/content/works/` 创建 `.mdx` 文件：

```mdx
---
title: "作品名称"
description: "作品描述"
date: "2024-12-27"
tags: ["标签"]
link: "https://example.com"
github: "https://github.com/..."
---

作品详情...
```

## Supabase 配置

在 Supabase 创建 `page_views` 表：

```sql
CREATE TABLE page_views (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 部署到 Vercel

1. 连接 GitHub 仓库到 Vercel
2. 配置环境变量
3. 部署

> "Keep the map aligned with the terrain, or the terrain will be lost."
