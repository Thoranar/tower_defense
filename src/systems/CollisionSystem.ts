// Detects and resolves collisions (enemy↔projectile, enemy↔ground)
// Performs broad and narrow phase collision detection
// Generates collision events for other systems to process

import { World } from '../core/World.js';
import { EventBus } from '../core/EventBus.js';
import { Entity } from '../gameplay/Entity.js';
import { Projectile } from '../gameplay/Projectile.js';
import { Enemy } from '../gameplay/Enemy.js';
import { Tower } from '../gameplay/Tower.js';

export type CollisionPair = {
  entityA: Entity;
  entityB: Entity;
  distance: number;
  type: 'projectile-enemy' | 'enemy-ground' | 'enemy-tower';
};

export class CollisionSystem {
  private world: World;
  private bus: EventBus;
  private collisionPairs: CollisionPair[] = [];
  private groundY: number = 600; // TODO: Get from viewport/config

  constructor(args: { world: World; bus: EventBus }) {
    this.world = args.world;
    this.bus = args.bus;
  }

  /** Detect projectile↔enemy and enemy↔ground/tower; produce collision pairs */
  update(dt: number): void {
    // Clear previous frame's collisions
    this.collisionPairs = [];

    const entities = Array.from(this.world.all());
    const projectiles = entities.filter((e): e is Projectile => e instanceof Projectile);
    const enemies = entities.filter((e): e is Enemy => e instanceof Enemy);
    const towers = entities.filter((e): e is Tower => e instanceof Tower);

    // Check projectile vs enemy collisions using CCD
    for (const projectile of projectiles) {
      for (const enemy of enemies) {
        if (this.checkRayCircleCollision(projectile, enemy)) {
          this.collisionPairs.push({
            entityA: projectile,
            entityB: enemy,
            distance: this.getDistance(projectile, enemy),
            type: 'projectile-enemy'
          });
        }
      }
    }

    // Check enemy vs ground collisions
    for (const enemy of enemies) {
      if (enemy.pos.y + enemy.radius >= this.groundY) {
        this.collisionPairs.push({
          entityA: enemy,
          entityB: enemy, // Self-reference for ground collision
          distance: 0,
          type: 'enemy-ground'
        });
      }
    }

    // Check enemy vs tower collisions
    for (const enemy of enemies) {
      for (const tower of towers) {
        if (this.checkCircleCollision(enemy, tower)) {
          this.collisionPairs.push({
            entityA: enemy,
            entityB: tower,
            distance: this.getDistance(enemy, tower),
            type: 'enemy-tower'
          });
        }
      }
    }

    // Emit collision events for CombatSystem to handle
    if (this.collisionPairs.length > 0) {
      this.bus.emit('CollisionsDetected', this.collisionPairs);
    }
  }

  /** Get current collision pairs for dev tools visualization */
  getCollisionPairs(): CollisionPair[] {
    return [...this.collisionPairs];
  }

  private checkCircleCollision(entityA: Entity, entityB: Entity): boolean {
    const distance = this.getDistance(entityA, entityB);
    const combinedRadius = entityA.radius + entityB.radius;
    return distance <= combinedRadius;
  }

  /** Continuous Collision Detection: Ray vs Circle intersection */
  private checkRayCircleCollision(projectile: Entity, enemy: Entity): boolean {
    // Vector for the projectile's movement (the ray)
    const d = {
      x: projectile.pos.x - projectile.prevPos.x,
      y: projectile.pos.y - projectile.prevPos.y
    };

    // Vector from the enemy center to the projectile's start position
    const f = {
      x: projectile.prevPos.x - enemy.pos.x,
      y: projectile.prevPos.y - enemy.pos.y
    };

    const a = d.x * d.x + d.y * d.y; // dot(d, d)
    const b = 2 * (f.x * d.x + f.y * d.y); // 2 * dot(f, d)
    const combinedRadius = enemy.radius + projectile.radius;
    const c = (f.x * f.x + f.y * f.y) - combinedRadius * combinedRadius; // dot(f, f) - r^2

    let discriminant = b * b - 4 * a * c;
    if (discriminant < 0) {
      // No intersection
      return false;
    } else {
      // Ray intersects circle; find the intersection times (t)
      discriminant = Math.sqrt(discriminant);
      const t1 = (-b - discriminant) / (2 * a);
      const t2 = (-b + discriminant) / (2 * a);

      // Check if either intersection point is within the ray segment [0, 1]
      if (t1 >= 0 && t1 <= 1) {
        return true; // Collision occurred
      }
      if (t2 >= 0 && t2 <= 1) {
        return true; // Collision occurred
      }

      return false; // Intersections are outside the path segment
    }
  }

  private getDistance(entityA: Entity, entityB: Entity): number {
    const dx = entityA.pos.x - entityB.pos.x;
    const dy = entityA.pos.y - entityB.pos.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}