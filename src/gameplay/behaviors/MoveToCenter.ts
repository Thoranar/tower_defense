// Radial movement behavior toward screen center
// Moves enemy from spawn position toward the tower in the center
// Replaces vertical movement for 360-degree gameplay

import { Entity, Vec2 } from '../Entity.js';

export class MoveToCenter {
  // Store the center position as a static property
  private static centerPos: Vec2 = { x: 400, y: 400 };

  /** Set the center position (called when canvas is resized or initialized) */
  static setCenter(x: number, y: number): void {
    MoveToCenter.centerPos.x = x;
    MoveToCenter.centerPos.y = y;
  }

  /** Get the current center position */
  static getCenter(): Vec2 {
    return { ...MoveToCenter.centerPos };
  }

  /** Apply movement toward center based on entity speed and dt */
  static apply(entity: Entity, dt: number): void {
    // Calculate direction from enemy to center
    const dx = MoveToCenter.centerPos.x - entity.pos.x;
    const dy = MoveToCenter.centerPos.y - entity.pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Normalize direction and apply velocity
    if (distance > 0.1) {
      const speed = Math.sqrt(entity.vel.x * entity.vel.x + entity.vel.y * entity.vel.y);
      entity.vel.x = (dx / distance) * speed;
      entity.vel.y = (dy / distance) * speed;
    }
  }

  /** Set up velocity for movement toward center based on enemy speed */
  static initialize(entity: Entity, speed: number): void {
    // Calculate initial direction from spawn position to center
    const dx = MoveToCenter.centerPos.x - entity.pos.x;
    const dy = MoveToCenter.centerPos.y - entity.pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Set velocity components based on direction
    if (distance > 0) {
      entity.vel.x = (dx / distance) * speed;
      entity.vel.y = (dy / distance) * speed;
    } else {
      // Fallback if spawned exactly at center (shouldn't happen)
      entity.vel.x = 0;
      entity.vel.y = speed;
    }
  }
}
