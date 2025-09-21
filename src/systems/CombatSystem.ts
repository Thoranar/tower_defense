// Applies damage, handles deaths, grants XP
// Processes combat results from collision detection
// Manages damage application and enemy death rewards

import { World } from '../core/World.js';
import { EventBus } from '../core/EventBus.js';
import { CollisionPair } from './CollisionSystem.js';
import { Projectile } from '../gameplay/Projectile.js';
import { Enemy } from '../gameplay/Enemy.js';
import { Tower } from '../gameplay/Tower.js';

export type DamageEvent = {
  target: Enemy | Tower;
  amount: number;
  source: Projectile | Enemy;
  position: { x: number; y: number };
  timestamp: number;
};

export class CombatSystem {
  private world: World;
  private bus: EventBus;
  private damageEvents: DamageEvent[] = [];
  private invincibleTower: boolean = false; // Dev tool toggle

  constructor(args: { world: World; bus: EventBus }) {
    this.world = args.world;
    this.bus = args.bus;

    // Listen for collision events
    this.bus.on('CollisionsDetected', (collisions: CollisionPair[]) => {
      this.processCollisions(collisions);
    });
  }

  /** Set tower invincibility (dev tool) */
  setTowerInvincible(invincible: boolean): void {
    this.invincibleTower = invincible;
  }

  /** Get damage events for dev tools visualization */
  getDamageEvents(): DamageEvent[] {
    return [...this.damageEvents];
  }

  /** Clear old damage events (called each frame) */
  clearOldDamageEvents(maxAge: number = 3000): void {
    const now = Date.now();
    this.damageEvents = this.damageEvents.filter(event =>
      now - event.timestamp < maxAge
    );
  }

  private processCollisions(collisions: CollisionPair[]): void {
    for (const collision of collisions) {
      switch (collision.type) {
        case 'projectile-enemy':
          this.handleProjectileEnemyCollision(collision);
          break;
        case 'enemy-ground':
          this.handleEnemyGroundCollision(collision);
          break;
        case 'enemy-tower':
          this.handleEnemyTowerCollision(collision);
          break;
      }
    }
  }

  private handleProjectileEnemyCollision(collision: CollisionPair): void {
    const projectile = collision.entityA as Projectile;
    const enemy = collision.entityB as Enemy;

    // Apply damage to enemy
    const damageEvent: DamageEvent = {
      target: enemy,
      amount: projectile.damage,
      source: projectile,
      position: { x: enemy.pos.x, y: enemy.pos.y },
      timestamp: Date.now()
    };

    this.damageEvents.push(damageEvent);

    const wasKilled = enemy.applyDamage(projectile.damage);

    // Remove projectile (unless it has piercing)
    projectile.alive = false;

    // Emit events
    if (wasKilled) {
      this.bus.emit('EnemyKilled', {
        enemy: enemy,
        xpReward: enemy.xp,
        position: { x: enemy.pos.x, y: enemy.pos.y }
      });
    }
  }

  private handleEnemyGroundCollision(collision: CollisionPair): void {
    const enemy = collision.entityA as Enemy;

    // Enemy reached the ground - remove it and damage tower
    enemy.alive = false;

    // Damage tower if not invincible
    if (!this.invincibleTower) {
      const towers = this.world.query((entity): entity is Tower => entity instanceof Tower);
      const tower = towers[0];
      if (tower) {
        const damageEvent: DamageEvent = {
          target: tower,
          amount: 1, // Each enemy that reaches ground does 1 damage
          source: enemy,
          position: { x: tower.pos.x, y: tower.pos.y },
          timestamp: Date.now()
        };

        this.damageEvents.push(damageEvent);
        tower.applyDamage(1);

        this.bus.emit('TowerDamaged', {
          tower: tower,
          damage: 1,
          source: 'enemy-ground'
        });
      }
    }
  }

  private handleEnemyTowerCollision(collision: CollisionPair): void {
    const enemy = collision.entityA as Enemy;
    const tower = collision.entityB as Tower;

    // Direct collision - enemy dies, tower takes damage
    enemy.alive = false;

    if (!this.invincibleTower) {
      const damageAmount = Math.ceil(enemy.maxHp / 2); // Damage based on enemy strength

      const damageEvent: DamageEvent = {
        target: tower,
        amount: damageAmount,
        source: enemy,
        position: { x: tower.pos.x, y: tower.pos.y },
        timestamp: Date.now()
      };

      this.damageEvents.push(damageEvent);
      tower.applyDamage(damageAmount);

      this.bus.emit('TowerDamaged', {
        tower: tower,
        damage: damageAmount,
        source: 'enemy-collision'
      });
    }
  }
}