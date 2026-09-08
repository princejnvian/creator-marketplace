import type { MetadataRoute } from "next";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: "https://youtent.in", lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: "https://youtent.in/creators", lastModified: now, changeFrequency: "daily", priority: 0.9 },
  ];

  const { data: creators } = await supabaseAdmin
    .from("profiles")
    .select("username, updated_at, created_at")
    .eq("account_type", "freelancer")
    .not("username", "is", null)
    .order("created_at", { ascending: false });

  const creatorPages: MetadataRoute.Sitemap = (creators || [])
    .filter((creator) => String(creator.username || "").trim().length > 0)
    .map((creator) => ({
      url: `https://youtent.in/creators/${encodeURIComponent(String(creator.username).toLowerCase())}`,
      lastModified: creator.updated_at || creator.created_at || now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  return [...staticPages, ...creatorPages];
}
