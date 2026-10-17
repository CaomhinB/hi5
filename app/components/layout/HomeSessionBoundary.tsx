"use client";

import { useEffect, useState, type ReactNode } from "react";
import { getSupabaseBrowserClient } from "../../lib/supabase/browser";

/** Server checks protect requests; this also closes an already-open signed-out tab. */
export function HomeSessionBoundary({ userId, children }: { userId: string; children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(true);

  useEffect(() => {
    const { data } = getSupabaseBrowserClient().auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setAuthenticated(false);
        window.location.replace("/");
      } else if (session.user.id !== userId) {
        // Do not keep another account's client/router state when accounts change.
        setAuthenticated(false);
        window.location.reload();
      }
    });
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => {
      data.subscription.unsubscribe();
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [userId]);

  return authenticated ? children : null;
}
