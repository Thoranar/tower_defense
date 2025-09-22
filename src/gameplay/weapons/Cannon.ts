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

    const projectiles: Projectile[] = [];

    // Get scatter pattern from weapon blueprint
    const scatterLevel = this.blueprint.scatterPattern;
    const scatterPatterns = ctx.creators.registry?.scatterPatterns?.patterns;

    let scatterAngles = [0]; // Default single shot
    if (scatterPatterns && scatterPatterns[scatterLevel.toString()]) {
      const pattern = scatterPatterns[scatterLevel.toString()];
      scatterAngles = pattern.angles.map((angleDegrees: number) => angleDegrees * Math.PI / 180);
    }

    // Get projectile speed and radius from projectile blueprint (projectile-based properties)
    const projectileBlueprint = ctx.creators.registry?.projectiles[this.projectileKey];
    const speed = projectileBlueprint?.speed ?? 400;
    const radius = projectileBlueprint?.radius ?? 3;

    // Calculate weapon damage multiplier
    const weaponDamageMultiplier = this.blueprint.damageMultiplier;
    const baseDamage = this.blueprint.baseUpgradeStats.damage;
    const towerDamage = ctx.towerStats?.damage ?? baseDamage;
    const finalDamageMultiplier = weaponDamageMultiplier * (towerDamage / baseDamage);

    // Fire projectile for each scatter angle
    for (const angleOffset of scatterAngles) {
      // Calculate new direction with angle offset
      const currentAngle = Math.atan2(ctx.direction.y, ctx.direction.x) + angleOffset;
      const scatterDirection = {
        x: Math.cos(currentAngle),
        y: Math.sin(currentAngle)
      };

      // Calculate muzzle position (end of barrel)
      const muzzleX = ctx.origin.x + scatterDirection.x * this.barrelLength;
      const muzzleY = ctx.origin.y + scatterDirection.y * this.barrelLength;

      // Calculate velocity based on scatter direction and speed
      const vx = scatterDirection.x * speed;
      const vy = scatterDirection.y * speed;

      // Create projectile using creators (uses blueprint data)
      const projectile = ctx.creators.projectile(
        this.projectileKey,
        muzzleX,
        muzzleY,
        vx,
        vy,
        finalDamageMultiplier,
        ctx.ownerId
      );

      projectiles.push(projectile);
    }

    // Reset cooldown with fire rate multiplier applied
    this.resetCooldown(fireRateMultiplier);

    return projectiles;
  }
}