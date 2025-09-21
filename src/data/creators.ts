import { Weapon } from '../gameplay/weapons/Weapon.js';
import { Cannon } from '../gameplay/weapons/Cannon.js';
import { Projectile } from '../gameplay/Projectile.js';
import { Registry, ProjectileBlueprint, WeaponBlueprint } from './registry.js';

// Tiny factory functions to instantiate entities/weapons from registry
// Provides controlled entity creation from blueprint data
// Only way to create game objects; prevents hardcoded values
export type Creators = {
  weapon(key: string, level?: number): Weapon;
  projectile(key: string, x: number, y: number, vx: number, vy: number, damage: number, ownerId: number): Projectile;
};

export function makeCreators(registry: Registry): Creators {
  const creators = {
    weapon(key: string, level: number = 1): Weapon {
      const blueprint = registry.weapons[key];
      if (!blueprint) {
        throw new Error(`Unknown weapon key: ${key}`);
      }

      switch (blueprint.type) {
        case 'cannon':
          return new Cannon(level, blueprint);
        default:
          throw new Error(`Unknown weapon type: ${blueprint.type}`);
      }
    },

    projectile(key: string, x: number, y: number, vx: number, vy: number, damage: number, ownerId: number): Projectile {
      const blueprint = registry.projectiles[key];
      if (!blueprint) {
        throw new Error(`Unknown projectile key: ${key}`);
      }

      return new Projectile(x, y, vx, vy, damage, ownerId, blueprint.lifetime, blueprint.radius);
    },

    registry // Add registry access for weapons
  };

  return creators as any; // Type workaround for now
}