// Applies damage, handles deaths, grants XP
// Processes combat results from collision detection
// Manages damage application and enemy death rewards

import { World } from '../core/World.js';
import { EventBus } from '../core/EventBus.js';
import { CollisionPair } from './CollisionSystem.js';
import { Projectile } from '../gameplay/Projectile.js';
import { Enemy } from '../gameplay/Enemy.js';
import { Tower } from '../gameplay/Tower.js';
import { Vec2 } from '../gameplay/Entity.js';

export type DamageEvent = {
  target: Enemy | Tower;
  amount: number;
  source: Projectile | Enemy;
  position: { x: number; y: number };
  timestamp: number;
};

export type ExplosionEvent = {
  position: Vec2;
  radius: number;
  damage: number;
  timestamp: number;
};

export class CombatSystem {
  private world: World;
  private bus: EventBus;
  private damageEvents: DamageEvent[] = [];
  private explosionEvents: ExplosionEvent[] = [];
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

  /** Get explosion events for visual effects */
  getExplosionEvents(): ExplosionEvent[] {
    return [...this.explosionEvents];
  }

  /** Clear old damage events (called each frame) */
  clearOldDamageEvents(maxAge: number = 3000): void {
    const now = Date.now();
    this.damageEvents = this.damageEvents.filter(event =>
      now - event.timestamp < maxAge
    );
  }

  /** Clear old explosion events (called each frame) */
  clearOldExplosionEvents(maxAge: number = 1000): void {
    const now = Date.now();
    this.explosionEvents = this.explosionEvents.filter(event =>
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

    // Apply damage to the primary target
    const damageEvent: DamageEvent = {
      target: enemy,
      amount: projectile.damage,
      source: projectile,
      position: { x: enemy.pos.x, y: enemy.pos.y },
      timestamp: Date.now()
    };

    this.damageEvents.push(damageEvent);

    const wasKilled = enemy.applyDamage(projectile.damage);

    // Handle explosive area damage if projectile has explosion
    if (projectile.explosion && projectile.explosionRadius > 0) {
      this.handleExplosion(projectile, enemy.pos);
    }

    // Handle projectile hit (piercing vs non-piercing)
    projectile.onHit();

    // Emit events
    if (wasKilled) {
      this.bus.emit('EnemyKilled', {
        enemy: enemy,
        xpReward: enemy.xp,
        position: { x: enemy.pos.x, y: enemy.pos.y }
      });
    }
  }

  private handleExplosion(projectile: Projectile, explosionCenter: Vec2): void {
    // Get all enemies in the world
    const enemies = this.world.query((entity): entity is Enemy => entity instanceof Enemy);

    // Calculate explosion damage
    const explosionDamage = Math.round(projectile.damage * projectile.explosionDamage);

    // Find enemies within explosion radius
    for (const enemy of enemies) {
      if (!enemy.alive) continue; // Skip dead enemies

      const distance = this.getDistance(explosionCenter, enemy.pos);

      if (distance <= projectile.explosionRadius) {
        // Apply explosion damage (reduced by distance for realism)
        const distanceRatio = distance / projectile.explosionRadius;
        const scaledDamage = Math.round(explosionDamage * (1 - distanceRatio * 0.5)); // 50% damage reduction at edge

        if (scaledDamage > 0) {
          const damageEvent: DamageEvent = {
            target: enemy,
            amount: scaledDamage,
            source: projectile,
            position: { x: enemy.pos.x, y: enemy.pos.y },
            timestamp: Date.now()
          };

          this.damageEvents.push(damageEvent);

          const wasKilled = enemy.applyDamage(scaledDamage);

          if (wasKilled) {
            this.bus.emit('EnemyKilled', {
              enemy: enemy,
              xpReward: enemy.xp,
              position: { x: enemy.pos.x, y: enemy.pos.y }
            });
          }
        }
      }
    }

    // Store explosion event for visual effects
    const explosionEvent: ExplosionEvent = {
      position: explosionCenter,
      radius: projectile.explosionRadius,
      damage: explosionDamage,
      timestamp: Date.now()
    };
    this.explosionEvents.push(explosionEvent);

    // Emit explosion event for other systems
    this.bus.emit('ExplosionTriggered', explosionEvent);
  }

  private getDistance(pos1: Vec2, pos2: Vec2): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
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