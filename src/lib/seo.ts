export const seo = (title: string, description: string) => ({
  meta: [
    { title: `${title} — SEEKER` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — SEEKER` },
    { property: "og:description", content: description },
    { name: "robots", content: "noindex" },
  ],
});
