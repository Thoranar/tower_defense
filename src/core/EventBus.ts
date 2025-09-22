// Lightweight pub/sub for cross-system communication
// Decouples systems through event-driven architecture
// Handles events like EnemyKilled, LevelUp, CardChosen, RunEnded, etc.

export type EventKey =
  | "EnemyKilled"
  | "LevelUp"
  | "CardChosen"
  | "CardDraftActive"
  | "CardDraftClosed"
  | "NoAvailableUpgrades"
  | "RunEnded"
  | "BossSpawned"
  | "BossDefeated"
  | "BossReachedGround"
  | "TowerDamaged"
  | "TowerDestroyed"
  | "CollisionsDetected"
  | "StatModification"
  | "EquipWeapon"
  | "UpgradeApplied";

export class EventBus {
  private listeners: Map<EventKey, Array<(payload: any) => void>> = new Map();

  /** Subscribe to an event key; returns unsubscribe fn */
  on<T>(key: EventKey, handler: (payload: T) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }

    const handlers = this.listeners.get(key)!;
    handlers.push(handler);

    // Return unsubscribe function
    return () => {
      const index = handlers.indexOf(handler);
      if (index >= 0) {
        handlers.splice(index, 1);
      }
    };
  }

  /** Emit an event to all handlers */
  emit<T>(key: EventKey, payload: T): void {
    const handlers = this.listeners.get(key);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(payload);
        } catch (error) {
          console.error(`Error in event handler for ${key}:`, error);
        }
      }
    }
  }

  /** Clear all listeners (useful for cleanup) */
  clear(): void {
    this.listeners.clear();
  }
}