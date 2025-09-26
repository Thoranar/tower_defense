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
      baseDamage: 10,
      speed: 200,
      lifetime: 3.0,
      radius: 3,
      visual: { type: "circle", color: "#ffff00", size: 6 },
      physics: { piercing: false, maxHits: 1, gravity: false, bounce: false, bounceCount: 0 },
      effects: { trail: false, explosion: false, explosionRadius: 0, explosionDamage: 0 }
    }
  },
  weapons: {
    cannon: {
      name: "Cannon",
      description: "Standard cannon",
      type: "cannon",
      projectileKey: "bullet",
      baseCooldown: 1.0,
      baseFireRate: 1.0,
      damageMultiplier: 1.0,
      scatterPattern: 0,
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
  bosses: {
    shadowStalker: {
      hp: 50,
      maxHp: 50,
      speed: 40,
      xp: 25,
      radius: 20,
      behaviors: ["MoveDown"],
      color: "#8B008B",
      damage: 3,
      isBoss: true,
      bossType: "mini"
    }
  },
  waveConfig: {
    waves: [{
      timeStart: 0,
      timeEnd: 60,
      spawnInterval: 2.0,
      enemies: [{ key: "basic", weight: 100 }]
    }],
    miniBosses: {
      enabled: false,
      interval: 60,
      warningTime: 10,
      statModifiers: { hp: 1.0, damage: 0.5, speed: 0.1 },
      pool: ["shadowStalker"]
    },
    finalBoss: {
      spawnTime: 600,
      warningTime: 30,
      key: "shadowStalker"
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
    },
    rapid_cannon: {
      name: "Rapid Cannon",
      description: "Equip fast-firing cannon",
      rarity: "uncommon",
      weight: 70,
      upgradeKey: "equip_rapid_cannon",
      visual: { icon: "🚀", color: "#f39c12" }
    },
    scatter_cannon: {
      name: "Scatter Cannon",
      description: "Equip multi-shot cannon",
      rarity: "rare",
      weight: 40,
      upgradeKey: "equip_scatter_cannon",
      visual: { icon: "📡", color: "#9b59b6" }
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
        "1": [{ "op": "statMult", "target": "tower.damage", "value": 1.25 }],
        "2": [{ "op": "statMult", "target": "tower.damage", "value": 1.35 }],
        "3": [{ "op": "statMult", "target": "tower.damage", "value": 1.50 }],
        "4": [{ "op": "statMult", "target": "tower.damage", "value": 1.75 }],
        "5": [{ "op": "statMult", "target": "tower.damage", "value": 2.00 }]
      }
    },
    fire_rate: {
      name: "Rapid Fire",
      description: "Increases weapon firing speed",
      maxLevel: 5,
      icon: "🔥",
      color: "#ffa500",
      effects: {
        "1": [{ "op": "statMult", "target": "tower.fireRate", "value": 1.20 }],
        "2": [{ "op": "statMult", "target": "tower.fireRate", "value": 1.30 }],
        "3": [{ "op": "statMult", "target": "tower.fireRate", "value": 1.45 }],
        "4": [{ "op": "statMult", "target": "tower.fireRate", "value": 1.65 }],
        "5": [{ "op": "statMult", "target": "tower.fireRate", "value": 2.00 }]
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
    },
    equip_rapid_cannon: {
      name: "Rapid Cannon",
      description: "Equip fast-firing cannon",
      maxLevel: 1,
      icon: "🚀",
      color: "#f39c12",
      effects: {
        "1": [{ "op": "equipWeapon", "weaponKey": "rapidCannon", "level": 1, "weaponSlot": 0 }]
      }
    },
    equip_scatter_cannon: {
      name: "Scatter Cannon",
      description: "Equip multi-shot cannon",
      maxLevel: 1,
      icon: "📡",
      color: "#9b59b6",
      effects: {
        "1": [{ "op": "equipWeapon", "weaponKey": "scatterCannon", "level": 1, "weaponSlot": 0 }]
      }
    }
  },
  prestigeItems: {
    prestige_tower_damage: {
      category: "tower",
      name: "Tower Damage Boost",
      description: "Permanently increases tower base damage",
      icon: "tower_damage",
      maxLevel: 10,
      basePrice: 5,
      priceScaling: 1.5,
      effects: {
        "1": [{ "op": "statMult", "target": "tower.baseDamage", "value": 1.1 }]
      }
    }
  },
  scatterPatterns: {
    patterns: {
      "0": { name: "Single Shot", description: "Standard single projectile", angles: [0] },
      "1": { name: "Twin Shot", description: "Two projectiles at 25° spread", angles: [-25, 25] },
      "2": { name: "Triple Shot", description: "Three projectiles: center + 25° spread", angles: [-25, 0, 25] },
      "3": { name: "Quad Shot", description: "Four projectiles: 25° and 45° spread", angles: [-45, -25, 25, 45] }
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