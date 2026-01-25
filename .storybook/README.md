# Storybook for Jellyfin Web

This Storybook documents the UI components used in the Jellyfin Web client.

## Running Storybook

```bash
npm run storybook        # Start dev server at http://localhost:6006
npm run storybook:build # Build static storybook to storybook-static/
```

## Story Organization

### UI Primitives (`src/ui-primitives/`)
Core design system components built with Radix UI and vanilla-extract:
- **Layout**: Box, Flex, Grid, Container, Paper, Spacer
- **Typography**: Text, Heading
- **Buttons & Inputs**: Button, IconButton, Input, Select, Checkbox, Switch, Slider
- **Feedback**: Alert, Progress, CircularProgress, Skeleton
- **Data Display**: Card, Avatar, Table, DataTable, Chip
- **Navigation**: Tabs, Menu, List
- **Overlays**: Dialog, Tooltip

### Playback Components (`src/components/playback/`)
Components for media playback:
- **NowPlayingBar**: Current track display with controls
- **PlaybackControls**: Play/pause/skip buttons and progress sliders

### Common Components (`src/components/common/`)
Shared components:
- **States**: Loading skeletons, error states, empty states

## Providers

Storybook includes mock providers for testing components in isolation:

### MockProviders Props

| Prop | Type | Description |
|------|------|-------------|
| `audioStore` | `Partial<AudioStoreState>` | Mock audio player state |
| `serverStore` | `Partial<ServerConnectionState>` | Mock server connection state |
| `playbackStore` | `Partial<PlaybackState>` | Mock playback state |
| `themeStore` | `Partial<ThemeState>` | Mock theme state |
| `notificationsStore` | `Partial<NotificationsState>` | Mock notifications |
| `i18n` | `boolean` | Enable i18n provider (default: true) |

### Usage in Stories

```tsx
export const MyStory: Story = {
    parameters: {
        providers: {
            audioStore: {
                isPlaying: true,
                currentTrack: { id: '1', title: 'Song', artist: 'Artist', album: 'Album', imageUrl: '' },
            },
        },
    },
    render: () => <MyComponent />,
};
```

## Available Decorators

### withProviders
Wraps stories with all mock providers.

### withQueryClient
Wraps stories with TanStack Query client.

### withI18n
Wraps stories with i18n provider.

### withDarkTheme
Sets dark theme background.

### withLightTheme
Sets light theme background.

### withPlayingAudio
Provides audio store with playing state.

### withConnectedServer
Provides server store with connected state.

## Global Controls

### Locale
Toggle between LTR and RTL layouts using the toolbar.

### Viewport
Test responsive behavior with presets:
- Mobile: 375x667
- Tablet: 768x1024
- Desktop: 1280x800
- Wide: 1920x1080

### Background
Switch between dark, light, and surface backgrounds.

## Accessibility Testing

Storybook includes `@storybook/addon-a11y` for accessibility testing. Check the Accessibility tab in each story for WCAG compliance results.

## Adding New Stories

1. Create a `.stories.tsx` file alongside your component
2. Use the established patterns from existing stories
3. Add appropriate `parameters.providers` for context
4. Include documentation in the `parameters.docs` object
5. Export a default `meta` and `Story` types

## Mock Data

The `providers.tsx` file exports mock data for common scenarios:

```tsx
import { mockData } from '../.storybook/providers';

const track = mockData.audioTrack;
const server = mockData.server;
```

## Building for Production

```bash
npm run storybook:build
# Output: storybook-static/
```

Deploy the `storybook-static` folder to any static hosting service.
