export interface RunStats {
  timeSurvived: number; // seconds
  enemiesKilled: number;
  miniBossesDefeated: number;
  finalBossDefeated: boolean;
  endReason: "death" | "boss_ground" | "victory";
}

export interface GameScore {
  prestigeEarned: number;
  timeSurvived: number;
  enemiesKilled: number;
  miniBossesDefeated: number;
  finalBossDefeated: boolean;
  breakdown: {
    timeScore: number;
    killScore: number;
    miniBossBonus: number;
    finalBossBonus: number;
  };
}

import { Registry, PrestigeItemBlueprint, UpgradeEffect } from '../data/registry.js';

export interface MetaData {
  totalPrestige: number;
  topScore: number;
  topTime: number;
  totalRuns: number;
  prestigePurchases: Record<string, number>; // itemKey -> level purchased
  unlockedBuildings: string[];
  unlockedWeapons: string[];
  unlockedProjectiles: string[];
}

export interface PurchaseResult {
  success: boolean;
  message: string;
  newLevel?: number;
}

// Calculates prestige currency, persists to storage
// Manages meta-progression and permanent upgrades
// Handles prestige earning and spending mechanics
export class PrestigeSystem {
  private metaData: MetaData;
  private readonly STORAGE_KEY = 'tower_defense_meta';
  private registry: Registry | null = null;

  constructor(registry?: Registry) {
    this.registry = registry || null;
    this.metaData = this.loadMetaData();
  }

  /** Set the registry for prestige item lookups */
  setRegistry(registry: Registry): void {
    this.registry = registry;
  }

  /** Calculate prestige score from run stats */
  calculateScore(runStats: RunStats): GameScore {
    const { timeSurvived, enemiesKilled, miniBossesDefeated, finalBossDefeated } = runStats;

    // Base score from survival time (1 point per 10 seconds)
    const timeScore = Math.floor(timeSurvived / 10);

    // Score from enemies killed (2 points per enemy)
    const killScore = enemiesKilled * 2;

    // Mini-boss bonus (50 points per mini-boss)
    const miniBossBonus = miniBossesDefeated * 50;

    // Final boss bonus (200 points for defeating final boss)
    const finalBossBonus = finalBossDefeated ? 200 : 0;

    const prestigeEarned = timeScore + killScore + miniBossBonus + finalBossBonus;

    console.log(`Prestige calculation: Time(${timeSurvived}s): ${timeScore}, Kills(${enemiesKilled}): ${killScore}, MiniBoss(${miniBossesDefeated}): ${miniBossBonus}, FinalBoss: ${finalBossBonus} = ${prestigeEarned} total`);

    return {
      prestigeEarned,
      timeSurvived,
      enemiesKilled,
      miniBossesDefeated,
      finalBossDefeated,
      breakdown: {
        timeScore,
        killScore,
        miniBossBonus,
        finalBossBonus
      }
    };
  }

  /** End a run and award prestige */
  endRun(runStats: RunStats): GameScore {
    const score = this.calculateScore(runStats);

    // Update meta data
    this.metaData.totalPrestige += score.prestigeEarned;
    this.metaData.totalRuns++;

    // Track best scores
    if (score.prestigeEarned > this.metaData.topScore) {
      this.metaData.topScore = score.prestigeEarned;
    }

    if (score.timeSurvived > this.metaData.topTime) {
      this.metaData.topTime = score.timeSurvived;
    }

    this.saveMetaData();

    console.log(`Run ended - Earned ${score.prestigeEarned} prestige (Total: ${this.metaData.totalPrestige})`);

    return score;
  }

  /** Get current meta progression data */
  getMetaData(): MetaData {
    return { ...this.metaData };
  }

  /** Spend prestige (for future prestige store) */
  spendPrestige(amount: number): boolean {
    if (this.metaData.totalPrestige >= amount) {
      this.metaData.totalPrestige -= amount;
      this.saveMetaData();
      return true;
    }
    return false;
  }

