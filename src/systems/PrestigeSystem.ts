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

export interface MetaData {
  totalPrestige: number;
  topScore: number;
  topTime: number;
  totalRuns: number;
}

// Calculates prestige currency, persists to storage
// Manages meta-progression and permanent upgrades
// Handles prestige earning and spending mechanics
export class PrestigeSystem {
  private metaData: MetaData;
  private readonly STORAGE_KEY = 'tower_defense_meta';

  constructor() {
    this.metaData = this.loadMetaData();
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

  /** Reset all meta data (for dev tools) */
  resetMetaData(): void {
    this.metaData = {
      totalPrestige: 0,
      topScore: 0,
      topTime: 0,
      totalRuns: 0
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
          totalRuns: parsed.totalRuns || 0
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
      totalRuns: 0
    };
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