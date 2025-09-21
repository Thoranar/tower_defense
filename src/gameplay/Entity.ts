// Vector 2D utility type
export type Vec2 = { x: number; y: number };

// Base entity class with position, velocity, radius, alive flag
// Abstract base class for all game objects (towers, enemies, projectiles)
// Provides common properties and optional update method
export abstract class Entity {
  id: number = 0;                // unique id assigned by World
  pos: Vec2;                     // position in world space
  vel: Vec2;                     // velocity per second
  radius: number;                // collision radius
  alive: boolean = true;         // false when scheduled for removal
  tags?: string[];               // optional query tags

  constructor(x: number = 0, y: number = 0, radius: number = 10) {
    this.pos = { x, y };
    this.vel = { x: 0, y: 0 };
    this.radius = radius;
  }

  /** Optional per-entity update; systems perform most logic. */
  update?(dt: number): void;
}