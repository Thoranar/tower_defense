# Milestones & Implementation Plan (High-Level)

> Goal: Ship visual, testable increments. Each milestone ends with something **on-screen** so we can validate, roll back, or adjust quickly.
>
> **Dev Tools**: Each milestone adds toggleable developer overlays/actions exposed via a dedicated **DevTools panel** (keyboard toggle, e.g., `~`). All dev features must be **non-invasive** (no gameplay side effects unless explicitly triggered) and **runtime toggleable**.

---

## Milestone 1 — Boot & Rendering Skeleton
- **Implement**: Vite setup, Canvas boot, basic game loop (update/render), `UIRenderer` placeholder.
- **Visible**: Solid background, FPS counter/text, ground line.
- **Rollback Point**: Clean canvas loop + renderer only.
- **Dev Tools/Overlays**:
  - Toggleable **FPS counter** and frame time graph.
  - **Canvas bounds** and safe-area guides.
  - Dev panel scaffold with on/off toggles persisted to LocalStorage.

## Milestone 2 — Player Tower & Input
- **Implement**: `Tower` entity, turret angle via keyboard/mouse, basic `HudModel` with timer.
- **Visible**: Tower sprite/shape at bottom center, turret rotates.
- **Rollback Point**: Tower + input works; no enemies yet.
- **Dev Tools/Overlays**:
  - Toggle **input visualizer** (shows current keys/mouse state, turret angle).
  - **Origin/grid overlay** to verify positioning.
  - Button: **Reset run** (soft restart state without page reload).

## Milestone 3 — Weapons & Projectiles (Data-Driven)
- **Implement**: `weapons.json5`, `projectiles.json5`, creators, `Cannon` weapon firing.
- **Visible**: Projectiles shoot upward on cooldown.
- **Rollback Point**: Firing with one weapon from data.
- **Dev Tools/Overlays**:
  - Toggle **projectile debug** (draw projectile IDs, lifetimes).
  - Slider: **fire rate multiplier** (dev-only) applied via DevTools, not saved.
  - Button: **Give weapon** (equip by weapon key) to test creators.

## Milestone 4 — Enemies & Spawning
- **Implement**: `enemies.json5`, `waves.json5`, `SpawnSystem`, `MoveDown` behavior.
- **Visible**: Enemies fall from top per wave timing.
- **Rollback Point**: Stable spawn pacing.
- **Dev Tools/Overlays**:
  - Button: **Spawn enemy** (select key & count) → calls same API as `SpawnSystem`.
  - Toggle **behavior trails** (draw recent path lines for enemies).
  - Readout: **active entities** count by type.

## Milestone 5 — Collisions & Combat
- **Implement**: `CollisionSystem`, `CombatSystem`, HP on enemies, floating damage numbers.
- **Visible**: Enemies take damage and die; numbers pop.
- **Rollback Point**: Basic kill loop functional.
- **Dev Tools/Overlays**:
  - Toggle **collision markers** (entity radii, contact pairs, AABB outlines).
  - Toggle **hit logs** (last N collisions with damage values).
  - Button: **Invincible tower** (dev-only toggle).

## Milestone 6 — XP & Level-Up Cards
- **Implement**: `ExperienceSystem`, `cards.json5`, `CardDraftSystem`, `CardOverlayView`.
- **Visible**: XP bar fills; on level-up, 3-card overlay appears.
- **Rollback Point**: Draft UI opens/closes; no upgrades applied yet.
- **Dev Tools/Overlays**:
  - Button: **Grant XP** (+N) to force level-up.
  - Toggle **draft preview** (show next rolled cards w/ seeds).
  - Readout: **XP curve** inspector (current/next thresholds).

## Milestone 7 — Upgrade Rules & Effects
- **Implement**: `UpgradeSystem` (5 slots × 5 levels), `upgrades.json5` ops (statAdd, equipWeapon), weapon equip.
- **Visible**: Selecting a card affects HP/fire rate or equips cannon.
- **Rollback Point**: Upgrades apply and persist for the run.
- **Dev Tools/Overlays**:
  - Panel: **Upgrade inspector** (list selected upgrades & levels; buttons to add/remove/level).
  - Toggle **stat overlays** (show derived multipliers next to tower).
  - Button: **Equip weapon** by key/level.

## Milestone 8 — Boss & Intensity Cues
- **Implement**: `boss.json5`, `BossSystem`, boss warning banner, boss HP bar.
- **Visible**: Warning at 9:30; boss spawns at 10:00 with top HP bar.
- **Rollback Point**: Boss phase isolated and testable.
- **Dev Tools/Overlays**:
  - Button: **Spawn boss now** (bypass timer).
  - Toggle **boss phase timer** (shows internal phase state for behaviors).
  - Slider: **boss HP scale** for testing.

## Milestone 9 — Run End & Prestige Stub
- **Implement**: End conditions (player HP≤0 or boss hits ground), `PrestigeSystem` calculation + save, simple menu.
- **Visible**: End screen with time/kills and prestige gained; Start Run button.
- **Rollback Point**: Full loop from start → end → menu.
- **Dev Tools/Overlays**:
  - Button: **Force end run** (choose reason).
  - Toggle **stats dump** (log RunStats to console & on-screen panel).
  - Button: **Clear LocalStorage** (meta reset).

## Milestone 10 — Supports & Meta Persistence
- **Implement**: `supports.json5`, `SupportBuildingSystem`, placing supports at run start; LocalStorage persistence.
- **Visible**: Unlocked support appears next run and fires.
- **Rollback Point**: Meta layer demonstrated.
- **Dev Tools/Overlays**:
  - Panel: **Meta editor** (grant/spend prestige; unlock/lock supports).
  - Button: **Spawn support** at slot location(s).
  - Toggle **aura ranges** visualization.

## Milestone 11 — UI/FX Polish Pass
- **Implement**: Gradients, shadows, flash on damage, XP tween, toasts for achievements.
- **Visible**: Clean minimal HUD with satisfying feedback.
- **Rollback Point**: Visual-only polish; gameplay intact.
- **Dev Tools/Overlays**:
  - Toggle **FX preview** (show/hide flashes, glows, shadows).
  - Slider: **UI scale** and **motion intensity** for accessibility/dev tuning.
  - Palette picker: **color theme** swap for quick contrast testing.

## Milestone 12 — Content Expansion Hooks
- **Implement**: Add one more enemy type, one more weapon, one more upgrade—**via JSON5 only**.
- **Visible**: New content live without code changes.
- **Rollback Point**: Revert JSON5 to prior set.
- **Dev Tools/Overlays**:
  - Panel: **Content loader** (hot-reload JSON5 files; show validation errors inline).
  - Button: **Spawn content by key** (enemy/weapon/upgrade) for smoke tests.
  - Toggle **registry diff view** (compare current vs last load).

---

### DevTools Architecture (suggestion)
- **DevToolsSystem**: Central state for toggles, sliders, and actions (subscribes to input shortcut and exposes an API).
- **DevOverlay UI**: Renders a docked/overlay panel with categories (Render, Input, Entities, Combat, Cards, Upgrades, Boss, Meta, Content).
- **Actions** call the same public methods used by gameplay systems (e.g., `SpawnSystem.requestSpawn()`), never private internals.
- **Persistence**: Save dev settings to `localStorage.devtools` and restore on boot.
- **Isolation**: All dev drawing occurs after gameplay/UI layers to avoid interfering with core visuals.

