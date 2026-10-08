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

## Discovery integration

Applying filters saves them locally and returns to Discovery. The Discovery
feature subscribes to changes and filters Supabase before 10-profile pagination.
Industry selections match any selected array value. Role / Profession and Skills
match any shared word, ignoring case and common punctuation; selected skills use
OR. Different filter sections combine with AND. Experience uses the numeric
year ranges shown in the controls, including both endpoints.

The dropdown suggestions for Role / Profession and Skills also use any-word
searching and accept partial words while typing. A custom value can be added
even when other suggestions match. C#, C++ and Node.js stay distinct tokens.

Looking for, distance, Work arrangement and Open to remain saved demo choices.
The current profile table lacks the fields/location coordinates to apply them.
The panel explains which controls currently filter Discovery.

Run `../discover/search-functions.sql` in the Supabase SQL Editor to install
the computed word fields used by the queries. The Filters panel itself still
only stores preferences; Supabase requests belong to the Discovery feature.
