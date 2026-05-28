# Audio Assets

Drop audio files into the relevant sub-folder. All formats should be `.mp3` (good
browser compat) with an `.ogg` fallback where file size matters.

## Folder map

| Folder    | Purpose                                                                 |
|-----------|-------------------------------------------------------------------------|
| `ambient/`| Looping background texture — room hum, distant static, low-frequency   |
| `music/`  | Optional background score — horror ambient, looping                     |
| `sfx/`    | One-shot effects tied to room interactions (door creak, clock tick, etc)|
| `ui/`     | Short UI sounds — key click, window open/close, static burst            |

## Implementation notes

When you're ready to add audio:

1. **Howler.js** is the recommended library (`npm install howler`).  
   It handles autoplay policy, Web Audio API fallback, and loop cross-fade cleanly.

2. Create a `src/hooks/useAudio.js` hook that:
   - Loads sounds lazily (on first user gesture, not on mount)
   - Exposes `play(id)`, `stop(id)`, `setVolume(v)` methods
   - Stores a master mute flag in `settings.json` → `audio.muted`

3. Trigger points to wire up first:
   - `Room.jsx` → ambient loop starts on mount (after first click)
   - `StaticTransition` → static burst sfx on transition
   - `DesktopWindow` open/close → short UI click sound
   - `AboutMe` enter → brief CRT power-on sound from `ui/`

4. Always gate audio behind a user gesture check and respect the OS reduced-motion
   / audio preferences where possible.
