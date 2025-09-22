// Manages upgrade effects and slot/level constraints
// Applies upgrade operations when cards are chosen
// Tracks which upgrades are selected and at what level

import { EventBus } from '../core/EventBus.js';
import { Registry, UpgradeBlueprint, UpgradeEffect } from '../data/registry.js';
import { Creators } from '../data/creators.js';
import { Tower } from '../gameplay/Tower.js';

export class UpgradeSystem {
  private levels: Map<string, number> = new Map();  // upgradeKey -> level
  private slotsMax: number;
  private maxLevelPerUpgrade: number;

  private bus: EventBus;
  private registry: Registry;
  private creators: Creators;

  constructor(args: { bus: EventBus; reg: Registry; creators: Creators }) {
    this.bus = args.bus;
    this.registry = args.reg;
    this.creators = args.creators;

    // Get limits from config
    this.slotsMax = this.registry.config.upgrades.maxSlots;
    this.maxLevelPerUpgrade = this.registry.config.upgrades.maxLevelPerUpgrade;

    // Listen for card chosen events to apply upgrades
    this.bus.on('CardChosen', (data: any) => {
      this.apply(data.upgradeKey);
    });
  }

  /** True if upgrade can be selected (slot or level limit). */
  canSelect(upgKey: string): boolean {
    const currentLevel = this.levels.get(upgKey) || 0;
    const upgrade = this.registry.upgrades[upgKey];

    if (!upgrade) {
      console.warn(`Upgrade not found: ${upgKey}`);
      return false;
    }

    // Check if we can level this upgrade further
    if (currentLevel >= upgrade.maxLevel || currentLevel >= this.maxLevelPerUpgrade) {
      return false;
    }

    // If it's a new upgrade, check if we have slots available
    if (currentLevel === 0) {
      const uniqueUpgrades = new Set(this.levels.keys()).size;
      return uniqueUpgrades < this.slotsMax;
    }

    // Can level existing upgrade
    return true;
  }

  /** Apply upgrade effect ops at the next level; update levels map. */
  apply(upgKey: string): void {
    if (!this.canSelect(upgKey)) {
      console.warn(`Cannot select upgrade: ${upgKey}`);
      return;
    }

    const currentLevel = this.levels.get(upgKey) || 0;
    const newLevel = currentLevel + 1;
    this.levels.set(upgKey, newLevel);

    const upgrade = this.registry.upgrades[upgKey];
    if (!upgrade) {
      console.error(`Upgrade not found: ${upgKey}`);
      return;
    }

    const effects = upgrade.effects[newLevel.toString()];
    if (!effects) {
      console.error(`No effects defined for ${upgKey} level ${newLevel}`);
      return;
    }

    console.log(`Applying ${upgrade.name} level ${newLevel} with ${effects.length} effects`);

    // Apply each effect
    for (const effect of effects) {
      this.applyEffect(effect);
    }

    // Emit upgrade applied event
    this.bus.emit('UpgradeApplied', {
      upgradeKey: upgKey,
      level: newLevel,
      upgradeName: upgrade.name
    });
  }

  /** Apply a single upgrade effect operation. */
  private applyEffect(effect: UpgradeEffect): void {
    console.log(`Applying effect: ${effect.op} ${effect.target || effect.weaponKey || effect.projectileKey} ${effect.value}`);

    switch (effect.op) {
      case 'statAdd':
        this.applyStatAdd(effect);
        break;
      case 'statMult':
        this.applyStatMult(effect);
        break;
      case 'statSet':
        this.applyStatSet(effect);
        break;
      case 'equipWeapon':
        this.applyEquipWeapon(effect);
        break;
      case 'upgradeWeapon':
        this.applyUpgradeWeapon(effect);
        break;
      case 'switchProjectile':
        this.applySwitchProjectile(effect);
        break;
      case 'addWeaponSlot':
        this.applyAddWeaponSlot(effect);
        break;
      default:
        console.warn(`Unknown upgrade operation: ${effect.op}`);
    }
  }

