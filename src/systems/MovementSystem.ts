// Updates entity positions and applies behaviors
// Integrates velocity into position and executes entity movement behaviors
// Handles physics-based movement and behavior pattern execution

import { World } from '../core/World.js';
import { Enemy } from '../gameplay/Enemy.js';
import { Registry } from '../data/registry.js';
import { MoveDown } from '../gameplay/behaviors/MoveDown.js';
import { MoveToCenter } from '../gameplay/behaviors/MoveToCenter.js';
import { EventBus } from '../core/EventBus.js';

export class MovementSystem {
  private world: World;
  private registry: Registry;
  private bus: EventBus | null = null;

  constructor(args: { world: World; reg: Registry; bus?: EventBus }) {
    this.world = args.world;
    this.registry = args.reg;
    this.bus = args.bus || null;
  }

  /** Integrate positions by velocity; apply behavior updates */
  update(dt: number): void {
    for (const entity of this.world.all()) {
      // Store current position as previous position for CCD
      entity.prevPos.x = entity.pos.x;
      entity.prevPos.y = entity.pos.y;

      // Apply behaviors for enemies
      if (entity instanceof Enemy) {
        this.applyEnemyBehaviors(entity, dt);
      }

      // Basic position integration for all entities
      entity.pos.x += entity.vel.x * dt;
      entity.pos.y += entity.vel.y * dt;

      // Handle enemies that reach the center (tower position)
      if (entity instanceof Enemy) {
        const center = MoveToCenter.getCenter();
        const dx = entity.pos.x - center.x;
        const dy = entity.pos.y - center.y;
        const distanceToCenter = Math.sqrt(dx * dx + dy * dy);

        // Enemy reached the tower (within collision distance ~40 pixels)
        if (distanceToCenter < 40) {
          if (this.isBoss(entity)) {
            // Boss reaching center ends the run
            if (this.bus) {
              this.bus.emit('BossReachedGround', { boss: entity });
            }
            console.log('Boss reached the center! Game over.');
          }
          entity.alive = false;
        }
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
        case 'MoveToCenter':
          MoveToCenter.apply(enemy, dt);
          break;
        default:
          console.warn(`Unknown behavior: ${behaviorKey}`);
      }
    }
  }

  /** Check if an enemy is a boss */
  private isBoss(enemy: Enemy): boolean {
    // Use the isBoss flag that's set during enemy creation
    return enemy.isBoss === true;
  }
}