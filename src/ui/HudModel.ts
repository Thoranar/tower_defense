// Data model for HUD rendering
// Structured data passed to UI renderer for HUD display
// Contains health, XP, level, time, and boss information
export interface HudModel {
  hp: number;
  maxHp: number;
  xp?: number;                  // Optional for milestone 2
  xpToNext?: number;            // Optional for milestone 2
  level?: number;               // Optional for milestone 2
  timeSec: number;              // Elapsed seconds since run start
  bossActive?: boolean;         // Optional for milestone 2
  bossHp?: number;              // Optional for milestone 2
  bossMaxHp?: number;           // Optional for milestone 2
}