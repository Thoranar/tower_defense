import { HudModel } from './HudModel.js';
import { Tower } from '../gameplay/Tower.js';
import { Clock } from '../core/Clock.js';
import { ExperienceSystem } from '../systems/ExperienceSystem.js';

// Displays health, XP, level, prestige, and timers
// Main HUD interface showing critical game state information
// Provides snapshot model for renderer consumption
export class Hud {
  constructor() {
    // No state stored here - pure function to create snapshots
  }

  /** Produce a snapshot model of HUD data from game state. */
  snapshot(tower: Tower, clock: Clock, xpSystem?: ExperienceSystem): HudModel {
    const hudModel: HudModel = {
      hp: tower.stats.hp,
      maxHp: tower.stats.maxHp,
      timeSec: clock.getElapsedTime()
    };

    // Add XP data if system is provided
    if (xpSystem) {
      const xpState = xpSystem.getXpState();
      hudModel.level = xpState.level;
      hudModel.xp = xpState.xp;
      hudModel.xpToNext = xpState.xpToNext;
      (hudModel as any).xp = xpState; // For UI rendering convenience
    }

    return hudModel;
  }
}