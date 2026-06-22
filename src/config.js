// ── Central config — all commonly-tuned values live here ─────────────────────
// Edit this file to adjust audio, layout, and seasonal settings across the site.

// ── Scale system ──────────────────────────────────────────────────────────────
// All components receive a `scale` prop = containerWidth / DESIGN_WIDTH.
export const DESIGN_WIDTH = 1280

// ── Audio volumes ─────────────────────────────────────────────────────────────
export const VOL_RAIN_ROOM       = 0.18   // rain on homepage / about / contact
export const VOL_RAIN_DESKTOP    = 0.07   // rain on portfolio desktop
export const VOL_RAIN_VENT       = 0.05   // rain inside the vents
export const VOL_FRIDGE          = 0.25   // fridge hum in room
export const VOL_STATIC          = 0.25   // TV static transition
export const VOL_PHONE_HOVER     = 0.18   // phone ring SFX on hover

// ── Seasonal month ranges ─────────────────────────────────────────────────────
// Month indices 0–11 (Jan=0). Used by Room.jsx and Admin season preview.
export const SUMMER_MONTHS = [5, 6, 7]    // Jun Jul Aug
export const AUTUMN_MONTHS = [8, 9, 10]   // Sep Oct Nov
