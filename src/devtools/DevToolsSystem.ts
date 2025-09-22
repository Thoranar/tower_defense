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
  private selectedUpgrade: string = '';
  private availableUpgrades: string[] = [];

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
    this.toggles.invincibleTower = false;
    this.toggles.draftPreview = false;
    this.toggles.showUpgradeInspector = false;
    this.toggles.showStatOverlays = false;

    // Default slider values
    this.sliders.fireRateMult = 1.0;
    this.sliders.bossHpScale = 1.0;
    this.sliders.uiScale = 1.0;
    this.sliders.motionIntensity = 1.0;
  }

  private attachInput(): void {
    document.addEventListener('keydown', (event) => {
      // Toggle DevTools panel
      if (event.key === this.shortcutKey && !event.repeat) {
        this.toggleVisibility();
        event.preventDefault();
        return;
      }

      // DevTools shortcuts (only when panel is visible)
      if (this.visible && !event.repeat) {
        switch (event.code) {
          case 'KeyR':
            this.runAction('resetRun');
            event.preventDefault();
            break;
          case 'KeyC':
            this.runAction('clearStorage');
            event.preventDefault();
            break;
          case 'Digit1':
            this.setToggle('showInput', !this.isOn('showInput'));
            event.preventDefault();
            break;
          case 'Digit2':
            this.setToggle('showBounds', !this.isOn('showBounds'));
            event.preventDefault();
            break;
        }
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

  private gameActions: { [key: string]: () => void } = {};
  private parameterizedActions: { [key: string]: (param: string) => void } = {};

  /** Register game action callbacks for DevTools */
  registerGameActions(actions: { [key: string]: () => void }): void {
    Object.assign(this.gameActions, actions);
  }

  /** Register parameterized action callbacks for DevTools */
  registerParameterizedAction(key: string, action: (param: string) => void): void {
    this.parameterizedActions[key] = action;
  }

  runAction(key: ActionKey): void {
    console.log(`DevTools action: ${key}`);

    switch (key) {
      case 'resetRun':
        if (this.gameActions.resetRun) {
          this.gameActions.resetRun();
        } else {
          console.log('Reset run requested (no handler)');
        }
        break;
      case 'spawnBasicEnemy':
        if (this.gameActions.spawnBasicEnemy) {
          this.gameActions.spawnBasicEnemy();
        } else {
          console.log('Spawn basic enemy requested (no handler)');
        }
        break;
      case 'spawnBossNow':
        if (this.gameActions.spawnBossNow) {
          this.gameActions.spawnBossNow();
        } else {
          console.log('Spawn boss now requested (no handler)');
        }
        break;
      case 'grantXp':
        if (this.gameActions.grantXp) {
          this.gameActions.grantXp();
        } else {
          console.log('Grant XP requested (no handler)');
        }
        break;
      case 'clearStorage':
        this.clearStorage();
        break;
      case 'applyUpgrade':
        if (this.parameterizedActions.applyUpgrade && this.selectedUpgrade) {
          this.parameterizedActions.applyUpgrade(this.selectedUpgrade);
        } else {
          console.log('Apply upgrade requested (no handler or upgrade selected)');
        }
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

  /** Set available upgrades for the selector */
  setAvailableUpgrades(upgrades: string[]): void {
    this.availableUpgrades = upgrades;
    // Reset selection if current upgrade is no longer available
    if (!upgrades.includes(this.selectedUpgrade)) {
      this.selectedUpgrade = upgrades[0] || '';
    }
  }

  /** Get available upgrades for the selector */
  getAvailableUpgrades(): string[] {
    return this.availableUpgrades;
  }

  /** Set selected upgrade */
  setSelectedUpgrade(upgradeKey: string): void {
    if (this.availableUpgrades.includes(upgradeKey)) {
      this.selectedUpgrade = upgradeKey;
    }
  }

  /** Get selected upgrade */
  getSelectedUpgrade(): string {
    return this.selectedUpgrade;
  }
}