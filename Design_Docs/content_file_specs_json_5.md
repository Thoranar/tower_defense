# Content File Specs (JSON5)

This document defines the **expected schema** for each JSON5 content file under `public/content/`. Fields marked **required** must be present; others are optional with defaults. All keys are **case-sensitive**. Keep numeric values within reasonable ranges to avoid runtime errors.

> Notes
> - Comments are allowed thanks to JSON5.
> - IDs/keys should be **stable** strings (e.g., `enemy.basic`, `weapon.cannon`).
> - Cross-references (e.g., weapon → projectile) must point to existing keys in the corresponding file.

---

## `config.json5`
Global tunables and rule caps.

**Schema**
```json5
{
  xpCurve: number[],                 // required; xp needed per level index (1-based or 0 as placeholder)
  bossTimeSec: number,               // required; time to spawn super enemy (in seconds)
  cardChoices: number,               // required; number of cards shown per level-up
  upgradeSlots: number,              // required; max distinct upgrade keys selectable per run
  upgradeMaxLevel: number,           // required; max level per upgrade key (e.g., 5)
  prestige: {                        // required
    perKill: number,                 // prestige per enemy kill
    perSecond: number                // prestige per second survived
  },
  rngSeed?: number,                  // optional; fixed seed for deterministic runs in dev
  ui?: {                             // optional; text/formatting hints
    font?: string,
    showDebug?: boolean
  }
}
```

---

## `projectiles.json5`
Projectile blueprints used by weapons.

**Schema**
```json5
{
  [projectileKey: string]: {
    speed: number,                   // required; px/s
    radius: number,                  // required; collision radius (px)
    damage: number,                  // required; base damage
    sprite?: string,                 // optional; sprite key/name
    lifetimeSec?: number             // optional; default TTL; if omitted, derived from screen bounds
  }
}
```

**Example**
```json5
{
  "proj.cannon": { speed: 600, radius: 3, damage: 5, sprite: "proj.cannon" }
}
```

---

## `weapons.json5`
Weapon stat blueprints; behavior implemented by matching class in `gameplay/weapons`.

**Schema**
```json5
{
  [weaponKey: string]: {
    key: string,                     // required; must equal the object key
    class?: string,                  // optional; name of concrete Weapon class (default maps by key)
    projectile: string,              // required; key in projectiles.json5
    baseCooldown: number,            // required; seconds between shots at level 1
    baseDamage: number,              // required; damage baseline applied to projectile
    perLevel?: {                     // optional; applied cumulatively per level > 1
      damage?: number,               // flat add per level
      cooldownPct?: number,          // percentage add per level (e.g., -5 for faster)
      mult?: number                  // optional global multiplier per level
    },
    spreadDeg?: number,              // optional; for multi-shot weapons
    pellets?: number                 // optional; shots per trigger
  }
}
```

**Example**
```json5
{
  "weapon.cannon": {
    key: "weapon.cannon",
    projectile: "proj.cannon",
    baseCooldown: 0.5,
    baseDamage: 5,
    perLevel: { damage: 2, cooldownPct: -5 }
  }
}
```

---

## `enemies.json5`
Enemy definitions for runtime spawn.

**Schema**
```json5
{
  [enemyKey: string]: {
    key: string,                     // required; must equal the object key
    hp: number,                      // required; max health
    speed: number,                   // required; downward speed (px/s) or behavior-specific meaning
    radius: number,                  // required; collision radius (px)
    xp: number,                      // required; XP awarded on kill
    sprite?: string,                 // optional; sprite key
    behaviors: string[],             // required; behavior keys/params (see notes)
    tags?: string[]                  // optional; e.g., ["flying","splitter"]
  }
}
```

**Behavior Key Format**
- Simple key: `"move.down"`
- With params: `"phase.shield(5,10)"`, `"death.split(3,enemy.mini)"`
  - Parsing is handled by behavior resolver; keep params primitive (numbers/strings).

**Example**
```json5
{
  "enemy.basic": {
    key: "enemy.basic",
    hp: 10, speed: 60, radius: 10, xp: 1,
    sprite: "enemy.basic",
    behaviors: ["move.down"]
  }
}
```

---

## `upgrades.json5`
Run upgrades (stats, weapons, supports). Effects are expressed as op lists.

**Schema**
```json5
{
  [upgradeKey: string]: {
    key: string,                     // required; must equal object key
    type: "Stat" | "Weapon" | "Support", // required
    slotCost: number,                // required; typically 1
    maxLevel: number,                // required; cap per run (matches config.upgradeMaxLevel)
    apply: UpgradeOp[]               // required; interpreted by UpgradeSystem
  }
}
```

**UpgradeOp (union)**
```ts
// documented for reference
 type UpgradeOp =
  | { op: "statAdd", path: string, amount: number }
  | { op: "statMult", path: string, factor: number }
  | { op: "healPct", pct: number }
  | { op: "equipWeapon", key: string }
  | { op: "spawnSupport", key: string, slot?: string }
  | { op: "grantCard", key: string };
```

