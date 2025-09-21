# Project Architecture & File Hierarchy

This document defines the technical class and file layout for the game project. Each file or folder includes comments describing its purpose and responsibilities.

---

## Folder Structure

```
src/
  core/                  # Core engine and loop coordination
    Game.ts              # Main loop; orchestrates systems and updates world
    World.ts             # Maintains list of entities; add/remove/update lifecycle
    EventBus.ts          # Lightweight pub/sub for cross-system communication
    Renderer.ts          # Abstract rendering interface
    Canvas2DRenderer.ts  # Canvas 2D implementation of Renderer
    Input.ts             # Keyboard/mouse input state tracking
    Clock.ts             # Manages time deltas, elapsed time, and timers

  systems/               # Systems implement distinct gameplay concerns
    SpawnSystem.ts       # Spawns enemies based on wave data
    MovementSystem.ts    # Updates entity positions and applies behaviors
    CollisionSystem.ts   # Detects and resolves collisions (enemy↔projectile, enemy↔ground)
    CombatSystem.ts      # Applies damage, handles deaths, grants XP
    ExperienceSystem.ts  # Tracks XP, levels, and triggers card drafts
    CardDraftSystem.ts   # Presents upgrade card choices and processes selection
    UpgradeSystem.ts     # Applies upgrade effects, enforces slot/level rules
    PrestigeSystem.ts    # Calculates prestige currency, persists to storage
    AchievementSystem.ts # Evaluates achievement conditions and grants rewards
    SupportBuildingSystem.ts # Manages meta-support buildings during runs
    BossSystem.ts        # Handles super enemy spawn, logic, and special behavior

  gameplay/              # Entity definitions and gameplay classes
    Entity.ts            # Base entity class with position, velocity, radius, alive flag
    Tower.ts             # Player tower; holds stats, weapons, and health
    Enemy.ts             # Enemy entity; hp, xp reward, behaviors
    Projectile.ts        # Projectile entity; damage, speed, owner
    weapons/             # Weapon classes extending abstract Weapon
      Weapon.ts          # Abstract weapon class; defines fire method and cooldown logic
      Cannon.ts          # Concrete cannon weapon for MVP
      // Future: Different weapon types, area bombs, freezing shots, etc.
    behaviors/           # Reusable behavior modules for enemies
      MoveDown.ts        # Simple downward movement behavior
      // Future: ZigZag.ts, SplitOnDeath.ts, etc.

  data/                  # Data registry and loading layer
    registry.ts          # Type definitions for all blueprint data (enemies, weapons, etc.)
    loaders.ts           # Loads JSON5 content files, validates references, builds registry
    creators.ts          # Tiny factory functions to instantiate entities/weapons from registry

  ui/                    # User interface overlays and HUD
    Hud.ts               # Displays health, XP, level, prestige, and timers
    CardOverlay.ts       # UI for level-up card draft selection
    AchievementPopup.ts  # Shows unlocked achievements during run

public/
  content/               # Data-driven JSON5 files (no hardcoding in codebase)
    config.json5         # Global settings (xp curve, boss timer, upgrade slot rules)
    enemies.json5        # Enemy definitions (stats, behaviors, sprites)
    projectiles.json5    # Projectile definitions (speed, radius, damage)
    weapons.json5        # Weapon definitions (base cooldown, damage, projectile)
    upgrades.json5       # Upgrade definitions (stat boosts, equip weapon, support buffs)
    cards.json5          # Card definitions for level-up draft
    waves.json5          # Wave schedules and enemy spawn tables
    boss.json5           # Super enemy blueprint
    supports.json5       # Prestige support building definitions
    achievements.json5   # Achievement conditions and rewards
    sprites.json5        # Optional sprite atlas mapping
```

---

## Notes

- All gameplay numbers, tuning, and content live in JSON5 files inside `public/content/`.
- The `data/creators.ts` file is the only way entities/weapons/upgrades are instantiated; systems never call constructors with raw values.
- Systems in `src/systems/` must remain single-responsibility and should not exceed \~200 lines each.
- `Renderer` abstraction allows swapping rendering implementations if needed.
- `EventBus` keeps systems decoupled while allowing signals like `EnemyKilled`, `LevelUp`, or `RunEnded`.
- UI scripts only read and display state; they do not mutate gameplay state.

