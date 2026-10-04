# Meet preferences

Route: `/home/meet`. The Discover page links here through its existing Meet action.
The shared `/home` layout supplies navigation, notifications, and the profile menu.
Meet opens as a modal route panel with the same dimensions, rounded shape, and
600 ms slide-up entrance as Filters. Its header and Save actions remain visible
while preferences scroll. The panel also fits above the mobile keyboard.

## Opening and closing

Link to `/home/meet?from=/home/discover` (or another `/home` page). The top-right
Close button and Escape return to that local page. Direct visits use a suitable
same-origin referrer, then `/home/discover` as the fallback. Close discards unsaved
edits. Saving keeps the panel open. Background scrolling and controls are disabled
while the panel is open, and keyboard focus stays inside it.

## Feature files

- `meetingOptions.ts`: typed identifiers, form defaults, and validation.
- `meetingStorage.ts`: parsing, localStorage access, and change subscriptions.
- `MeetingPreferencesForm.tsx`: form state and accessible controls.
- `MeetPanel.tsx` and `returnPath.ts`: modal behaviour and close navigation.
- `Meet.module.css` and `MeetIcon.tsx`: styles and icons scoped to this feature.
- `page.tsx`: route metadata and return-path parameters.

## Persistence contract

The key `hi5.meeting-preferences.v1` stores a JSON `MeetingPreferences` object.
Values use the identifiers in `meetingOptions.ts`, rather than display labels.
`travelRadius` is in kilometres; `null` represents Remote only or Anywhere.
Unknown identifiers and malformed data are handled by the storage parser.

Defaults are Both, Within 25 km, Weekends, and 30–60 minutes. Meeting methods
start unselected; saving requires at least one. Reset changes the draft only.
Preferences are stored in the current browser, with no account or server sync.

Future Supabase integration can retain the model and validation while replacing
the storage functions and subscription in `meetingStorage.ts`. No Supabase
integration or extra backend service is included in this implementation.

The only integration change outside this directory is the Meet link in
`app/home/discover/DiscoveryExperience.tsx`.
