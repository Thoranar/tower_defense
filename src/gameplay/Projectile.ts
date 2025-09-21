import { Entity } from './Entity.js';

// Projectile entity; damage, speed, owner
// Fired by towers and support buildings to damage enemies
// Contains damage values, collision detection, and lifetime management
export class Projectile extends Entity {
  damage: number;
  ownerId: number;
  lifetime: number;
  maxLifetime: number;

  constructor(x: number, y: number, vx: number, vy: number, damage: number, ownerId: number, lifetime: number = 3.0, radius: number = 3) {
    super();
    this.pos.x = x;
    this.pos.y = y;
    this.vel.x = vx;
    this.vel.y = vy;
    this.damage = damage;
    this.ownerId = ownerId;
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
    this.radius = radius; // Collision radius from data
  }

  update(dt: number): void {
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;

    this.lifetime -= dt;
    if (this.lifetime <= 0) {
      this.alive = false;
    }
  }
}