  /** Add prestige (for dev tools) */
  addPrestige(amount: number): void {
    this.metaData.totalPrestige += amount;
    this.saveMetaData();
  }

  /** Purchase a prestige item */
  purchasePrestigeItem(itemKey: string): PurchaseResult {
    if (!this.registry) {
      return { success: false, message: 'Registry not loaded' };
    }

    const item = this.registry.prestigeItems[itemKey];
    if (!item) {
      return { success: false, message: 'Item not found' };
    }

    const currentLevel = this.metaData.prestigePurchases[itemKey] || 0;

    // Check if already at max level
    if (currentLevel >= item.maxLevel) {
      return { success: false, message: 'Item already at max level' };
    }

    // Check unlock requirements
    if (item.requiresUnlock) {
      const requiredLevel = this.metaData.prestigePurchases[item.requiresUnlock] || 0;
      if (requiredLevel === 0) {
        const requiredItem = this.registry.prestigeItems[item.requiresUnlock];
        const requiredName = requiredItem?.name || item.requiresUnlock;
        return { success: false, message: `Requires: ${requiredName}` };
      }
    }

    // Calculate price for next level
    const price = this.calculatePrestigeItemPrice(item, currentLevel);

    // Check if can afford
    if (this.metaData.totalPrestige < price) {
      return { success: false, message: `Need ${price} prestige (have ${this.metaData.totalPrestige})` };
    }

    // Make purchase
    this.metaData.totalPrestige -= price;
    this.metaData.prestigePurchases[itemKey] = currentLevel + 1;

    // Handle unlock effects
    this.applyUnlockEffects(item, currentLevel + 1);

    this.saveMetaData();

    console.log(`Purchased ${item.name} level ${currentLevel + 1} for ${price} prestige`);

    return {
      success: true,
      message: `Purchased ${item.name} (Level ${currentLevel + 1})`,
      newLevel: currentLevel + 1
    };
  }

  /** Calculate price for a prestige item at a specific level */
  calculatePrestigeItemPrice(item: PrestigeItemBlueprint, currentLevel: number): number {
    return Math.floor(item.basePrice * Math.pow(item.priceScaling, currentLevel));
  }

  /** Apply unlock effects for prestige items */
  private applyUnlockEffects(item: PrestigeItemBlueprint, level: number): void {
    const effects = item.effects[level.toString()];
    if (!effects) return;

    for (const effect of effects) {
      switch (effect.op) {
        case 'unlockBuilding':
          if (effect.buildingKey && !this.metaData.unlockedBuildings.includes(effect.buildingKey)) {
            this.metaData.unlockedBuildings.push(effect.buildingKey);
          }
          break;
        case 'unlockWeapon':
          if (effect.weaponKey && !this.metaData.unlockedWeapons.includes(effect.weaponKey)) {
            this.metaData.unlockedWeapons.push(effect.weaponKey);
          }
          break;
        case 'unlockProjectile':
          if (effect.projectileKey && !this.metaData.unlockedProjectiles.includes(effect.projectileKey)) {
            this.metaData.unlockedProjectiles.push(effect.projectileKey);
          }
          break;
      }
    }
  }

  /** Get current level of a prestige item */
  getPrestigeItemLevel(itemKey: string): number {
    return this.metaData.prestigePurchases[itemKey] || 0;
  }

  /** Get all prestige items with current levels */
  getPrestigeItemsWithLevels(): Array<{
    key: string;
    item: PrestigeItemBlueprint;
    currentLevel: number;
    nextPrice: number;
    canAfford: boolean;
    isAvailable: boolean;
    isMaxLevel: boolean;
  }> {
    if (!this.registry) return [];

    return Object.entries(this.registry.prestigeItems).map(([key, item]) => {
      const currentLevel = this.getPrestigeItemLevel(key);
      const isMaxLevel = currentLevel >= item.maxLevel;
      const nextPrice = isMaxLevel ? -1 : this.calculatePrestigeItemPrice(item, currentLevel);
      const canAfford = !isMaxLevel && this.metaData.totalPrestige >= nextPrice;

      // Check availability based on unlock requirements
      let isAvailable = true;
      if (item.requiresUnlock) {
        const requiredLevel = this.getPrestigeItemLevel(item.requiresUnlock);
        isAvailable = requiredLevel > 0;
      }

      return {
        key,
        item,
        currentLevel,
        nextPrice,
        canAfford,
        isAvailable,
        isMaxLevel
      };
    });
  }

