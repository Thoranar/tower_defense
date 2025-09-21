# Class Skeletons – UIRenderer & FX (TypeScript)

> Purpose: Declaration-only skeletons for a Canvas-based UI renderer and lightweight FX managers (floating numbers, overlays). No implementations here—just structure and comments.

---

## Types & Interfaces

### `src/ui/types.ts`
```ts
export type Rect = { x: number; y: number; w: number; h: number };
export type RGBA = { r: number; g: number; b: number; a?: number };

export type TextStyle = {
  font: string;                 // e.g., "bold 16px Inter, system-ui"
  align?: CanvasTextAlign;      // 'left' | 'center' | 'right'
  baseline?: CanvasTextBaseline; // 'top' | 'middle' | 'alphabetic' etc.
  fill?: string;                // CSS color
  shadow?: { color: string; blur: number; offsetX?: number; offsetY?: number };
};

export type BarStyle = {
  bgColor: string;              // background bar color
  fgColor: string;              // foreground (fill) color
  border?: { color: string; width: number; radius?: number };
  gradient?: { from: string; to: string; vertical?: boolean };
};

export type FloatingTextSpec = {
  text: string;                 // content, e.g., "+25", "-12"
  x: number; y: number;         // spawn position in screen coords
  color: string;                // CSS color
  size: number;                 // px font size
  life: number;                 // seconds total lifetime
  kind: 'damage' | 'heal' | 'xp' | 'info';
};
```

---

## HUD Model

### `src/ui/HudModel.ts`
```ts
export type HudModel = {
  hp: number; maxHp: number;                   // player health
  xp: number; xpToNext: number; level: number; // progression
  timeSec: number;                              // elapsed seconds
  bossActive: boolean;                          // show boss bar when true
  bossHp?: number; bossMaxHp?: number;          // optional boss values
};
```

---

## UIRenderer (Canvas 2D)

### `src/ui/UIRenderer.ts`
```ts
import { Rect, TextStyle, BarStyle } from './types';
import { HudModel } from './HudModel';

export class UIRenderer {
  /** Provide canvas context and cached metrics (e.g., dpi scale). */
  constructor(params: { ctx: CanvasRenderingContext2D; width: number; height: number; dpiScale?: number }) {}

  /** Update internal layout if the canvas size changes. */
  resize(width: number, height: number): void;

  /** Draw the entire HUD layer using the provided model. */
  drawHUD(hud: HudModel): void;

  /** Draw a labeled horizontal bar (used by HP/XP/Boss). */
  drawBar(area: Rect, value: number, max: number, style: BarStyle, label?: string): void;

  /** Draw text with optional shadow/outline styling. */
  drawText(text: string, x: number, y: number, style: TextStyle): void;

  /** Flash effect (e.g., damage feedback overlay). */
  flash(area: Rect, color: string, durationSec: number): void;

  /** Dim the scene for overlays (card draft).
   *  Returned token can be used to restore state if needed. */
  dimBackground(intensity: number): void;

  /** Card panels for level-up overlay. */
  drawCardPanel(area: Rect, title: string, desc: string, selected: boolean): void;

  /** Boss warning banner (top of screen). */
  drawBossWarning(text: string): void;
}
```

---

## Floating Text Manager

### `src/ui/FloatingText.ts`
```ts
import { FloatingTextSpec, TextStyle } from './types';

export class FloatingTextManager {
  /** Spawn a new floating text element (damage/heal/xp). */
  spawn(spec: FloatingTextSpec): void;

  /** Advance lifetimes and positions; remove expired items. */
  update(dt: number): void;

  /** Render all active floating texts. */
  render(drawText: (text: string, x: number, y: number, style: TextStyle) => void): void;

  /** Clear all active items (e.g., on scene change). */
  clear(): void;
}
```

---

## Overlay Controllers

### `src/ui/CardOverlayView.ts`
```ts
import { Rect, TextStyle } from './types';

export class CardOverlayView {
  visible: boolean;                  // true when shown
  areas: Rect[];                     // clickable card rectangles

  /** Open overlay with n cards and computed layout. */
  open(n: number, canvasW: number, canvasH: number): void;

  /** Close overlay. */
  close(): void;

  /** Hit test to determine which card (if any) was clicked. */
  hitTest(x: number, y: number): number | null;

  /** Render the overlay: dim bg + cards. */
  render(renderer: UIRenderer, titles: string[], descs: string[], selectedIndex?: number): void;
}
```

### `src/ui/Toast.ts`
```ts
import { TextStyle } from './types';

export type Toast = { id: number; title: string; timeLeft: number };

export class ToastManager {
  /** Add a toast (e.g., achievement unlocked). */
  push(title: string, durationSec: number): number;

  /** Advance timers and drop expired toasts. */
  update(dt: number): void;

  /** Render stacked toasts (e.g., top-left). */
  render(draw: (text: string, x: number, y: number, style: TextStyle) => void): void;

  /** Remove a toast by id. */
  dismiss(id: number): void;
}
```

---

## Styling Presets (suggested constants)

### `src/ui/styles.ts`
```ts
export const Styles = {
  text: {
    hud: { font: 'bold 16px Inter, system-ui', fill: '#FFFFFF', shadow: { color: 'rgba(0,0,0,0.6)', blur: 2 } },
    timer: { font: 'bold 18px Inter, system-ui', fill: '#FFFFFF', shadow: { color: 'rgba(0,0,0,0.7)', blur: 3 } },
    damage: { font: 'bold 14px Inter, system-ui', fill: '#FFFFFF', shadow: { color: 'rgba(0,0,0,0.5)', blur: 2 } },
    crit: { font: 'bold 16px Inter, system-ui', fill: '#FFD54D', shadow: { color: 'rgba(0,0,0,0.6)', blur: 3 } },
    heal: { font: 'bold 14px Inter, system-ui', fill: '#7CFC00', shadow: { color: 'rgba(0,0,0,0.5)', blur: 2 } },
    xp: { font: 'bold 12px Inter, system-ui', fill: '#7FDBFF', shadow: { color: 'rgba(0,0,0,0.4)', blur: 2 } },
  },
  bar: {
    hp: { bgColor: '#3A0C0C', fgColor: '#E53935', border: { color: '#000000', width: 2, radius: 6 }, gradient: { from: '#B71C1C', to: '#E57373' } },
    xp: { bgColor: '#0C1D3A', fgColor: '#42A5F5', border: { color: '#000000', width: 2, radius: 6 }, gradient: { from: '#1565C0', to: '#64B5F6' } },
    boss: { bgColor: '#2B0C0C', fgColor: '#C62828', border: { color: '#000000', width: 2 }, gradient: { from: '#8E0000', to: '#FF5252' } },
  },
};
```

---

## Integration Notes

- `UIRenderer.drawHUD()` consumes a `HudModel` produced by your game state adapter (e.g., `Hud.ts`).
- `FloatingTextManager` should be updated *after* world/combat updates, then rendered *after* HUD for proper layering.
- `CardOverlayView` only handles layout/hit-testing/render; selection logic remains in the `CardDraftSystem`.
- All drawing here is pure view logic—**no game state mutation**.
