// Simple registry types for data-driven game objects
export type ProjectileBlueprint = {
  name: string;
  description: string;
  baseDamage: number;
  speed: number;
  lifetime: number;
  radius: number;
  visual: {
    type: string;
    color: string;
    size: number;
  };
  physics: {
    piercing: boolean;
    maxHits: number;
    gravity: boolean;
    bounce: boolean;
    bounceCount: number;
  };
  effects: {
    trail: boolean;
    explosion: boolean;
    explosionRadius: number;
    explosionDamage: number;
  };
};

export type WeaponBlueprint = {
  name: string;
  description: string;
  type: string;
  projectileKey: string;
  baseCooldown: number;
  baseFireRate: number;
  damageMultiplier: number;
  scatterPattern: number;
  baseUpgradeStats: {
    damage: number;
    fireRate: number;
    range: number;
  };
  levelScaling: {
    damage: number;
    fireRate: number;
    range: number;
  };
  maxLevel: number;
  rarity: string;
};

export type EnemyBlueprint = {
  hp: number;
  maxHp: number;
  speed: number;
  xp: number;
  radius: number;
  behaviors: string[];
  sprite?: string;
  color: string;
  damage?: number;
  isBoss?: boolean;
  bossType?: 'mini' | 'final';
};

export type WaveBlueprint = {
  timeStart: number;
  timeEnd: number;
  spawnInterval: number;
  enemies: Array<{
    key: string;
    weight: number;
  }>;
};

export type MiniBossConfig = {
  enabled: boolean;
  interval: number; // Time interval between mini-boss spawns
  warningTime: number; // Warning duration before spawn
  statModifiers: {
    hp: number;
    damage: number;
    speed: number;
  };
  pool: string[]; // Keys of mini-bosses to choose from
};

export type FinalBossConfig = {
  spawnTime: number; // When final boss spawns (in seconds)
  warningTime: number; // Warning duration before spawn
  key: string; // Boss key to spawn
};

export type WaveConfig = {
  waves: WaveBlueprint[];
  miniBosses: MiniBossConfig;
  finalBoss: FinalBossConfig;
};

export type CardBlueprint = {
  name: string;
  description: string;
  rarity: string;
  weight: number;
  upgradeKey: string;
  visual: {
    icon: string;
    color: string;
  };
};

export type UpgradeEffect = {
  op: 'statAdd' | 'statMult' | 'statSet' | 'equipWeapon' | 'upgradeWeapon' | 'switchProjectile' | 'addWeaponSlot';
  target?: string;
  value?: number | boolean;
  weaponKey?: string;
  projectileKey?: string;
  weaponSlot?: number; // which weapon slot to target
  level?: number;
};

export type UpgradeBlueprint = {
  name: string;
  description: string;
  maxLevel: number;
  icon: string;
  color: string;
  effects: Record<string, UpgradeEffect[]>;
};

export type GameConfig = {
  xp: {
    basePerLevel: number;
    growthFactor: number;
    maxLevel: number;
    curve: number[];
  };
  cards: {
    draftSize: number;
    rarityWeights: Record<string, number>;
  };
  upgrades: {
    maxSlots: number;
    maxLevelPerUpgrade: number;
  };
  tower: {
    baseHealth: number;
    baseDamage: number;
    baseFireRate: number;
  };
  difficulty: {
    enemySpawnScale: number;
    enemyHealthScale: number;
    bossHealthScale: number;
  };
  timing: {
    runDuration: number;
    bossWarning: number;
    bossSpawn: number;
  };
  prestige: {
    baseReward: number;
    timeBonus: number;
    killBonus: number;
  };
};

export type ScatterPattern = {
  name: string;
  description: string;
  angles: number[]; // Angles in degrees
};

export type ScatterPatterns = {
  patterns: Record<string, ScatterPattern>;
};

export type Registry = {
  projectiles: Record<string, ProjectileBlueprint>;
  weapons: Record<string, WeaponBlueprint>;
  enemies: Record<string, EnemyBlueprint>;
  bosses: Record<string, EnemyBlueprint>;
  waveConfig: WaveConfig;
  waves: WaveBlueprint[]; // For backward compatibility
  cards: Record<string, CardBlueprint>;
  upgrades: Record<string, UpgradeBlueprint>;
  scatterPatterns: ScatterPatterns;
  config: GameConfig;
};

