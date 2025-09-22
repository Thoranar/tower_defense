import { Vec2 } from '../Entity.js';
import { Projectile } from '../Projectile.js';

export type FireContext = {
  ownerId: number;
  origin: Vec2;
  direction: Vec2;
  creators: any; // TODO: type this properly when creators are implemented
  towerStats?: {
    damage: number;
    weaponStats: any;
    projectileStats: any;
  };
};

// Abstract weapon class; defines fire method and cooldown logic
// Base class for all weapon types with common firing mechanics
// Manages cooldowns, projectile creation, and upgrade scaling
export abstract class Weapon {
  key: string;
  level: number;
  cooldown: number;
  timer: number;
  projectileKey: string;

  constructor(key: string, level: number = 1, cooldown: number, projectileKey: string) {
    this.key = key;
    this.level = level;
    this.cooldown = cooldown;
    this.timer = 0;
    this.projectileKey = projectileKey;
  }

  tick(dt: number): void {
    if (this.timer > 0) {
      this.timer -= dt;
    }
  }

  canFire(): boolean {
    return this.timer <= 0;
  }

  abstract fire(ctx: FireContext, fireRateMultiplier?: number): Projectile[];

  protected resetCooldown(fireRateMultiplier: number = 1.0): void {
    this.timer = this.cooldown / fireRateMultiplier;
  }
}