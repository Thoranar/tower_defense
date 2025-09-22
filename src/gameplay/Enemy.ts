// Enemy entity; hp, xp reward, behaviors
// Hostile entities that move toward the player tower
// Contains health, reward values, and behavior patterns

import { Entity, Vec2 } from './Entity.js';

export class Enemy extends Entity {
  hp: number;
  maxHp: number;
  xp: number;
  behaviorKeys: string[];
  type: string = 'enemy';
  color: string;
  speed: number;
  damage: number | undefined;
  isBoss: boolean | undefined;

  constructor(params: {
    hp: number;
    maxHp: number;
    xp: number;
    speed: number;
    radius: number;
    behaviorKeys: string[];
    color?: string;
    pos?: Vec2;
    damage?: number | undefined;
    isBoss?: boolean | undefined;
  }) {
    super(
      params.pos?.x || 0,
      params.pos?.y || 0,
      params.radius
    );
    this.hp = params.hp;
    this.maxHp = params.maxHp;
    this.xp = params.xp;
    this.speed = params.speed;
    this.behaviorKeys = params.behaviorKeys;
    this.color = params.color || '#FF6B6B';
    this.damage = params.damage ?? undefined;
    this.isBoss = params.isBoss ?? undefined;
  }

  /** Apply damage to this enemy; returns true if killed */
  applyDamage(amount: number): boolean {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.alive = false;
      return true;
    }
    return false;
  }

  /** Update enemy logic each frame */
  update(dt: number): void {
    // Apply behaviors - for now just basic movement
    // Behaviors will be applied by MovementSystem
  }
}