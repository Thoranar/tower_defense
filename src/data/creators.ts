import { Weapon } from '../gameplay/weapons/Weapon.js';
import { Cannon } from '../gameplay/weapons/Cannon.js';
import { Projectile } from '../gameplay/Projectile.js';
import { Enemy } from '../gameplay/Enemy.js';
import { Registry, ProjectileBlueprint, WeaponBlueprint, EnemyBlueprint } from './registry.js';
import { Vec2 } from '../gameplay/Entity.js';

// Tiny factory functions to instantiate entities/weapons from registry
// Provides controlled entity creation from blueprint data
// Only way to create game objects; prevents hardcoded values
export type Creators = {
  weapon(key: string, level?: number): Weapon;
  projectile(key: string, x: number, y: number, vx: number, vy: number, damage: number, ownerId: number): Projectile;
  enemy(key: string, pos: Vec2): Enemy;
  enemyFromBlueprint(key: string, blueprint: EnemyBlueprint, pos: Vec2): Enemy;
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

    projectile(key: string, x: number, y: number, vx: number, vy: number, damage: number, ownerId: number, piercing?: boolean, maxHits?: number): Projectile {
      const blueprint = registry.projectiles[key];
      if (!blueprint) {
        throw new Error(`Unknown projectile key: ${key}`);
      }

      return new Projectile(
        x, y, vx, vy, damage, ownerId,
        blueprint.lifetime,
        blueprint.radius,
        piercing ?? blueprint.physics?.piercing ?? false,
        maxHits ?? 1
      );
    },

    enemy(key: string, pos: Vec2): Enemy {
      let blueprint = registry.enemies[key];
      if (!blueprint) {
        // Check bosses registry
        blueprint = registry.bosses[key];
        if (!blueprint) {
          throw new Error(`Unknown enemy key: ${key}`);
        }
      }

      return new Enemy({
        hp: blueprint.hp,
        maxHp: blueprint.maxHp,
        xp: blueprint.xp,
        speed: blueprint.speed,
        radius: blueprint.radius,
        behaviorKeys: blueprint.behaviors,
        color: blueprint.color,
        pos: pos,
        damage: blueprint.damage ?? undefined,
        isBoss: blueprint.isBoss ?? undefined
      });
    },

    enemyFromBlueprint(key: string, blueprint: EnemyBlueprint, pos: Vec2): Enemy {
      return new Enemy({
        hp: blueprint.hp,
        maxHp: blueprint.maxHp,
        xp: blueprint.xp,
        speed: blueprint.speed,
        radius: blueprint.radius,
        behaviorKeys: blueprint.behaviors,
        color: blueprint.color,
        pos: pos,
        damage: blueprint.damage ?? undefined,
        isBoss: blueprint.isBoss ?? undefined
      });
    },

    registry // Add registry access for weapons
  };

  return creators as any; // Type workaround for now
}