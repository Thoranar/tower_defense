# Class Skeletons – Key Systems (TypeScript)

> Purpose: Provide example class structures with commented members and method signatures **without implementations**, to illustrate responsibilities, inputs/outputs, and interactions.

---

## Core Engine

### `src/core/Game.ts`
```ts
export class Game {
  // Injected singletons
  private world;           // World – entity container
  private renderer;        // IRenderer – draw abstraction
  private input;           // Input – keyboard/mouse state
  private clock;           // Clock – dt/time
  private bus;             // EventBus – pub/sub

  // Systems – created in ctor or injected
  private systems;         // { spawn, move, collide, combat, xp, cards, upgrades, prestige, boss, supports, achievements }

  // Runtime state
  private running: boolean;       // true when a run is active
  private registry;               // Registry – frozen data from JSON5
  private creators;               // creators – functions to instantiate entities/weapons/etc.

  /** Initialize renderer/input/registry/systems; set starting scene. */
  init(): void;

  /** Per-frame update: advance time, update systems, evaluate end conditions. */
  update(dt: number): void;

  /** Per-frame render: draw world & UI layers. */
  render(interp: number): void;

  /** Begin a new run: create Tower, supports, reset stats. */
  startRun(): void;

  /** End the current run: compute prestige, persist, show menu. */
  endRun(reason: "death" | "boss_ground" | "victory"): void;
}
```

### `src/core/World.ts`
```ts
export class World {
  // Entity storage
  private entities;       // Set<Entity> or array

  /** Add entity to world; assigns id. */
  add(e: Entity): void;

  /** Mark entity for removal (safe during iteration). */
  remove(e: Entity): void;

  /** Iterate living entities for systems. */
  all(): Iterable<Entity>;

  /** Query by type guard or tag; optional AABB query later. */
  query<T extends Entity>(pred: (e: Entity) => e is T): T[];
}
```

### `src/core/EventBus.ts`
```ts
export type EventKey =
  | "EnemyKilled"
  | "LevelUp"
  | "CardChosen"
  | "RunEnded"
  | "BossSpawned"
  | "TowerDamaged";

export class EventBus {
  /** Subscribe to an event key; returns unsubscribe fn. */
  on<T>(key: EventKey, handler: (payload: T) => void): () => void;

  /** Emit an event to all handlers. */
  emit<T>(key: EventKey, payload: T): void;
}
```

### `src/core/Renderer.ts`
```ts
export interface IRenderer {
  /** Prepare frame (clear, set transforms). */
  begin(): void;

  /** Draw an entity sprite/shape. */
  drawEntity(e: Entity): void;

  /** Draw UI text and bars. */
  drawUI(hud: HudModel): void;

  /** Finalize frame. */
  end(): void;
}
```

### `src/core/Canvas2DRenderer.ts`
```ts
export class Canvas2DRenderer implements IRenderer {
  /** Initialize canvas context, viewport, sprite atlas (optional). */
  constructor(params: { canvas: HTMLCanvasElement; sprites?: SpriteAtlas }) {}

  begin(): void;    // setup per-frame state
  drawEntity(e: Entity): void; // choose shape/sprite based on e.type
  drawUI(hud: HudModel): void; // HP/XP bars, boss bar, cards overlay stub
  end(): void;      // present frame
}
```

---

## Gameplay Entities

### `src/gameplay/Entity.ts`
```ts
export abstract class Entity {
  id: number;                 // unique id assigned by World
  pos: Vec2;                  // position in world space
  vel: Vec2;                  // velocity per second
  radius: number;             // collision radius
  alive: boolean;             // false when scheduled for removal
  tags?: string[];            // optional query tags

  /** Optional per-entity update; systems perform most logic. */
  update?(dt: number): void;
}
```

### `src/gameplay/Tower.ts`
```ts
export class Tower extends Entity {
  stats: TowerStats;          // hp, maxHp, damageMult, fireRateMult, regen
  weapons: Weapon[];          // equipped weapons
  turretAngle: number;        // rad; controlled by input

  /** Apply damage; emits TowerDamaged; ends run when hp<=0. */
  applyDamage(amount: number): void;

  /** Add a weapon instance to the tower. */
  addWeapon(w: Weapon): void;
}
```

