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

export type Registry = {
  projectiles: Record<string, ProjectileBlueprint>;
  weapons: Record<string, WeaponBlueprint>;
};

// Simple synchronous loader for now (async loading in later milestones)
export async function loadRegistry(): Promise<Registry> {
  try {
    const [projectilesResponse, weaponsResponse] = await Promise.all([
      fetch('/public/content/projectiles.json5'),
      fetch('/public/content/weapons.json5')
    ]);

    if (!projectilesResponse.ok || !weaponsResponse.ok) {
      throw new Error('Failed to load content files');
    }

    const [projectilesText, weaponsText] = await Promise.all([
      projectilesResponse.text(),
      weaponsResponse.text()
    ]);

    // Simple JSON5 parsing (remove comments for basic JSON parsing)
    const cleanJson5 = (text: string) => {
      return text
        .split('\n')
        .map(line => line.replace(/\/\/.*$/, '').trim())
        .filter(line => line)
        .join('\n');
    };

    const projectiles = JSON.parse(cleanJson5(projectilesText));
    const weapons = JSON.parse(cleanJson5(weaponsText));

    console.log('Registry loaded from JSON5 files:');
    console.log('- Bullet speed:', projectiles.bullet?.speed);
    console.log('- Bullet lifetime:', projectiles.bullet?.lifetime);
    console.log('- Cannon cooldown:', weapons.cannon?.baseCooldown);

    return {
      projectiles,
      weapons
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
      }
    };
  }
}