# Class Skeletons – DevTools System & Overlay (TypeScript)

> Purpose: Declaration-only skeletons for a centralized developer tools state manager and an overlay UI panel. No implementations—just structure, comments, and method signatures.

---

## Types

### `src/devtools/types.ts`
```ts
export type ToggleKey =
  | 'showFps' | 'showBounds' | 'showInput' | 'projectileDebug'
  | 'behaviorTrails' | 'collisionMarkers' | 'hitLogs'
  | 'draftPreview' | 'statOverlays' | 'bossPhaseTimer'
  | 'statsDump' | 'auraRanges' | 'fxPreview' | 'contentHotReload';

export type SliderKey = 'fireRateMult' | 'bossHpScale' | 'uiScale' | 'motionIntensity';

export type ActionKey =
  | 'resetRun' | 'spawnEnemy' | 'spawnBoss' | 'grantXp'
  | 'equipWeapon' | 'forceEndRun' | 'clearStorage'
  | 'spawnSupport' | 'reloadContent';

export type ToggleMap = Partial<Record<ToggleKey, boolean>>;
export type SliderMap = Partial<Record<SliderKey, number>>;

export type DevAction = {
  key: ActionKey;
  label: string;
  /** Execute using public game/system APIs only. */
  run(): void;
};

export type DevCategory =
  | 'Render' | 'Input' | 'Entities' | 'Combat' | 'Progression'
  | 'Upgrades' | 'Boss' | 'Meta' | 'Content' | 'System';

export type DevPanelSection = {
  category: DevCategory;
  toggles?: { key: ToggleKey; label: string }[];
  sliders?: { key: SliderKey; label: string; min: number; max: number; step?: number }[];
  actions?: DevAction[];
};
```

---

## DevTools System

### `src/devtools/DevToolsSystem.ts`
```ts
import { ToggleMap, SliderMap, DevPanelSection, ToggleKey, SliderKey, ActionKey } from './types';

export class DevToolsSystem {
  /** Current enablement for each toggle. */
  readonly toggles: ToggleMap;

  /** Current values for sliders. */
  readonly sliders: SliderMap;

  /** Registered sections for overlay rendering. */
  private sections: DevPanelSection[];

  /** Whether the overlay panel is visible. */
  visible: boolean;

  /** Keyboard shortcut (e.g., backtick) to toggle visibility. */
  shortcutKey: string;

  /** Storage key for persisting settings to LocalStorage. */
  storageKey: string;

  constructor(params: { shortcutKey?: string; storageKey?: string }) {}

  /** Register a section with toggles, sliders, and actions. */
  registerSection(section: DevPanelSection): void;

  /** Get immutable list of sections for rendering. */
  getSections(): ReadonlyArray<DevPanelSection>;

  /** Read a toggle value; default false. */
  isOn(key: ToggleKey): boolean;

  /** Set a toggle value and optionally persist. */
  setToggle(key: ToggleKey, on: boolean, persist?: boolean): void;

  /** Read a slider value; default 1.0. */
  getSlider(key: SliderKey): number;

  /** Set a slider value and optionally persist. */
  setSlider(key: SliderKey, value: number, persist?: boolean): void;

  /** Execute an action by key (e.g., spawn enemy). */
  runAction(key: ActionKey): void;

  /** Attach DOM-level key handlers; call once on boot. */
  attachInput(): void;

  /** Load settings from LocalStorage (if present). */
  load(): void;

  /** Save settings to LocalStorage. */
  save(): void;

  /** Clear all settings and restore defaults. */
  reset(): void;
}
```

---

## Dev Overlay Panel

### `src/devtools/DevOverlay.ts`
```ts
import { DevToolsSystem } from './DevToolsSystem';
import { DevPanelSection } from './types';

export class DevOverlay {
  private dev: DevToolsSystem;     // source of truth for state + sections

  /** Panel layout metrics and cached mouse state. */
  private width: number; private height: number; private x: number; private y: number;

  /** Last hovered control for tooltip/help. */
  private hoverId?: string;

  constructor(params: { dev: DevToolsSystem; width?: number; height?: number }) {}

  /** Update overlay input (mouse position, clicks), handle control interactions. */
  update(dt: number, mouse: { x: number; y: number; down: boolean }): void;

  /** Render overlay UI onto Canvas using simple rects/text. */
  render(ctx: CanvasRenderingContext2D): void;

  /** Recompute panel layout on resize. */
  resize(width: number, height: number): void;

  /** Provide categories/sections for drawing (cached from DevToolsSystem). */
  getSections(): ReadonlyArray<DevPanelSection>;
}
```

---

## Integration Facade

### `src/devtools/integration.ts`
```ts
import { DevToolsSystem } from './DevToolsSystem';
import { DevOverlay } from './DevOverlay';

export class DevToolsIntegration {
  dev: DevToolsSystem;
  overlay: DevOverlay;

  /** Wire DevTools to game systems via public APIs. */
  constructor(params: {
    dev: DevToolsSystem;
    overlay: DevOverlay;
    gameApis: {
      resetRun: () => void;
      spawnEnemy: (key: string, count: number) => void;
      spawnBoss: () => void;
      grantXp: (amount: number) => void;
      equipWeapon: (key: string, level?: number) => void;
      forceEndRun: (reason: 'death' | 'boss_ground' | 'victory') => void;
      clearStorage: () => void;
      spawnSupport: (key: string) => void;
      reloadContent: () => Promise<void>;
    };
  }) {}

  /** Populate default sections/toggles/sliders/actions for milestones. */
  registerDefaultPanels(): void;

  /** Pass-through helpers to read toggles/sliders at render/update time. */
  isOn(toggle: string): boolean;
  slider(key: string): number;
}
```

---

## Minimal Styling Helpers (Optional)

### `src/devtools/styles.ts`
```ts
export const DevStyles = {
  panelBg: 'rgba(20,20,28,0.92)',
  panelBorder: '#444B',
  text: '#EEE',
  accent: '#5FB3F9',
  warn: '#FFB74D',
  danger: '#EF5350',
};
```

---

## Usage Notes
- The **DevToolsSystem** is the single source of truth for dev settings; other systems should **query** it (e.g., `if (dev.isOn('collisionMarkers')) { /* draw gizmos */ }`).
- The **DevOverlay** is purely a view/controller; it never mutates gameplay directly—only through **public game APIs** exposed to the Integration facade.
- Settings should be **persisted** and **restored** across reloads so your dev environment stays consistent.
- Keep rendering simple: rectangles, text, basic sliders/checkboxes; avoid heavy UI frameworks to keep performance predictable.