### `src/gameplay/Enemy.ts`
```ts
export class Enemy extends Entity {
  hp: number;                 // current health
  maxHp: number;              // max health
  xp: number;                 // xp value on death
  behaviorKeys: string[];     // behavior identifiers from data

  /** Called when taking damage; returns true if killed. */
  applyDamage(amount: number): boolean;
}
```

### `src/gameplay/Projectile.ts`
```ts
export class Projectile extends Entity {
  damage: number;             // damage to apply on hit
  ownerId: number;            // id of firing entity (tower/support)
  lifetime: number;           // seconds remaining before auto-despawn
}
```

### `src/gameplay/weapons/Weapon.ts`
```ts
export abstract class Weapon {
  key: string;                // weapon key from data
  level: number;              // run level (1..config.upgradeMaxLevel)
  cooldown: number;           // seconds between allowed shots (base)
  timer: number;              // time until next shot available
  projectileKey: string;      // key in projectiles.json5

  /** Advance internal cooldown timers. */
  tick(dt: number): void;

  /** Attempt to fire; returns zero or more projectiles. */
  fire(ctx: FireContext): Projectile[];
}
```

---

## Systems

### `src/systems/SpawnSystem.ts`
```ts
export class SpawnSystem {
  constructor(args: { world: World; creators: Creators; reg: Registry; clock: Clock }) {}

  /** Called every frame; spawns enemies according to active wave band. */
  update(dt: number): void;

  /** Reset internal state (e.g., spawn timers) at start of run. */
  reset(): void;
}
```

### `src/systems/MovementSystem.ts`
```ts
export class MovementSystem {
  constructor(args: { world: World; reg: Registry }) {}

  /** Integrate positions by velocity; apply behavior updates. */
  update(dt: number): void;
}
```

### `src/systems/CollisionSystem.ts`
```ts
export class CollisionSystem {
  constructor(args: { world: World; bus: EventBus }) {}

  /** Detect projectile↔enemy and enemy↔ground/tower; produce collision pairs. */
  update(dt: number): void;
}
```

### `src/systems/CombatSystem.ts`
```ts
export class CombatSystem {
  constructor(args: { world: World; bus: EventBus }) {}

  /** Consume collision results, apply damage, mark deaths, emit EnemyKilled. */
  apply(): void;
}
```

### `src/systems/ExperienceSystem.ts`
```ts
export class ExperienceSystem {
  level: number;              // current run level
  xp: number;                 // current xp toward next level
  xpToNext: number;           // threshold from config.xpCurve

  constructor(args: { bus: EventBus; reg: Registry }) {}

  /** Grant XP (e.g., on EnemyKilled); may trigger LevelUp event. */
  grant(xp: number): void;

  /** Reset to level 1 and initial thresholds at run start. */
  reset(): void;
}
```

### `src/systems/CardDraftSystem.ts`
```ts
export class CardDraftSystem {
  active: boolean;            // true when draft UI is visible
  currentChoices: string[];   // card keys currently presented

  constructor(args: { bus: EventBus; reg: Registry; rng: RNG }) {}

  /** Create a new draft set of N cards from reg.cards (weighted). */
  offer(count: number): void;

  /** Apply chosen card outcome (upgrade key), then close the draft. */
  choose(cardKey: string): void;
}
```

### `src/systems/UpgradeSystem.ts`
```ts
export class UpgradeSystem {
  private levels;             // Map<upgradeKey, level>
  private slotsMax: number;   // from config.upgradeSlots

  constructor(args: { bus: EventBus; reg: Registry; creators: Creators }) {}

  /** True if upgrade can be selected (slot or level limit). */
  canSelect(upgKey: string): boolean;

  /** Apply upgrade effect ops at the next level; update levels map. */
  apply(upgKey: string): void;

  /** Read current level for an upgrade key. */
  levelOf(upgKey: string): number;

  /** Reset selection map at run start. */
  reset(): void;
}
```