// Simple synchronous loader for now (async loading in later milestones)
export async function loadRegistry(): Promise<Registry> {
  try {
    // Determine base path for GitHub Pages vs local development
    const basePath = window.location.hostname === 'thoranar.github.io'
      ? '/tower_defense/public/content/'
      : './public/content/';

    const [projectilesResponse, weaponsResponse, enemiesResponse, bossesResponse, wavesResponse, cardsResponse, upgradesResponse, scatterPatternsResponse, configResponse] = await Promise.all([
      fetch(`${basePath}projectiles.json5`),
      fetch(`${basePath}weapons.json5`),
      fetch(`${basePath}enemies.json5`),
      fetch(`${basePath}boss.json5`),
      fetch(`${basePath}waves.json5`),
      fetch(`${basePath}cards.json5`),
      fetch(`${basePath}upgrades.json5`),
      fetch(`${basePath}scatterPatterns.json5`),
      fetch(`${basePath}config.json5`)
    ]);

    if (!projectilesResponse.ok || !weaponsResponse.ok || !enemiesResponse.ok || !bossesResponse.ok || !wavesResponse.ok || !cardsResponse.ok || !upgradesResponse.ok || !scatterPatternsResponse.ok || !configResponse.ok) {
      throw new Error('Failed to load content files');
    }

    const [projectilesText, weaponsText, enemiesText, bossesText, wavesText, cardsText, upgradesText, scatterPatternsText, configText] = await Promise.all([
      projectilesResponse.text(),
      weaponsResponse.text(),
      enemiesResponse.text(),
      bossesResponse.text(),
      wavesResponse.text(),
      cardsResponse.text(),
      upgradesResponse.text(),
      scatterPatternsResponse.text(),
      configResponse.text()
    ]);

    // Improved JSON5 parsing (remove comments and handle basic JSON5 syntax)
    const cleanJson5 = (text: string) => {
      // Remove single-line comments but preserve strings
      let cleaned = text;

      // Split by lines and process each line
      const lines = cleaned.split('\n');
      const processedLines = lines.map(line => {
        // Find the position of // that's not inside a string
        let inString = false;
        let escapeNext = false;
        let commentStart = -1;

        for (let i = 0; i < line.length - 1; i++) {
          if (escapeNext) {
            escapeNext = false;
            continue;
          }

          if (line[i] === '\\' && inString) {
            escapeNext = true;
            continue;
          }

          if (line[i] === '"' && !escapeNext) {
            inString = !inString;
            continue;
          }

          if (!inString && line[i] === '/' && line[i + 1] === '/') {
            commentStart = i;
            break;
          }
        }

        // Remove comment if found
        if (commentStart >= 0) {
          return line.substring(0, commentStart).trim();
        }

        return line.trim();
      });

      // Join lines and remove empty ones
      return processedLines
        .filter(line => line.length > 0)
        .join('\n');
    };

    const projectiles = JSON.parse(cleanJson5(projectilesText));
    const weapons = JSON.parse(cleanJson5(weaponsText));
    const enemies = JSON.parse(cleanJson5(enemiesText));
    const bosses = JSON.parse(cleanJson5(bossesText));
    const waveConfig = JSON.parse(cleanJson5(wavesText));
    const cards = JSON.parse(cleanJson5(cardsText));
    const upgrades = JSON.parse(cleanJson5(upgradesText));
    const scatterPatterns = JSON.parse(cleanJson5(scatterPatternsText));
    const config = JSON.parse(cleanJson5(configText));

    console.log('Registry loaded from JSON5 files:');
    console.log('- Bullet speed:', projectiles.bullet?.speed);
    console.log('- Bullet lifetime:', projectiles.bullet?.lifetime);
    console.log('- Cannon cooldown:', weapons.cannon?.baseCooldown);
    console.log('- Enemy types:', Object.keys(enemies));
    console.log('- Boss types:', Object.keys(bosses));
    console.log('- Wave count:', waveConfig.waves?.length || 0);
    console.log('- Mini-boss pool:', waveConfig.miniBosses?.pool || []);
    console.log('- Card types:', Object.keys(cards));
    console.log('- Upgrade types:', Object.keys(upgrades));
    console.log('- Scatter patterns:', Object.keys(scatterPatterns.patterns));
    console.log('- XP base per level:', config.xp?.basePerLevel);

    return {
      projectiles,
      weapons,
      enemies,
      bosses,
      waveConfig,
      waves: waveConfig.waves || [], // For backward compatibility
      cards,
      upgrades,
      scatterPatterns,
      config
    };
  } catch (error) {
    console.error('Failed to load registry:', error);
    // Return default registry for fallback
    return {
      projectiles: {
        bullet: {
          name: "Bullet",
          description: "Standard projectile",
          baseDamage: 10,
          speed: 400,
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
      bosses: {},
      waveConfig: {
        waves: [
          {
            timeStart: 0,
            timeEnd: 60,
            spawnInterval: 2.0,
            enemies: [{ key: "basic", weight: 100 }]
          }
        ],
        miniBosses: {
          enabled: false,
          interval: 60,
          warningTime: 10,
          statModifiers: { hp: 1.0, damage: 0.5, speed: 0.1 },
          pool: []
        },
        finalBoss: {
          spawnTime: 600,
          warningTime: 30,
          key: "ancientTitan"
        }
      },
      waves: [
        {
          timeStart: 0,
          timeEnd: 60,
          spawnInterval: 2.0,
          enemies: [{ key: "basic", weight: 100 }]
        }
      ],
      cards: {
        damage_boost: {
          name: "Damage Boost",
          description: "Increase tower damage by 25%",
          rarity: "common",
          weight: 100,
          upgradeKey: "damage_boost",
          visual: { icon: "⚔️", color: "#ff6b6b" }
        }
      },
      upgrades: {
        damage_boost: {
          name: "Damage Amplifier",
          description: "Increases tower damage output",
          maxLevel: 5,
          icon: "⚔️",
          color: "#ff6b6b",
          effects: {
            "1": [{ "op": "statMult", "target": "tower.damage", "value": 1.25 }]
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
        xp: {
          basePerLevel: 10,
          growthFactor: 1.2,
          maxLevel: 50,
          curve: [10, 12, 14, 17, 20, 24, 29, 35, 42, 50]
        },
        cards: {
          draftSize: 3,
          rarityWeights: { common: 70, uncommon: 25, rare: 5 }
        },
        upgrades: {
          maxSlots: 5,
          maxLevelPerUpgrade: 5
        },
        tower: {
          baseHealth: 100,
          baseDamage: 10,
          baseFireRate: 1.0
        },
        difficulty: {
          enemySpawnScale: 1.0,
          enemyHealthScale: 1.0,
          bossHealthScale: 1.0
        },
        timing: {
          runDuration: 600,
          bossWarning: 570,
          bossSpawn: 600
        },
        prestige: {
          baseReward: 1,
          timeBonus: 0.1,
          killBonus: 0.01
        }
      }
    };
  }
}