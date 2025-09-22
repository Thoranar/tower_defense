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

// Additional stats for weapons and projectiles
export type WeaponStats = {
  scatterLevel: number; // 0=single, 1=2 shots at 25°, 2=3 shots (25° + center), 3=4 shots (25° + 45°)
};

export type ProjectileStats = {
  speedMult: number;
  piercing: boolean;
  maxHits: number;
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
  weaponStats: WeaponStats;      // weapon-related upgrades
  baseWeaponStats: WeaponStats;  // Original weapon stats
  projectileStats: ProjectileStats; // projectile-related upgrades
  baseProjectileStats: ProjectileStats; // Original projectile stats
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

    // Initialize base weapon stats
    this.baseWeaponStats = {
      scatterLevel: 0 // Single shot by default
    };

    // Initialize base projectile stats
    this.baseProjectileStats = {
      speedMult: 1.0,
      piercing: false,
      maxHits: 1
    };

    // Copy base stats to current stats
    this.stats = { ...this.baseStats };
    this.weaponStats = { ...this.baseWeaponStats };
    this.projectileStats = { ...this.baseProjectileStats };
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
      if (this.bus) {
        this.bus.emit('TowerDestroyed', { tower: this });
      }
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

  /** Get scatter angles for the given scatter level using registry configuration */
  private getScatterAngles(scatterLevel: number, registry: any): number[] {
    const scatterPatterns = registry?.scatterPatterns?.patterns;
    if (!scatterPatterns) {
      // Fallback to single shot if no patterns available
      console.warn('No scatter patterns found in registry, using single shot');
      return [0];
    }

    const pattern = scatterPatterns[scatterLevel.toString()];
    if (!pattern || !pattern.angles) {
      console.warn(`No scatter pattern found for level ${scatterLevel}, using single shot`);
      return [0];
    }

    // Convert degrees to radians
    return pattern.angles.map((angleDegrees: number) => angleDegrees * Math.PI / 180);
  }

  /** Fire all weapons and return projectiles created */
  fireWeapons(fireRateMultiplier: number = 1.0, creators: any = null): Projectile[] {
    const projectiles: Projectile[] = [];

    for (const weapon of this.weapons) {
      // Check if weapon can fire before attempting scatter shots
      if (!weapon.canFire()) {
        continue;
      }

      const scatterLevel = this.weaponStats.scatterLevel;
      const baseDirection = this.getTurretDirection();

      // Calculate scatter angles based on level
      const registry = creators?.registry;
      const scatterAngles = this.getScatterAngles(scatterLevel, registry);
      // console.log(`Scatter level: ${scatterLevel}, projectiles: ${scatterAngles.length}, angles: [${scatterAngles.map(a => (a * 180 / Math.PI).toFixed(1)).join(', ')}]°`);

      // Temporarily store original cooldown timer to restore after all scatter shots
      const originalTimer = (weapon as any).timer;

      for (const angleOffset of scatterAngles) {
        // Reset timer before each scatter shot to allow multiple fires
        (weapon as any).timer = 0;

        // Calculate new direction with angle offset
        const currentAngle = this.turretAngle + angleOffset;
        const scatterDirection = {
          x: Math.cos(currentAngle),
          y: Math.sin(currentAngle)
        };

        // Create fire context for this scatter shot
        const fireContext: FireContext = {
          ownerId: this.id,
          origin: { x: this.pos.x, y: this.pos.y },
          direction: scatterDirection,
          creators: creators,
          // Pass tower stats to weapons for upgrades
          towerStats: {
            damageMult: this.stats.damageMult,
            weaponStats: this.weaponStats,
            projectileStats: this.projectileStats
          }
        };

        const shotProjectiles = weapon.fire(fireContext, fireRateMultiplier);
        // console.log(`Fired ${shotProjectiles.length} projectiles at angle ${(angleOffset * 180 / Math.PI).toFixed(1)}°`);
        projectiles.push(...shotProjectiles);
      }

      // Restore the weapon cooldown after all scatter shots are complete
      // This ensures the weapon has proper cooldown between volleys
    }

    // console.log(`Total projectiles created: ${projectiles.length}`);
    return projectiles;
  }

  /** Apply a stat modification from an upgrade. */
  private applyStatModification(data: StatModificationEvent): void {
    const { op, target, value } = data;

    // Parse target (e.g., "tower.damageMult", "weapon.projectileCount", "projectile.speedMult")
    const targetParts = target.split('.');
    if (targetParts.length !== 2) {
      console.warn(`Invalid stat target format: ${target}`);
      return;
    }

    const [category, statKey] = targetParts;

    switch (category) {
      case 'tower':
        this.applyTowerStat(statKey as keyof TowerStats, op, value);
        break;
      case 'weapon':
        this.applyWeaponStat(statKey as keyof WeaponStats, op, value);
        break;
      case 'projectile':
        this.applyProjectileStat(statKey as keyof ProjectileStats, op, value);
        break;
      default:
        console.warn(`Unknown stat category: ${category}`);
    }
  }

  /** Apply tower stat modification */
  private applyTowerStat(statKey: keyof TowerStats, op: string, value: number | boolean): void {
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
      if (this.stats.hp === currentValue) {
        this.stats.hp = newValue;
      } else if (this.stats.hp > newValue) {
        this.stats.hp = newValue;
      }
    }
  }

  /** Apply weapon stat modification */
  private applyWeaponStat(statKey: keyof WeaponStats, op: string, value: number | boolean): void {
    if (!(statKey in this.weaponStats)) {
      console.warn(`Unknown weapon stat: ${statKey}`);
      return;
    }

    const currentValue = this.weaponStats[statKey] as number;
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

    (this.weaponStats as any)[statKey] = newValue;
    console.log(`Weapon ${statKey}: ${currentValue} -> ${newValue}`);
  }

  /** Apply projectile stat modification */
  private applyProjectileStat(statKey: keyof ProjectileStats, op: string, value: number | boolean): void {
    if (!(statKey in this.projectileStats)) {
      console.warn(`Unknown projectile stat: ${statKey}`);
      return;
    }

    const currentValue = this.projectileStats[statKey];
    let newValue: number | boolean;

    switch (op) {
      case 'add':
        newValue = (currentValue as number) + (value as number);
        break;
      case 'mult':
        newValue = (currentValue as number) * (value as number);
        break;
      case 'set':
        newValue = value;
        break;
      default:
        console.warn(`Unknown stat operation: ${op}`);
        return;
    }

    (this.projectileStats as any)[statKey] = newValue;
    console.log(`Projectile ${statKey}: ${currentValue} -> ${newValue}`);
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
    this.weaponStats = { ...this.baseWeaponStats };
    this.projectileStats = { ...this.baseProjectileStats };
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