# Filters

The `/home/filters` route presents the filter panel over the existing home layout.
The feature's state, suggestions, icons and CSS live in this folder. Discovery's
Filters link is the only integration change outside it.

## Opening and closing

Link to `/home/filters?from=/home/discover` (or another `/home` page). Apply and
Close return to this local page. Without `from`, a suitable same-origin referrer
is used, then `/home/discover` as the fallback. Close discards the draft. Reset
changes the draft to `DEFAULT_FILTERS`; Apply saves it.

## Reading selections in another feature

Import `readStoredFilters` and `FILTERS_STORAGE_KEY` from `./filterStorage` in a
client component. The storage key is `hi5.filters.v1`; its JSON value is the
`Filters` object defined in `filterOptions.ts`. For reactive updates, use
`subscribeToFilters` and `getFiltersSnapshot` with `useSyncExternalStore`, then
`parseStoredFilters`. Use a server snapshot of `null`.

`location: null` means unrestricted distance. The numeric values represent the
slider's 5 km, 25 km, 50 km and 100+ km positions. A null profession and empty
industry/skill arrays impose no corresponding restriction. Custom professions
and skills are trimmed strings and survive saving and reloading. Skills are
unique regardless of case and limited to five.

This feature stores preferences only. Applying them to discovery results is a
separate integration step; no database or Supabase connection is used here.
