import { HudModel } from './HudModel.js';
import { Tower } from '../gameplay/Tower.js';
import { Clock } from '../core/Clock.js';

// Displays health, XP, level, prestige, and timers
// Main HUD interface showing critical game state information
// Provides snapshot model for renderer consumption
export class Hud {
  constructor() {
    // No state stored here - pure function to create snapshots
  }

  /** Produce a snapshot model of HUD data from game state. */
  snapshot(tower: Tower, clock: Clock): HudModel {
    return {
      hp: tower.stats.hp,
      maxHp: tower.stats.maxHp,
      timeSec: clock.getElapsedTime()
    };
  }
}