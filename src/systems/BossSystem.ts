// Handles boss enemy spawning, scaling, and special behaviors
// Manages mini-boss and final boss encounter mechanics
// Controls boss spawn timing, warnings, and stat scaling

import { World } from '../core/World.js';
import { Clock } from '../core/Clock.js';
import { Registry, MiniBossConfig, FinalBossConfig } from '../data/registry.js';
import { Creators } from '../data/creators.js';
import { Vec2 } from '../gameplay/Entity.js';
import { Enemy } from '../gameplay/Enemy.js';
import { MoveDown } from '../gameplay/behaviors/MoveDown.js';
import { EventBus } from '../core/EventBus.js';

export interface BossWarning {
  type: 'mini' | 'final';
  timeRemaining: number;
  bossKey?: string;
}

export class BossSystem {
  private world: World;
  private creators: Creators;
  private registry: Registry;
  private clock: Clock;
  private eventBus: EventBus;

  private lastMiniBossTime: number = 0;
  private nextMiniBossWave: number = 1;
  private finalBossSpawned: boolean = false;
  private activeBoss: Enemy | null = null;
  private currentWarning: BossWarning | null = null;
  private isSpawningBoss: boolean = false;

  constructor(args: { world: World; creators: Creators; reg: Registry; clock: Clock; eventBus: EventBus }) {
    this.world = args.world;
    this.creators = args.creators;
    this.registry = args.reg;
    this.clock = args.clock;
    this.eventBus = args.eventBus;
  }

  update(dt: number): void {
    const currentTime = this.clock.getElapsedTime();
    const miniBossConfig = this.registry.waveConfig.miniBosses;
    const finalBossConfig = this.registry.waveConfig.finalBoss;

    // Check if current boss is still alive
    if (this.activeBoss && !this.world.has(this.activeBoss)) {
      this.activeBoss = null;
      this.isSpawningBoss = false;
      this.eventBus.emit('bossDefeated' as any, { type: 'boss' });
    }

    // Handle mini-boss spawning
    if (miniBossConfig.enabled && !this.isSpawningBoss) {
      this.handleMiniBossSpawning(currentTime, miniBossConfig);
    }

    // Handle final boss spawning
    if (!this.finalBossSpawned && !this.isSpawningBoss) {
      this.handleFinalBossSpawning(currentTime, finalBossConfig);
    }

    // Update warning countdown
    if (this.currentWarning) {
      this.currentWarning.timeRemaining -= dt;
      if (this.currentWarning.timeRemaining <= 0) {
        this.spawnBoss();
      }
    }
  }

  private handleMiniBossSpawning(currentTime: number, config: MiniBossConfig): void {
    const nextMiniBossTime = this.nextMiniBossWave * config.interval;

    if (currentTime >= nextMiniBossTime - config.warningTime && currentTime < nextMiniBossTime) {
      // Start warning if not already active
      if (!this.currentWarning) {
        const selectedBossKey = this.selectRandomMiniBoss(config.pool);
        this.currentWarning = {
          type: 'mini',
          timeRemaining: config.warningTime,
          bossKey: selectedBossKey
        };
        this.eventBus.emit('bossWarningStart' as any, this.currentWarning);
      }
    }
  }

  private handleFinalBossSpawning(currentTime: number, config: FinalBossConfig): void {
    if (currentTime >= config.spawnTime - config.warningTime && currentTime < config.spawnTime) {
      // Start final boss warning if not already active
      if (!this.currentWarning) {
        this.currentWarning = {
          type: 'final',
          timeRemaining: config.warningTime,
          bossKey: config.key
        };
        this.eventBus.emit('bossWarningStart' as any, this.currentWarning);
      }
    }
  }

