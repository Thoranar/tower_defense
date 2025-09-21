// Simple downward movement behavior
// Basic enemy movement pattern that moves straight down
// Primary movement behavior for most enemy types

import { Entity } from '../Entity.js';

export class MoveDown {
  /** Apply downward movement to an entity based on its speed and dt */
  static apply(entity: Entity, dt: number): void {
    // Simple downward movement
    entity.pos.y += entity.vel.y * dt;
  }

  /** Set up velocity for downward movement based on enemy speed */
  static initialize(entity: Entity, speed: number): void {
    entity.vel.y = speed;
    entity.vel.x = 0;
  }
}