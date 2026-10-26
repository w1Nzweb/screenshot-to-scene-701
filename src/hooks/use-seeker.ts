import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getMyAccess } from "@/lib/admin.functions";
import type { AppRole } from "@/lib/validation";

export function useAccess() {
  const fn = useServerFn(getMyAccess);
  return useQuery({ queryKey: ["access"], queryFn: () => fn() as Promise<{ role: AppRole; userId: string }> });
}

export function useMyProfile() {
  return useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { data, error } = await supabase.from("profiles").select("*").eq("id", u.user.id).single();
      if (error) throw error;
      return { ...data, email: u.user.email ?? "", last_sign_in_at: u.user.last_sign_in_at ?? null };
    },
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ["platform-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("platform_settings").select("*").eq("id", 1).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useSignOut() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return async (scope: "local" | "global" = "local") => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut({ scope });
    navigate({ to: "/auth", replace: true });
  };
}

export const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";
export const fmtDateTime = (s?: string | null) =>
  s ? new Date(s).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
