import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/creators", "/creators/"],
        disallow: [
          "/dashboard",
          "/profile",
          "/wallet",
          "/projects",
          "/projects/",
          "/requests",
          "/my-requests",
          "/login",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/auth/",
          "/api/",
        ],
      },
    ],
    sitemap: "https://youtent.in/sitemap.xml",
    host: "https://youtent.in",
  };
}
