"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
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
  const raw = useSyncExternalStore(subscribeToFilters, getFiltersSnapshot, serverFiltersSnapshot);
  const ready = useSyncExternalStore(subscribeToReady, clientReady, serverReady);
  const saved = useMemo(() => parseStoredFilters(raw), [raw]);
  const queryKey = JSON.stringify(getDiscoveryFilters(saved));
  const criteria = useMemo(() => JSON.parse(queryKey) as DiscoveryFilters, [queryKey]);
  const loadBatch = useCallback<DiscoveryBatchLoader>((request) => fetchDiscoveryProfilesBatch(request, criteria), [criteria]);

  return { queryKey, hasActiveFilters: hasDiscoveryFilters(criteria), loadBatch: ready ? loadBatch : null };
}
