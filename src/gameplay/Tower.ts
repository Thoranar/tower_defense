import { Entity, Vec2 } from './Entity.js';
import { Weapon, FireContext } from './weapons/Weapon.js';
import { Projectile } from './Projectile.js';

// Tower stats type definition
export type TowerStats = {
  hp: number;
  maxHp: number;
  damageMult: number;
  fireRateMult: number;
  regen: number;
};

// Player tower; holds stats, weapons, and health
// Main player-controlled entity at bottom center of screen
// Manages weapon systems, health, and turret rotation
export class Tower extends Entity {
  stats: TowerStats;             // hp, maxHp, damageMult, fireRateMult, regen
  weapons: Weapon[] = [];        // equipped weapons
  turretAngle: number = 0;       // rad; controlled by input

  constructor(x: number, y: number) {
    super(x, y, 20); // Tower has radius of 20

    // Initialize default stats
    this.stats = {
      hp: 100,
      maxHp: 100,
      damageMult: 1.0,
      fireRateMult: 1.0,
      regen: 0
    };
  }

  /** Apply damage; emits TowerDamaged; ends run when hp<=0. */
  applyDamage(amount: number): void {
    this.stats.hp = Math.max(0, this.stats.hp - amount);
    console.log(`Tower took ${amount} damage, HP: ${this.stats.hp}/${this.stats.maxHp}`);

    if (this.stats.hp <= 0) {
      console.log('Tower destroyed!');
      // Game end logic will be handled in future milestones
    }
  }

  /** Add a weapon instance to the tower. */
  addWeapon(weapon: Weapon): void {
    this.weapons.push(weapon);
    console.log('Weapon added to tower');
  }

  /** Update turret angle based on input (called by input system) */
  setTurretAngle(angle: number): void {
    this.turretAngle = angle;
  }

  /** Get turret direction as unit vector */
  getTurretDirection(): Vec2 {
    return {
      x: Math.cos(this.turretAngle),
      y: Math.sin(this.turretAngle)
    };
  }

  /** Fire all weapons and return projectiles created */
  fireWeapons(fireRateMultiplier: number = 1.0, creators: any = null): Projectile[] {
    const projectiles: Projectile[] = [];

    for (const weapon of this.weapons) {
      const fireContext: FireContext = {
        ownerId: this.id,
        origin: { x: this.pos.x, y: this.pos.y },
        direction: this.getTurretDirection(),
        creators: creators
      };

      const newProjectiles = weapon.fire(fireContext, fireRateMultiplier);
      projectiles.push(...newProjectiles);
    }

    return projectiles;
  }

  /** Optional update for tower-specific logic */
  update(dt: number): void {
    // Apply regeneration if any
    if (this.stats.regen > 0 && this.stats.hp < this.stats.maxHp) {
      this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + this.stats.regen * dt);
    }

    // Update weapon cooldowns
    for (const weapon of this.weapons) {
      weapon.tick(dt);
    }
  }
}