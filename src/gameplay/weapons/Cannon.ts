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

    // Get projectile speed from registry
    const projectileBlueprint = ctx.creators.registry?.projectiles[this.projectileKey];
    const speed = projectileBlueprint?.speed ?? 400;

    console.log(`Cannon firing: speed=${speed}, direction=(${ctx.direction.x.toFixed(2)}, ${ctx.direction.y.toFixed(2)})`);

    // Calculate velocity based on direction and speed
    const vx = ctx.direction.x * speed;
    const vy = ctx.direction.y * speed;

    // Get damage from weapon blueprint
    const damage = this.blueprint.baseUpgradeStats.damage;

    // Create projectile using creators (which will use registry data)
    const projectile = ctx.creators.projectile(
      this.projectileKey,
      muzzleX,
      muzzleY,
      vx,
      vy,
      damage,
      ctx.ownerId
    );

    // Reset cooldown with fire rate multiplier applied
    this.resetCooldown(fireRateMultiplier);

    return [projectile];
  }
}