### `src/systems/PrestigeSystem.ts`
```ts
export class PrestigeSystem {
  bank: number;               // total prestige (persisted)

  constructor(args: { storage: StorageLike; reg: Registry; bus: EventBus }) {}

  /** Compute prestige payout for the completed run and update bank. */
  settle(stats: RunStats): number;

  /** Spend prestige on a meta upgrade (e.g., unlock support building). */
  spend(cost: number): boolean;

  /** Load/save bank from/to LocalStorage. */
  load(): void;
  save(): void;
}
```

### `src/systems/BossSystem.ts`
```ts
export class BossSystem {
  constructor(args: { world: World; creators: Creators; reg: Registry; bus: EventBus; clock: Clock }) {}

  /** Spawn boss at configured time; emit BossSpawned. */
  update(dt: number): void;

  /** Clear any boss state at run start. */
  reset(): void;
}
```

### `src/systems/SupportBuildingSystem.ts`
```ts
export class SupportBuildingSystem {
  constructor(args: { world: World; creators: Creators; meta: MetaState; reg: Registry }) {}

  /** Place unlocked supports on ground at the start of a run. */
  spawnSupports(): void;
}
```

### `src/systems/AchievementSystem.ts`
```ts
export class AchievementSystem {
  unlocked;                 // Set<achievementKey>

  constructor(args: { reg: Registry; bus: EventBus; storage: StorageLike }) {}

  /** Periodically evaluate achievement predicates and unlock rewards. */
  update(dt: number): void;

  /** Persist unlocked achievements. */
  save(): void;
}
```

---

## Data Layer

### `src/data/registry.ts`
```ts
export type Registry = {
  config: GameConfig;                         // global rules
  enemies: Record<string, EnemyBlueprint>;    // enemy stats & behaviors
  projectiles: Record<string, ProjectileBlueprint>;
  weapons: Record<string, WeaponBlueprint>;
  upgrades: Record<string, UpgradeBlueprint>;
  cards: Record<string, CardBlueprint>;
  waves: WaveBlueprint[];
  boss: BossBlueprint;
  supports: Record<string, SupportBlueprint>;
  achievements: Record<string, AchievementBlueprint>;
};
```

### `src/data/loaders.ts`
```ts
export class RegistryLoader {
  /** Fetch and parse all JSON5 files; validate cross-references; freeze result. */
  async load(basePath: string): Promise<Registry>;

  /** Validate references (cards→upgrades, weapons→projectiles, waves→enemies). */
  validate(reg: Registry): void;
}
```

### `src/data/creators.ts`
```ts
export type Creators = {
  enemy(key: string, pos: Vec2): Enemy;              // build Enemy from blueprint
  projectile(key: string, init: Partial<Projectile>): Projectile; // build Projectile
  weapon(key: string, level?: number): Weapon;       // build Weapon with stats
  upgradeEffect(key: string): UpgradeEffect;         // parse & return effect executor
  support(key: string, pos: Vec2): Entity;           // build Support entity
};

export function makeCreators(reg: Registry): Creators;
```

---

## UI Layer

### `src/ui/Hud.ts`
```ts
export type HudModel = {
  hp: number; maxHp: number;      // player health
  xp: number; xpToNext: number;   // progression
  level: number;                  // current run level
  time: number;                   // elapsed seconds
  prestige: number;               // current bank (meta)
  bossActive: boolean;            // show boss bar when true
};

export class Hud {
  /** Produce a snapshot model of HUD data from game state. */
  snapshot(state: GameState): HudModel;
}
```

### `src/ui/CardOverlay.ts`
```ts
export class CardOverlay {
  visible: boolean;               // true when drafting
  choices: string[];              // card keys

  /** Open overlay with the given card keys. */
  open(choices: string[]): void;

  /** Close overlay and clear selection state. */
  close(): void;
}
```

---

## Support Types (examples)

```ts
export type TowerStats = { hp: number; maxHp: number; damageMult: number; fireRateMult: number; regen: number };
export type FireContext = { ownerId: number; origin: Vec2; direction: Vec2; creators: Creators };
export type RunStats = { time: number; kills: number; bossDefeated: boolean };
export type MetaState = { unlockedSupports: string[] };
export interface StorageLike { getItem(k: string): string | null; setItem(k: string, v: string): void; }
```

