"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useCurrentProfile } from "../../lib/supabase/currentProfile";
import { getFiltersSnapshot, parseStoredFilters, subscribeToFilters } from "../filters/filterStorage";
import { getDiscoveryFilters, hasDiscoveryFilters } from "./discoveryFilters";
import type { DiscoveryFilters } from "./discoveryFilters";
import { fetchDiscoveryProfilesBatch } from "./discoveryProfilesApi";
import type { DiscoveryBatchLoader } from "./discoveryProfilesApi";

const serverFiltersSnapshot = () => null;
const subscribeToReady = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

/** Reuse the saved Filters contract and wait for hydration before fetching a query. */
export function useDiscoveryFilters() {
  const account = useCurrentProfile();
  const raw = useSyncExternalStore(subscribeToFilters, getFiltersSnapshot, serverFiltersSnapshot);
  const ready = useSyncExternalStore(subscribeToReady, clientReady, serverReady);
  const saved = useMemo(() => parseStoredFilters(raw), [raw]);
  const criteriaKey = JSON.stringify(getDiscoveryFilters(saved));
  const criteria = useMemo(() => JSON.parse(criteriaKey) as DiscoveryFilters, [criteriaKey]);
  // Reset queued cards and any in-flight swipe when login/logout changes the viewer.
  const viewerKey = account.context?.authUserId ?? (account.status === "guest" ? "guest" : "pending");
  const queryKey = JSON.stringify([criteriaKey, viewerKey]);
  const loadBatch = useCallback<DiscoveryBatchLoader>((request) => fetchDiscoveryProfilesBatch(request, criteria), [criteria]);
  const accountReady = account.status !== "loading" || account.context !== null;

  return { queryKey, hasActiveFilters: hasDiscoveryFilters(criteria), loadBatch: ready && accountReady ? loadBatch : null };
}
