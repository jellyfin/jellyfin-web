# Show Composer in Song/Track List View

## Summary

This change adds composer display to the song list view in Jellyfin Web.
When browsing an album's track list, the composer's name now appears below
the track title — but only for tracks where composer metadata is available
in the audio file's ID3/tags.

## Background

Jellyfin populates the `People` array for audio items exclusively from the
`COMPOSER` tag embedded in the audio file itself. It does **not** derive
composer information from album-level metadata or library-level artist
associations.

This means:
- A recording of Bach's *Kunst der Fuge* by Ensemble L'Arte della Fuga
  will show "Johann Sebastian Bach" as composer — **if** the individual
  track files carry a `COMPOSER` tag.
- A Haydn symphony on a label-issued CD rip may show nothing, if the
  files only carry `ARTIST` and `ALBUMARTIST` tags.

This behavior is intentional and correct: the feature gracefully degrades.
No composer tag → no composer shown. No false positives.

## Root Cause

The `People` field was never requested from the Jellyfin API for audio
items. Even though the display logic (`useTextLines.tsx`, `listview.js`)
already contained composer-rendering code, the data never arrived from
the server.

Additionally, `showComposer` was not set in the list options for the
Songs view.

## Changes

### `src/utils/items.ts`

Added `ItemFields.People` to the API fields requested for `LibraryTab.Songs`:
```typescript
if (viewType === LibraryTab.Songs) {
    itemFields.push(ItemFields.People);
}
```

Without this, the server response never includes `People` data for audio
items, regardless of what the frontend tries to render.

### `src/apps/experimental/components/library/ItemsView.tsx`

Added `showComposer: true` to the list options for the Songs view:
```typescript
if (viewType === LibraryTab.Songs) {
    listOptions.showParentTitle = true;
    listOptions.action = ItemAction.PlayAllFromHere;
    listOptions.smallIcon = true;
    listOptions.showArtist = true;
    listOptions.addToListButton = true;
    listOptions.showComposer = true;  // added
}
```

## How It Works

The data flow end-to-end:
```
Audio file (ID3 COMPOSER tag)
  → Jellyfin server indexes it into item.People[]
    → API response includes People when fields=People is requested
      → useTextLines.tsx filters People by Type === "Composer"
        → Composer name rendered below track title in list view
```

## Scope

- **Affected view:** Songs list (ListView mode in music libraries)
- **Not affected:** Albums, Artists, Movies, Episodes, or any other view
- **Prerequisite:** Audio files must carry a `COMPOSER` ID3/metadata tag

## Testing

Verified against Jellyfin 10.11.6 with a classical music library:

| Scenario | Result |
|---|---|
| Track with COMPOSER tag (e.g. Corelli via Dorothee Oberlinger) | ✅ Composer shown |
| Track without COMPOSER tag (e.g. Haydn symphony, tag not set) | ✅ Field empty, no error |
| Album view | ✅ Unaffected |
| Movie/Episode view | ✅ Unaffected |

## Notes

This feature is particularly useful for classical music libraries, where
the performing artist and the composer are different people — a distinction
that mainstream music players often ignore.