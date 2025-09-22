// Type definitions for developer tools system
// Defines toggle keys, slider keys, and action types for dev tools
// Provides type safety for developer debugging interface
export type ToggleKey =
  | 'showFps'
  | 'showBounds'
  | 'showInput'
  | 'projectileDebug'
  | 'behaviorTrails'
  | 'collisionMarkers'
  | 'hitLogs'
  | 'invincibleTower'
  | 'draftPreview';

export type SliderKey =
  | 'fireRateMult'
  | 'bossHpScale'
  | 'uiScale'
  | 'motionIntensity';

export type ActionKey =
  | 'resetRun'
  | 'spawnEnemy'
  | 'spawnBoss'
  | 'grantXp'
  | 'equipWeapon'
  | 'forceEndRun'
  | 'clearStorage'
  | 'spawnBasicEnemy';

export type ToggleMap = Partial<Record<ToggleKey, boolean>>;
export type SliderMap = Partial<Record<SliderKey, number>>;