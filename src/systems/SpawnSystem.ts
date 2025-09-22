// Spawns enemies based on wave data
// Manages enemy spawn timing and composition according to wave definitions
// Handles progressive difficulty scaling and enemy type introduction

import { World } from '../core/World.js';
import { Clock } from '../core/Clock.js';
import { Registry, WaveBlueprint } from '../data/registry.js';
import { Creators } from '../data/creators.js';
import { Vec2 } from '../gameplay/Entity.js';
import { MoveDown } from '../gameplay/behaviors/MoveDown.js';
import { BossSystem } from './BossSystem.js';

export class SpawnSystem {
  private world: World;
  private creators: Creators;
  private registry: Registry;
  private clock: Clock;
  private bossSystem: BossSystem | undefined;

  private spawnTimer: number = 0;
  private currentWave: WaveBlueprint | null = null;

  constructor(args: { world: World; creators: Creators; reg: Registry; clock: Clock; bossSystem?: BossSystem }) {
    this.world = args.world;
    this.creators = args.creators;
    this.registry = args.reg;
    this.clock = args.clock;
    this.bossSystem = args.bossSystem;
  }

  /** Called every frame; spawns enemies according to active wave band */
  update(dt: number): void {
    const currentTime = this.clock.getElapsedTime();

    // Check if boss system is preventing normal spawns
    if (this.bossSystem?.isPreventingNormalSpawns()) {
      return; // Boss spawning or active, don't spawn normal enemies
    }

    // Find current wave based on time
    this.currentWave = this.findCurrentWave(currentTime);

    if (!this.currentWave) {
      return; // No active wave
    }

    // Update spawn timer
    this.spawnTimer -= dt;

    // Spawn enemy if timer expired
    if (this.spawnTimer <= 0) {
      this.spawnEnemy();
      this.spawnTimer = this.currentWave.spawnInterval;
    }
  }

  /** API method for manual enemy spawning (used by dev tools) */
  requestSpawn(enemyKey: string, count: number = 1): void {
    for (let i = 0; i < count; i++) {
      this.spawnEnemyByKey(enemyKey);
    }
  }

  /** Reset internal state (e.g., spawn timers) at start of run */
  reset(): void {
    this.spawnTimer = 0;
    this.currentWave = null;
  }

  private findCurrentWave(time: number): WaveBlueprint | null {
    const waves = this.registry.waveConfig?.waves || this.registry.waves;
    return waves.find(wave =>
      time >= wave.timeStart && time < wave.timeEnd
    ) || null;
  }

  private spawnEnemy(): void {
    if (!this.currentWave) return;

    // Select enemy type based on weights
    const enemyKey = this.selectEnemyType(this.currentWave);
    if (enemyKey) {
      this.spawnEnemyByKey(enemyKey);
    }
  }

  private spawnEnemyByKey(enemyKey: string): void {
    // Spawn at random X position above screen
    const spawnX = Math.random() * 800; // TODO: Get from viewport
    const spawnY = -50; // Above screen
    const spawnPos: Vec2 = { x: spawnX, y: spawnY };

    try {
      const enemy = this.creators.enemy(enemyKey, spawnPos);

      // Initialize movement behavior
      if (enemy.behaviorKeys.includes('MoveDown')) {
        MoveDown.initialize(enemy, enemy.speed);
      }

      this.world.add(enemy);
    } catch (error) {
      console.warn(`Failed to spawn enemy ${enemyKey}:`, error);
    }
  }

  private selectEnemyType(wave: WaveBlueprint): string | null {
    const totalWeight = wave.enemies.reduce((sum, e) => sum + e.weight, 0);
    const rand = Math.random() * totalWeight;

    let currentWeight = 0;
    for (const enemy of wave.enemies) {
      currentWeight += enemy.weight;
      if (rand <= currentWeight) {
        return enemy.key;
      }
    }

    return wave.enemies[0]?.key || null;
  }
}