/**
 * [INPUT]: POST { slug: string } - 文章标识符
 * [OUTPUT]: { views: number } - 访问次数
 * [POS]: API层，处理文章访问统计
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { slug } = await request.json();

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    // 先尝试获取现有记录
    const { data: existing } = await supabase
      .from("page_views")
      .select("views")
      .eq("slug", slug)
      .single();

    if (existing) {
      // 更新现有记录
      const { data, error } = await supabase
        .from("page_views")
        .update({ views: existing.views + 1 })
        .eq("slug", slug)
        .select("views")
        .single();

      if (error) throw error;
      return NextResponse.json({ views: data.views });
    } else {
      // 创建新记录
      const { data, error } = await supabase
        .from("page_views")
        .insert({ slug, views: 1 })
        .select("views")
        .single();

      if (error) throw error;
      return NextResponse.json({ views: data.views });
    }
  } catch {
    return NextResponse.json({ error: "Failed to update views" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const { data } = await supabase
      .from("page_views")
      .select("views")
      .eq("slug", slug)
      .single();

    return NextResponse.json({ views: data?.views || 0 });
  } catch {
    return NextResponse.json({ views: 0 });
  }
}