  private spawnBoss(): void {
    if (!this.currentWarning) return;

    const bossKey = this.currentWarning.bossKey!;
    const bossType = this.currentWarning.type;

    // Mark as spawning to prevent normal enemy spawns
    this.isSpawningBoss = true;
    this.eventBus.emit('bossSpawning' as any, { type: bossType, key: bossKey });

    try {
      // Spawn boss at center-top of screen
      const spawnPos: Vec2 = { x: 400, y: -100 }; // TODO: Get from viewport

      // Get boss blueprint from bosses registry
      const bossBlueprint = this.registry.bosses[bossKey];
      if (!bossBlueprint) {
        console.error(`Boss blueprint not found: ${bossKey}`);
        this.completeBossSpawn();
        return;
      }

      // Scale boss stats if it's a mini-boss
      const scaledBlueprint = bossType === 'mini' ?
        this.scaleMiniBossStats(bossBlueprint, this.nextMiniBossWave) :
        bossBlueprint;

      // Create boss enemy with scaled stats
      const boss = this.creators.enemyFromBlueprint(bossKey, scaledBlueprint, spawnPos);

      // Initialize movement behavior
      if (boss.behaviorKeys.includes('MoveDown')) {
        MoveDown.initialize(boss, boss.speed);
      }

      this.world.add(boss);
      this.activeBoss = boss;

      // Update state based on boss type
      if (bossType === 'mini') {
        this.nextMiniBossWave++;
      } else {
        this.finalBossSpawned = true;
      }

      this.eventBus.emit('bossSpawned' as any, { type: bossType, boss: boss });
      console.log(`${bossType === 'mini' ? 'Mini-boss' : 'Final boss'} spawned: ${bossKey} (Wave ${this.nextMiniBossWave - 1})`);

    } catch (error) {
      console.error(`Failed to spawn boss ${bossKey}:`, error);
    }

    this.completeBossSpawn();
  }

  private completeBossSpawn(): void {
    this.currentWarning = null;
    // Keep isSpawningBoss true while boss is alive to prevent normal spawns
  }

  private scaleMiniBossStats(blueprint: any, wave: number): any {
    const config = this.registry.waveConfig.miniBosses;
    const scaledBlueprint = { ...blueprint };

    // Apply wave-based scaling
    scaledBlueprint.hp = Math.floor(blueprint.hp * (1 + (wave - 1) * config.statModifiers.hp));
    scaledBlueprint.maxHp = scaledBlueprint.hp;

    if (blueprint.damage) {
      scaledBlueprint.damage = Math.floor(blueprint.damage * (1 + (wave - 1) * config.statModifiers.damage));
    }

    scaledBlueprint.speed = blueprint.speed * (1 + (wave - 1) * config.statModifiers.speed);

    return scaledBlueprint;
  }

  private selectRandomMiniBoss(pool: string[]): string {
    if (pool.length === 0) {
      console.error('Mini-boss pool is empty');
      return 'shadowStalker'; // Fallback
    }
    return pool[Math.floor(Math.random() * pool.length)] || 'shadowStalker';
  }

  /** API method for manual boss spawning (used by dev tools) */
  requestSpawnBoss(bossKey: string, bossType: 'mini' | 'final' = 'mini'): void {
    if (this.isSpawningBoss) {
      console.warn('Boss already spawning or active');
      return;
    }

    this.currentWarning = {
      type: bossType,
      timeRemaining: 0.1, // Almost immediate spawn
      bossKey: bossKey
    };
  }

  /** Check if boss spawning should prevent normal enemy spawns */
  isPreventingNormalSpawns(): boolean {
    return this.isSpawningBoss || (this.currentWarning !== null && this.currentWarning.timeRemaining <= 5);
  }

  /** Get current warning for UI display */
  getCurrentWarning(): BossWarning | null {
    return this.currentWarning;
  }

  /** Get active boss for UI display */
  getActiveBoss(): Enemy | null {
    return this.activeBoss;
  }

  /** Reset system state for new run */
  reset(): void {
    this.lastMiniBossTime = 0;
    this.nextMiniBossWave = 1;
    this.finalBossSpawned = false;
    this.activeBoss = null;
    this.currentWarning = null;
    this.isSpawningBoss = false;
  }
}