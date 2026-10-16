import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useAuth } from "./useAuth";

const sb = supabase as unknown as SupabaseClient;

/**
 * Whether the signed-in user belongs to a partner org. Used to surface the
 * (private) partner dashboard only to partners — there is no public partners page.
 */
export function usePartnerMembership(): boolean {
  const { user } = useAuth();
  const [isPartner, setIsPartner] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!user) {
      setIsPartner(false);
      return;
    }
    (async () => {
      const { data } = await sb
        .from("partner_members")
        .select("org_id")
        .eq("user_id", user.id)
        .limit(1);
      if (alive) setIsPartner(Array.isArray(data) && data.length > 0);
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  return isPartner;
}
