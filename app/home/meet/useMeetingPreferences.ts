"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createDefaultMeetingPreferences } from "./meetingOptions";
import type { MeetingPreferences } from "./meetingOptions";
import { loadMeetingPreferences, storeMeetingPreferences } from "./meetingPreferencesApi";
import type { StoredMeetingPreferences } from "./meetingPreferencesApi";

export function useMeetingPreferences(authUserId: string, profileId: string) {
  const [saved, setSaved] = useState<StoredMeetingPreferences>(() => ({ preferences: createDefaultMeetingPreferences(), hasRecord: false }));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const mounted = useRef(false);
  const savingRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; savingRequest.current?.abort(); savingRequest.current = null; };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setIsLoading(true); setLoadError(null);
      void loadMeetingPreferences({ authUserId, profileId }, controller.signal).then((result) => {
        if (active) { setSaved(result); setIsLoading(false); }
      }).catch((cause: unknown) => {
        if (!active || controller.signal.aborted) return;
        setLoadError(cause instanceof Error ? cause.message : "Your meeting preferences couldn’t be loaded.");
        setIsLoading(false);
      });
    });
    return () => { active = false; controller.abort(); };
  }, [authUserId, profileId, reload]);

  const save = useCallback(async (preferences: MeetingPreferences): Promise<MeetingPreferences | null> => {
    if (!mounted.current || savingRequest.current) return null;
    const controller = new AbortController();
    savingRequest.current = controller;
    setIsSaving(true);
    try {
      const result = await storeMeetingPreferences({ authUserId, profileId }, preferences, controller.signal);
      if (!mounted.current || controller.signal.aborted || savingRequest.current !== controller) return null;
      setSaved(result);
      return result.preferences;
    } catch (cause) {
      if (!mounted.current || controller.signal.aborted) return null;
      throw cause;
    } finally {
      if (savingRequest.current === controller) {
        savingRequest.current = null;
        if (mounted.current) setIsSaving(false);
      }
    }
  }, [authUserId, profileId]);

  return { ...saved, isLoading, isSaving, loadError, save, retry: () => setReload((value) => value + 1) };
}
