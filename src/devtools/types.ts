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
  | 'draftPreview'
  | 'showUpgradeInspector'
  | 'showStatOverlays';

export type SliderKey =
  | 'fireRateMult'
  | 'bossHpScale'
  | 'uiScale'
  | 'motionIntensity';

export type ActionKey =
  | 'resetRun'
  | 'spawnEnemy'
  | 'spawnBoss'
  | 'spawnBossNow'
  | 'grantXp'
  | 'equipWeapon'
  | 'forceEndRun'
  | 'clearStorage'
  | 'spawnBasicEnemy'
  | 'applyUpgrade';

export type ToggleMap = Partial<Record<ToggleKey, boolean>>;
export type SliderMap = Partial<Record<SliderKey, number>>;