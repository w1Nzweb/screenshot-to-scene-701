import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";
import { PageHeader, StatusDot } from "@/components/seeker/AppShell";
import { DataTable } from "@/components/seeker/DataTable";
import { fmtDate, fmtDateTime, useAccess, useMyProfile } from "@/hooks/use-seeker";
import { ROLE_LABEL, type AppRole } from "@/lib/validation";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => seo("Profile", "Your SEEKER account details."),
  component: Profile,
});

type Field = { name: string; note: string; value: React.ReactNode };

const dash = (v?: string | null) => (v && v.trim() ? v : "—");

function Profile() {
  const { data: me, isLoading, error } = useMyProfile();
  const { data: access } = useAccess();

  const rows: Field[] = me
    ? [
        { name: "Username", note: "Public handle", value: <span className="font-medium">@{dash(me.username)}</span> },
        { name: "Display name", note: "Shown in search results", value: dash(me.display_name) },
        { name: "Profile ID", note: "Used by Search ID", value: <span className="font-mono text-xs">{me.id}</span> },
        { name: "Email", note: "Visible to staff only", value: dash(me.email) },
        {
          name: "Role",
          note: "Access level on the platform",
          value: (
            <span className="inline-flex items-center gap-2">
              <StatusDot status="active" />
              {ROLE_LABEL[(access?.role ?? "user") as AppRole]}
            </span>
          ),
        },
        {
          name: "Status",
          note: me.status_reason ? `Reason: ${me.status_reason}` : "Account standing",
          value: (
            <span className="inline-flex items-center gap-2 capitalize">
              <StatusDot status={me.status} />
              {dash(me.status)}
            </span>
          ),
        },
        { name: "Visibility", note: "Who can open your profile", value: <span className="capitalize">{dash(me.visibility)}</span> },
        { name: "Bio", note: "Short description", value: dash(me.bio) },
        { name: "Joined", note: "Registration date", value: fmtDate(me.created_at) },
        { name: "Last sign-in", note: "Most recent session", value: fmtDateTime(me.last_sign_in_at) },
        { name: "Updated", note: "Last profile edit", value: fmtDateTime(me.updated_at) },
      ]
    : [];

  return (
    <div aria-label="Profile">
      <PageHeader title="Profile" subtitle="Everything stored on your account, in one table." />
      <div className="px-6 py-6 md:px-8">
        <DataTable<Field>
          title="Account details"
          subtitle="Live values from your profile record."
          className="max-w-4xl"
          columns={[
            {
              key: "name",
              header: "Field",
              className: "w-[220px]",
              render: (r) => (
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{r.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{r.note}</p>
                </div>
              ),
            },
            { key: "value", header: "Value", render: (r) => <div className="min-w-0 break-words text-foreground/90">{r.value}</div> },
          ]}
          rows={rows}
          emptyText={error ? error.message : isLoading ? "Loading your profile…" : "No profile found."}
          footer="Values shown here come straight from your account record."
        />
      </div>
    </div>
  );
}
