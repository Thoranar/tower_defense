import { Entity } from './Entity.js';
import { ProjectileBlueprint } from '../data/registry.js';

// Projectile entity; damage, speed, owner
// Fired by towers and support buildings to damage enemies
// Contains damage values, collision detection, and lifetime management
export class Projectile extends Entity {
  damage: number;
  ownerId: number;
  lifetime: number;
  maxLifetime: number;
  piercing: boolean;
  maxHits: number;
  hitCount: number;
  // New physics properties
  gravity: boolean;
  bounce: boolean;
  bounceCount: number;
  bouncesRemaining: number;
  // New effects properties
  trail: boolean;
  explosion: boolean;
  explosionRadius: number;
  explosionDamage: number;

  // Blueprint reference for easy access to visual properties
  blueprint: ProjectileBlueprint;

  // Legacy constructor for backward compatibility
  constructor(x: number, y: number, vx: number, vy: number, damage: number, ownerId: number, lifetime: number = 3.0, radius: number = 3, piercing: boolean = false, maxHits: number = 1) {
    super();
    this.pos.x = x;
    this.pos.y = y;
    this.vel.x = vx;
    this.vel.y = vy;
    this.damage = damage;
    this.ownerId = ownerId;
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
    this.radius = radius;
    this.piercing = piercing;
    this.maxHits = maxHits;
    this.hitCount = 0;

    // Default values for new properties
    this.gravity = false;
    this.bounce = false;
    this.bounceCount = 0;
    this.bouncesRemaining = 0;
    this.trail = false;
    this.explosion = false;
    this.explosionRadius = 0;
    this.explosionDamage = 0;

    // Create a minimal blueprint for legacy usage
    this.blueprint = {
      name: "Legacy Projectile",
      description: "Backward compatibility projectile",
      baseDamage: damage,
      speed: Math.sqrt(vx*vx + vy*vy),
      lifetime: lifetime,
      radius: radius,
      visual: { type: "circle", color: "#ffff00", size: radius * 2 },
      physics: { piercing: piercing, maxHits: maxHits, gravity: false, bounce: false, bounceCount: 0 },
      effects: { trail: false, explosion: false, explosionRadius: 0, explosionDamage: 0 }
    };
  }

  // New blueprint-based constructor
  static fromBlueprint(blueprint: ProjectileBlueprint, x: number, y: number, vx: number, vy: number, damageMultiplier: number, ownerId: number): Projectile {
    const projectile = new Projectile(
      x, y, vx, vy,
      blueprint.baseDamage * damageMultiplier,
      ownerId,
      blueprint.lifetime,
      blueprint.radius,
      blueprint.physics.piercing,
      blueprint.physics.maxHits
    );

    // Set blueprint-specific properties
    projectile.blueprint = blueprint;
    projectile.gravity = blueprint.physics.gravity;
    projectile.bounce = blueprint.physics.bounce;
    projectile.bounceCount = blueprint.physics.bounceCount;
    projectile.bouncesRemaining = blueprint.physics.bounceCount;
    projectile.trail = blueprint.effects.trail;
    projectile.explosion = blueprint.effects.explosion;
    projectile.explosionRadius = blueprint.effects.explosionRadius;
    projectile.explosionDamage = blueprint.effects.explosionDamage;

    return projectile;
  }

  update(dt: number): void {
    this.lifetime -= dt;
    if (this.lifetime <= 0) {
      this.alive = false;
    }
  }

  /** Handle hitting an enemy - returns true if projectile should be destroyed */
  onHit(): boolean {
    this.hitCount++;

    // Non-piercing projectiles die on first hit
    if (!this.piercing) {
      this.alive = false;
      return true;
    }

    // Piercing projectiles die when they reach max hits
    if (this.hitCount >= this.maxHits) {
      this.alive = false;
      return true;
    }

    return false; // Projectile continues
  }
}