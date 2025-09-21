# UI Design & Schema

This document outlines the **user interface design principles**, a **schema of UI elements**, and **UX guidelines** for the game.

---

## Design Principles

- **Minimalist Core**: Focus on gameplay; UI should never clutter or distract.
- **High Feedback**: Visual feedback for every action (damage, healing, XP gain).
- **Escalating Intensity**: UX conveys rising tension as waves progress.
- **Separation of Layers**: Core HUD is static; ephemeral overlays (damage numbers, XP floaters) are transient.
- **Legibility First**: All text, bars, and numbers are clear at a glance.

---

## UI Schema

### HUD Elements (always visible)
- **Player Health Bar**
  - Positioned: Bottom-left.
  - Shows current HP / Max HP.
  - Flashes when damage taken.
- **XP Bar**
  - Positioned: Bottom-center.
  - Shows XP progress toward next level.
  - Fills smoothly; pulses on level-up.
- **Level Indicator**
  - Positioned: Above XP bar.
  - Displays current level number.
- **Prestige Counter**
  - Positioned: Top-right.
  - Displays accumulated prestige.
- **Timer**
  - Positioned: Top-center.
  - Shows elapsed time; boss timer changes color when approaching 10 minutes.

### Ephemeral Feedback (floating/animated)
- **Damage Numbers**
  - Spawn above enemies when hit.
  - Color-coded: white (normal), yellow (crit), green (healing).
- **XP Gains**
  - Small floating +XP number when enemy dies.
- **Healing Numbers**
  - Green floating text when player heals.
- **Level Up Flash**
  - Brief screen flash / pulse on level-up.

### Overlay UI (contextual)
- **Card Draft Screen**
  - Trigger: On level-up.
  - Shows 3 cards (upgrades) side by side.
  - Simple layout: card art/icon, title, description.
  - One-click to select, auto-close.
- **Achievement Popups**
  - Trigger: On unlock.
  - Small popup fades in top-left.
  - Shows title + icon.
- **Boss Warning**
  - Trigger: 30 seconds before boss.
  - Flashing banner across top with warning text.

### Meta UI (outside run)
- **Main Menu**
  - Options: Start Run, Prestige Shop, Achievements.
- **Prestige Shop**
  - Grid of unlockable upgrades (support buildings, buffs).
  - Shows cost, purchased/unlocked state.
- **Achievements Menu**
  - List of unlocked + locked achievements.

---

## Visual Suggestions

- **Font**: Clean, sans-serif, bold for numbers.
- **Colors**:
  - HP: Red bar.
  - XP: Blue bar.
  - Prestige: Gold counter.
  - Timer: White (normal), orange/red (approaching boss).
- **Floating Text**: Slight fade and upward drift.
- **Card Draft**: Dim background, cards centered, clear highlight on hover.
- **Boss Entry**: Red vignette + text overlay (intensity spike).

---

## UX Intensity Curve

- **Early Game (0–3 min)**: Calm, simple UI, basic numbers.
- **Mid Game (3–7 min)**: More damage/heal/XP numbers popping, denser enemy waves.
- **Late Game (7–10 min)**: Frequent feedback spam, boss warning banner adds tension.
- **Boss Phase (10+ min)**: Dramatic UI—boss HP bar at top, timer replaced by “Boss Active”.

---

## Technical Notes

- **HUD Model**: Exposed by `Hud.ts` for rendering.
- **Overlay Components**: `CardOverlay.ts`, `AchievementPopup.ts` control their own lifecycle.
- **Feedback System**: Separate lightweight manager for floating text (damage/heal/XP).
- **Renderer Layering**:
  1. World (entities).
  2. HUD (bars, counters).
  3. Ephemeral text (floating feedback).
  4. Overlays (cards, boss warning).

