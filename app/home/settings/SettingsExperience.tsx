"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { getSupabaseBrowserClient } from "../../lib/supabase/browser";
import styles from "./Settings.module.css";

const icons = {
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></>,
  shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
  appearance: <><circle cx="12" cy="12" r="9" /><path d="M12 3v18M12 3a9 9 0 0 1 0 18" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .6-1.5 1-1.5 2M12 17h.01" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></>,
  chevron: <path d="m9 5 7 7-7 7" />,
  logout: <><path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4M9 12h12m-4-4 4 4-4 4" /></>,
} satisfies Record<string, ReactNode>;

function SettingsIcon({ name, size = 20 }: { name: keyof typeof icons; size?: number }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
    strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{icons[name]}</svg>;
}

const groups = [
  {
    id: "account", title: "Account", items: [
      { icon: "user", title: "Account details", description: "Your personal and professional information" },
      { icon: "lock", title: "Password & security", description: "Manage your account security" },
      { icon: "shield", title: "Privacy & visibility", description: "Choose how your profile is seen" },
    ],
  },
  {
    id: "preferences", title: "Preferences", items: [
      { icon: "bell", title: "Notifications", description: "Hi requests, matches and messages" },
      { icon: "appearance", title: "Appearance", description: "Personalise your Hi5 experience" },
      { icon: "globe", title: "Language", description: "Choose your preferred language" },
    ],
  },
  {
    id: "help", title: "Help", items: [
      { icon: "help", title: "Help & support", description: "Find answers and get a little guidance" },
      { icon: "info", title: "About Hi5", description: "Meet five people worth saying Hi to" },
    ],
  },
] as const;

export function SettingsExperience() {
  const [demoNotice, setDemoNotice] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");
  const logoutLock = useRef(false);

  async function logOut() {
    if (logoutLock.current) return;
    logoutLock.current = true;
    setLoggingOut(true);
    setError("");
    setDemoNotice("");
    try {
      const { error: signOutError } = await getSupabaseBrowserClient().auth.signOut({ scope: "local" });
      if (signOutError) throw signOutError;
      // A fresh document returns to the landing page with the session cleared.
      window.location.replace("/");
    } catch {
      logoutLock.current = false;
      setLoggingOut(false);
      setError("We couldn’t log you out. Please try again.");
    }
  }

  return (
    <>
      <div className={styles.groups}>
        {groups.map((group) => (
          <section key={group.id} aria-labelledby={`settings-${group.id}`}>
            <h2 id={`settings-${group.id}`} className={styles.groupTitle}>{group.title}</h2>
            <div className={styles.card}>
              {group.items.map((item) => (
                <button key={item.title} type="button" className={styles.row} disabled={loggingOut}
                  onClick={() => setDemoNotice(`${item.title} settings are coming soon.`)}>
                  <span className={styles.icon}><SettingsIcon name={item.icon} /></span>
                  <span className={styles.rowBody}>
                    <span className={styles.rowTitle}>{item.title}</span>
                    <span className={styles.rowDescription}>{item.description}</span>
                  </span>
                  <span className={styles.demoBadge}>Demo</span>
                  <span className={styles.chevron}><SettingsIcon name="chevron" size={16} /></span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className={styles.demoNotice} role="status" aria-live="polite">{demoNotice}</p>
      <button type="button" className={styles.logoutButton} disabled={loggingOut} aria-busy={loggingOut}
        aria-describedby={error ? "settings-logout-error" : undefined} onClick={() => void logOut()}>
        <SettingsIcon name="logout" size={19} />
        <span>{loggingOut ? "Logging out…" : "Log out"}</span>
      </button>
      {error && <p id="settings-logout-error" className={styles.error} role="alert">{error}</p>}
    </>
  );
}
