import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/seeker/AppShell";
import { LoadingScreen } from "@/components/seeker/Logo";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth", search: { redirect: location.href } as never });
    return { user: data.user };
  },
  pendingComponent: () => <LoadingScreen />,
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
