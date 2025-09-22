import { Registry } from './registry.js';

/**
 * Fallback registry used when JSON5 files fail to load.
 * This should match the structure of the actual JSON5 files.
 * In production, this fallback should be minimal or removed entirely.
 */
export const FALLBACK_REGISTRY: Registry = {
  projectiles: {
    bullet: {
      name: "Bullet",
      description: "Standard projectile",
      speed: 200,
      lifetime: 3.0,
      radius: 3,
      visual: { type: "circle", color: "#ffff00", size: 6 },
      physics: { piercing: false, gravity: false, bounce: false },
      effects: { trail: false, explosion: false }
    }
  },
  weapons: {
    cannon: {
      name: "Cannon",
      description: "Standard cannon",
      type: "cannon",
      projectileKey: "bullet",
      baseCooldown: 1.0,
      baseUpgradeStats: { damage: 10, fireRate: 1.0, range: 300 },
      levelScaling: { damage: 1.2, fireRate: 1.1, range: 1.05 },
      maxLevel: 5,
      rarity: "common"
    }
  },
  enemies: {
    basic: {
      hp: 3,
      maxHp: 3,
      speed: 60,
      xp: 1,
      radius: 12,
      behaviors: ["MoveDown"],
      color: "#FF6B6B"
    }
  },
  waves: [{
    timeStart: 0,
    timeEnd: 60,
    spawnInterval: 2.0,
    enemies: [{ key: "basic", weight: 100 }]
  }],
  cards: {
    damage_boost: {
      name: "Damage Boost",
      description: "Increase tower damage by 25%",
      rarity: "common",
      weight: 100,
      upgradeKey: "damage_boost",
      visual: { icon: "⚔️", color: "#ff6b6b" }
    },
    fire_rate: {
      name: "Rapid Fire",
      description: "Increase fire rate by 20%",
      rarity: "common",
      weight: 100,
      upgradeKey: "fire_rate",
      visual: { icon: "🔥", color: "#ffa500" }
    },
    tower_health: {
      name: "Reinforced Armor",
      description: "Increase tower HP by 50",
      rarity: "common",
      weight: 80,
      upgradeKey: "tower_health",
      visual: { icon: "🛡️", color: "#4ecdc4" }
    }
  },
  upgrades: {
    damage_boost: {
      name: "Damage Boost",
      description: "Increases tower damage output",
      maxLevel: 5,
      icon: "⚔️",
      color: "#ff6b6b",
      effects: {
        "1": [{ "op": "statAdd", "target": "tower.damageMult", "value": 0.25 }],
        "2": [{ "op": "statAdd", "target": "tower.damageMult", "value": 0.35 }],
        "3": [{ "op": "statAdd", "target": "tower.damageMult", "value": 0.50 }],
        "4": [{ "op": "statAdd", "target": "tower.damageMult", "value": 0.75 }],
        "5": [{ "op": "statAdd", "target": "tower.damageMult", "value": 1.00 }]
      }
    },
    fire_rate: {
      name: "Rapid Fire",
      description: "Increases weapon firing speed",
      maxLevel: 5,
      icon: "🔥",
      color: "#ffa500",
      effects: {
        "1": [{ "op": "statAdd", "target": "tower.fireRateMult", "value": 0.20 }],
        "2": [{ "op": "statAdd", "target": "tower.fireRateMult", "value": 0.30 }],
        "3": [{ "op": "statAdd", "target": "tower.fireRateMult", "value": 0.45 }],
        "4": [{ "op": "statAdd", "target": "tower.fireRateMult", "value": 0.65 }],
        "5": [{ "op": "statAdd", "target": "tower.fireRateMult", "value": 1.00 }]
      }
    },
    tower_health: {
      name: "Reinforced Armor",
      description: "Increases tower maximum health",
      maxLevel: 5,
      icon: "🛡️",
      color: "#4ecdc4",
      effects: {
        "1": [{ "op": "statAdd", "target": "tower.maxHp", "value": 50 }],
        "2": [{ "op": "statAdd", "target": "tower.maxHp", "value": 75 }],
        "3": [{ "op": "statAdd", "target": "tower.maxHp", "value": 100 }],
        "4": [{ "op": "statAdd", "target": "tower.maxHp", "value": 150 }],
        "5": [{ "op": "statAdd", "target": "tower.maxHp", "value": 200 }]
      }
    }
  },
  config: {
    xp: { basePerLevel: 10, growthFactor: 1.2, maxLevel: 50, curve: [10, 12, 14, 17, 20] },
    cards: { draftSize: 3, rarityWeights: { common: 70, uncommon: 25, rare: 5 } },
    upgrades: { maxSlots: 5, maxLevelPerUpgrade: 5 },
    tower: { baseHealth: 100, baseDamage: 10, baseFireRate: 1.0 },
    difficulty: { enemySpawnScale: 1.0, enemyHealthScale: 1.0, bossHealthScale: 1.0 },
    timing: { runDuration: 600, bossWarning: 570, bossSpawn: 600 },
    prestige: { baseReward: 1, timeBonus: 0.1, killBonus: 0.01 }
  }
};