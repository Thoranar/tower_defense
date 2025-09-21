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

    // Check projectile vs enemy collisions
    for (const projectile of projectiles) {
      for (const enemy of enemies) {
        if (this.checkCircleCollision(projectile, enemy)) {
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

  private getDistance(entityA: Entity, entityB: Entity): number {
    const dx = entityA.pos.x - entityB.pos.x;
    const dy = entityA.pos.y - entityB.pos.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}