**Example**
```json5
{
  "upg.health": {
    key: "upg.health", type: "Stat", slotCost: 1, maxLevel: 5,
    apply: [
      { op: "statAdd", path: "tower.maxHp", amount: 20 },
      { op: "healPct", pct: 100 }
    ]
  },
  "w.cannon": {
    key: "w.cannon", type: "Weapon", slotCost: 1, maxLevel: 5,
    apply: [ { op: "equipWeapon", key: "weapon.cannon" } ]
  }
}
```

---

## `cards.json5`
Level-up card pool; each card references an upgrade.

**Schema**
```json5
{
  [cardKey: string]: {
    key: string,                     // required; must equal object key
    title: string,                   // required; UI text
    desc: string,                    // required; UI description
    outcome: string,                 // required; upgrade key from upgrades.json5
    weight?: number                  // optional; selection weight (default 1)
  }
}
```

**Example**
```json5
{
  "card.health": { key: "card.health", title: "+20 Max HP", desc: "Bulk up.", outcome: "upg.health", weight: 1 }
}
```

---

## `waves.json5`
Defines spawn schedule and composition over time.

**Schema**
```json5
[
  {
    tStart: number,                  // required; inclusive (seconds)
    tEnd: number,                    // required; inclusive (seconds)
    table: [                         // required; enemy mixture and rates
      { enemy: string, rate: number } // rate per minute (converted to spawn intervals)
    ],
    modifiers?: string[]             // optional; behavior or difficulty tags (e.g., ["rush","tank"])
  }
]
```

**Example**
```json5
[
  { tStart: 0, tEnd: 600, table: [ { enemy: "enemy.basic", rate: 30 } ] }
]
```

---

## `boss.json5`
Blueprint for the 10-minute super enemy.

**Schema**
```json5
{
  key: string,                       // required; boss enemy key (may be distinct from enemies.json5)
  hp: number,                        // required
  radius: number,                    // required
  sprite?: string,                   // optional
  behaviors: string[]                // required; e.g., ["move.down","phase.shield(5,10)"]
}
```

**Example**
```json5
{
  key: "boss.super",
  hp: 2000, radius: 40, sprite: "boss.super",
  behaviors: ["move.down", "phase.shield(5,10)"]
}
```

---

## `supports.json5`
Prestige unlockable support buildings placed at run start.

**Schema**
```json5
{
  [supportKey: string]: {
    key: string,                     // required; must equal object key
    slot?: string,                   // optional; named placement (e.g., "ground-left")
    weapon?: string,                 // optional; weapon key to auto-fire
    aura?: {                         // optional; passive area effect
      stat: string,                  // path (e.g., "tower.damageMult")
      amount?: number,               // flat add
      factor?: number                // multiplier
    }
  }
}
```

**Example**
```json5
{
  "support.autoturret": { key: "support.autoturret", slot: "ground-left", weapon: "weapon.cannon" }
}
```

---

## `achievements.json5`
Achievement definitions and rewards.

**Schema**
```json5
{
  [achievementKey: string]: {
    title: string,                   // required; UI title
    desc?: string,                   // optional; UI description
    check: string,                   // required; predicate DSL (e.g., "player.level>=5")
    reward?: { prestige?: number }   // optional; rewards (extendable)
  }
}
```

**Example**
```json5
{
  "ach.level5": { title: "Hit Level 5", check: "player.level>=5", reward: { prestige: 5 } }
}
```

---

## `sprites.json5` (optional)
Sprite atlas mapping or individual sprite metadata.

**Schema**
```json5
{
  atlas?: string,                    // optional; path to atlas image
  frames?: {                         // optional; per-sprite frame rects in the atlas
    [spriteKey: string]: { x: number, y: number, w: number, h: number }
  },
  animations?: {                     // optional; named animations mapping to frame arrays
    [animKey: string]: { frames: string[], fps?: number, loop?: boolean }
  }
}
```

---

## Validation Rules (Summary)
- `cards[*].outcome` must exist in `upgrades.json5`.
- `weapons[*].projectile` must exist in `projectiles.json5`.
- `waves[*].table[*].enemy` must exist in `enemies.json5`.
- `boss.behaviors[*]` and `enemies[*].behaviors[*]` must resolve to known behavior keys.
- `upgrades` operations must be valid `UpgradeOp` shapes.
- Numbers must be finite and non-negative unless the field explicitly supports negatives (e.g., `cooldownPct`).

---

## Conventions
- Use kebab or dotted keys: `enemy.basic`, `weapon.railgun`.
- Keep behaviors narrowly-scoped; complex bosses are composed via multiple behavior entries.
- Prefer flat, explicit fields over deeply nested structures for ease of authoring.

