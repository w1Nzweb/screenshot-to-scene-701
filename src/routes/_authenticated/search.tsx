import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Empty, Row } from "@/components/seeker/AppShell";
import { fmtDate } from "@/hooks/use-seeker";
import { UUID_RE } from "@/lib/validation";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/search")({
  validateSearch: (s: Record<string, unknown>) => ({ id: typeof s.id === "string" ? s.id.slice(0, 64) : "" }),
  head: () => seo("Search ID", "Find a SEEKER profile by ID."),
  component: SearchPage,
});

function SearchPage() {
  const { id } = Route.useSearch();
  const valid = UUID_RE.test(id);
  const { data, isLoading } = useQuery({
    queryKey: ["search-id", id],
    enabled: valid,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, username, display_name, bio, created_at").eq("id", id).maybeSingle();
      return data;
    },
  });
  return (
    <div>
      <PageHeader title="Search ID" subtitle={id || "Enter a profile ID in the sidebar."} />
      {!id ? null : !valid ? (
        <Empty text="This is not a valid profile ID." />
      ) : isLoading ? (
        <Empty text="Searching…" />
      ) : !data ? (
        <Empty text="No public profile with this ID." />
      ) : (
        <>
          <Row><span className="font-semibold">{data.display_name || data.username}</span> <span className="text-muted-foreground">@{data.username}</span></Row>
          {data.bio && <Row>{data.bio}</Row>}
          <Row className="text-muted-foreground">Member since {fmtDate(data.created_at)}</Row>
        </>
      )}
    </div>
  );
}
