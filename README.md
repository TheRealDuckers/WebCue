# WebCue

Web-based show control for theater, live events, and presentations. A free, QLab-style cue player that runs entirely in the browser.

> To use the new version, you may have to force refresh (Ctrl + Shift + R)

## URLs

- **Desktop**: [webcue.duckers.dev](https://webcue.duckers.dev)
- **Mobile**: [webcue.duckers.dev/mobile](https://webcue.duckers.dev/mobile)
- **Docs**: [webcue.duckers.dev/docs](https://webcue.duckers.dev/docs)

## Quick Start

### Desktop

1. Open [webcue.duckers.dev](https://webcue.duckers.dev)
2. Click **NEW** to create a show
3. Click **+** to add a cue
4. Select an audio or video file
5. Press **GO** (or Spacebar) to fire

### Mobile

1. Open [webcue.duckers.dev/mobile.html](https://webcue.duckers.dev/mobile.html)
2. Tap **+** to add a cue
3. Select media file
4. Tap **GO** to fire

## Features

- **Cue Types**: Audio, Video, Wait, Command, QLC+ DMX
- **Keyboard Shortcuts**: Space (GO), Esc (Stop), F (Fade), Arrows (navigate)
- **QLC+ Integration**: Control DMX lights via QLC+
- **OSC Output**: Send cue data to other apps
- **PWA Installable**: Works offline, install as app

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | GO - Fire selected cue |
| Esc | STOP |
| F | FADE - Fade out audio |
| Shift+Esc | PANIC - All stop + DMX blackout |
| ↑/↓ | Navigate cue list |
| Enter | Fire selected cue |
| Delete | Delete selected cue |

## GO Behavior

When you press GO:
1. Fires the selected cue
2. Automatically selects the next cue
3. Press GO again to fire the next cue

This is exactly like QLab's GO pedal.

## Loading Media

For instant playback without loading delays:

1. Add all your cues with audio/video files
2. Click **LOAD** to pre-load all media
3. Loaded cues show a green checkmark ✓

## QLC+ DMX Setup

1. In QLC+, enable Settings > Network > HTTP Server
2. Note the URL (e.g., `http://localhost:9999`)
3. In WebCue Settings, enter the QLC+ URL
4. Create QLC+ cue type with universe, channel, and DMX values


## License

MIT License - Open source, free to use and modify.

---

Built with ♫ by [Duckers](https://duckers.dev)
