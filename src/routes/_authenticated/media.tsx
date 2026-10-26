import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/seeker/AppShell";
import { EYE_URL } from "@/components/seeker/Logo";
import { media, DEMO_NOTICE } from "@/lib/demo";
import { fmtDate } from "@/hooks/use-seeker";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/media")({
  head: () => seo("Media", "Your media gallery."),
  component: () => (
    <div>
      <PageHeader title="Media" subtitle={DEMO_NOTICE} />
      <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3 lg:grid-cols-4">
        {media.map((m) => (
          <figure key={m.id} className="group bg-background">
            <div className="aspect-square overflow-hidden bg-ink">
              <img src={EYE_URL} alt={m.title} loading="lazy" className="h-full w-full object-contain opacity-60 grayscale transition-opacity group-hover:opacity-90" style={{ transform: `rotate(${m.id * 30}deg) scale(${0.6 + (m.id % 4) * 0.12})` }} />
            </div>
            <figcaption className="px-4 py-3 text-sm">
              <p className="font-medium">{m.title}</p>
              <p className="text-xs text-muted-foreground">{fmtDate(m.date)}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  ),
});
