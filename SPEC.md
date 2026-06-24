# WebCue - Web-Based Show Control

## Project Overview
- **Type**: Single-page web application (static HTML/CSS/JS)
- **Purpose**: QLab-style show control cue player for theater/live events
- **Target Users**: Theater technicians, live event operators, DJs, presenters

## UI/UX Specification

### Layout Structure
- **Header**: Show title, transport controls (GO, STOP, PAUSE)
- **Main Area**: Split view
  - Left (70%): Cue list with numbered cues
  - Right (30%): Cue editor panel
- **Footer**: Status bar (current cue, elapsed time)

### Visual Design
- **Color Palette**:
  - Background: #1a1a1a (dark gray)
  - Surface: #252525 (slightly lighter)
  - Primary: #00d4aa (teal/cyan - distinctive show control feel)
  - Secondary: #ff6b35 (orange - for stop/panic)
  - Text: #e0e0e0
  - Text muted: #888888
  - Cue selected: #00d4aa20
  - Cue running: #00d4aa40 with left border accent
  
- **Typography**:
  - Font: "JetBrains Mono", "Fira Code", monospace (technical feel)
  - Header: 24px bold
  - Cue list: 14px
  - Editor labels: 12px uppercase

- **Spacing**: 8px base unit

### Components

#### Transport Controls
- GO button: Large, green/teal, keyboard spacebar
- STOP button: Orange, keyboard escape
- PAUSE button: Yellow
- PANIC button: Red, stops all

#### Cue List
- Scrollable list with numbered cues
- Each cue shows: number, name, type icon, duration
- Click to select, double-click to fire
- Drag to reorder
- Selected cue highlighted
- Running cue has animated border

#### Cue Types
- Audio (speaker icon): plays audio file
- Video (play icon): plays video file
- Command (code icon): HTTP request or script
- MIDI (music icon): sends MIDI via Web MIDI API
- Wait (clock icon): timed pause
- Group (folder icon): cue list container

#### Cue Editor Panel
- Name field
- Type dropdown
- File selector (for audio/video)
- Duration/fade in/fade out fields
- Notes field
- Color picker for cue
- Delete button

## Functionality Specification

### Core Features
1. **Cue Management**
   - Add/edit/delete cues
   - Reorder via drag-and-drop
   - Duplicate cues
   - Cue groups with nested lists

2. **Playback**
   - Fire individual cues (Enter or double-click)
   - Fire next cue (Spacebar/GO)
   - Stop current cue (Escape)
   - Pause/resume
   - Panic (stop all)

3. **Audio Playback**
   - Load local audio files
   - Volume control
   - Fade in/out
   - Loop option

4. **Video Playback**
   - Load local video files
   - Fullscreen option
   - Fade in/out
   - Volume control

5. **Automation**
   - Auto-advance to next cue
   - Wait durations
   - Cue chaining (go to cue X after Y)

6. **Persistence**
   - Save/load shows to JSON
   - LocalStorage auto-save
   - Export/import show files

### Keyboard Shortcuts
- Space: GO (fire selected cue)
- Enter: Fire selected cue
- Escape: Stop
- Delete: Remove selected cue
- Ctrl+N: New show
- Ctrl+S: Save show
- Ctrl+O: Open show
- Up/Down: Navigate cue list

## Acceptance Criteria
1. Page loads without errors
2. Can create new cue
3. Can load local audio/video files
4. Can play/pause/stop cues
5. Can reorder cues
6. Can save/load show to JSON
7. Keyboard shortcuts work
8. Responsive on tablet (for iPad stage use)
