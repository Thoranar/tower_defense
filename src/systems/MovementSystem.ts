// Updates entity positions and applies behaviors
// Integrates velocity into position and executes entity movement behaviors
// Handles physics-based movement and behavior pattern execution

import { World } from '../core/World.js';
import { Enemy } from '../gameplay/Enemy.js';
import { Registry } from '../data/registry.js';
import { MoveDown } from '../gameplay/behaviors/MoveDown.js';

export class MovementSystem {
  private world: World;
  private registry: Registry;

  constructor(args: { world: World; reg: Registry }) {
    this.world = args.world;
    this.registry = args.reg;
  }

  /** Integrate positions by velocity; apply behavior updates */
  update(dt: number): void {
    for (const entity of this.world.all()) {
      // Apply behaviors for enemies
      if (entity instanceof Enemy) {
        this.applyEnemyBehaviors(entity, dt);
      }

      // Basic position integration for all entities
      entity.pos.x += entity.vel.x * dt;
      entity.pos.y += entity.vel.y * dt;

      // Remove entities that fall off screen
      if (entity.pos.y > 800) { // TODO: Get from viewport
        entity.alive = false;
      }
    }
  }

  private applyEnemyBehaviors(enemy: Enemy, dt: number): void {
    // Apply each behavior the enemy has
    for (const behaviorKey of enemy.behaviorKeys) {
      switch (behaviorKey) {
        case 'MoveDown':
          MoveDown.apply(enemy, dt);
          break;
        default:
          console.warn(`Unknown behavior: ${behaviorKey}`);
      }
    }
  }
}