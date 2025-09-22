// Tracks XP, levels, and triggers card drafts
// Manages player progression and level-up mechanics
// Calculates XP thresholds and triggers level-up events

import { EventBus } from '../core/EventBus.js';
import { Registry } from '../data/registry.js';

export class ExperienceSystem {
  level: number = 1;              // current run level
  xp: number = 0;                 // current xp toward next level
  xpToNext: number = 10;          // threshold from config.xpCurve

  private bus: EventBus;
  private registry: Registry;

  constructor(args: { bus: EventBus; reg: Registry }) {
    this.bus = args.bus;
    this.registry = args.reg;

    // Initialize XP curve from config
    this.xpToNext = this.registry.config.xp.curve[0] || this.registry.config.xp.basePerLevel;

    // Listen for enemy kill events to grant XP
    this.bus.on('EnemyKilled', (data: any) => {
      this.grant(data.xpReward || 1);
    });
  }

  /** Grant XP (e.g., on EnemyKilled); may trigger LevelUp event. */
  grant(xpAmount: number): void {
    this.xp += xpAmount;

    // Check for level up
    while (this.xp >= this.xpToNext && this.level < this.registry.config.xp.maxLevel) {
      this.levelUp();
    }
  }

  private levelUp(): void {
    // Spend XP for this level
    this.xp -= this.xpToNext;
    this.level++;

    // Calculate next level requirement
    const curveIndex = this.level - 2; // level 2 is index 0
    if (curveIndex >= 0 && curveIndex < this.registry.config.xp.curve.length) {
      const curveValue = this.registry.config.xp.curve[curveIndex];
      this.xpToNext = curveValue !== undefined ? curveValue : this.registry.config.xp.basePerLevel;
    } else {
      // Beyond predefined curve, use growth factor
      this.xpToNext = Math.floor(
        this.registry.config.xp.basePerLevel *
        Math.pow(this.registry.config.xp.growthFactor, this.level - 1)
      );
    }

    console.log(`Level up! Now level ${this.level}, need ${this.xpToNext} XP for next level`);

    // Emit level up event for card draft system
    this.bus.emit('LevelUp', {
      newLevel: this.level,
      xpToNext: this.xpToNext
    });
  }

  /** Reset to level 1 and initial thresholds at run start. */
  reset(): void {
    this.level = 1;
    this.xp = 0;
    this.xpToNext = this.registry.config.xp.curve[0] || this.registry.config.xp.basePerLevel;
    console.log(`XP system reset: Level ${this.level}, need ${this.xpToNext} XP for next level`);
  }

  /** Get current XP progress as percentage (0.0 to 1.0) */
  getXpProgress(): number {
    return this.xp / this.xpToNext;
  }

  /** Get current XP state for UI display */
  getXpState(): { level: number; xp: number; xpToNext: number; progress: number } {
    return {
      level: this.level,
      xp: this.xp,
      xpToNext: this.xpToNext,
      progress: this.getXpProgress()
    };
  }
}