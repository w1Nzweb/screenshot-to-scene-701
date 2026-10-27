import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { useAccess } from "@/hooks/use-seeker";
import { atLeast } from "@/lib/validation";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

// UI gate only — every admin server function re-checks the caller's role.
function AdminLayout() {
  const { data, isLoading } = useAccess();
  if (isLoading) return <p className="p-8 text-sm text-muted-foreground">Checking permissions…</p>;
  if (!data || !atLeast(data.role, "support"))
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">Access denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">You don't have permission to view the admin panel.</p>
        <Link to="/profile" className="btn btn-ghost mt-6">Back to SEEKER</Link>
      </div>
    );
  return <Outlet />;
}
