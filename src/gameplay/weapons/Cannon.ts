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

    // Get projectile speed from registry and apply tower speed multiplier
    const projectileBlueprint = ctx.creators.registry?.projectiles[this.projectileKey];
    const baseSpeed = projectileBlueprint?.speed ?? 400;
    const speedMultiplier = ctx.towerStats?.projectileStats?.speedMult ?? 1.0;
    const speed = baseSpeed * speedMultiplier;


    // Calculate velocity based on direction and speed
    const vx = ctx.direction.x * speed;
    const vy = ctx.direction.y * speed;

    // Get damage from weapon blueprint and apply tower damage multiplier
    const baseDamage = this.blueprint.baseUpgradeStats.damage;
    const damageMultiplier = ctx.towerStats?.damageMult ?? 1.0;
    const damage = baseDamage * damageMultiplier;

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
      maxHits
    );

    // Reset cooldown with fire rate multiplier applied
    this.resetCooldown(fireRateMultiplier);

    return [projectile];
  }
}