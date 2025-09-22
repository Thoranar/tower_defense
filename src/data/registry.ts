// Simple registry types for data-driven game objects
export type ProjectileBlueprint = {
  name: string;
  description: string;
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
    gravity: boolean;
    bounce: boolean;
  };
  effects: {
    trail: boolean;
    explosion: boolean;
  };
};

export type WeaponBlueprint = {
  name: string;
  description: string;
  type: string;
  projectileKey: string;
  baseCooldown: number;
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
  op: 'statAdd' | 'statMult' | 'statSet' | 'equipWeapon';
  target?: string;
  value?: number | boolean;
  weaponKey?: string;
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

export type Registry = {
  projectiles: Record<string, ProjectileBlueprint>;
  weapons: Record<string, WeaponBlueprint>;
  enemies: Record<string, EnemyBlueprint>;
  waves: WaveBlueprint[];
  cards: Record<string, CardBlueprint>;
  upgrades: Record<string, UpgradeBlueprint>;
  config: GameConfig;
};

// Simple synchronous loader for now (async loading in later milestones)
export async function loadRegistry(): Promise<Registry> {
  try {
    const [projectilesResponse, weaponsResponse, enemiesResponse, wavesResponse, cardsResponse, upgradesResponse, configResponse] = await Promise.all([
      fetch('/public/content/projectiles.json5'),
      fetch('/public/content/weapons.json5'),
      fetch('/public/content/enemies.json5'),
      fetch('/public/content/waves.json5'),
      fetch('/public/content/cards.json5'),
      fetch('/public/content/upgrades.json5'),
      fetch('/public/content/config.json5')
    ]);

    if (!projectilesResponse.ok || !weaponsResponse.ok || !enemiesResponse.ok || !wavesResponse.ok || !cardsResponse.ok || !upgradesResponse.ok || !configResponse.ok) {
      throw new Error('Failed to load content files');
    }

    const [projectilesText, weaponsText, enemiesText, wavesText, cardsText, upgradesText, configText] = await Promise.all([
      projectilesResponse.text(),
      weaponsResponse.text(),
      enemiesResponse.text(),
      wavesResponse.text(),
      cardsResponse.text(),
      upgradesResponse.text(),
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
    const waves = JSON.parse(cleanJson5(wavesText));
    const cards = JSON.parse(cleanJson5(cardsText));
    const upgrades = JSON.parse(cleanJson5(upgradesText));
    const config = JSON.parse(cleanJson5(configText));

    console.log('Registry loaded from JSON5 files:');
    console.log('- Bullet speed:', projectiles.bullet?.speed);
    console.log('- Bullet lifetime:', projectiles.bullet?.lifetime);
    console.log('- Cannon cooldown:', weapons.cannon?.baseCooldown);
    console.log('- Enemy types:', Object.keys(enemies));
    console.log('- Wave count:', waves.length);
    console.log('- Card types:', Object.keys(cards));
    console.log('- Upgrade types:', Object.keys(upgrades));
    console.log('- XP base per level:', config.xp?.basePerLevel);

    return {
      projectiles,
      weapons,
      enemies,
      waves,
      cards,
      upgrades,
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
          speed: 400,
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
            "1": [{ "op": "statAdd", "target": "tower.damageMult", "value": 0.25 }]
          }
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