  /** Apply statAdd operation to tower stats. */
  private applyStatAdd(effect: UpgradeEffect): void {
    if (!effect.target || effect.value === undefined) return;

    // For now, we'll emit an event that the tower can listen to
    // This keeps the upgrade system decoupled from the tower
    this.bus.emit('StatModification', {
      op: 'add',
      target: effect.target,
      value: effect.value
    });
  }

  /** Apply statMult operation to tower stats. */
  private applyStatMult(effect: UpgradeEffect): void {
    if (!effect.target || effect.value === undefined) return;

    this.bus.emit('StatModification', {
      op: 'mult',
      target: effect.target,
      value: effect.value
    });
  }

  /** Apply statSet operation to tower stats. */
  private applyStatSet(effect: UpgradeEffect): void {
    if (!effect.target || effect.value === undefined) return;

    this.bus.emit('StatModification', {
      op: 'set',
      target: effect.target,
      value: effect.value
    });
  }

  /** Apply equipWeapon operation. */
  private applyEquipWeapon(effect: UpgradeEffect): void {
    if (!effect.weaponKey) return;

    const level = effect.level || 1;
    const slot = effect.weaponSlot || 0; // Default to first slot

    this.bus.emit('EquipWeapon', {
      weaponKey: effect.weaponKey,
      level: level,
      slot: slot
    });
  }

  /** Apply upgradeWeapon operation - upgrades existing weapon in slot. */
  private applyUpgradeWeapon(effect: UpgradeEffect): void {
    const slot = effect.weaponSlot || 0;
    const value = effect.value || 1;

    this.bus.emit('UpgradeWeapon', {
      slot: slot,
      levelIncrease: value
    });
  }

  /** Apply switchProjectile operation - changes projectile type for weapon in slot. */
  private applySwitchProjectile(effect: UpgradeEffect): void {
    if (!effect.projectileKey) return;

    const slot = effect.weaponSlot || 0; // Default to first slot

    this.bus.emit('SwitchProjectile', {
      weaponSlot: slot,
      projectileKey: effect.projectileKey
    });
  }

  /** Apply addWeaponSlot operation - adds additional weapon slot to tower. */
  private applyAddWeaponSlot(effect: UpgradeEffect): void {
    this.bus.emit('AddWeaponSlot', {
      count: effect.value || 1
    });
  }

  /** Read current level for an upgrade key. */
  levelOf(upgKey: string): number {
    return this.levels.get(upgKey) || 0;
  }

  /** Get all selected upgrades with their levels. */
  getSelectedUpgrades(): Array<{ key: string; level: number; upgrade: UpgradeBlueprint }> {
    const result: Array<{ key: string; level: number; upgrade: UpgradeBlueprint }> = [];

    for (const [key, level] of this.levels.entries()) {
      const upgrade = this.registry.upgrades[key];
      if (upgrade) {
        result.push({ key, level, upgrade });
      }
    }

    return result;
  }

  /** Get upgrade slots usage info. */
  getSlotsInfo(): { used: number; max: number; available: number } {
    const used = new Set(this.levels.keys()).size;
    return {
      used,
      max: this.slotsMax,
      available: this.slotsMax - used
    };
  }

  /** Reset selection map at run start. */
  reset(): void {
    this.levels.clear();
    console.log('Upgrade system reset: All upgrades cleared');
  }

  /** Get upgrade state for dev tools. */
  getUpgradeState(): {
    levels: Record<string, number>;
    slots: { used: number; max: number };
    canSelectAny: boolean;
  } {
    const levelsObj: Record<string, number> = {};
    for (const [key, level] of this.levels.entries()) {
      levelsObj[key] = level;
    }

    const slotsInfo = this.getSlotsInfo();

    // Check if any upgrade can be selected
    let canSelectAny = false;
    for (const upgKey of Object.keys(this.registry.upgrades)) {
      if (this.canSelect(upgKey)) {
        canSelectAny = true;
        break;
      }
    }

    return {
      levels: levelsObj,
      slots: { used: slotsInfo.used, max: slotsInfo.max },
      canSelectAny
    };
  }
}