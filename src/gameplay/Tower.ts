import { Entity, Vec2 } from './Entity.js';
import { Weapon, FireContext } from './weapons/Weapon.js';
import { Projectile } from './Projectile.js';
import { EventBus } from '../core/EventBus.js';

// Tower stats type definition
export type TowerStats = {
  hp: number;
  maxHp: number;
  damageMult: number;
  fireRateMult: number;
  regen: number;
};

export type StatModificationEvent = {
  op: 'add' | 'mult' | 'set';
  target: string;
  value: number | boolean;
};

export type EquipWeaponEvent = {
  weaponKey: string;
  level: number;
};

// Player tower; holds stats, weapons, and health
// Main player-controlled entity at bottom center of screen
// Manages weapon systems, health, and turret rotation
export class Tower extends Entity {
  stats: TowerStats;             // hp, maxHp, damageMult, fireRateMult, regen
  baseStats: TowerStats;         // Original stats before upgrades
  weapons: Weapon[] = [];        // equipped weapons
  turretAngle: number = 0;       // rad; controlled by input
  private bus: EventBus | null;

  constructor(x: number, y: number, bus?: EventBus) {
    super(x, y, 20); // Tower has radius of 20

    // Initialize base stats
    this.baseStats = {
      hp: 100,
      maxHp: 100,
      damageMult: 1.0,
      fireRateMult: 1.0,
      regen: 0
    };

    // Copy base stats to current stats
    this.stats = { ...this.baseStats };
    this.bus = bus || null;

    // Listen for upgrade events if bus is provided
    if (this.bus) {
      this.bus.on('StatModification', (data: StatModificationEvent) => {
        this.applyStatModification(data);
      });

      this.bus.on('EquipWeapon', (data: EquipWeaponEvent) => {
        this.handleEquipWeapon(data);
      });
    }
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

  /** Apply a stat modification from an upgrade. */
  private applyStatModification(data: StatModificationEvent): void {
    const { op, target, value } = data;
    console.log(`Applying stat modification: ${op} ${target} ${value}`);

    // Parse target (e.g., "tower.damageMult")
    const targetParts = target.split('.');
    if (targetParts[0] !== 'tower' || targetParts.length !== 2) {
      console.warn(`Invalid tower stat target: ${target}`);
      return;
    }

    const statKey = targetParts[1] as keyof TowerStats;
    if (!(statKey in this.stats)) {
      console.warn(`Unknown tower stat: ${statKey}`);
      return;
    }

    const currentValue = this.stats[statKey] as number;
    let newValue: number;

    switch (op) {
      case 'add':
        newValue = currentValue + (value as number);
        break;
      case 'mult':
        newValue = currentValue * (value as number);
        break;
      case 'set':
        newValue = value as number;
        break;
      default:
        console.warn(`Unknown stat operation: ${op}`);
        return;
    }

    (this.stats as any)[statKey] = newValue;
    console.log(`Tower ${statKey}: ${currentValue} -> ${newValue}`);

    // Special handling for maxHp changes - adjust current HP if needed
    if (statKey === 'maxHp') {
      // If maxHp increased and we were at full health, restore to new max
      if (this.stats.hp === currentValue) {
        this.stats.hp = newValue;
      }
      // If current HP exceeds new max, cap it
      else if (this.stats.hp > newValue) {
        this.stats.hp = newValue;
      }
    }
  }

  /** Handle equipping a new weapon. */
  private handleEquipWeapon(data: EquipWeaponEvent): void {
    console.log(`Equipping weapon: ${data.weaponKey} level ${data.level}`);
    // For now, just log - we'll need to implement weapon creation in the integration
    // This would typically use the creators to make a weapon instance
  }

  /** Reset tower stats to base values (for run restart). */
  reset(): void {
    // Reset to base stats
    this.stats = { ...this.baseStats };
    this.turretAngle = 0;
    this.weapons = [];
    console.log('Tower reset to base stats and full health');
  }

  /** Get derived stats for display (shows the effects of all upgrades). */
  getDerivedStats(): TowerStats & {
    damageMultDisplay: string;
    fireRateMultDisplay: string;
    regenDisplay: string;
  } {
    return {
      ...this.stats,
      damageMultDisplay: `${(this.stats.damageMult * 100).toFixed(0)}%`,
      fireRateMultDisplay: `${(this.stats.fireRateMult * 100).toFixed(0)}%`,
      regenDisplay: this.stats.regen > 0 ? `+${this.stats.regen.toFixed(1)}/s` : 'None'
    };
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