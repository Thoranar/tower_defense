import { ToggleKey, SliderKey, ActionKey, ToggleMap, SliderMap } from './types.js';

// Centralized developer tools state manager
// Manages debug toggles, development sliders, and testing actions
// Provides developer interface for debugging and testing game systems
export class DevToolsSystem {
  private toggles: ToggleMap = {};
  private sliders: SliderMap = {};
  private visible: boolean = false;
  private readonly storageKey: string = 'tower_defense_devtools';
  private readonly shortcutKey: string = '`';

  constructor() {
    this.initDefaults();
    this.load();
    this.attachInput();
  }

  private initDefaults(): void {
    // Default toggle states
    this.toggles.showFps = true;
    this.toggles.showBounds = false;
    this.toggles.showInput = false;
    this.toggles.projectileDebug = false;
    this.toggles.behaviorTrails = false;
    this.toggles.collisionMarkers = false;
    this.toggles.hitLogs = false;

    // Default slider values
    this.sliders.fireRateMult = 1.0;
    this.sliders.bossHpScale = 1.0;
    this.sliders.uiScale = 1.0;
    this.sliders.motionIntensity = 1.0;
  }

  private attachInput(): void {
    document.addEventListener('keydown', (event) => {
      if (event.key === this.shortcutKey && !event.repeat) {
        this.toggleVisibility();
        event.preventDefault();
      }
    });
  }

  toggleVisibility(): void {
    this.visible = !this.visible;
    console.log(`DevTools ${this.visible ? 'opened' : 'closed'}`);
  }

  isVisible(): boolean {
    return this.visible;
  }

  isOn(key: ToggleKey): boolean {
    return this.toggles[key] ?? false;
  }

  setToggle(key: ToggleKey, value: boolean, persist: boolean = true): void {
    this.toggles[key] = value;
    if (persist) {
      this.save();
    }
  }

  getSlider(key: SliderKey): number {
    return this.sliders[key] ?? 1.0;
  }

  setSlider(key: SliderKey, value: number, persist: boolean = true): void {
    this.sliders[key] = value;
    if (persist) {
      this.save();
    }
  }

  runAction(key: ActionKey): void {
    console.log(`DevTools action: ${key}`);
    // Actions will be implemented in future milestones
    switch (key) {
      case 'resetRun':
        console.log('Reset run requested');
        break;
      case 'clearStorage':
        this.clearStorage();
        break;
      default:
        console.warn(`DevTools action not implemented: ${key}`);
    }
  }

  load(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.toggles) {
          Object.assign(this.toggles, data.toggles);
        }
        if (data.sliders) {
          Object.assign(this.sliders, data.sliders);
        }
      }
    } catch (error) {
      console.warn('Failed to load DevTools settings:', error);
    }
  }

  save(): void {
    try {
      const data = {
        toggles: this.toggles,
        sliders: this.sliders
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save DevTools settings:', error);
    }
  }

  clearStorage(): void {
    localStorage.removeItem(this.storageKey);
    this.initDefaults();
    console.log('DevTools storage cleared');
  }

  getToggles(): Readonly<ToggleMap> {
    return this.toggles;
  }

  getSliders(): Readonly<SliderMap> {
    return this.sliders;
  }
}