import { Weapon, FireContext } from './Weapon.js';
import { Projectile } from '../Projectile.js';
import { WeaponBlueprint } from '../../data/registry.js';

// Concrete cannon weapon for MVP
// Basic single-shot weapon that fires projectiles in turret direction
// Primary weapon type for initial game implementation
export class Cannon extends Weapon {
  private blueprint: WeaponBlueprint;
  private barrelLength: number = 25; // Distance from tower center to muzzle

  constructor(level: number = 1, blueprint: WeaponBlueprint) {
    super('cannon', level, blueprint.baseCooldown, blueprint.projectileKey);
    this.blueprint = blueprint;
  }

  fire(ctx: FireContext, fireRateMultiplier: number = 1.0): Projectile[] {
    if (!this.canFire() || !ctx.creators) {
      return [];
    }

    // Calculate muzzle position (end of barrel)
    const muzzleX = ctx.origin.x + ctx.direction.x * this.barrelLength;
    const muzzleY = ctx.origin.y + ctx.direction.y * this.barrelLength;

    // Get projectile speed and radius from tower stats (already upgraded values)
    const speed = ctx.towerStats?.projectileStats?.speed ?? 400;
    const radius = ctx.towerStats?.projectileStats?.radius ?? 3;


    // Calculate velocity based on direction and speed
    const vx = ctx.direction.x * speed;
    const vy = ctx.direction.y * speed;

    // Get damage from tower stats (already upgraded value)
    const baseDamage = this.blueprint.baseUpgradeStats.damage;
    const damage = ctx.towerStats?.damage ?? baseDamage;

    // Get piercing stats from tower
    const piercing = ctx.towerStats?.projectileStats?.piercing ?? false;
    const maxHits = ctx.towerStats?.projectileStats?.maxHits ?? 1;

    // Create projectile using creators (which will use registry data)
    const projectile = ctx.creators.projectile(
      this.projectileKey,
      muzzleX,
      muzzleY,
      vx,
      vy,
      damage,
      ctx.ownerId,
      piercing,
      maxHits,
      radius
    );

    // Reset cooldown with fire rate multiplier applied
    this.resetCooldown(fireRateMultiplier);

    return [projectile];
  }
}