  /** Reset all meta data (for dev tools) */
  resetMetaData(): void {
    this.metaData = {
      totalPrestige: 0,
      topScore: 0,
      topTime: 0,
      totalRuns: 0,
      prestigePurchases: {},
      unlockedBuildings: [],
      unlockedWeapons: [],
      unlockedProjectiles: []
    };
    this.saveMetaData();
    console.log('Meta data reset');
  }

  /** Load meta data from localStorage */
  private loadMetaData(): MetaData {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          totalPrestige: parsed.totalPrestige || 0,
          topScore: parsed.topScore || 0,
          topTime: parsed.topTime || 0,
          totalRuns: parsed.totalRuns || 0,
          prestigePurchases: parsed.prestigePurchases || {},
          unlockedBuildings: parsed.unlockedBuildings || [],
          unlockedWeapons: parsed.unlockedWeapons || [],
          unlockedProjectiles: parsed.unlockedProjectiles || []
        };
      }
    } catch (error) {
      console.warn('Failed to load meta data from localStorage:', error);
    }

    // Return default meta data
    return {
      totalPrestige: 0,
      topScore: 0,
      topTime: 0,
      totalRuns: 0,
      prestigePurchases: {},
      unlockedBuildings: [],
      unlockedWeapons: [],
      unlockedProjectiles: []
    };
  }

  /** Get all active prestige effects */
  getActivePrestigeEffects(): UpgradeEffect[] {
    if (!this.registry) return [];

    const effects: UpgradeEffect[] = [];

    for (const [itemKey, level] of Object.entries(this.metaData.prestigePurchases)) {
      const item = this.registry.prestigeItems[itemKey];
      if (!item || level === 0) continue;

      // Collect effects from all levels up to current level
      for (let i = 1; i <= level; i++) {
        const levelEffects = item.effects[i.toString()];
        if (levelEffects) {
          effects.push(...levelEffects);
        }
      }
    }

    return effects;
  }

  /** Apply prestige effects to base stats */
  applyPrestigeEffectsToStats(baseStats: Record<string, number>): Record<string, number> {
    const effects = this.getActivePrestigeEffects();
    const modifiedStats = { ...baseStats };

    for (const effect of effects) {
      if (effect.op === 'statAdd' && effect.target && typeof effect.value === 'number') {
        const targetKey = effect.target.replace('tower.', '').replace('player.', '');
        if (modifiedStats[targetKey] !== undefined) {
          modifiedStats[targetKey] += effect.value;
        }
      } else if (effect.op === 'statMult' && effect.target && typeof effect.value === 'number') {
        const targetKey = effect.target.replace('tower.', '').replace('player.', '');
        if (modifiedStats[targetKey] !== undefined) {
          modifiedStats[targetKey] *= effect.value;
        }
      }
    }

    return modifiedStats;
  }

  /** Get stat multipliers from prestige effects */
  getPrestigeStatMultipliers(): Record<string, number> {
    const effects = this.getActivePrestigeEffects();
    const multipliers: Record<string, number> = {};

    for (const effect of effects) {
      if (effect.op === 'statMult' && effect.target && typeof effect.value === 'number') {
        const targetKey = effect.target;
        if (!multipliers[targetKey]) {
          multipliers[targetKey] = 1;
        }
        multipliers[targetKey] *= effect.value;
      }
    }

    return multipliers;
  }

  /** Save meta data to localStorage */
  private saveMetaData(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.metaData));
    } catch (error) {
      console.warn('Failed to save meta data to localStorage:', error);
    }
  }
}